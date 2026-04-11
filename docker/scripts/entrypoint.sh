#!/usr/bin/env bash
# entrypoint.sh — jenkins-plus container entrypoint
#
# 1. Validates required environment variables.
# 2. Runs envsubst over every YAML file in CASC_JENKINS_CONFIG so that
#    ${VAR:-default} expressions are resolved before JCasC reads them.
# 3. Execs the standard Jenkins entrypoint (via tini).

set -euo pipefail

CASC_DIR="${CASC_JENKINS_CONFIG:-/var/jenkins_home/casc_configs}"

# ── Required variable validation ──────────────────────────────────────────────
REQUIRED_VARS=(
    "ADMIN_USER"
    "ADMIN_PASSWORD"
    "JENKINS_URL"
)

MISSING=()
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        MISSING+=("$var")
    fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
    echo "[entrypoint] FATAL: The following required environment variables are not set:"
    for v in "${MISSING[@]}"; do
        echo "  - $v"
    done
    echo "[entrypoint] Refusing to start. Please supply the missing variables."
    exit 1
fi

echo "[entrypoint] Required environment variables validated."

# ── envsubst: resolve ${VAR:-default} in JCasC YAML files ─────────────────────
if [[ -d "${CASC_DIR}" ]]; then
    echo "[entrypoint] Substituting environment variables in JCasC configs at ${CASC_DIR} ..."

    # Build a list of all exported env var names for envsubst to substitute
    # (passing the full list prevents envsubst from clobbering unrelated $ signs)
    ENV_VAR_LIST="$(env | cut -d= -f1 | sed 's/^/\${/' | sed 's/$/}/' | tr '\n' ',')"

    while IFS= read -r -d '' yaml_file; do
        echo "[entrypoint]   Processing: ${yaml_file}"
        # Write substituted output to a temp file then move atomically
        tmp_file="$(mktemp)"
        envsubst "${ENV_VAR_LIST}" < "${yaml_file}" > "${tmp_file}"
        mv "${tmp_file}" "${yaml_file}"
    done < <(find "${CASC_DIR}" -type f -name '*.yaml' -print0)

    echo "[entrypoint] JCasC environment substitution complete."
else
    echo "[entrypoint] WARNING: CASC_DIR '${CASC_DIR}' not found — skipping envsubst."
fi

# ── Optional: print active config summary ─────────────────────────────────────
echo "[entrypoint] Starting jenkins-plus with:"
echo "  JENKINS_URL        = ${JENKINS_URL}"
echo "  ADMIN_USER         = ${ADMIN_USER}"
echo "  CASC_JENKINS_CONFIG= ${CASC_DIR}"
echo "  JAVA_OPTS          = ${JAVA_OPTS:-<not set>}"

# ── Hand off to the official Jenkins entrypoint via tini ─────────────────────
exec /usr/bin/tini -- /usr/local/bin/jenkins.sh "$@"

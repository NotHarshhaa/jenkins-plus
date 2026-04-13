#!/usr/bin/env bash
# entrypoint.sh — jenkins-plus container entrypoint
#
# 1. Validates required environment variables.
# 2. Auto-detects security realm: OIDC (production) when OIDC_ISSUER is set,
#    local accounts (development) otherwise.
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

# ── Security realm auto-detection ───────────────────────────────────────────
# JCasC merges all YAML files in CASC_DIR. We ship both security-local.yaml
# and security-oidc.yaml; only one must be present at runtime.
if [[ -d "${CASC_DIR}" ]]; then
    if [[ -n "${OIDC_ISSUER:-}" ]]; then
        echo "[entrypoint] OIDC_ISSUER is set → activating OIDC security realm (production)."
        rm -f "${CASC_DIR}/security-local.yaml"
    else
        echo "[entrypoint] OIDC_ISSUER is empty → activating local security realm (development)."
        rm -f "${CASC_DIR}/security-oidc.yaml"
    fi
else
    echo "[entrypoint] WARNING: CASC_DIR '${CASC_DIR}' not found — JCasC will have nothing to load."
fi

# ── JCasC env-var resolution ─────────────────────────────────────────────────
# JCasC natively supports ${VAR:-default} syntax and resolves env vars at load
# time.  Do NOT run envsubst or manual substitution — it destroys the fallback
# defaults for unset optional variables and breaks JCasC parsing.

# ── Optional: print active config summary ─────────────────────────────────────
AUTH_MODE="local"
[[ -n "${OIDC_ISSUER:-}" ]] && AUTH_MODE="oidc (${OIDC_ISSUER})"

echo "[entrypoint] Starting jenkins-plus with:"
echo "  JENKINS_URL        = ${JENKINS_URL}"
echo "  ADMIN_USER         = ${ADMIN_USER}"
echo "  AUTH_MODE          = ${AUTH_MODE}"
echo "  CASC_JENKINS_CONFIG= ${CASC_DIR}"
echo "  JAVA_OPTS          = ${JAVA_OPTS:-<not set>}"

# ── Hand off to the official Jenkins entrypoint via tini ─────────────────────
exec /usr/bin/tini -- /usr/local/bin/jenkins.sh "$@"

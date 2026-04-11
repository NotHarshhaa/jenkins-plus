#!/usr/bin/env bash
# plugin-verify.sh — verifies that every plugin listed in plugins.txt is
# active in the running Jenkins instance.
#
# Hits the Jenkins Plugin Manager REST API and diffs the expected list against
# the actual active plugins. Exits 1 with a clear diff when any plugin is
# missing or in a failed/disabled state.
#
# Usage (inside the container):
#   /usr/local/bin/jenkins-plus/plugin-verify.sh
#
# Usage via make:
#   make plugin-verify

set -euo pipefail

JENKINS_URL="${JENKINS_URL:-http://localhost:8080}"
JENKINS_USER="${ADMIN_USER:-admin}"
JENKINS_TOKEN="${ADMIN_PASSWORD:-admin}"
PLUGINS_FILE="${PLUGINS_FILE:-/usr/share/jenkins/plugins.txt}"

API_URL="${JENKINS_URL%/}/pluginManager/api/json?depth=1&tree=plugins[shortName,version,active,enabled,hasUpdate]"

echo "[plugin-verify] Checking plugins against ${PLUGINS_FILE} ..."
echo "[plugin-verify] Jenkins API: ${API_URL}"

# ── Fetch installed plugin list ───────────────────────────────────────────────
response=$(curl -sf \
    --max-time 30 \
    -u "${JENKINS_USER}:${JENKINS_TOKEN}" \
    "${API_URL}" 2>/dev/null) || {
    echo "[plugin-verify] ERROR: Could not reach Jenkins API at ${API_URL}"
    echo "[plugin-verify] Is Jenkins running and are ADMIN_USER/ADMIN_PASSWORD correct?"
    exit 1
}

# Extract shortNames of plugins that are both active and enabled
active_plugins=$(echo "${response}" | \
    grep -o '"shortName":"[^"]*","version":"[^"]*","active":true,"enabled":true' | \
    grep -o '"shortName":"[^"]*"' | \
    sed 's/"shortName":"//;s/"//' | \
    sort)

# ── Parse expected plugins from plugins.txt ───────────────────────────────────
expected_plugins=$(grep -v '^#' "${PLUGINS_FILE}" | \
    grep -v '^[[:space:]]*$' | \
    cut -d: -f1 | \
    sort)

# ── Diff ──────────────────────────────────────────────────────────────────────
missing=()
while IFS= read -r plugin; do
    if ! echo "${active_plugins}" | grep -qx "${plugin}"; then
        missing+=("${plugin}")
    fi
done <<< "${expected_plugins}"

echo ""
echo "[plugin-verify] Expected plugins : $(echo "${expected_plugins}" | wc -l | tr -d ' ')"
echo "[plugin-verify] Active plugins   : $(echo "${active_plugins}" | wc -l | tr -d ' ')"
echo ""

if [[ ${#missing[@]} -eq 0 ]]; then
    echo "[plugin-verify] ✓ All plugins are active and enabled."
    exit 0
else
    echo "[plugin-verify] ✗ The following plugins are MISSING or INACTIVE:"
    for p in "${missing[@]}"; do
        echo "  - ${p}"
    done
    echo ""
    echo "[plugin-verify] FAILED — ${#missing[@]} plugin(s) not active."
    exit 1
fi

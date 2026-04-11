#!/usr/bin/env bash
# healthcheck.sh — polls the Jenkins /login page until it returns HTTP 200.
# Used by docker-compose depends_on condition: service_healthy.
#
# Exit 0 — Jenkins is up and serving requests.
# Exit 1 — Timed out after TIMEOUT_SECONDS.

set -euo pipefail

JENKINS_URL="${JENKINS_URL:-http://localhost:8080}"
TIMEOUT_SECONDS="${HEALTHCHECK_TIMEOUT:-120}"
POLL_INTERVAL=5

LOGIN_URL="${JENKINS_URL%/}/login"
elapsed=0

echo "[healthcheck] Waiting for Jenkins at ${LOGIN_URL} (timeout: ${TIMEOUT_SECONDS}s) ..."

while true; do
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${LOGIN_URL}" 2>/dev/null || echo "000")

    if [[ "${http_code}" == "200" ]]; then
        echo "[healthcheck] Jenkins is UP (HTTP ${http_code}) after ${elapsed}s."
        exit 0
    fi

    if [[ ${elapsed} -ge ${TIMEOUT_SECONDS} ]]; then
        echo "[healthcheck] TIMEOUT after ${elapsed}s — Jenkins did not respond with HTTP 200 (last code: ${http_code})."
        exit 1
    fi

    echo "[healthcheck] ${elapsed}s — HTTP ${http_code}, retrying in ${POLL_INTERVAL}s ..."
    sleep "${POLL_INTERVAL}"
    elapsed=$(( elapsed + POLL_INTERVAL ))
done

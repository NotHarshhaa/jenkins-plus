# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — plugin-installer
# Installs all pinned plugins into the ref directory.
# Using a separate stage keeps the final image layer clean and avoids
# downloading the plugin installer dependencies in the final image.
# ─────────────────────────────────────────────────────────────────────────────
FROM jenkins/jenkins:lts-jdk21 AS plugin-installer

USER root
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*
USER jenkins

COPY jenkins-core/plugin-system/plugins.txt /usr/share/jenkins/plugins.txt

RUN jenkins-plugin-cli \
        --plugin-file /usr/share/jenkins/plugins.txt \
        --latest true \
        --verbose

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — final hardened image
# ─────────────────────────────────────────────────────────────────────────────
FROM jenkins/jenkins:lts-jdk21

LABEL org.opencontainers.image.title="jenkins-plus" \
      org.opencontainers.image.description="Hardened Jenkins LTS with zero click-ops setup" \
      org.opencontainers.image.source="https://github.com/NotHarshhaa/jenkins-plus" \
      org.opencontainers.image.licenses="MIT"

USER root

# Install envsubst (gettext), tini, curl (healthcheck), jq (JSON parsing)
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
        gettext-base \
        curl \
        ca-certificates \
        jq \
    && rm -rf /var/lib/apt/lists/*

# ── JVM & Jenkins tuning ──────────────────────────────────────────────────────
ENV JAVA_OPTS="\
-Djenkins.install.runSetupWizard=false \
-Dhudson.security.csrf.DefaultCrumbIssuer.EXCLUDE_SESSION_ID=true \
-Dorg.jenkinsci.plugins.durabletask.BourneShellScript.LAUNCH_FAILURE_TIMEOUT=300 \
-Djenkins.model.Jenkins.crumbIssuerProxyCompatibility=true \
-Dhudson.model.DirectoryBrowserSupport.CSP=\"sandbox allow-same-origin allow-scripts; default-src 'self';\" \
-XX:+UseG1GC \
-XX:MaxGCPauseMillis=200 \
-XX:+ExplicitGCInvokesConcurrent \
-Xmx2g \
-Xms512m"

# ── Configuration as Code ────────────────────────────────────────────────────
ENV CASC_JENKINS_CONFIG=/var/jenkins_home/casc_configs

# ── Jenkins home ─────────────────────────────────────────────────────────────
ENV JENKINS_HOME=/var/jenkins_home

# Copy pre-installed plugins from stage 1
COPY --from=plugin-installer /usr/share/jenkins/ref/plugins /usr/share/jenkins/ref/plugins

# JCasC configuration (template — envsubst runs at container start via entrypoint.sh)
ARG CACHEBUST=1
COPY jenkins-core/jcasc/ /var/jenkins_home/casc_configs/

# Shared library bundled into the image so pipelines work without network access
COPY jenkins-core/shared-library/ /var/jenkins_home/shared-library/

# Groovy init scripts (run before JCasC on every startup)
COPY docker/init.groovy.d/ /usr/share/jenkins/ref/init.groovy.d/

# Operational scripts
COPY docker/scripts/ /usr/local/bin/jenkins-plus/
RUN chmod +x /usr/local/bin/jenkins-plus/*.sh

# Ensure casc_configs directory is writable by jenkins user (entrypoint writes substituted yaml)
RUN chown -R jenkins:jenkins /var/jenkins_home/casc_configs \
    && chown -R jenkins:jenkins /var/jenkins_home/shared-library

USER jenkins

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
    CMD curl -sf http://localhost:8080/login > /dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/jenkins-plus/entrypoint.sh"]

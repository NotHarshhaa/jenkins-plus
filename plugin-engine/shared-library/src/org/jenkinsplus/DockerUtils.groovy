package org.jenkinsplus

/**
 * DockerUtils — low-level Docker operations for Jenkins Pipeline scripts.
 *
 * All methods that interact with non-serializable Docker objects are annotated
 * with @NonCPS where appropriate.
 *
 * Usage (in a Jenkinsfile):
 *   @Library('jenkins-plus') _
 *   import org.jenkinsplus.DockerUtils
 *   def docker = new DockerUtils(this)
 *   docker.loginToRegistry('registry.example.com', 'docker-registry')
 *   docker.buildImage('myapp:1.0.0', 'Dockerfile', [VERSION: '1.0.0'])
 *   docker.pushImage('myapp:1.0.0', ['1.0.0', 'latest'])
 *   docker.removeLocalImage('myapp:1.0.0')
 */
class DockerUtils implements Serializable {

    private static final long serialVersionUID = 1L

    private final Script script

    DockerUtils(Script script) {
        this.script = script
    }

    // ── loginToRegistry ─────────────────────────────────────────────────────

    /**
     * Authenticates with a Docker registry using a Jenkins credentials binding.
     *
     * @param registry      String  Registry hostname, e.g. "registry.example.com"
     * @param credentialsId String  Jenkins usernamePassword credentials ID
     */
    void loginToRegistry(String registry, String credentialsId) {
        if (!registry)      { script.error('[DockerUtils] loginToRegistry: registry is required.')      }
        if (!credentialsId) { script.error('[DockerUtils] loginToRegistry: credentialsId is required.') }

        script.echo "[DockerUtils] Logging in to registry: ${registry}"

        script.withCredentials([
            script.usernamePassword(
                credentialsId: credentialsId,
                usernameVariable: 'DOCKER_USER',
                passwordVariable: 'DOCKER_PASS'
            )
        ]) {
            script.sh """
                set -euo pipefail
                echo "\${DOCKER_PASS}" | docker login --username "\${DOCKER_USER}" --password-stdin ${registry}
            """
        }

        script.echo "[DockerUtils] Successfully logged in to ${registry}."
    }

    // ── buildImage ──────────────────────────────────────────────────────────

    /**
     * Builds a Docker image from a Dockerfile.
     *
     * @param name       String  Full image name with tag, e.g. "registry.example.com/myapp:1.0.0"
     * @param dockerfile String  Path to the Dockerfile (default: 'Dockerfile')
     * @param buildArgs  Map     Key/value pairs passed as --build-arg (default: [:])
     */
    void buildImage(String name, String dockerfile = 'Dockerfile', Map buildArgs = [:]) {
        if (!name) { script.error('[DockerUtils] buildImage: name is required.') }

        String buildArgStr = buildArgs.collect { String k, String v ->
            "--build-arg ${k}=${v}"
        }.join(' ')

        script.echo "[DockerUtils] Building image '${name}' from ${dockerfile}"

        script.sh """
            set -euo pipefail
            docker build \\
                -t ${name} \\
                -f ${dockerfile} \\
                ${buildArgStr} \\
                .
        """

        script.echo "[DockerUtils] Image '${name}' built successfully."
    }

    // ── pushImage ───────────────────────────────────────────────────────────

    /**
     * Tags and pushes an existing local image to the remote registry under one
     * or more tags.
     *
     * @param name String        Base image name (must already be built locally)
     * @param tags List<String>  Additional tags to push (e.g. ['1.0.0', 'latest'])
     */
    void pushImage(String name, List<String> tags) {
        if (!name) { script.error('[DockerUtils] pushImage: name is required.') }
        if (!tags)  { script.error('[DockerUtils] pushImage: tags list is required.') }

        tags.each { String tag ->
            String taggedName = resolveTaggedName(name, tag)
            script.echo "[DockerUtils] Tagging '${name}' → '${taggedName}'"
            script.sh "docker tag ${name} ${taggedName}"

            script.echo "[DockerUtils] Pushing '${taggedName}'"
            script.sh """
                set -euo pipefail
                docker push ${taggedName}
            """
        }

        script.echo "[DockerUtils] All tags pushed for '${name}'."
    }

    // ── removeLocalImage ────────────────────────────────────────────────────

    /**
     * Removes a locally cached Docker image to reclaim disk space on the agent.
     * Failures are suppressed — the agent workspace is cleaned regardless.
     *
     * @param name String  Image name (with or without tag)
     */
    void removeLocalImage(String name) {
        if (!name) { script.error('[DockerUtils] removeLocalImage: name is required.') }

        script.echo "[DockerUtils] Removing local image: ${name}"
        script.sh(
            script: "docker rmi -f ${name} || true",
            returnStatus: true
        )
    }

    // ── private helpers ─────────────────────────────────────────────────────

    /**
     * If `tag` is a bare tag string (no ':'), appends it to the image base name.
     * If `tag` already contains ':' or '/', treats it as a fully-qualified name.
     */
    @NonCPS
    private String resolveTaggedName(String name, String tag) {
        // Split base name (without its own tag) + new tag
        String baseName = name.contains(':') ? name.split(':')[0] : name
        return "${baseName}:${tag}"
    }
}

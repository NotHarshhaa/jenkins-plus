/**
 * dockerBuild — builds (and optionally pushes) a Docker image.
 *
 * @param image      String  Docker image name with tag, e.g. "myapp:1.0.0"
 * @param dockerfile String  Path to Dockerfile relative to workspace (default: 'Dockerfile')
 * @param push       Boolean Whether to push the image to the registry (default: true)
 * @param registry   String  Registry URL, e.g. "registry.example.com" (default: env.DOCKER_REGISTRY)
 * @param buildArgs  Map     Additional --build-arg key/value pairs (default: [:])
 */
def call(Map config = [:]) {
    String image      = config.get('image')      as String
    String dockerfile = config.get('dockerfile', 'Dockerfile') as String
    Boolean push      = config.get('push',       true) as Boolean
    String registry   = config.get('registry',   env.DOCKER_REGISTRY ?: '') as String
    Map buildArgs     = config.get('buildArgs',  [:]) as Map

    if (!image) {
        error('[dockerBuild] Required parameter "image" is missing.')
    }

    String fullImage = registry ? "${registry}/${image}" : image

    String buildArgStr = buildArgs.collect { String k, String v ->
        "--build-arg ${k}=${v}"
    }.join(' ')

    echo "[dockerBuild] Building image: ${fullImage}"
    echo "[dockerBuild] Dockerfile:     ${dockerfile}"
    echo "[dockerBuild] Build args:     ${buildArgStr ?: '(none)'}"

    docker.build(fullImage, "${buildArgStr} -f ${dockerfile} .")

    if (push) {
        String credentialsId = config.get('credentialsId', 'docker-registry') as String
        echo "[dockerBuild] Pushing image: ${fullImage}"
        docker.withRegistry("https://${registry}", credentialsId) {
            docker.image(fullImage).push()
            // Also push a 'latest' tag for non-PR builds
            if (env.CHANGE_ID == null) {
                docker.image(fullImage).push('latest')
            }
        }
        echo "[dockerBuild] Successfully pushed ${fullImage}"
    }
}

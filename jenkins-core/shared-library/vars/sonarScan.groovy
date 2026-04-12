/**
 * sonarScan — runs a SonarQube analysis and optionally waits for the Quality Gate.
 *
 * @param projectKey        String  SonarQube project key (required)
 * @param projectName       String  Display name shown in SonarQube UI (default: projectKey)
 * @param sources           String  Comma-separated source paths (default: 'src')
 * @param exclusions        String  Comma-separated glob exclusions (default: '')
 * @param sonarUrl          String  SonarQube server URL (default: env.SONAR_URL or 'http://sonarqube:9000')
 * @param waitForQualityGate Boolean Abort pipeline when quality gate fails (default: true)
 * @param sonarInstallation String  Name of the SonarQube installation in Jenkins config (default: 'SonarQube')
 * @param extraProperties   Map     Additional sonar.* properties to pass (default: [:])
 */
def call(Map config = [:]) {
    String projectKey        = config.get('projectKey')                                                  as String
    String projectName       = config.get('projectName',       projectKey)                               as String
    String sources           = config.get('sources',           'src')                                    as String
    String exclusions        = config.get('exclusions',        '')                                       as String
    String sonarUrl          = config.get('sonarUrl',          env.SONAR_URL ?: 'http://sonarqube:9000') as String
    Boolean waitForQG        = config.get('waitForQualityGate', true)                                    as Boolean
    String sonarInstallation = config.get('sonarInstallation', 'SonarQube')                              as String
    Map extraProperties      = config.get('extraProperties',   [:])                                      as Map

    if (!projectKey) {
        error('[sonarScan] Required parameter "projectKey" is missing.')
    }

    List<String> extraProps = extraProperties.collect { String k, String v ->
        "-Dsonar.${k}=${v}"
    }

    String exclusionsFlag = exclusions ? "-Dsonar.exclusions=${exclusions}" : ''

    echo "[sonarScan] Project key: ${projectKey}  Server: ${sonarUrl}"

    withSonarQubeEnv(sonarInstallation) {
        sh """
            set -euo pipefail
            sonar-scanner \\
                -Dsonar.projectKey=${projectKey} \\
                -Dsonar.projectName="${projectName}" \\
                -Dsonar.sources=${sources} \\
                -Dsonar.host.url=${sonarUrl} \\
                ${exclusionsFlag} \\
                ${extraProps.join(' \\\n                ')}
        """
    }

    if (waitForQG) {
        echo '[sonarScan] Waiting for SonarQube Quality Gate result…'
        timeout(time: 5, unit: 'MINUTES') {
            def qg = waitForQualityGate abortPipeline: true
            if (qg.status != 'OK') {
                error("[sonarScan] Quality Gate FAILED: status=${qg.status}")
            }
            echo "[sonarScan] Quality Gate PASSED: status=${qg.status}"
        }
    }
}

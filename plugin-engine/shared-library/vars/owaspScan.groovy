/**
 * owaspScan — runs OWASP Dependency-Check and publishes the HTML report.
 *
 * @param project    String  Project name used in the report (required)
 * @param failOnCVSS Integer Fail the build if any CVE meets or exceeds this CVSS score (default: 7)
 * @param formats    List    Output formats to generate: any of HTML, JSON, XML, CSV, SARIF (default: ['HTML','JSON'])
 * @param scanPath   String  Path to scan relative to workspace (default: '.')
 * @param reportDir  String  Output directory for reports (default: 'dependency-check-report')
 * @param extraArgs  String  Any additional dependency-check CLI arguments (default: '')
 */
def call(Map config = [:]) {
    String  project    = config.get('project')                  as String
    Integer failOnCVSS = config.get('failOnCVSS',   7)         as Integer
    List    formats    = config.get('formats',       ['HTML', 'JSON']) as List
    String  scanPath   = config.get('scanPath',      '.')       as String
    String  reportDir  = config.get('reportDir',     'dependency-check-report') as String
    String  extraArgs  = config.get('extraArgs',     '')        as String

    if (!project) {
        error('[owaspScan] Required parameter "project" is missing.')
    }

    String formatsArg = formats.collect { String f -> "--format ${f.toUpperCase()}" }.join(' ')

    echo "[owaspScan] Scanning project: ${project}  Fail on CVSS >= ${failOnCVSS}"

    dependencyCheck(
        additionalArguments: """
            --project "${project}" \\
            --scan "${scanPath}" \\
            --out "${reportDir}" \\
            ${formatsArg} \\
            --failOnCVSS ${failOnCVSS} \\
            --enableRetired \\
            ${extraArgs}
        """.trim(),
        odcInstallation: 'dependency-check'
    )

    // Publish the HTML report if it was generated
    if (formats.any { it.toUpperCase() == 'HTML' }) {
        publishHTML(target: [
            allowMissing:          false,
            alwaysLinkToLastBuild: true,
            keepAll:               true,
            reportDir:             reportDir,
            reportFiles:           'dependency-check-report.html',
            reportName:            "OWASP Dependency Check — ${project}",
            reportTitles:          "OWASP DC: ${project}"
        ])
    }

    // Archive JSON report for downstream consumption / UI badge
    if (formats.any { it.toUpperCase() == 'JSON' }) {
        archiveArtifacts(
            artifacts:     "${reportDir}/dependency-check-report.json",
            allowEmptyArchive: true
        )
    }

    echo "[owaspScan] Dependency-Check scan complete for '${project}'."
}

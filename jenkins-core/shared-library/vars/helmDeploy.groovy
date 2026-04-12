/**
 * helmDeploy — deploys (or upgrades) a Helm chart onto a Kubernetes cluster.
 *
 * @param chart       String  Helm chart name or local path (required)
 * @param release     String  Helm release name (required)
 * @param namespace   String  Kubernetes namespace (default: 'default')
 * @param values      String  Path to values file relative to workspace (default: 'helm/values.yaml')
 * @param image       String  Fully-qualified image to set via --set image.repository + image.tag
 * @param kubeconfig  String  Jenkins credentials ID for the kubeconfig secret file (default: 'kubeconfig')
 * @param atomic      Boolean Pass --atomic to helm (rolls back on failure) (default: true)
 * @param timeout     String  Helm operation timeout (default: '5m')
 * @param extraSets   Map     Additional --set key=value pairs (default: [:])
 */
def call(Map config = [:]) {
    String chart      = config.get('chart')      as String
    String release    = config.get('release')    as String
    String namespace  = config.get('namespace',  'default')            as String
    String values     = config.get('values',     'helm/values.yaml')   as String
    String image      = config.get('image',      '')                   as String
    String kubeconfig = config.get('kubeconfig', 'kubeconfig')         as String
    Boolean atomic    = config.get('atomic',     true)                 as Boolean
    String timeout    = config.get('timeout',    '5m')                 as String
    Map extraSets     = config.get('extraSets',  [:])                  as Map

    if (!chart)   { error('[helmDeploy] Required parameter "chart" is missing.')   }
    if (!release) { error('[helmDeploy] Required parameter "release" is missing.') }

    List<String> setArgs = []
    if (image) {
        // Convention: image is "registry/repo:tag"
        List<String> parts = image.tokenize(':')
        String imageRepo = parts[0]
        String imageTag  = parts.size() > 1 ? parts[1] : 'latest'
        setArgs << "--set image.repository=${imageRepo}"
        setArgs << "--set image.tag=${imageTag}"
    }
    extraSets.each { String k, String v ->
        setArgs << "--set ${k}=${v}"
    }

    String atomicFlag = atomic ? '--atomic' : ''
    String setStr     = setArgs.join(' ')
    String valuesFlag = fileExists(values) ? "-f ${values}" : ''

    echo "[helmDeploy] Release:   ${release}"
    echo "[helmDeploy] Chart:     ${chart}"
    echo "[helmDeploy] Namespace: ${namespace}"
    echo "[helmDeploy] Atomic:    ${atomic}  Timeout: ${timeout}"

    withCredentials([file(credentialsId: kubeconfig, variable: 'KUBECONFIG')]) {
        sh """
            set -euo pipefail
            helm upgrade --install ${release} ${chart} \\
                --namespace ${namespace} \\
                --create-namespace \\
                ${valuesFlag} \\
                ${setStr} \\
                ${atomicFlag} \\
                --wait \\
                --timeout ${timeout} \\
                --history-max 10
        """
    }

    echo "[helmDeploy] Release '${release}' deployed successfully to namespace '${namespace}'."
}

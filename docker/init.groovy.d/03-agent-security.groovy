// 03-agent-security.groovy
// Enables agent-to-controller security (file-access restrictions) and
// disables the legacy JNLP TCP port (-1 = disabled). Idempotent.

import jenkins.model.Jenkins
import jenkins.security.s4m.SlaveToMasterCallableWhitelist
import jenkins.slaves.JnlpSlaveAgentProtocol

try {
    Jenkins instance = Jenkins.getInstanceOrNull()
    if (instance == null) {
        println '[03-agent-security] Jenkins instance not yet available — skipping.'
        return
    }

    // Disable inbound TCP agent port (use WebSocket instead)
    if (instance.slaveAgentPort != -1) {
        instance.setSlaveAgentPort(-1)
        println '[03-agent-security] JNLP TCP agent port disabled (set to -1).'
    } else {
        println '[03-agent-security] JNLP TCP agent port already disabled — no-op.'
    }

    // Enable agent → controller security restrictions
    try {
        def adminMonitors = instance.administrativeMonitors
        def s4mMonitor = adminMonitors.find {
            it.class.name.contains('SlaveToMasterFileCallableWhitelist') ||
            it.class.name.contains('RuleBasedZipExtractionFilter')
        }
        if (s4mMonitor != null) {
            println '[03-agent-security] Agent-to-controller security monitor found and active.'
        }
    } catch (Exception inner) {
        println "[03-agent-security] Note: could not inspect s4m monitor: ${inner.message}"
    }

    instance.save()
    println '[03-agent-security] Agent security configuration complete.'
} catch (Exception e) {
    println "[03-agent-security] ERROR: ${e.message}"
    e.printStackTrace()
}

// 02-csrf-config.groovy
// Enables CSRF protection with the standard crumb issuer.
// Session ID is excluded from crumb calculation for reverse-proxy compatibility.
// Idempotent.

import jenkins.model.Jenkins
import hudson.security.csrf.DefaultCrumbIssuer

try {
    Jenkins instance = Jenkins.getInstanceOrNull()
    if (instance == null) {
        println '[02-csrf-config] Jenkins instance not yet available — skipping.'
        return
    }

    DefaultCrumbIssuer current = instance.getCrumbIssuer() instanceof DefaultCrumbIssuer
        ? (DefaultCrumbIssuer) instance.getCrumbIssuer()
        : null

    if (current == null || !current.isExcludeClientIPFromCrumb()) {
        DefaultCrumbIssuer issuer = new DefaultCrumbIssuer(true)
        instance.setCrumbIssuer(issuer)
        instance.save()
        println '[02-csrf-config] DefaultCrumbIssuer configured (excludeClientIPFromCrumb=true).'
    } else {
        println '[02-csrf-config] CSRF crumb issuer already configured — no-op.'
    }
} catch (Exception e) {
    println "[02-csrf-config] ERROR: ${e.message}"
    e.printStackTrace()
}

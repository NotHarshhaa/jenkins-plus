// 05-quiet-period.groovy
// Sets the global quiet period to 5 seconds and the SCM checkout retry count to 2.
// Idempotent.

import jenkins.model.Jenkins

try {
    Jenkins instance = Jenkins.getInstanceOrNull()
    if (instance == null) {
        println '[05-quiet-period] Jenkins instance not yet available — skipping.'
        return
    }

    boolean changed = false

    if (instance.quietPeriod != 5) {
        instance.quietPeriod = 5
        changed = true
        println '[05-quiet-period] Global quiet period set to 5 seconds.'
    } else {
        println '[05-quiet-period] Quiet period already 5 seconds — no-op.'
    }

    if (instance.scmCheckoutRetryCount != 2) {
        instance.scmCheckoutRetryCount = 2
        changed = true
        println '[05-quiet-period] SCM checkout retry count set to 2.'
    } else {
        println '[05-quiet-period] SCM checkout retry count already 2 — no-op.'
    }

    if (changed) {
        instance.save()
    }
} catch (Exception e) {
    println "[05-quiet-period] ERROR: ${e.message}"
    e.printStackTrace()
}

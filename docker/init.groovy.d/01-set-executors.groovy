// 01-set-executors.groovy
// Sets the number of executors on the controller node to 0.
// All work must run on agents. Idempotent.

import jenkins.model.Jenkins

try {
    Jenkins instance = Jenkins.getInstanceOrNull()
    if (instance == null) {
        println '[01-set-executors] Jenkins instance not yet available — skipping.'
        return
    }

    if (instance.numExecutors != 0) {
        instance.numExecutors = 0
        instance.save()
        println '[01-set-executors] Controller executors set to 0.'
    } else {
        println '[01-set-executors] Controller executors already 0 — no-op.'
    }
} catch (Exception e) {
    println "[01-set-executors] ERROR: ${e.message}"
    e.printStackTrace()
}

// 00-disable-setup-wizard.groovy
// Marks the Jenkins installation as complete so the setup wizard never appears.
// Idempotent: safe to run on every restart.

import jenkins.model.Jenkins
import jenkins.install.InstallState

try {
    Jenkins instance = Jenkins.getInstanceOrNull()
    if (instance == null) {
        println '[00-disable-setup-wizard] Jenkins instance not yet available — skipping.'
        return
    }

    if (instance.installState != InstallState.INITIAL_SETUP_COMPLETED) {
        instance.setInstallState(InstallState.INITIAL_SETUP_COMPLETED)
        println '[00-disable-setup-wizard] Install state set to INITIAL_SETUP_COMPLETED.'
    } else {
        println '[00-disable-setup-wizard] Install state already INITIAL_SETUP_COMPLETED — no-op.'
    }
} catch (Exception e) {
    println "[00-disable-setup-wizard] ERROR: ${e.message}"
    e.printStackTrace()
}

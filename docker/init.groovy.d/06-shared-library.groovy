// 06-shared-library.groovy
// Registers the bundled jenkins-plus shared library as a global pipeline library.
// The library is loaded from the filesystem path baked into the image, so pipelines
// work without network access to an external SCM.
// Idempotent: updates the existing entry if already registered.

import jenkins.model.Jenkins
import org.jenkinsci.plugins.workflow.libs.GlobalLibraries
import org.jenkinsci.plugins.workflow.libs.LibraryConfiguration
import org.jenkinsci.plugins.workflow.libs.SCMSourceRetriever
import jenkins.plugins.git.GitSCMSource

try {
    Jenkins instance = Jenkins.getInstanceOrNull()
    if (instance == null) {
        println '[06-shared-library] Jenkins instance not yet available — skipping.'
        return
    }

    GlobalLibraries globalLibraries = GlobalLibraries.get()
    List<LibraryConfiguration> libs = globalLibraries.getLibraries() ?: []

    String libName        = 'jenkins-plus'
    String libPath        = '/var/jenkins_home/shared-library'
    String defaultVersion = 'main'

    LibraryConfiguration existing = libs.find { it.name == libName }

    if (existing != null) {
        println "[06-shared-library] Library '${libName}' already registered — no-op."
        return
    }

    // Use a filesystem-backed local SCM retriever so no network is needed
    def localSCMSource = new hudson.plugins.filesystem_scm.FSCMSource(libPath)

    // Fall back to a plain GitSCMSource if filesystem SCM plugin is absent
    LibraryConfiguration lib
    try {
        lib = new LibraryConfiguration(libName, new SCMSourceRetriever(localSCMSource))
    } catch (Exception ignored) {
        GitSCMSource gitSource = new GitSCMSource(
            "file://${libPath}"
        )
        lib = new LibraryConfiguration(libName, new SCMSourceRetriever(gitSource))
        println "[06-shared-library] filesystem-scm not available; falling back to git file:// URI."
    }

    lib.defaultVersion    = defaultVersion
    lib.implicit          = false
    lib.allowVersionOverride = true
    lib.includeInChangesets  = false

    libs = new ArrayList<>(libs)
    libs.add(lib)
    globalLibraries.setLibraries(libs)
    globalLibraries.save()

    println "[06-shared-library] Global library '${libName}' registered (path: ${libPath}, default: ${defaultVersion})."
} catch (Exception e) {
    println "[06-shared-library] ERROR: ${e.message}"
    e.printStackTrace()
}

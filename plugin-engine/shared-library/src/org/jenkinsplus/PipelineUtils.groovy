package org.jenkinsplus

/**
 * PipelineUtils — stateless helpers for Jenkins Pipeline scripts.
 *
 * All methods that touch non-serializable Jenkins/Groovy objects are annotated
 * with @NonCPS so the CPS transformer leaves them alone.
 *
 * Usage (in a Jenkinsfile):
 *   @Library('jenkins-plus') _
 *   import org.jenkinsplus.PipelineUtils
 *   def utils = new PipelineUtils(this)
 */
class PipelineUtils implements Serializable {

    private static final long serialVersionUID = 1L

    /** Reference to the pipeline script context (the 'this' of a Jenkinsfile). */
    private final Script script

    PipelineUtils(Script script) {
        this.script = script
    }

    // ── getBuildDuration ────────────────────────────────────────────────────

    /**
     * Returns the current build duration as a human-readable string.
     *
     * @return String  e.g. "2m 34s"
     */
    @NonCPS
    String getBuildDuration() {
        long millis = script.currentBuild.duration ?: 0L
        long seconds = millis / 1000
        long minutes = seconds / 60
        long hours   = minutes / 60

        if (hours > 0) {
            return "${hours}h ${minutes % 60}m ${seconds % 60}s"
        }
        if (minutes > 0) {
            return "${minutes}m ${seconds % 60}s"
        }
        return "${seconds}s"
    }

    // ── getChangeAuthors ────────────────────────────────────────────────────

    /**
     * Returns the list of authors who contributed to this build's change sets.
     *
     * @return List<String>  Unique author display names; empty list if no changes.
     */
    @NonCPS
    List<String> getChangeAuthors() {
        Set<String> authors = new LinkedHashSet<String>()
        try {
            script.currentBuild.changeSets.each { changeSet ->
                changeSet.items.each { entry ->
                    String name = entry.author?.fullName
                    if (name) {
                        authors << name
                    }
                }
            }
        } catch (Exception ignored) {
            // changeSets can be null in some execution contexts
        }
        return authors.toList()
    }

    // ── isReleaseBranch ─────────────────────────────────────────────────────

    /**
     * Returns true when the current branch matches a release pattern.
     *
     * Matches:  main, master, release/*, hotfix/*, v1.2.3
     *
     * @param pattern String  Optional override regex (default covers common release branches)
     * @return Boolean
     */
    @NonCPS
    Boolean isReleaseBranch(String pattern = /^(main|master|release\/.*|hotfix\/.*|v\d+\.\d+\.\d+.*)$/) {
        String branch = script.env.BRANCH_NAME ?: ''
        return branch ==~ pattern
    }

    // ── getCommitSha ────────────────────────────────────────────────────────

    /**
     * Returns the short (8-char) commit SHA for the current build.
     *
     * @return String  Short SHA, or 'unknown' if unavailable.
     */
    String getCommitSha() {
        try {
            String full = script.sh(
                script: 'git log -1 --format=%H',
                returnStdout: true
            ).trim()
            return full ? full.take(8) : 'unknown'
        } catch (Exception ignored) {
            return script.env.GIT_COMMIT ? script.env.GIT_COMMIT.take(8) : 'unknown'
        }
    }

    // ── getImageTag ─────────────────────────────────────────────────────────

    /**
     * Derives a Docker-safe image tag from the current branch and build number.
     *
     * Replaces '/' with '-' and strips characters illegal in image tags.
     *
     * @param suffix String  Optional suffix appended after the build number (default: '')
     * @return String  e.g. "release-1.2-42" for branch "release/1.2" and build 42
     */
    @NonCPS
    String getImageTag(String suffix = '') {
        String branch = script.env.BRANCH_NAME ?: 'unknown'
        String build  = script.env.BUILD_NUMBER ?: '0'

        String safeBranch = branch
            .replaceAll('/', '-')
            .replaceAll('[^a-zA-Z0-9._-]', '-')
            .toLowerCase()
            .replaceAll('-{2,}', '-')
            .replaceAll('^-|-$', '')

        String tag = "${safeBranch}-${build}"
        if (suffix) {
            tag = "${tag}-${suffix}"
        }
        return tag
    }
}

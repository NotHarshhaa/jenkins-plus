/**
 * slackNotify — sends a build notification to a Slack channel.
 *
 * @param channel String  Slack channel including '#', e.g. '#ci-builds' (required)
 * @param status  String  Build status: SUCCESS | FAILURE | UNSTABLE | ABORTED (required)
 * @param mention String  Slack user or group handle to mention, e.g. '@oncall' (default: '')
 * @param message String  Optional custom message appended to the standard notification (default: '')
 */
def call(Map config = [:]) {
    String channel = config.get('channel') as String
    String status  = config.get('status')  as String
    String mention = config.get('mention', '')  as String
    String message = config.get('message', '')  as String

    if (!channel) { error('[slackNotify] Required parameter "channel" is missing.') }
    if (!status)  { error('[slackNotify] Required parameter "status" is missing.')  }

    String colour    = resolveColour(status)
    String icon      = resolveIcon(status)
    String duration  = currentBuild.durationString?.replace(' and counting', '') ?: 'N/A'
    String commitSha = resolveCommitSha()
    String author    = resolveAuthor()
    String jobUrl    = env.BUILD_URL ?: ''
    String jobName   = env.JOB_NAME  ?: ''
    String buildNum  = env.BUILD_NUMBER ?: ''

    String mentionStr = mention ? "${mention} " : ''
    String customMsg  = message ? "\n>${message}" : ''

    String text = """\
${mentionStr}${icon} *${status}* — <${jobUrl}|${jobName} #${buildNum}>
• Duration: \`${duration}\`
• Commit:   \`${commitSha}\` by *${author}*${customMsg}""".stripIndent()

    slackSend(
        channel:              channel,
        color:                colour,
        message:              text,
        tokenCredentialId:    'slack-token',
        botUser:              true,
        failOnError:          false
    )
}

@NonCPS
private String resolveColour(String status) {
    switch (status?.toUpperCase()) {
        case 'SUCCESS':  return 'good'
        case 'FAILURE':  return 'danger'
        case 'UNSTABLE': return 'warning'
        case 'ABORTED':  return '#808080'
        default:         return '#808080'
    }
}

@NonCPS
private String resolveIcon(String status) {
    switch (status?.toUpperCase()) {
        case 'SUCCESS':  return ':white_check_mark:'
        case 'FAILURE':  return ':x:'
        case 'UNSTABLE': return ':warning:'
        case 'ABORTED':  return ':no_entry_sign:'
        default:         return ':question:'
    }
}

@NonCPS
private String resolveCommitSha() {
    try {
        return env.GIT_COMMIT ? env.GIT_COMMIT.take(8) : 'unknown'
    } catch (Exception ignored) {
        return 'unknown'
    }
}

@NonCPS
private String resolveAuthor() {
    try {
        def changeSets = currentBuild.changeSets
        if (changeSets && !changeSets.isEmpty()) {
            def entries = changeSets[0].items
            if (entries && entries.length > 0) {
                return entries[0].author?.fullName ?: 'unknown'
            }
        }
        return env.GIT_AUTHOR_NAME ?: 'unknown'
    } catch (Exception ignored) {
        return 'unknown'
    }
}

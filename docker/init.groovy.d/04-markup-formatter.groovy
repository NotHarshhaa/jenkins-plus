// 04-markup-formatter.groovy
// Sets the global markup formatter to SafeHtml (allows a safe subset of HTML).
// Prevents XSS from raw HTML injection in job descriptions. Idempotent.

import jenkins.model.Jenkins
import hudson.markup.SafeHtmlMarkupFormatter

try {
    Jenkins instance = Jenkins.getInstanceOrNull()
    if (instance == null) {
        println '[04-markup-formatter] Jenkins instance not yet available — skipping.'
        return
    }

    if (!(instance.markupFormatter instanceof SafeHtmlMarkupFormatter)) {
        instance.markupFormatter = new SafeHtmlMarkupFormatter(false)
        instance.save()
        println '[04-markup-formatter] Markup formatter set to SafeHtmlMarkupFormatter.'
    } else {
        println '[04-markup-formatter] Markup formatter already SafeHtml — no-op.'
    }
} catch (Exception e) {
    println "[04-markup-formatter] ERROR: ${e.message}"
    e.printStackTrace()
}

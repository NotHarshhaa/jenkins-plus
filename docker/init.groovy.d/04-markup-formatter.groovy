// 04-markup-formatter.groovy
// Sets the global markup formatter to EscapedMarkupFormatter (plain text).
// Prevents XSS from raw HTML injection in job descriptions. Idempotent.
// Note: EscapedMarkupFormatter is built into Jenkins core — no extra plugin required.

import jenkins.model.Jenkins
import hudson.markup.EscapedMarkupFormatter

try {
    Jenkins instance = Jenkins.getInstanceOrNull()
    if (instance == null) {
        println '[04-markup-formatter] Jenkins instance not yet available — skipping.'
        return
    }

    if (!(instance.markupFormatter instanceof EscapedMarkupFormatter)) {
        instance.markupFormatter = new EscapedMarkupFormatter()
        instance.save()
        println '[04-markup-formatter] Markup formatter set to EscapedMarkupFormatter (plain text).'
    } else {
        println '[04-markup-formatter] Markup formatter already EscapedMarkupFormatter — no-op.'
    }
} catch (Exception e) {
    println "[04-markup-formatter] ERROR: ${e.message}"
    e.printStackTrace()
}

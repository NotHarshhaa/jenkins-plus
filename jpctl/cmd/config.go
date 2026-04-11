package cmd

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

func NewConfigCmd() *cobra.Command {
	configCmd := &cobra.Command{
		Use:   "config",
		Short: "Manage Jenkins Configuration as Code (JCasC)",
	}

	configCmd.AddCommand(newConfigExportCmd())
	configCmd.AddCommand(newConfigApplyCmd())
	configCmd.AddCommand(newConfigCheckCmd())
	return configCmd
}

// ── config export ─────────────────────────────────────────────────────────────

func newConfigExportCmd() *cobra.Command {
	var output string

	cmd := &cobra.Command{
		Use:   "export",
		Short: "Export the current JCasC configuration to a YAML file",
		RunE: func(c *cobra.Command, _ []string) error {
			return runConfigExport(output)
		},
	}

	cmd.Flags().StringVarP(&output, "output", "o", "jenkins.yaml", "Output file path")
	return cmd
}

func runConfigExport(output string) error {
	jenkinsURL := resolveJenkinsURL()
	user := resolveUser()
	token := resolveToken()

	color.Cyan("Exporting JCasC configuration from %s ...", jenkinsURL)

	exportURL := strings.TrimRight(jenkinsURL, "/") + "/configuration-as-code/export"
	body, err := jenkinsHTTP("GET", exportURL, user, token, nil, 30*time.Second)
	if err != nil {
		return fmt.Errorf("failed to export JCasC config: %w", err)
	}

	if err := os.WriteFile(output, body, 0644); err != nil {
		return fmt.Errorf("failed to write %s: %w", output, err)
	}

	color.Green("✓ JCasC configuration exported to %s (%d bytes)", output, len(body))
	return nil
}

// ── config apply ──────────────────────────────────────────────────────────────

func newConfigApplyCmd() *cobra.Command {
	var input string

	cmd := &cobra.Command{
		Use:   "apply",
		Short: "Apply a local JCasC YAML file to Jenkins (live reload)",
		RunE: func(c *cobra.Command, _ []string) error {
			return runConfigApply(input)
		},
	}

	cmd.Flags().StringVarP(&input, "input", "i", "jenkins.yaml", "JCasC YAML file to apply")
	return cmd
}

func runConfigApply(input string) error {
	jenkinsURL := resolveJenkinsURL()
	user := resolveUser()
	token := resolveToken()

	data, err := os.ReadFile(input)
	if err != nil {
		return fmt.Errorf("cannot read %s: %w", input, err)
	}

	color.Cyan("Applying JCasC configuration from %s to %s ...", input, jenkinsURL)

	// Get CSRF crumb
	crumb, crumbField, err := getCrumb(jenkinsURL, user, token)
	if err != nil {
		return fmt.Errorf("failed to get CSRF crumb: %w", err)
	}

	applyURL := strings.TrimRight(jenkinsURL, "/") + "/configuration-as-code/apply"
	headers := map[string]string{
		"Content-Type": "application/yaml",
		crumbField:     crumb,
	}

	if _, err := jenkinsHTTPWithHeaders("POST", applyURL, user, token, data, headers, 60*time.Second); err != nil {
		return fmt.Errorf("JCasC apply failed: %w", err)
	}

	color.Green("✓ JCasC configuration applied successfully.")
	return nil
}

// ── config check ──────────────────────────────────────────────────────────────

func newConfigCheckCmd() *cobra.Command {
	var input string

	cmd := &cobra.Command{
		Use:   "check",
		Short: "Validate a JCasC YAML file against Jenkins (dry-run, no changes applied)",
		RunE: func(c *cobra.Command, _ []string) error {
			return runConfigCheck(input)
		},
	}

	cmd.Flags().StringVarP(&input, "input", "i", "jenkins.yaml", "JCasC YAML file to validate")
	return cmd
}

func runConfigCheck(input string) error {
	jenkinsURL := resolveJenkinsURL()
	user := resolveUser()
	token := resolveToken()

	data, err := os.ReadFile(input)
	if err != nil {
		return fmt.Errorf("cannot read %s: %w", input, err)
	}

	color.Cyan("Checking (dry-run) JCasC configuration from %s against %s ...", input, jenkinsURL)

	crumb, crumbField, err := getCrumb(jenkinsURL, user, token)
	if err != nil {
		return fmt.Errorf("failed to get CSRF crumb: %w", err)
	}

	checkURL := strings.TrimRight(jenkinsURL, "/") + "/configuration-as-code/check"
	headers := map[string]string{
		"Content-Type": "application/yaml",
		crumbField:     crumb,
	}

	result, err := jenkinsHTTPWithHeaders("POST", checkURL, user, token, data, headers, 30*time.Second)
	if err != nil {
		return fmt.Errorf("JCasC check failed: %w", err)
	}

	msg := strings.TrimSpace(string(result))
	if msg == "" || strings.Contains(strings.ToLower(msg), "ok") || strings.Contains(strings.ToLower(msg), "success") {
		color.Green("✓ JCasC configuration is valid (dry-run passed).")
	} else {
		color.Yellow("⚠  JCasC check returned:\n%s", msg)
	}
	return nil
}

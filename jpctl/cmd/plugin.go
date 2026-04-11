package cmd

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/briandowns/spinner"
	"github.com/fatih/color"
	"github.com/olekukonko/tablewriter"
	"github.com/spf13/cobra"
)

func NewPluginCmd() *cobra.Command {
	pluginCmd := &cobra.Command{
		Use:   "plugin",
		Short: "Manage Jenkins plugins",
	}

	pluginCmd.AddCommand(newPluginInstallCmd())
	pluginCmd.AddCommand(newPluginListCmd())
	return pluginCmd
}

// ── plugin install ────────────────────────────────────────────────────────────

func newPluginInstallCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "install <plugin-name> [<plugin-name> ...]",
		Short: "Install one or more Jenkins plugins",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(c *cobra.Command, args []string) error {
			return runPluginInstall(args)
		},
	}
}

func runPluginInstall(plugins []string) error {
	jenkinsURL := resolveJenkinsURL()
	user := resolveUser()
	token := resolveToken()

	// 1. Get crumb
	crumb, crumbField, err := getCrumb(jenkinsURL, user, token)
	if err != nil {
		return fmt.Errorf("failed to get CSRF crumb: %w", err)
	}

	// 2. Build XML install request
	type xmlInstall struct {
		XMLName xml.Name `xml:"jenkins"`
		Install []struct {
			XMLName xml.Name `xml:"install"`
			Plugin  string   `xml:"plugin,attr"`
		}
	}
	req := xmlInstall{}
	for _, p := range plugins {
		name := p
		if !strings.Contains(p, "@") {
			name = p + "@latest"
		}
		req.Install = append(req.Install, struct {
			XMLName xml.Name `xml:"install"`
			Plugin  string   `xml:"plugin,attr"`
		}{Plugin: name})
	}
	xmlBody, err := xml.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal install request: %w", err)
	}

	// 3. POST to installNecessaryPlugins
	installURL := strings.TrimRight(jenkinsURL, "/") + "/pluginManager/installNecessaryPlugins"
	headers := map[string]string{
		"Content-Type": "text/xml",
		crumbField:     crumb,
	}

	color.Cyan("Installing plugins: %s", strings.Join(plugins, ", "))
	if _, err := jenkinsHTTPWithHeaders("POST", installURL, user, token, xmlBody, headers, 30*time.Second); err != nil {
		return fmt.Errorf("install request failed: %w", err)
	}

	// 4. Poll update center until all jobs complete
	s := spinner.New(spinner.CharSets[14], 400*time.Millisecond)
	s.Suffix = "  Waiting for plugin installation to complete..."
	s.Color("cyan")
	s.Start()

	deadline := time.Now().Add(5 * time.Minute)
	success := false
	for time.Now().Before(deadline) {
		time.Sleep(3 * time.Second)
		if done, ok, err := checkUpdateCenterJobs(jenkinsURL, user, token, plugins); err == nil {
			if done {
				s.Stop()
				if ok {
					color.Green("✓ Plugins installed successfully: %s", strings.Join(plugins, ", "))
				} else {
					color.Red("✗ Some plugins failed to install — check Jenkins Plugin Manager for details.")
				}
				success = true
				break
			}
		}
	}

	if !success {
		s.Stop()
		color.Yellow("⚠  Timed out waiting for installation — check Jenkins Plugin Manager manually.")
	}

	return nil
}

func checkUpdateCenterJobs(baseURL, user, token string, plugins []string) (done bool, allOK bool, err error) {
	type updateJob struct {
		Type   string `json:"type"`
		Status struct {
			Success bool `json:"success"`
			Type    string `json:"type"`
		} `json:"installStatus"`
	}
	type updateCenter struct {
		Jobs []updateJob `json:"jobs"`
	}

	body, err := jenkinsAPIGet(baseURL, user, token, "/updateCenter/api/json?depth=1&tree=jobs[type,installStatus[success,type]]")
	if err != nil {
		return false, false, err
	}
	var uc updateCenter
	if err := json.Unmarshal(body, &uc); err != nil {
		return false, false, err
	}

	pending := 0
	failed := 0
	for _, j := range uc.Jobs {
		statusType := j.Status.Type
		if statusType == "Pending" || statusType == "Installing" {
			pending++
		} else if !j.Status.Success && statusType != "" {
			failed++
		}
	}

	if pending > 0 {
		return false, false, nil
	}
	return true, failed == 0, nil
}

// ── plugin list ───────────────────────────────────────────────────────────────

func newPluginListCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "list",
		Short: "List installed Jenkins plugins",
		RunE: func(c *cobra.Command, _ []string) error {
			return runPluginList()
		},
	}
}

func runPluginList() error {
	jenkinsURL := resolveJenkinsURL()
	user := resolveUser()
	token := resolveToken()

	type plugin struct {
		ShortName  string `json:"shortName"`
		Version    string `json:"version"`
		Active     bool   `json:"active"`
		Enabled    bool   `json:"enabled"`
		HasUpdate  bool   `json:"hasUpdate"`
	}
	type response struct {
		Plugins []plugin `json:"plugins"`
	}

	body, err := jenkinsAPIGet(jenkinsURL, user, token,
		"/pluginManager/api/json?depth=1&tree=plugins[shortName,version,active,enabled,hasUpdate]")
	if err != nil {
		return fmt.Errorf("failed to list plugins: %w", err)
	}

	var resp response
	if err := json.Unmarshal(body, &resp); err != nil {
		return fmt.Errorf("failed to parse plugin list: %w", err)
	}

	table := tablewriter.NewWriter(os.Stdout)
	table.SetHeader([]string{"Plugin", "Version", "Active", "Update?"})
	table.SetBorder(false)
	table.SetHeaderColor(
		tablewriter.Colors{tablewriter.Bold, tablewriter.FgCyanColor},
		tablewriter.Colors{tablewriter.Bold, tablewriter.FgCyanColor},
		tablewriter.Colors{tablewriter.Bold, tablewriter.FgCyanColor},
		tablewriter.Colors{tablewriter.Bold, tablewriter.FgCyanColor},
	)

	for _, p := range resp.Plugins {
		active := color.GreenString("yes")
		if !p.Active || !p.Enabled {
			active = color.RedString("no")
		}
		update := ""
		if p.HasUpdate {
			update = color.YellowString("yes")
		}
		table.Append([]string{p.ShortName, p.Version, active, update})
	}
	table.Render()
	fmt.Printf("\nTotal: %d plugins\n", len(resp.Plugins))
	return nil
}

// ── helpers used by multiple commands ─────────────────────────────────────────

func getCrumb(baseURL, user, token string) (crumb, field string, err error) {
	type crumbResponse struct {
		Crumb             string `json:"crumb"`
		CrumbRequestField string `json:"crumbRequestField"`
	}
	body, err := jenkinsAPIGet(baseURL, user, token, "/crumbIssuer/api/json")
	if err != nil {
		return "", "", err
	}
	var cr crumbResponse
	if err := json.Unmarshal(body, &cr); err != nil {
		return "", "", err
	}
	return cr.Crumb, cr.CrumbRequestField, nil
}

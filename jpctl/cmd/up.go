package cmd

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/briandowns/spinner"
	"github.com/fatih/color"
	"github.com/olekukonko/tablewriter"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func NewUpCmd() *cobra.Command {
	var timeout int
	var detach bool

	cmd := &cobra.Command{
		Use:   "up",
		Short: "Start the jenkins-plus stack using docker compose",
		Long:  "Validates environment, starts all services with docker compose, then polls until Jenkins is ready.",
		RunE: func(c *cobra.Command, _ []string) error {
			return runUp(timeout, detach)
		},
	}

	cmd.Flags().IntVar(&timeout, "timeout", 120, "Seconds to wait for Jenkins to become healthy")
	cmd.Flags().BoolVar(&detach, "detach", true, "Run containers in detached mode (background)")
	return cmd
}

func runUp(timeout int, detach bool) error {
	// 1. Check docker and docker compose are available
	if err := checkCommand("docker", "version"); err != nil {
		return fmt.Errorf("docker not available: %w\n  Install Docker from https://docs.docker.com/get-docker/", err)
	}
	if err := checkCommand("docker", "compose", "version"); err != nil {
		return fmt.Errorf("docker compose plugin not available: %w\n  Install: https://docs.docker.com/compose/install/", err)
	}

	// 2. Check docker-compose.yml exists in cwd
	if _, err := os.Stat("docker-compose.yml"); os.IsNotExist(err) {
		return fmt.Errorf("docker-compose.yml not found in current directory\n  Run jpctl from the jenkins-plus project root")
	}

	// 3. Check .env exists; copy from .env.example if not
	if _, err := os.Stat(".env"); os.IsNotExist(err) {
		if _, exErr := os.Stat(".env.example"); exErr == nil {
			color.Yellow("⚠  .env not found — copying from .env.example. Edit .env before going to production!")
			if err := copyFile(".env.example", ".env"); err != nil {
				return fmt.Errorf("failed to copy .env.example to .env: %w", err)
			}
		} else {
			color.Yellow("⚠  .env not found and .env.example not available. Proceeding without .env file.")
		}
	}

	// 4. Run docker compose up
	args := []string{"compose", "up"}
	if detach {
		args = append(args, "-d")
	}
	args = append(args, "--remove-orphans")

	color.Cyan("Starting jenkins-plus stack...")
	if err := runDockerCmd(args...); err != nil {
		return fmt.Errorf("docker compose up failed: %w", err)
	}

	// 5. Poll /login until 200 or timeout
	jenkinsURL := resolveJenkinsURL()
	loginURL := jenkinsURL + "/login"

	s := spinner.New(spinner.CharSets[14], 500*time.Millisecond)
	s.Suffix = fmt.Sprintf("  Waiting for Jenkins at %s (timeout: %ds)...", loginURL, timeout)
	s.Color("cyan")
	s.Start()

	deadline := time.Now().Add(time.Duration(timeout) * time.Second)
	ready := false
	for time.Now().Before(deadline) {
		if httpGet200(loginURL, 5*time.Second) {
			ready = true
			break
		}
		time.Sleep(3 * time.Second)
	}
	s.Stop()

	if !ready {
		return fmt.Errorf("Jenkins did not become healthy within %ds\n  Check logs: jpctl logs", timeout)
	}

	// 6. Print success table
	adminUser := getEnvOrDefault("ADMIN_USER", viper.GetString("user"), "admin")
	adminPass := getEnvOrDefault("ADMIN_PASSWORD", "", "changeme")
	grafanaURL := deriveGrafanaURL(jenkinsURL)

	color.Green("\n✓ jenkins-plus is UP and healthy!\n")

	table := tablewriter.NewWriter(os.Stdout)
	table.SetHeader([]string{"Service", "URL"})
	table.SetBorder(false)
	table.SetColumnSeparator("  ")
	table.SetHeaderColor(
		tablewriter.Colors{tablewriter.Bold, tablewriter.FgCyanColor},
		tablewriter.Colors{tablewriter.Bold, tablewriter.FgCyanColor},
	)
	table.Append([]string{"Jenkins", jenkinsURL})
	table.Append([]string{"Jenkins UI", jenkinsURL + "/ui/"})
	table.Append([]string{"Grafana", grafanaURL})
	table.Append([]string{"Prometheus", derivePrometheusURL(jenkinsURL)})
	table.Append([]string{"Admin User", adminUser})
	table.Append([]string{"Admin Password", adminPass})
	table.Render()

	fmt.Println()
	color.Cyan("Tip: run 'jpctl status' to verify all services are running.")
	return nil
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func checkCommand(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = nil
	cmd.Stderr = nil
	return cmd.Run()
}

func runDockerCmd(args ...string) error {
	cmd := exec.Command("docker", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func httpGet200(url string, timeout time.Duration) bool {
	client := &http.Client{Timeout: timeout}
	resp, err := client.Get(url)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(filepath.Clean(src))
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0600)
}

func resolveJenkinsURL() string {
	if u := viper.GetString("url"); u != "" {
		return u
	}
	if u := os.Getenv("JENKINS_URL"); u != "" {
		return u
	}
	return "http://localhost:8080"
}

func getEnvOrDefault(envKey, fallback, def string) string {
	if fallback != "" {
		return fallback
	}
	if v := os.Getenv(envKey); v != "" {
		return v
	}
	return def
}

func deriveGrafanaURL(jenkinsURL string) string {
	// Replace port 8080 with 3001, or append :3001
	if len(jenkinsURL) > 0 {
		return replacePort(jenkinsURL, "8080", "3001")
	}
	return "http://localhost:3001"
}

func derivePrometheusURL(jenkinsURL string) string {
	return replacePort(jenkinsURL, "8080", "9090")
}

func replacePort(url, oldPort, newPort string) string {
	// Simple string replacement for common cases
	if len(url) == 0 {
		return fmt.Sprintf("http://localhost:%s", newPort)
	}
	// Try to replace :<oldPort> with :<newPort>
	needle := ":" + oldPort
	if idx := len(url) - len(needle); idx >= 0 && url[idx:] == needle {
		return url[:idx] + ":" + newPort
	}
	return url
}

package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/fatih/color"
	"github.com/olekukonko/tablewriter"
	"github.com/spf13/cobra"
)

func NewStatusCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "status",
		Short: "Show the status of jenkins-plus services and Jenkins internals",
		RunE: func(c *cobra.Command, _ []string) error {
			return runStatus()
		},
	}
}

func runStatus() error {
	// 1. docker compose ps
	fmt.Println(color.CyanString("\n── Container Status ─────────────────────────────────────────────────────────"))
	out, err := exec.Command("docker", "compose", "ps", "--format", "table {{.Name}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}").CombinedOutput()
	if err != nil {
		color.Yellow("  docker compose ps failed: %s", strings.TrimSpace(string(out)))
	} else {
		fmt.Println(string(out))
	}

	jenkinsURL := resolveJenkinsURL()
	user := resolveUser()
	token := resolveToken()

	// 2. Jenkins version
	fmt.Println(color.CyanString("── Jenkins ──────────────────────────────────────────────────────────────────"))
	type jenkinsMeta struct {
		Version string `json:"version"`
	}
	var meta jenkinsMeta
	if body, err := jenkinsAPIGet(jenkinsURL, user, token, "/api/json?tree=version"); err != nil {
		color.Red("  Jenkins unreachable: %s", err.Error())
	} else if err := json.Unmarshal(body, &meta); err == nil {
		color.Green("  Jenkins Version: %s", meta.Version)
	}

	// 3. Agent count
	type computerAPI struct {
		TotalExecutors int `json:"totalExecutors"`
		Computer       []struct {
			DisplayName string `json:"displayName"`
			Offline     bool   `json:"offline"`
		} `json:"computer"`
	}
	var computers computerAPI
	if body, err := jenkinsAPIGet(jenkinsURL, user, token, "/computer/api/json?tree=totalExecutors,computer[displayName,offline]"); err == nil {
		if err := json.Unmarshal(body, &computers); err == nil {
			online := 0
			for _, c := range computers.Computer {
				if !c.Offline {
					online++
				}
			}
			color.Green("  Agents: %d online / %d total", online, len(computers.Computer))

			table := tablewriter.NewWriter(os.Stdout)
			table.SetHeader([]string{"Agent", "Status"})
			table.SetBorder(false)
			for _, c := range computers.Computer {
				status := color.GreenString("online")
				if c.Offline {
					status = color.RedString("offline")
				}
				table.Append([]string{c.DisplayName, status})
			}
			table.Render()
		}
	}

	// 4. Queue depth
	type queueAPI struct {
		Items []interface{} `json:"items"`
	}
	var queue queueAPI
	if body, err := jenkinsAPIGet(jenkinsURL, user, token, "/queue/api/json?tree=items[id]"); err == nil {
		if err := json.Unmarshal(body, &queue); err == nil {
			queueLen := len(queue.Items)
			if queueLen == 0 {
				color.Green("  Queue depth: 0")
			} else {
				color.Yellow("  Queue depth: %d", queueLen)
			}
		}
	}

	fmt.Println()
	return nil
}

// ── Shared HTTP helpers (used by multiple cmds) ───────────────────────────────

func jenkinsAPIGet(baseURL, user, token, path string) ([]byte, error) {
	url := strings.TrimRight(baseURL, "/") + path
	return jenkinsHTTP("GET", url, user, token, nil, 30*time.Second)
}

func jenkinsHTTP(method, url, user, token string, body []byte, timeout time.Duration) ([]byte, error) {
	const maxRetries = 3
	var lastErr error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		b, err := doHTTP(method, url, user, token, body, timeout)
		if err == nil {
			return b, nil
		}
		lastErr = err
		if attempt < maxRetries {
			time.Sleep(time.Duration(attempt) * 2 * time.Second)
		}
	}
	return nil, fmt.Errorf("after %d attempts: %w", maxRetries, lastErr)
}

func resolveUser() string {
	if u := os.Getenv("JENKINS_USER"); u != "" {
		return u
	}
	return "admin"
}

func resolveToken() string {
	if t := os.Getenv("JENKINS_TOKEN"); t != "" {
		return t
	}
	if p := os.Getenv("ADMIN_PASSWORD"); p != "" {
		return p
	}
	return "admin"
}

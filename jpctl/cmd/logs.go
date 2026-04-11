package cmd

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/spf13/cobra"
)

func NewLogsCmd() *cobra.Command {
	var service string
	var tail int

	cmd := &cobra.Command{
		Use:   "logs",
		Short: "Tail logs from a jenkins-plus service",
		RunE: func(c *cobra.Command, _ []string) error {
			return runLogs(service, tail)
		},
	}

	cmd.Flags().StringVar(&service, "service", "jenkins-plus", "Service name to tail logs for")
	cmd.Flags().IntVar(&tail, "tail", 100, "Number of lines to show from the end of the logs")
	return cmd
}

func runLogs(service string, tail int) error {
	args := []string{
		"compose", "logs",
		"-f",
		fmt.Sprintf("--tail=%d", tail),
		service,
	}

	cmd := exec.Command("docker", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("docker compose logs failed: %w", err)
	}
	return nil
}

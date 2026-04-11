package cmd

import (
	"fmt"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

func NewDownCmd() *cobra.Command {
	var volumes bool

	cmd := &cobra.Command{
		Use:   "down",
		Short: "Stop the jenkins-plus stack",
		Long:  "Runs docker compose down, optionally removing persistent volumes.",
		RunE: func(c *cobra.Command, _ []string) error {
			return runDown(volumes)
		},
	}

	cmd.Flags().BoolVar(&volumes, "volumes", false, "Also remove named volumes (destroys jenkins_home data!)")
	return cmd
}

func runDown(removeVolumes bool) error {
	args := []string{"compose", "down", "--remove-orphans"}
	if removeVolumes {
		color.Red("⚠  --volumes flag set: jenkins_home and all data volumes will be DESTROYED.")
		args = append(args, "-v")
	}

	color.Cyan("Stopping jenkins-plus stack...")
	if err := runDockerCmd(args...); err != nil {
		return fmt.Errorf("docker compose down failed: %w", err)
	}

	color.Green("✓ Stack stopped.")
	if removeVolumes {
		color.Yellow("All volumes have been removed.")
	}
	return nil
}

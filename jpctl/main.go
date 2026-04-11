package main

import (
	"fmt"
	"os"

	"github.com/NotHarshhaa/jenkins-plus/jpctl/cmd"
	"github.com/fatih/color"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	version = "dev"
	commit  = "none"
	date    = "unknown"
)

func main() {
	root := buildRoot()
	if err := root.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, color.RedString("Error: %s", err.Error()))
		os.Exit(1)
	}
}

func buildRoot() *cobra.Command {
	root := &cobra.Command{
		Use:   "jpctl",
		Short: "jenkins-plus CLI — manage your jenkins-plus instance",
		Long: color.CyanString(`
     _             _   _
    (_)_ __   ___| |_| |
    | | '_ \ / __| __| |
    | | |_) | (__| |_| |
 _/ | .__/ \___|\__|_|
|__/|_|  jenkins-plus CLI`) + "\n\nManage, inspect, and operate your jenkins-plus instance.",
		Version: fmt.Sprintf("%s (commit: %s, built: %s)", version, commit, date),
		PersistentPreRunE: func(c *cobra.Command, _ []string) error {
			// Bind env vars
			viper.SetEnvPrefix("JENKINS")
			viper.AutomaticEnv()

			// Resolve --url from flag → env → default
			if urlFlag, _ := c.Flags().GetString("url"); urlFlag != "" {
				viper.Set("url", urlFlag)
			}
			if viper.GetString("url") == "" {
				if envURL := os.Getenv("JENKINS_URL"); envURL != "" {
					viper.Set("url", envURL)
				} else {
					viper.Set("url", "http://localhost:8080")
				}
			}
			return nil
		},
	}

	// ── Persistent flags ────────────────────────────────────────────────────────
	root.PersistentFlags().String("url", "", "Jenkins URL (env: JENKINS_URL)")
	root.PersistentFlags().String("user", "", "Jenkins username (env: JENKINS_USER, default: admin)")
	root.PersistentFlags().String("token", "", "Jenkins API token or password (env: JENKINS_TOKEN)")

	viper.BindPFlag("url", root.PersistentFlags().Lookup("url"))
	viper.BindPFlag("user", root.PersistentFlags().Lookup("user"))
	viper.BindPFlag("token", root.PersistentFlags().Lookup("token"))

	viper.BindEnv("url", "JENKINS_URL")
	viper.BindEnv("user", "JENKINS_USER")
	viper.BindEnv("token", "JENKINS_TOKEN")

	viper.SetDefault("user", "admin")

	// ── Subcommands ─────────────────────────────────────────────────────────────
	root.AddCommand(
		cmd.NewUpCmd(),
		cmd.NewDownCmd(),
		cmd.NewStatusCmd(),
		cmd.NewLogsCmd(),
		cmd.NewPluginCmd(),
		cmd.NewConfigCmd(),
	)

	return root
}

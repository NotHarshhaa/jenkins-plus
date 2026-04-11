"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const [jenkinsUrl, setJenkinsUrl] = useState(
    process.env.NEXT_PUBLIC_JENKINS_URL ?? "http://localhost:8080"
  );
  const [jenkinsUser, setJenkinsUser] = useState("");
  const [jenkinsToken, setJenkinsToken] = useState("");
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [pollingInterval, setPollingInterval] = useState("5");

  function handleSave() {
    toast.success("Settings saved successfully");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your jenkins-plus instance</p>
      </div>

      <Card className="bg-card dark:bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Jenkins Connection</CardTitle>
          <CardDescription className="text-muted-foreground">
            Configure the Jenkins instance to connect to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jenkins-url" className="text-foreground">Jenkins URL</Label>
            <Input
              id="jenkins-url"
              value={jenkinsUrl}
              onChange={(e) => setJenkinsUrl(e.target.value)}
              placeholder="http://localhost:8080"
              className="bg-background dark:bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jenkins-user" className="text-foreground">Username</Label>
            <Input
              id="jenkins-user"
              value={jenkinsUser}
              onChange={(e) => setJenkinsUser(e.target.value)}
              placeholder="admin"
              className="bg-background dark:bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jenkins-token" className="text-foreground">API Token</Label>
            <Input
              id="jenkins-token"
              type="password"
              value={jenkinsToken}
              onChange={(e) => setJenkinsToken(e.target.value)}
              placeholder="your-api-token"
              className="bg-background dark:bg-background"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card dark:bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Polling</CardTitle>
          <CardDescription className="text-muted-foreground">
            Configure real-time data refresh behaviour
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-foreground">Enable auto-refresh</Label>
              <p className="text-sm text-muted-foreground">
                Automatically refresh build data
              </p>
            </div>
            <Switch
              checked={pollingEnabled}
              onCheckedChange={setPollingEnabled}
            />
          </div>
          <Separator className="bg-border dark:bg-border" />
          <div className="space-y-2">
            <Label htmlFor="polling-interval" className="text-foreground">
              Polling interval (seconds)
            </Label>
            <Input
              id="polling-interval"
              type="number"
              min="2"
              max="60"
              value={pollingInterval}
              onChange={(e) => setPollingInterval(e.target.value)}
              disabled={!pollingEnabled}
              className="w-32 bg-background dark:bg-background"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Moon, Sun, Command, Bell, User, Settings, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { cn } from "@/lib/utils";

function getBreadcrumb(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p) =>
    p.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-background/95">
        <div className="flex flex-1 items-center gap-2">
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-muted-foreground">/</span>}
                <span
                  className={cn(
                    i === breadcrumb.length - 1
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
          <Badge
            variant="outline"
            className="ml-2 hidden text-xs text-muted-foreground sm:flex"
          >
            jenkins-plus
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden gap-2 text-muted-foreground sm:flex"
            onClick={() => setCommandOpen(true)}
          >
            <Command className="h-3.5 w-3.5" />
            <span className="text-xs">Search...</span>
            <kbd className="pointer-events-none ml-1 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              ⌘K
            </kbd>
          </Button>

          <div className="flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5 text-muted-foreground" />
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
              aria-label="Toggle dark mode"
            />
            <Moon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}

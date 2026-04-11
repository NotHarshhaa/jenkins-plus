# jenkins-plus UI

Modern Jenkins dashboard built with Next.js 14 App Router, shadcn/ui, and Tailwind CSS.

## Tech Stack

- **Next.js 14** (App Router only)
- **shadcn/ui** — component primitives
- **Tailwind CSS** — styling with dark mode via `next-themes`
- **SWR** — all client-side data fetching with 5s polling
- **@dnd-kit** — drag-and-drop pipeline builder
- **Recharts** — DORA metrics charts
- **lucide-react** — icons
- **ansi-to-html** — ANSI log rendering
- **highlight.js** — Groovy syntax highlighting
- **sonner** — toast notifications

## Quick Start

```bash
cd ui
cp .env.example .env.local
# Edit .env.local with your Jenkins instance details
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_JENKINS_URL` | Public Jenkins URL (browser-side) |
| `NEXT_PUBLIC_APP_NAME` | App display name |
| `JENKINS_URL` | Internal Jenkins URL (server-side proxy) |
| `JENKINS_USER` | Jenkins username |
| `JENKINS_TOKEN` | Jenkins API token |

## Architecture

### Proxy
All Jenkins API calls go through `/jenkins/:path*` → rewrites to `JENKINS_URL/:path*` server-side. This eliminates CORS and avoids exposing credentials to the browser.

### Data Fetching
- SWR polling every 5s for builds/jobs list
- Progressive log polling every 1.5s while a build is running
- CSRF crumb fetched once per 30 minutes and cached

### Pages

| Route | Description |
|---|---|
| `/dashboard` | Summary cards + recent builds |
| `/pipeline-builder` | Drag-and-drop Jenkinsfile builder |
| `/builds` | All builds with filters |
| `/builds/[jobName]/[buildNumber]` | Build detail: logs + stage timeline |
| `/dora` | DORA metrics (Deploy Frequency, Lead Time, CFR, MTTR) |
| `/plugins` | Plugin marketplace |
| `/settings` | Instance configuration |

## Running Tests

```bash
npm test
```

Tests cover the `generateJenkinsfile` pure function with 13 cases including all step types, post actions, agent variants, and multi-stage pipelines.

## Building for Production

```bash
npm run build
npm start
```

## Dark Mode

Dark mode follows the system preference by default. Toggle via the switch in the header.

# ─────────────────────────────────────────────────────────────────────────────
# jenkins-plus — Makefile
# ─────────────────────────────────────────────────────────────────────────────
.DEFAULT_GOAL := help
.PHONY: help dev build push logs stop clean test lint plugin-verify ui-dev

IMAGE  ?= notharshaa/jenkins-plus
TAG    ?= latest
COMPOSE = docker compose

# ── Colours ───────────────────────────────────────────────────────────────────
BOLD  := \033[1m
RESET := \033[0m
GREEN := \033[32m
CYAN  := \033[36m

help: ## Show this help
	@echo ""
	@echo "  $(BOLD)jenkins-plus$(RESET) — available targets"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ── Docker Compose ────────────────────────────────────────────────────────────

dev: ## Start all services in detached mode (docker compose up -d)
	$(COMPOSE) up -d
	@echo "$(GREEN)✓ Stack started. Jenkins → http://localhost:8080  UI → http://localhost:3000$(RESET)"

stop: ## Stop all running services (docker compose down)
	$(COMPOSE) down

clean: ## Stop all services and destroy volumes — DESTRUCTIVE
	$(COMPOSE) down -v --remove-orphans
	@echo "$(GREEN)✓ All containers and volumes removed.$(RESET)"

logs: ## Tail Jenkins controller logs
	$(COMPOSE) logs -f jenkins-plus

logs-all: ## Tail logs for all services
	$(COMPOSE) logs -f

restart: ## Restart the Jenkins controller only
	$(COMPOSE) restart jenkins-plus

# ── Docker image ──────────────────────────────────────────────────────────────

build: ## Build the jenkins-plus Docker image
	docker build \
		--file docker/Dockerfile \
		--tag $(IMAGE):$(TAG) \
		--tag $(IMAGE):$(shell git rev-parse --short HEAD 2>/dev/null || echo dev) \
		.
	@echo "$(GREEN)✓ Image built: $(IMAGE):$(TAG)$(RESET)"

push: ## Push the image to Docker Hub
	docker push $(IMAGE):$(TAG)
	docker push $(IMAGE):$(shell git rev-parse --short HEAD 2>/dev/null || echo dev) || true
	@echo "$(GREEN)✓ Image pushed: $(IMAGE):$(TAG)$(RESET)"

# ── Quality & verification ────────────────────────────────────────────────────

test: ## Run the Next.js UI test suite
	cd ui && npm test

lint: ## Lint the Next.js UI source
	cd ui && npm run lint

plugin-verify: ## Verify all plugins are active in the running Jenkins instance
	docker exec jenkins-plus /usr/local/bin/jenkins-plus/plugin-verify.sh

healthcheck: ## Run the healthcheck script against the local Jenkins instance
	JENKINS_URL=http://localhost:8080 docker/scripts/healthcheck.sh

# ── UI development ────────────────────────────────────────────────────────────

ui-dev: ## Start the Next.js UI in development mode (hot-reload)
	cd ui && npm run dev

ui-install: ## Install UI dependencies
	cd ui && npm ci

# ── Utilities ─────────────────────────────────────────────────────────────────

env: ## Copy .env.example to .env (safe — will not overwrite an existing .env)
	@if [ -f .env ]; then \
		echo ".env already exists — not overwriting. Edit it manually."; \
	else \
		cp .env.example .env; \
		echo "$(GREEN)✓ .env created from .env.example — fill in your values.$(RESET)"; \
	fi

ps: ## Show running compose service status
	$(COMPOSE) ps

shell: ## Open a bash shell inside the Jenkins controller container
	docker exec -it jenkins-plus bash

casc-reload: ## Trigger a live JCasC reload without restarting Jenkins
	curl -sf -X POST \
		-u "$(shell grep ADMIN_USER .env | cut -d= -f2):$(shell grep ADMIN_PASSWORD .env | cut -d= -f2)" \
		"http://localhost:8080/reload-configuration-as-code/?casc-reload=true" \
		&& echo "$(GREEN)✓ JCasC reloaded.$(RESET)" \
		|| echo "Failed — is Jenkins running and are credentials correct?"

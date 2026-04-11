# Contributing to jenkins-plus

Thank you for your interest in contributing to jenkins-plus! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for UI development)
- Go 1.22+ (for jpctl CLI development)
- Make (or use the provided commands directly)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/jenkins-plus.git
   cd jenkins-plus
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/NotHarshhaa/jenkins-plus.git
   ```

### Running Locally

```bash
# Copy environment variables
cp .env.example .env
# Edit .env to set required values (at minimum ADMIN_PASSWORD)

# Start the full stack
make dev

# Or start individual components
cd ui && npm run dev      # UI with hot reload
```

## Development Workflow

### Branch Naming

Use the following branch naming convention:

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `chore/` - Maintenance tasks
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests

Example: `feat/add-kubernetes-agent-support`

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

Example:
```
fix(jenkins): resolve WebSocket agent connection timeout

Agents were failing to connect due to insufficient timeout in the
WebSocket handshake configuration. Increased timeout from 30s to 90s.

Closes #123
```

### DCO Sign-off

All commits must be signed off using the `-s` flag:

```bash
git commit -s -m "feat: add new feature"
```

This indicates you agree to the Developer Certificate of Origin (DCO).

## Pull Request Process

### Before Submitting

1. **Update documentation** - If your change affects functionality, update the relevant docs
2. **Add tests** - Ensure new features have test coverage
3. **Run tests locally**:
   ```bash
   make test          # Run all tests
   make lint          # Lint all code
   ```
4. **Rebase your branch** - Keep your branch up to date with upstream/main:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### PR Checklist

When submitting a PR, ensure:

- [ ] Title follows conventional commit format
- [ ] Description explains the "why" and "what"
- [ ] All tests pass locally
- [ ] Documentation is updated
- [ ] No merge conflicts with upstream/main
- [ ] Commits are signed off (DCO)
- [ ] For UI changes: include screenshots if applicable

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test this change?

## Screenshots (if UI change)
[Attach screenshots]

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Coding Standards

### General

- Follow existing code style and patterns
- Keep functions small and focused
- Add comments for complex logic
- Use meaningful variable and function names

### UI (Next.js/TypeScript)

- Use TypeScript for all new code
- Follow existing component structure
- Use shadcn/ui components when possible
- Ensure dark mode compatibility

### Groovy (Shared Library)

- All classes must implement `Serializable`
- Use `@NonCPS` for non-serializable methods
- Follow existing naming conventions
- Add Javadoc comments for public methods

### Go (jpctl)

- Follow standard Go conventions
- Use `gofmt` for formatting
- Handle errors explicitly
- Write tests for new functions

### Helm/Terraform

- Follow existing template patterns
- Use Helm best practices
- Keep Terraform modules reusable
- Document complex logic

## Running Tests

```bash
# UI tests
cd ui
npm test
npm run lint

# Go tests
cd jpctl
go test ./...
go vet ./...

# Terraform validation
cd terraform/aws && terraform init -backend=false && terraform validate
cd terraform/gcp && terraform init -backend=false && terraform validate
cd terraform/azure && terraform init -backend=false && terraform validate

# Helm lint
helm lint ./helm
```

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues and PRs first

Thank you for contributing to jenkins-plus!

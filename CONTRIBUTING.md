# Contributing to VideoHarvest
First off, thank you for considering contributing to VideoHarvest!

Whether you're fixing a bug, improving documentation, suggesting a feature, or submitting code, every contribution helps make the project better.

Please take a few minutes to read this guide before opening an issue or pull request.


# Code of Conduct

By participating in this project, you agree to follow our Code of Conduct.

Please read:

**CODE_OF_CONDUCT.md**

Be respectful, constructive, and welcoming to everyone.


## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies: `pnpm install`
3. Run in dev mode: `pnpm tauri dev`

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Enforced by commitlint.

```
feat(download): add playlist range support
fix(scheduler): prevent double-trigger on startup
docs: update installation guide
```

## Pull Requests

- One feature or fix per PR.
- Target the `main` branch.
- Fill in the PR template.
- Pass lint: `pnpm lint` and Rust checks: `cargo clippy && cargo fmt --check`

## Code Style

**Frontend:** ESLint enforces style automatically via `pnpm lint:fix`.
**Rust:** Run `cargo fmt` before committing.

## Reporting Issues

Use the GitHub issue templates for bugs and feature requests.

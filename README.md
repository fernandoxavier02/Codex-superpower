<div align="center">
  <img src="assets/fx-studio-ai-logo.png" alt="FX Studio AI" width="600"/>
</div>

<h1 align="center">Codex Superpower</h1>

<p align="center">
  <strong>Agentic Skills + Pipeline Orchestration for OpenAI Codex CLI</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-OpenAI%20Codex%20CLI-412991?style=flat-square" alt="Platform"/>
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/language-JavaScript-F7DF1E?style=flat-square" alt="Language"/>
</p>

## What It Does

Codex Superpower brings together the Superpowers skills framework and the Pipeline Orchestrator into a unified package for OpenAI Codex CLI. It combines 14 specialized development skills with multi-agent pipeline orchestration, all adapted for Codex's terminal-based environment.

The result is a structured development workflow engine that runs entirely in the terminal: brainstorm ideas, write specs, execute with TDD, review with adversarial agents, and deploy -- all through a single cohesive system.

## Features

- **14 Superpowers Skills** — Brainstorming, TDD, code review, debugging, plan execution, subagent delegation, git worktrees, and more
- **Pipeline Orchestration** — Multi-agent task execution with auto-classification, adaptive batching, and quality gates
- **Local Diagnostics MCP** — Read-only stdio MCP server for bundle inspection, installation checks, and configuration diagnostics
- **Adversarial Review** — Built-in review agents that challenge proposals before execution
- **1% Rule Methodology** — Each skill focuses on one concern, delegating via subagents
- **Terminal-Native** — Designed for Codex CLI's terminal-based interaction model
- **Structured Lifecycle** — From ideation through implementation, review, and deployment in a single toolchain
- **Plugin Bundle** — Complete `.codex-plugin/` manifest with skills, hooks, commands, and agents

## Installation

### Option A: Marketplace-Local Install

1. Clone the repository:
   ```bash
   git clone https://github.com/fernandoxavier02/Codex-superpower.git ~/plugins/superpowers-codex-global
   ```

2. Register the plugin in your local Codex marketplace at `~/.agents/plugins/marketplace.json`.

3. Restart Codex to reload the plugin manifest.

### Option B: Manual Clone Install

1. Clone the repository:
   ```bash
   git clone https://github.com/fernandoxavier02/Codex-superpower.git
   ```

2. Symlink the skills directory:
   ```bash
   ln -s $(pwd)/Codex-superpower/skills ~/.agents/skills/superpowers
   ```

3. Restart Codex.

See [.codex/INSTALL.md](./.codex/INSTALL.md) for detailed installation guidance.

## Usage

Invoke skills and pipeline commands through Codex:

```bash
# Brainstorm a feature
@brainstorm "Design a caching layer for the API"

# Run TDD workflow
@tdd "Implement pagination for the search endpoint"

# Submit a task to the pipeline
@pipeline "Refactor error handling across all services"

# Code review
@review "Audit the latest changes for performance issues"

# Run diagnostics on the bundle
# (via the local MCP: bundle_metadata, inspect_bundle, doctor)
```

Skills produce structured outputs with clear next steps. The pipeline orchestrator handles complex multi-step tasks by decomposing them, assigning specialized agents, and enforcing quality gates throughout.

## Validation

Run the test suite to verify the installation:

```bash
node --test tests/mcp/superpowers-codex-manifests.test.mjs \
  tests/mcp/superpowers-codex-diagnostics.test.mjs \
  tests/mcp/superpowers-codex-diagnostics-integration.test.mjs
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <strong>Built by <a href="https://github.com/fernandoxavier02">Fernando Xavier</a></strong>
  <br/>
  <a href="https://fxstudioai.com">FX Studio AI</a> — Business Automation with AI
</div>

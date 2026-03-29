# Codex Superpower

<p align="center">
  <img src="./assets/fx-studio-ai.png" alt="FX Studio AI" width="460" />
</p>

<p align="center"><strong>Professional Superpowers workflow adaptation for Codex</strong></p>

<p align="center">
  Codex-focused distribution of the original
  <a href="https://github.com/obra/superpowers">Superpowers</a>
  methodology, packaged with plugin assets, workflow hooks, and a local read-only diagnostics MCP.
</p>

<p align="center">
  <img alt="Target Codex" src="https://img.shields.io/badge/Target-Codex-0A84FF?style=flat-square" />
  <img alt="Transport stdio" src="https://img.shields.io/badge/MCP-stdio-101828?style=flat-square" />
  <img alt="Diagnostics Read Only" src="https://img.shields.io/badge/Diagnostics-read--only-12B76A?style=flat-square" />
  <img alt="License MIT" src="https://img.shields.io/badge/License-MIT-F79009?style=flat-square" />
</p>

## Executive Summary

This repository packages the Codex-native version of the Superpowers workflow with a clear and honest scope:

- a Codex plugin bundle under `.codex-plugin/`
- native skill and hook assets for the workflow
- a real local diagnostics MCP registered through `.mcp.json`
- test coverage for manifests, diagnostics behavior, and published integration wiring

This version does not ship any external app surface. The real integration surface for this release is the local read-only diagnostic MCP.

## Why This Repository Exists

The goal is not to replace or rebrand the upstream project. The goal is to adapt the original Superpowers operating model to Codex while preserving the discipline that makes the workflow valuable:

- brainstorming before implementation
- explicit specs before execution
- written plans before code changes
- multi-agent execution with review checkpoints
- verification before completion

## Highlights In This Version

- Local diagnostic MCP published through [`.mcp.json`](./.mcp.json)
- Read-only diagnostics contract implemented in [`scripts/mcp/`](./scripts/mcp)
- Plugin manifest aligned to real behavior in [`.codex-plugin/plugin.json`](./.codex-plugin/plugin.json)
- Documentation updated to remove unused external app promises
- Published config snippet cleaned up to remove `collab = true`
- Targeted MCP test coverage in [`tests/mcp/`](./tests/mcp)

## What Is Included

| Area | Purpose |
| --- | --- |
| [`.codex-plugin/`](./.codex-plugin) | Codex plugin manifest and bundle metadata |
| [`skills/`](./skills) | Active Superpowers skills used by Codex |
| [`hooks/`](./hooks) | Workflow enforcement hooks |
| [`commands/`](./commands) | Codex command entrypoints |
| [`agents/`](./agents) | Agent-facing bundle assets |
| [`scripts/mcp/`](./scripts/mcp) | Local diagnostics MCP implementation |
| [`tests/`](./tests) | Validation for manifests, MCP logic, and integration wiring |
| [`codex-global/`](./codex-global) | Global support assets and install references |
| [`docs/`](./docs) | Codex-facing documentation and approved implementation records |

## Scope Boundary

This repository is intentionally strict about its public contract.

**Included in scope**

- Codex workflow assets
- local diagnostics MCP
- installation guidance for native skill discovery
- tests that validate the published contract

**Out of scope in this version**

- external app integration via `.app.json`
- marketplace claims for capabilities that are not actually wired
- write-capable MCP operations

The bundle itself still contains interactive and write-capable workflows through skills, hooks, and execution patterns. The **MCP surface only** is read-only.

## Quick Start

Choose one of the two supported installation paths:

1. **Marketplace-local install**
   Register the plugin in your home-local Codex marketplace and point it at a local checkout in `~/plugins/superpowers-codex-global`.
2. **Manual clone install**
   Clone the repository, create the native skills link, restart Codex, and use the bundle directly from the checkout.

For most users, the best route is:

1. Clone this repository to `~/plugins/superpowers-codex-global`.
2. Register or update the local marketplace entry in `~/.agents/plugins/marketplace.json`.
3. Restart Codex so it reloads the local marketplace and the plugin manifest.
4. If needed, enable multi-agent support with the snippet in [`codex-global/config/hooks-snippet.toml`](./codex-global/config/hooks-snippet.toml).
5. Use the repo-local diagnostics MCP exposed by [`.mcp.json`](./.mcp.json) when working inside this workspace.

Detailed installation guidance lives in [`.codex/INSTALL.md`](./.codex/INSTALL.md) and [docs/README.codex.md](./docs/README.codex.md).

## Installation Paths

### Option A: Marketplace-Local Install

Codex supports a **home-local marketplace** file at `~/.agents/plugins/marketplace.json`.
This is not a remote public marketplace. It is a machine-local catalog that can point to plugins stored under `~/plugins/`.

For this plugin, the marketplace entry should point to:

- plugin name: `superpowers-codex-global`
- source path: `./plugins/superpowers-codex-global`
- installation policy: `AVAILABLE`
- authentication policy: `ON_INSTALL`

When installed this way, Codex reads the plugin manifest and loads the bundle's
declared `skills`, `hooks`, and `mcpServers` from the local checkout.
You do **not** need a separate `~/.agents/skills/superpowers` symlink for this route.

This route is ideal if you want the plugin to appear in the Codex marketplace UI on your machine while still being backed by a local checkout you control.

### Option B: Manual Clone Install

If you do not want to use the marketplace-local route, you can still install the bundle manually:

- clone the repository into `~/plugins/superpowers-codex-global`
- point `~/.agents/skills/superpowers` at the bundle's `skills/` directory
- restart Codex

Both routes use the same local checkout and the same repo-local only diagnostic MCP, but only the manual route depends on the explicit skills symlink/junction.

## Diagnostics MCP

The diagnostics service is implemented as a **local stdio MCP** and is intentionally narrow:

- server name: `superpowers-codex-diagnostics`
- transport: `stdio`
- contract: read-only diagnostics
- entrypoint: [`scripts/mcp/superpowers-codex-diagnostics.mjs`](./scripts/mcp/superpowers-codex-diagnostics.mjs)

Core diagnostics tools include:

- `bundle_metadata`
- `inspect_bundle`
- `inspect_installation`
- `inspect_hooks`
- `inspect_config`
- `doctor`

This MCP is for bundle diagnostics only. It is not an app integration layer and does not expose write operations.

## Validation

The repository includes targeted automated checks for the published contract:

- manifest and documentation expectations
- diagnostics tool behavior
- integration wiring derived from [`.mcp.json`](./.mcp.json)

Primary validation suite:

```bash
node --test tests/mcp/superpowers-codex-manifests.test.mjs tests/mcp/superpowers-codex-diagnostics.test.mjs tests/mcp/superpowers-codex-diagnostics-integration.test.mjs
```

Installation is considered successful when:

- the bundle is present in your local marketplace, if you chose that route
- Codex can discover the plugin-provided skills, or the `superpowers` skills namespace in manual mode
- the repo-local diagnostic MCP is available inside this workspace
- the diagnostics bundle reports the expected assets and configuration

## Workflow Shape

The Codex adaptation preserves the recognizable structure of the original Superpowers workflow:

1. `brainstorming`
2. `writing-plans`
3. `subagent-driven-development` or `executing-plans`
4. `requesting-code-review`
5. `verification-before-completion`
6. `finishing-a-development-branch`

That workflow is reinforced here with hooks, docs, and validation assets so planning and execution stay explicit and reviewable.

## Attribution

This project builds on the upstream Superpowers methodology and preserves clear attribution:

- Upstream repository: [obra/superpowers](https://github.com/obra/superpowers)
- Original creator: Jesse Vincent
- Original organization: Prime Radiant
- Codex adaptation, workflow port, global integration, and diagnostics packaging: Fernando Xavier, FX Studio AI

## Community And Upstream

- Upstream issues: [github.com/obra/superpowers/issues](https://github.com/obra/superpowers/issues)
- Upstream marketplace: [github.com/obra/superpowers-marketplace](https://github.com/obra/superpowers-marketplace)
- Upstream Discord: [discord.gg/Jd8Vphy9jq](https://discord.gg/Jd8Vphy9jq)

## License

MIT License. See [LICENSE](./LICENSE).

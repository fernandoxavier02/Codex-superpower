# Codex Superpower

<p align="center">
  <img src="./assets/fx-studio-ai.png" alt="FX Studio AI" width="420" />
</p>

<p align="center">
  Codex-only adaptation of the original <a href="https://github.com/obra/superpowers">Superpowers</a> workflow.
</p>

## Overview

This repository contains only the Codex plugin bundle and the Codex global support files needed to run the workflow the same way it runs in my own environment.

It is not intended to replace or rebrand the upstream project. The purpose is to adapt the original Claude-oriented Superpowers workflow to Codex while preserving the same structure, discipline, and operating model:

- brainstorming before implementation
- spec approval before plan writing
- writing-plans before code changes
- execution with gates, reviews, and checkpoints
- verification before completion

## Attribution

- Original upstream project: [obra/superpowers](https://github.com/obra/superpowers)
- Original creator: Jesse Vincent
- Original organization: Prime Radiant
- Codex adaptation, global integration, hook enforcement, and workflow port: Fernando Xavier - FX Studio AI

This repository intentionally preserves the recognizable shape of the original workflow so users can benefit from the upstream methodology on Codex without losing the attribution to the original work.

## What This Repository Contains

This is a Codex-focused distribution. It contains:

- `.codex-plugin/` with the Codex plugin manifest
- `skills/` with the active skill set
- `hooks/` with the enforcement hooks used by the workflow
- `commands/` and `agents/` with Codex-facing entrypoints
- `tests/` with the gate validation tests
- `codex-global/` with the global Codex assets and installation references used to mirror the same behavior across projects
- `assets/` with branding and UI assets used by the plugin bundle

This repository ships only the Codex plugin and the Codex-specific supporting assets users need to install and use it consistently.

It does not ship compatibility folders for Claude, Cursor, Gemini, OpenCode, or any other IDE/runtime.

## Scope Boundary

The marketplace plugin and the local Codex pipeline are intentionally **not** the same thing.

**The plugin marketplace scope covers:**

- design discovery and clarification
- written specs
- written implementation plans
- execution handoff
- plan execution discipline
- verification before completion

**The local Codex pipeline scope covers:**

- heavy orchestration such as `task-orchestrator`
- adaptive batch execution
- adversarial per-batch review gates
- sanity-checker and final validator style closure
- Go/No-Go style pipeline decisions

The plugin should be rigorous within its own scope, but it should not claim to be the full local pipeline.

## Workflow Summary

The adapted workflow keeps the same core structure as the original Superpowers system:

1. `brainstorming`
2. `writing-plans`
3. `subagent-driven-development` or `executing-plans`
4. `requesting-code-review`
5. `verification-before-completion`
6. `finishing-a-development-branch`

In the Codex adaptation, this flow is reinforced with hooks and stateful gates so planning, writing-plans, execution, and pipeline behavior remain explicit and auditable.

Within the plugin bundle itself, the intended scope is:

- `brainstorming` for design discovery, clarification, and written specs
- `writing-plans` for detailed written implementation plans and explicit execution handoff
- `subagent-driven-development` or `executing-plans` for plan execution within skill-defined checkpoints
- `requesting-code-review` for independent code review during implementation
- `verification-before-completion` for evidence-based completion claims

Heavy pipeline orchestration is intentionally left to the local Codex pipeline assets and should not be treated as part of the marketplace plugin contract.

## Installation For Codex

Use the Codex plugin bundle in this repository together with the Codex global assets in `codex-global/`.

Main plugin manifest:

- [`.codex-plugin/plugin.json`](./.codex-plugin/plugin.json)

Primary runtime folders:

- [`skills/`](./skills)
- [`hooks/`](./hooks)
- [`commands/`](./commands)
- [`agents/`](./agents)
- [`codex-global/`](./codex-global)

Codex-focused docs:

- [`docs/README.codex.md`](./docs/README.codex.md)
- [`codex-global/config/hooks-snippet.toml`](./codex-global/config/hooks-snippet.toml)

## Validation

The repository includes gate tests for the main workflow states, including:

- planning mode
- writing-plans mode
- execution choice mode
- execution mode
- pipeline mode for the local Codex integration surface, not as a statement that the marketplace plugin itself implements the full pipeline contract

These tests live under [`tests/`](./tests).

## Community And Upstream

The original Superpowers community and upstream project live at [obra/superpowers](https://github.com/obra/superpowers).

- Upstream issues: [github.com/obra/superpowers/issues](https://github.com/obra/superpowers/issues)
- Upstream marketplace: [github.com/obra/superpowers-marketplace](https://github.com/obra/superpowers-marketplace)
- Upstream Discord: [discord.gg/Jd8Vphy9jq](https://discord.gg/Jd8Vphy9jq)

## License

MIT License. See [LICENSE](./LICENSE).

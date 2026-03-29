# Superpowers Codex Bundle

## Objective

This bundle is the canonical Codex-facing packaging of Superpowers 5.0.8. It mirrors the upstream skill library where possible, adapts Codex-specific workflows and docs, and keeps global assets in one place for the bundle to reference consistently.

## Matrix

| Area | Treatment | Notes |
| --- | --- | --- |
| `skills/` | Mirror + SSOT | Skill files are the primary workflow contract for the marketplace plugin. Codex-specific drift is allowed when needed, but the skill text stays authoritative. |
| `hooks/` | Adapt | Keep the hook entrypoints working for Codex and remove Claude-only wording. |
| `codex-global/hooks/` | Validate | Hooks should enforce or validate the contract defined by `skills/`; they should not become a separate competing SSOT. |
| `codex-global/tests/` | Validate | Tests should verify the workflow contract from `skills/` and the behavior of Codex hooks, not redefine the workflow independently. |
| `docs/README.codex.md` | Adapt | Installation and usage docs should match Codex discovery and multi-agent support. |
| `README.md` | Scope SSOT | Public statement of what the plugin bundle covers versus what remains in the local Codex pipeline. |
| `.codex/INSTALL.md` | Adapt | Short install entrypoint for Codex users. |
| `skills/using-git-worktrees` | Adapt | Project-instructions checks need Codex-friendly wording. |
| `skills/executing-plans` | Adapt | Plan tracking must map cleanly to Codex `update_plan`. |
| `skills/subagent-driven-development` | Adapt | Subagent dispatch needs Codex tool mapping notes. |
| `skills/using-superpowers/references/codex-tools.md` | Mirror | Source-of-truth mapping between Superpowers concepts and Codex tools. |
| `codex-global/` | Add | Shared global assets for this bundle live here. |
| Local `.codex/skills/pipeline` | Out of scope | Heavy orchestration, adversarial per-batch review, and Go/No-Go closure belong to the local Codex pipeline, not the marketplace plugin contract. |
| Legacy placeholders | Remove | Any leftover TODOs, placeholder URLs, or non-Codex compatibility artifacts should not remain in the canonical bundle. |

## Workflow Boundary

The marketplace plugin contract is intentionally narrower than the local Codex pipeline.

**Plugin contract:**

- design clarification and one-question-at-a-time discovery
- no-invention gating
- written spec creation and review
- written implementation plan creation and review
- execution handoff and execution discipline
- verification before completion

**Local pipeline contract:**

- task orchestration
- adaptive batch control
- adversarial per-batch review
- sanity/final validation gates
- Go/No-Go style closure

The plugin may integrate cleanly with those local assets, but it must not overclaim that it implements the full pipeline.

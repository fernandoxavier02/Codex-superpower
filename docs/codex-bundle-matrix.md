# Superpowers Codex Bundle

## Objective

This bundle is the canonical Codex-facing packaging of Superpowers 5.0.6. It mirrors the upstream skill library where possible, adapts Codex-specific workflows and docs, and keeps global assets in one place for the bundle to reference consistently.

## Matrix

| Area | Treatment | Notes |
| --- | --- | --- |
| `skills/` | Mirror | Keep the upstream skill library intact unless Codex-specific drift is known. |
| `hooks/` | Adapt | Keep the hook entrypoints working for Codex and remove Claude-only wording. |
| `docs/README.codex.md` | Adapt | Installation and usage docs should match Codex discovery and multi-agent support. |
| `.codex/INSTALL.md` | Adapt | Short install entrypoint for Codex users. |
| `skills/using-git-worktrees` | Adapt | Project-instructions checks need Codex-friendly wording. |
| `skills/executing-plans` | Adapt | Plan tracking must map cleanly to Codex `update_plan`. |
| `skills/subagent-driven-development` | Adapt | Subagent dispatch needs Codex tool mapping notes. |
| `skills/using-superpowers/references/codex-tools.md` | Mirror | Source-of-truth mapping between Superpowers concepts and Codex tools. |
| `.claude-plugin/`, `.cursor-plugin/`, `.opencode/` | Mirror | Keep upstream compatibility artifacts, but do not treat them as Codex-first surfaces. |
| `codex-global/` | Add | Shared global assets for this bundle live here. |
| Legacy placeholders | Remove later | Any leftover TODOs or placeholder URLs should not remain in the canonical bundle. |

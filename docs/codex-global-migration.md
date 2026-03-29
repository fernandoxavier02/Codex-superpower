# Superpowers Codex Global Migration Inventory

## Goal

This bundle is the canonical local source for the Codex global stack that mirrors:

- upstream `superpowers`
- the active Claude global pipeline entrypoints
- the local Kiro and orchestrator overlay used outside plugin cache

## Matrix

| Category | Source | Action |
|---|---|---|
| Core superpowers skills, commands, docs, tests | `C:\Users\win\.claude\plugins\cache\claude-plugins-official\superpowers\5.0.6` | `mirror` |
| Codex worktree and finishing compatibility | upstream specs in `docs\superpowers\specs` | `adapt` |
| Pipeline and Kiro overlay in active global Codex files | `C:\Users\win\.claude\.kiro`, `C:\Users\win\.claude\agents`, `C:\Users\win\.claude\commands` | `adapt` |
| Historical Claude hooks backups and inactive marketplace installs | `C:\Users\win\.claude\hooks\backup-*`, disabled plugin installs | `ignore` |
| Legacy Codex-local `superpowers` skills and wrappers | `C:\Users\win\.codex\skills\superpowers`, `C:\Users\win\.codex\skills\using-superpowers`, legacy wrappers in `C:\Users\win\.codex\commands` | `remove-later` |

## Canonical Active Surfaces

- `C:\Users\win\.codex\AGENTS.md`
- `C:\Users\win\.codex\.kiro\`
- `C:\Users\win\.codex\hooks\`
- `C:\Users\win\.codex\commands\`
- `C:\Users\win\.codex\agents\`
- `C:\Users\win\.agents\skills\superpowers`

The bundle is intentionally outside `C:\Users\win\.codex\plugins\cache` to avoid using a runtime cache as the source of truth.

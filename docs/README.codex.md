# Superpowers for Codex

Guide for using the local `superpowers-codex-global` bundle with Codex via native skill discovery.

Codex adaptation by Fernando Xavier - FX Studio AI.

## Quick Install

Tell Codex:

```
Follow the install instructions from `~/plugins/superpowers-codex-global/.codex/INSTALL.md`
```

## Manual Installation

### Prerequisites

- Codex
- A local canonical bundle at `~/plugins/superpowers-codex-global`

These instructions assume the canonical bundle is checked out at
`~/plugins/superpowers-codex-global`.

### Steps

1. Ensure the canonical bundle exists at:
   ```bash
   ~/plugins/superpowers-codex-global
   ```

2. Create the skills symlink:
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/plugins/superpowers-codex-global/skills ~/.agents/skills/superpowers
   ```

3. Restart Codex.

4. **For subagent skills** (optional): Skills like `dispatching-parallel-agents` and `subagent-driven-development` require Codex's multi-agent feature. Add to your Codex config:
   ```toml
   [features]
   multi_agent = true
   ```

5. Keep `~/.agents/skills/superpowers` pointed at the bundle's `skills/` directory so native skill discovery stays live after updates.

### Windows

Use a junction instead of a symlink (works without Developer Mode):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\plugins\superpowers-codex-global\skills"
```

## How It Works

Codex has native skill discovery — it scans `~/.agents/skills/` at startup, parses SKILL.md frontmatter, and loads skills on demand. Superpowers skills are made visible through a single symlink:

```
~/.agents/skills/superpowers/ → ~/plugins/superpowers-codex-global/skills/
```

The `using-superpowers` skill is discovered automatically and enforces skill usage discipline — no additional configuration needed.

## Diagnostic MCP

This bundle now ships a local read-only diagnostic MCP entrypoint through
`.mcp.json`. It is the repository-local integration surface reserved for
Superpowers Codex diagnostics in this release.

It does not repair the environment automatically in this version.
It is repo-local only and is available when Codex is running in a workspace
that loads this repository's `.mcp.json`.
The MCP surface is read-only, while the broader plugin bundle still includes
interactive and write-capable workflows through its skills and hooks.

## Usage

Skills are discovered automatically. Codex activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill directs Codex to use one

## Scope Note

This Codex bundle covers the marketplace-scope workflow: design discovery, written specs,
written implementation plans, execution handoff, execution discipline, and verification.

It is not the same thing as the heavier local Codex pipeline. Local pipeline concerns such as
task orchestration, adaptive batching, adversarial per-batch review, and Go/No-Go validation
remain outside the marketplace plugin contract.

### Personal Skills

Create your own skills in `~/.agents/skills/`:

```bash
mkdir -p ~/.agents/skills/my-skill
```

Create `~/.agents/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Codex decides when to activate a skill automatically — write it as a clear trigger condition.

## Updating

```bash
Update the canonical bundle in `~/plugins/superpowers-codex-global`.
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\superpowers"
```

Optionally delete the canonical bundle: `rm -rf ~/plugins/superpowers-codex-global` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\plugins\superpowers-codex-global"`).

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.agents/skills/superpowers`
2. Check skills exist: `ls ~/plugins/superpowers-codex-global/skills`
3. Restart Codex — skills are discovered at startup

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Canonical local bundle: `~/plugins/superpowers-codex-global`

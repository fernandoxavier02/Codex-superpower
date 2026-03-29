# Installing Superpowers for Codex

Enable the local `superpowers-codex-global` bundle in Codex via native skill discovery.

## Prerequisites

- A local canonical bundle at `~/plugins/superpowers-codex-global`

These instructions assume the canonical bundle is checked out at
`~/plugins/superpowers-codex-global`.

## Installation

1. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/plugins/superpowers-codex-global/skills ~/.agents/skills/superpowers
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\plugins\superpowers-codex-global\skills"
   ```

2. **Restart Codex** (quit and relaunch the CLI) to discover the skills.

3. **Enable multi-agent support** if you plan to use `dispatching-parallel-agents` or `subagent-driven-development`:
   ```toml
   [features]
   multi_agent = true
   ```

## Diagnostic MCP

The bundle includes a local read-only diagnostic MCP registered through `.mcp.json`.
It is the repository-local integration surface used for Superpowers Codex
diagnostics in this release.
It is repo-local only and is available when Codex is running in a workspace
that loads this repository's `.mcp.json`.
The MCP surface is read-only, while the broader plugin bundle still includes
interactive and write-capable workflows through its skills and hooks.

## Migrating from old bootstrap

If you installed superpowers before native skill discovery, you need to:

1. Point `~/.agents/skills/superpowers` to `~/plugins/superpowers-codex-global/skills`.
2. Remove legacy bootstrap wiring only after the new bundle is validated.
3. Restart Codex.

## Verify

```bash
ls -la ~/.agents/skills/superpowers
```

You should see a symlink (or junction on Windows) pointing to `~/plugins/superpowers-codex-global/skills`.

## Updating

Update the canonical bundle contents in `~/plugins/superpowers-codex-global`.

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
```

Optionally delete the canonical bundle: `rm -rf ~/plugins/superpowers-codex-global`.

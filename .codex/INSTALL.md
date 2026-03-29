# Installing Superpowers for Codex

Enable the local `superpowers-codex-global` bundle in Codex via native skill discovery.

## Prerequisites

- A local canonical bundle at `C:\Users\win\plugins\superpowers-codex-global`

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

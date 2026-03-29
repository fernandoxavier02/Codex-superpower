# Installing Superpowers for Codex

Enable the local `superpowers-codex-global` bundle in Codex via native skill discovery.

This guide supports two installation models:

1. **Marketplace-local install**
   Publish the plugin into your machine-local Codex marketplace at `~/.agents/plugins/marketplace.json`.
2. **Manual install**
   Use the repository directly without adding a marketplace entry.

## Prerequisites

- Git
- A local clone target such as `~/plugins/`
- A local canonical bundle at `~/plugins/superpowers-codex-global`

These instructions assume the canonical bundle is checked out at
`~/plugins/superpowers-codex-global`.

## Step 1: Clone The Repository

```bash
mkdir -p ~/plugins
git clone https://github.com/fernandoxavier02/Codex-superpower.git ~/plugins/superpowers-codex-global
```

**Windows (PowerShell):**

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\plugins"
git clone https://github.com/fernandoxavier02/Codex-superpower.git "$env:USERPROFILE\plugins\superpowers-codex-global"
```

## Step 2: Choose Your Installation Route

### Route A: Marketplace-Local Install

Codex can read a machine-local marketplace catalog from:

```text
~/.agents/plugins/marketplace.json
```

Create the parent folder if it does not exist:

```bash
mkdir -p ~/.agents/plugins
```

**Windows (PowerShell):**

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\plugins"
```

If you do not already have a marketplace file, create this one:

```json
{
  "name": "local-codex-marketplace",
  "interface": {
    "displayName": "Local Codex Marketplace"
  },
  "plugins": [
    {
      "name": "superpowers-codex-global",
      "source": {
        "source": "local",
        "path": "./plugins/superpowers-codex-global"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

If you already have a marketplace file, add or update the `superpowers-codex-global`
entry in the `plugins` array without duplicating it.

This route lets the plugin appear in the Codex marketplace UI on your machine while remaining backed by your local checkout.
In this mode, Codex can load the bundle through the plugin manifest itself, so a separate
`~/.agents/skills/superpowers` symlink is not required.

### Route B: Manual Install

If you do not want a marketplace entry, continue using the same local checkout directly.
The manual route works through native skill discovery and does require the skills symlink or junction.

## Step 3: Activate The Route

### Route A: Marketplace-Local

After saving `~/.agents/plugins/marketplace.json`, restart Codex.

Codex should now load the plugin from:

```text
~/plugins/superpowers-codex-global
```

through the manifest in:

```text
~/plugins/superpowers-codex-global/.codex-plugin/plugin.json
```

### Route B: Manual

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

## Step 4: Restart Codex

Quit and relaunch Codex so it can:

- rescan `~/.agents/skills/`, if you chose the manual route
- reload the machine-local marketplace, if you configured it
- pick up this bundle's repo-local only diagnostic MCP when you work in this repository

## Step 5: Enable Multi-Agent Support When Needed

Enable multi-agent support if you plan to use `dispatching-parallel-agents` or `subagent-driven-development`:
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

## Verify The Installation

If you chose the marketplace-local route, also verify that `~/.agents/plugins/marketplace.json`
contains a single `superpowers-codex-global` entry pointing to `./plugins/superpowers-codex-global`.

If you chose the manual route, verify the skills link:

```bash
ls -la ~/.agents/skills/superpowers
```

You should see a symlink (or junction on Windows) pointing to `~/plugins/superpowers-codex-global/skills`.

Inside the repository workspace, you can also validate the diagnostic MCP contract with:

```bash
node --test tests/mcp/superpowers-codex-manifests.test.mjs tests/mcp/superpowers-codex-diagnostics.test.mjs tests/mcp/superpowers-codex-diagnostics-integration.test.mjs
```

Success means:

- the marketplace entry is correct, if used
- the plugin manifest can load the bundle in marketplace-local mode
- skills are discoverable in manual mode
- the bundle wiring is coherent
- the diagnostic MCP is available and read-only

## First Run

After restarting Codex, try prompts such as:

- `Use brainstorming before we change the feature`
- `Execute this approved plan with subagent-driven-development`
- `Run requesting-code-review before we close the task`

These help confirm that native skill discovery is working.

## Updating

Update the canonical bundle contents in `~/plugins/superpowers-codex-global`.
If you installed through the marketplace-local route, no additional marketplace change is needed as long as the path stays the same.

```bash
cd ~/plugins/superpowers-codex-global
git pull
```

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
```

This removal is only needed for the manual route.

If you used the marketplace-local route, also remove the `superpowers-codex-global`
entry from `~/.agents/plugins/marketplace.json`.

Optionally delete the canonical bundle: `rm -rf ~/plugins/superpowers-codex-global`.

# Installing Superpowers for Codex

## Quick Install (Recommended)

```bash
# 1. Clone
git clone https://github.com/fernandoxavier02/Codex-superpower.git

# 2. Copy into Codex plugin cache
mkdir -p ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global/5.0.9
cp -r Codex-superpower/* ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global/5.0.9/

# 3. Make hooks executable (Unix/macOS)
chmod +x ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global/5.0.9/hooks/run-hook.cmd
chmod +x ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global/5.0.9/hooks/session-start

# 4. Restart Codex CLI
```

### Windows (PowerShell)

```powershell
# 1. Clone
git clone https://github.com/fernandoxavier02/Codex-superpower.git

# 2. Copy into Codex plugin cache
$dest = "$env:USERPROFILE\.codex\plugins\cache\fx-studio-ai\superpowers-codex-global\5.0.9"
New-Item -ItemType Directory -Force -Path $dest
Copy-Item -Recurse -Force "Codex-superpower\*" $dest
```

## Prerequisites

```toml
# ~/.codex/config.toml
multi_agent = true
model_reasoning_effort = "high"
```

## Development Symlink

For active development on the plugin itself:

```bash
git clone https://github.com/fernandoxavier02/Codex-superpower.git
cd Codex-superpower

mkdir -p ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global
ln -sf "$(pwd)" ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global/5.0.9
```

## Verify

```bash
# Check 14 skills are discoverable
ls ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global/*/skills/*/SKILL.md | wc -l
# Expected: 14

# Check hooks are present
ls ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global/*/hooks/hooks.json
# Expected: hooks.json path

# Check plugin manifest
cat ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global/*/\\.codex-plugin/plugin.json | head -3
# Expected: { "name": "superpowers-codex-global", "version": "5.0.9" ...
```

## Updating

```bash
cd Codex-superpower  # or wherever you cloned
git pull
cp -r * ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global/5.0.9/
```

## Uninstalling

```bash
rm -rf ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global
```

## Legacy Migration

If you previously installed using `~/.agents/skills/superpowers` symlinks:

```bash
# Remove old symlink
rm -f ~/.agents/skills/superpowers

# Install using the new method above
```

The `~/.agents/` path was used in early Codex versions. The standard path is now `~/.codex/plugins/cache/`.

<div align="center">
  <img src="assets/fx-studio-ai-logo.png" alt="FX Studio AI" width="600"/>
</div>

<h1 align="center">Codex Superpower</h1>

<p align="center">
  <strong>14 Agentic Development Skills for OpenAI Codex CLI</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-OpenAI%20Codex%20CLI-412991?style=flat-square" alt="Platform"/>
  <img src="https://img.shields.io/badge/version-5.0.9-blue?style=flat-square" alt="Version"/>
  <img src="https://img.shields.io/badge/skills-14-orange?style=flat-square" alt="Skills"/>
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"/>
</p>

## What It Does

Codex Superpower provides 14 specialized development skills adapted from the Claude Code Superpowers v5.0.7 for OpenAI Codex CLI. Each skill is a structured workflow that guides the LLM through complex development tasks — brainstorming, TDD, code review, debugging, plan execution, subagent delegation, and more.

## Skills (14)

| Skill | Description |
|:------|:------------|
| `brainstorming` | Structured ideation before implementation |
| `systematic-debugging` | Root-cause analysis with defense-in-depth |
| `executing-plans` | Execute approved plans with checkpoints |
| `finishing-a-development-branch` | Branch completion workflow |
| `requesting-code-review` | Pre-landing review preparation |
| `receiving-code-review` | Process and apply review feedback |
| `subagent-driven-development` | Delegate implementation to specialist subagents |
| `test-driven-development` | RED-GREEN-REFACTOR cycle enforcement |
| `verification-before-completion` | Pre-completion verification checklist |
| `writing-plans` | Structured plan document creation |
| `writing-skills` | Create new skills following best practices |
| `using-superpowers` | Bootstrap: how to discover and use skills |
| `dispatching-parallel-agents` | Parallel subagent execution |
| `using-git-worktrees` | Feature branch isolation via worktrees |

---

## Installation

### Prerequisites

```toml
# ~/.codex/config.toml — required for subagent skills
multi_agent = true
model_reasoning_effort = "high"
```

### Option 1: Codex Plugin Cache (Recommended)

This installs into the standard Codex plugin discovery path:

```bash
# Clone the repo
git clone https://github.com/fernandoxavier02/Codex-superpower.git

# Install into Codex plugins cache
mkdir -p ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global/5.0.9
cp -r Codex-superpower/* ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global/5.0.9/

# Restart Codex CLI
```

### Option 2: Symlink for Development

```bash
git clone https://github.com/fernandoxavier02/Codex-superpower.git
cd Codex-superpower

# Create symlink in plugins cache
mkdir -p ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global
ln -sf "$(pwd)" ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global/5.0.9
```

### Option 3: Codex Install (if published to registry)

```bash
codex install fx-studio-ai/superpowers-codex-global
```

### Verify Installation

```bash
# Check skills are discoverable
ls ~/.codex/plugins/cache/fx-studio-ai/superpowers-codex-global/*/skills/*/SKILL.md

# Should list 14 SKILL.md files
```

---

## Usage

Skills are invoked through Codex's skill system:

```
# Brainstorm before implementing
Use brainstorming to explore approaches for the caching layer

# TDD workflow
Use test-driven-development to implement pagination

# Code review
Use requesting-code-review before merging

# Debugging
Use systematic-debugging to find the root cause of the auth failure
```

---

## Project Structure

```
superpowers-codex-global/
├── .codex-plugin/
│   └── plugin.json              # Plugin manifest (v5.0.9)
├── skills/                      # 14 skill directories
│   ├── brainstorming/SKILL.md
│   ├── systematic-debugging/SKILL.md
│   ├── executing-plans/SKILL.md
│   ├── finishing-a-development-branch/SKILL.md
│   ├── requesting-code-review/SKILL.md
│   ├── receiving-code-review/SKILL.md
│   ├── subagent-driven-development/SKILL.md
│   ├── test-driven-development/SKILL.md
│   ├── verification-before-completion/SKILL.md
│   ├── writing-plans/SKILL.md
│   ├── writing-skills/SKILL.md
│   ├── using-superpowers/SKILL.md
│   ├── dispatching-parallel-agents/SKILL.md
│   └── using-git-worktrees/SKILL.md
├── hooks/
│   ├── hooks.json               # Hook registry
│   ├── run-hook.cmd             # Cross-platform hook runner (Windows + Unix)
│   └── session-start            # SessionStart context injection
└── assets/                      # Branding assets
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|:---|:---|:---|
| Skills not found | Plugin not in Codex cache | Follow "Option 1" install above |
| `spawn_agent` not available | `multi_agent = false` | Set `multi_agent = true` in `~/.codex/config.toml` |
| Session hook not firing | Hook runner not executable | `chmod +x hooks/run-hook.cmd hooks/session-start` |
| Skills loaded but degraded output | Missing Guardrails/Output Contract | Verify SKILL.md files have both sections (v5.0.9 includes them) |

### Runtime Dependencies

| Component | Files | External Dependencies |
|:---|:---|:---|
| Skills (instructions) | `skills/*/SKILL.md` (14 files) | None |
| Hooks | `hooks/run-hook.cmd`, `hooks/session-start` | bash (Unix) or Git Bash (Windows) |
| Manifest | `.codex-plugin/plugin.json` | None |

**No `npm install` required.** All hooks use only bash and the plugin has no Node.js runtime dependencies.

---

## Origin

Adapted from [Claude Code Superpowers v5.0.7](https://github.com/obra/superpowers) by Jesse Vincent. Codex adaptation includes:
- Tool name mapping (Agent → spawn_agent, TodoWrite → update_plan, etc.)
- Guardrails and Output Contract sections for GPT instruction compliance
- Imperative enforcement blocks (`<MANDATORY-*-RULE>`) for orchestration skills
- Cross-platform hook runner (Windows + Unix polyglot)

---

## License

MIT — See [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Built by <a href="https://github.com/fernandoxavier02">Fernando Xavier</a></strong>
  <br/>
  <a href="https://fxstudioai.com">FX Studio AI</a> — Business Automation with AI
</div>

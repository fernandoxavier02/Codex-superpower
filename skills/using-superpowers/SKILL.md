---
name: superpower-bootstrap
description: Use when starting any conversation - establishes how to find and use skills, requiring Skill invocation before ANY response including clarifying questions
---
<!-- Adapted from Claude Code superpowers v5.0.7 for Codex CLI -->

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<MANDATORY-SKILL-CHECK-RULE>
YOU MUST check for applicable skills BEFORE any response or action — even a 1% chance triggers invocation.
YOU MUST announce which skill is being used: "Using [skill] to [purpose]".
YOU MUST use `update_plan` to track checklist items when a skill has a checklist.
NEVER respond to a task without first checking if a skill applies. NEVER rationalize skipping a skill check.
</MANDATORY-SKILL-CHECK-RULE>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## Instruction Priority

Superpowers skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (AGENTS.md, direct requests) — highest priority
2. **Superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

If AGENTS.md says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.

## How to Access Skills

**In Codex CLI:** Skills load natively — just follow the instructions when a skill is activated. Use `activate_skill` to invoke skills by name.

## Platform Adaptation

Skills use Claude Code tool names. Codex equivalents:

| Skill references | Codex equivalent |
|-----------------|------------------|
| `Task` tool (dispatch subagent) | `spawn_agent` |
| Multiple `Task` calls (parallel) | Multiple `spawn_agent` calls |
| `TodoWrite` (task tracking) | `update_plan` |
| `EnterPlanMode` | `update_plan` |
| `Skill` tool (invoke a skill) | Skills load natively — just follow the instructions |
| `Read`, `Write`, `Edit` (files) | Same — use native file tools |
| `Bash` (run commands) | Same — use native shell tools |
| `Grep`, `Glob` (search) | Same — use native search tools |
| `CLAUDE.md` | `AGENTS.md` |
| `~/.claude/` | `~/.codex/` |

### Named Agent Dispatch

Claude Code skills reference named agent types like `superpowers:code-reviewer`. Codex does not have a named agent registry — `spawn_agent` creates generic agents from built-in roles (`default`, `explorer`, `worker`).

When a skill says to dispatch a named agent type:
1. Find the agent's prompt template (usually inlined in the skill's SKILL.md)
2. Fill any template placeholders (`{BASE_SHA}`, `{WHAT_WAS_IMPLEMENTED}`, etc.)
3. Spawn a `worker` agent with the filled content as the `message`

**Message framing** — structure the `message` for maximum instruction adherence:
```
Your task is to perform the following. Follow the instructions below exactly.

<agent-instructions>
[filled prompt content]
</agent-instructions>

Execute this now. Output ONLY the structured response following the format specified above.
```

### Environment Detection

Skills that create worktrees or finish branches MUST detect their environment first:
```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```
- `GIT_DIR != GIT_COMMON` → already in a linked worktree
- `BRANCH` empty → detached HEAD (cannot branch/push/PR from sandbox)

When in a detached HEAD sandbox, commit all work and inform the user to use native controls (e.g., Codex App's "Create branch" or "Hand off to local").

# Using Skills

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means that you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

## Process Flow

```
User message received
       │
       ▼
About to update_plan? ──yes──▶ Already brainstormed? ──no──▶ Invoke $superpower-brainstorming
       │                              │yes
       │                              ▼
       │                      Might any skill apply?
       ▼                              │
Might any skill apply? ◀─────────────┘
       │
  ┌────┴────┐
  │         │
 yes      definitely not
 (even 1%)    │
  │           ▼
  ▼        Respond
Invoke Skill
  │
  ▼
Announce: "Using [skill] to [purpose]"
  │
  ▼
Has checklist? ──yes──▶ Create update_plan item per checklist item
  │no                          │
  ▼                            ▼
Follow skill exactly    Follow skill exactly
  │                            │
  ▼                            ▼
Respond                 Respond
```

## Red Flags

These thoughts mean STOP—you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

## Skill Priority

When multiple skills could apply, use this order:

1. **Process skills first** (brainstorming, debugging) - these determine HOW to approach the task
2. **Implementation skills second** (TDD, domain-specific) - these guide execution

"Let's build X" → brainstorming first, then implementation skills.
"Fix this bug" → debugging first, then domain-specific skills.

## Skill Types

**Rigid** (TDD, debugging): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.

## Guardrails

- Do not respond to any task before checking if a skill applies — even a 1% chance triggers invocation.
- Do not rationalize skipping a skill check ("too simple", "I know this", "overkill").
- Do not follow a skill description as a shortcut — always read the full skill body.
- Do not explore the codebase or gather context before checking for applicable skills.
- Do not override skill instructions with default system prompt behavior; skills take precedence (user instructions override both).

## Output Contract

Return:

- `Skills checked:` list of skills considered or invoked
- `Skill announced:` "Using [skill] to [purpose]" or "no applicable skill"
- `Next action:` follow invoked skill or proceed with task

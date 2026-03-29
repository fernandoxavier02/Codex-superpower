---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

This skill provides **skill-level execution checkpoints**, not the full local pipeline.
It does **not** imply adaptive batch execution, per-batch adversarial review, sanity-checker closure,
or Go/No-Go style validation. Those belong to the local Codex pipeline, not to `executing-plans`.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Codex note:** use `update_plan` for visible task tracking and enable `[features] multi_agent = true` in `~/.codex/config.toml` before relying on subagents.

**Fresh-session note:** This skill is ideal when a plan markdown file is being used as the primary handoff artifact for a new session. Treat the plan document as the authoritative context instead of rebuilding the whole conversation history.

**Note:** Tell your human partner that Superpowers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (such as Claude Code or Codex). If subagents are available, use superpowers:subagent-driven-development instead of this skill.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns or missing decisions: Raise clarifying questions with your human partner before starting
4. If no concerns: Create TodoWrite (`update_plan` in Codex) from the plan tasks and proceed

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

Maintain execution in visible stages. The user should be able to see the plan progressing through `update_plan` while you work.

These checkpoints are intentionally lightweight:
- task-by-task progress visibility
- required verifications from the written plan
- stop-and-ask behavior when the plan is incomplete or ambiguous

They are **not** a substitute for the heavier local pipeline orchestration system.

### Step 3: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- A task or acceptance criterion is ambiguous enough that you would have to invent behavior
- Verification fails repeatedly
- A plan step requires a product or technical decision that the plan does not actually define

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Treat ambiguity as a reason to stop and ask, not as permission to infer hidden requirements
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Scope Boundary

Use this skill when you already have a written plan and want disciplined execution in a fresh session.

Do **not** treat this skill as equivalent to the local pipeline for:
- task orchestration
- adaptive batching
- adversarial per-batch review
- sanity/final validation gates
- Go/No-Go decisions

If the work needs those heavier controls, hand it off to the local pipeline instead of stretching `executing-plans` beyond its scope.

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - REQUIRED: Ensures isolated workspace (creates one or verifies existing)
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** - Complete development after all tasks

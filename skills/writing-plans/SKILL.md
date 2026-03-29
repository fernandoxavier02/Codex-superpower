---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

## Codex Execution Note

When operating in Codex, mirror the writing-plans phase explicitly:

- Immediately call `update_plan` with these steps:
  1. Explore current code for the plan
  2. Read approved spec
  3. Check relevant requirements/rules/tests
  4. Write implementation plan
  5. Independent plan review loop
  6. Offer execution choice and wait
- Keep exactly one step `in_progress` at a time
- Do not jump straight from "spec approved" to "plan complete"
- Do not start executing the plan in the same turn that presents the two execution options
- If the user chooses option 1, first assess whether same-session context is still sufficient; if not, provide a complete next-session prompt using the plan doc

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development for same-session execution or superpowers:executing-plans for fresh-session execution from this document. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Plan Review Loop

After writing the complete plan, run an independent plan review before offering execution choices.

1. Dispatch an independent plan reviewer using `plan-document-reviewer-prompt.md`
2. Give the reviewer the plan path plus the approved spec path
3. If the reviewer finds blocking issues:
   - fix the plan document yourself
   - re-dispatch the reviewer
   - repeat until the reviewer approves or the loop exceeds 3 iterations
4. If the loop exceeds 3 iterations, stop and surface the disagreement or blocker to the user

**Reviewer independence requirements:**

- The plan review must be an independent reviewer step, not the coordinator doing another inline self-review
- The reviewer should check buildability, spec coverage, placeholder content, and whether the tasks are actionable enough for implementation
- If you disagree with reviewer feedback, explain the disagreement and either resolve it in the plan or surface it to the user

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended for speed)** - I first assess if there is enough context left in this session; if yes, I stay here and dispatch fresh subagents per task, with review between tasks. If not, I give you a complete next-session prompt based on the plan document.

**2. Inline Execution** - I execute the tasks sequentially in this same session with checkpoints and visible `update_plan`

**Which approach?"**

**If Same Session chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- First assess whether enough context remains in the current session to execute safely
- If context is sufficient: fresh subagent per task + two-stage review
- If context is insufficient: provide this exact prompt, filled with the actual plan path:

```text
Use superpowers:subagent-driven-development to implement `<plan-path>`.
Treat that markdown plan as the authoritative context for this session.
Before coding, read it critically, extract its tasks into update_plan, confirm you have enough context to execute in this fresh session, dispatch one fresh subagent per task, and ask clarifying questions instead of inventing missing details.
```

**If Inline Execution chosen:**
- Use inline same-session execution with visible `update_plan`
- Keep exactly one task `in_progress` at a time
- Execute sequentially with checkpoints

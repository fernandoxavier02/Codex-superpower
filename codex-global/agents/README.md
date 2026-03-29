# Codex Pipeline Agents

This folder contains the global agent prompts used by the Codex pipeline mirror.

## Canonical Agents

- `task-orchestrator`
- `context-classifier`
- `information-gate`
- `plan-architect`
- `executor-controller`
- `executor-implementer`
- `executor-fix`
- `review-orchestrator`
- `architecture-reviewer`
- `adversarial-reviewer`
- `sanity-checker`
- `final-adversarial-orchestrator`
- `final-validator`

## Compatibility Agents

Some older prompts still exist for backward compatibility, such as
`orchestrator-documenter`. Keep them readable, but prefer the canonical set for
new orchestration work.

## Source Of Truth

When agent prompts disagree with pipeline docs, follow:

1. `C:\Users\win\.codex\skills\pipeline-orchestrator\SKILL.md`
2. `C:\Users\win\.codex\skills\pipeline-orchestrator\references\*`
3. `C:\Users\win\.codex\commands\pipeline.md`

#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\win',
  '.codex',
  'hook-state',
  'execution-gate.json',
);

const EXECUTION_EVIDENCE_PATTERNS = [
  /update_plan/i,
  /Task\s+\d+/i,
  /in_progress/i,
  /completed/i,
  /uma tarefa por vez/i,
  /one task.*in_progress/i,
];

const EXECUTION_COMPLETION_PATTERNS = [
  /all tasks complete/i,
  /execu[cç][aã]o conclu[ií]da/i,
  /execution complete/i,
  /finishing-a-development-branch/i,
];

function readResponse(input) {
  const arg = (input || '').trim() || process.argv[2] || '';
  if (!arg) return '';
  if (fs.existsSync(arg)) {
    return fs.readFileSync(arg, 'utf8');
  }
  return arg;
}

function hasExecutionEvidence(response) {
  const text = (response || '').trim();
  if (!/ORCHESTRATOR_DECISION:/i.test(text)) return false;
  return EXECUTION_EVIDENCE_PATTERNS.some((pattern) => pattern.test(text));
}

function isExecutionComplete(response) {
  const text = (response || '').trim();
  return EXECUTION_COMPLETION_PATTERNS.some((pattern) => pattern.test(text));
}

function clearExecutionState() {
  if (fs.existsSync(STATE_PATH)) {
    fs.unlinkSync(STATE_PATH);
  }
}

function main() {
  try {
    if (!fs.existsSync(STATE_PATH)) {
      process.stdout.write('execution-checklist: skipped');
      process.exit(0);
    }

    const response = readResponse('');

    if (hasExecutionEvidence(response)) {
      if (isExecutionComplete(response)) {
        clearExecutionState();
      }
      process.stdout.write('execution-checklist: ok');
      process.exit(0);
    }

    process.stderr.write(`
BLOCKED: execution turn without staged execution evidence

This turn was classified as plan execution. The first assistant response must show evidence of execution setup:
- mention ORCHESTRATOR_DECISION
- mention update_plan or visible task-stage tracking
- indicate sequential staged execution rather than free-form implementation
`.trim());
    process.exit(1);
  } catch (error) {
    process.stderr.write(`execution-checklist hook error: ${error.message}`);
    process.exit(1);
  }
}

main();

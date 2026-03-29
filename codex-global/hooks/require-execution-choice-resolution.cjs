#!/usr/bin/env node
/**
 * Hook: require-execution-choice-resolution
 *
 * Quando o usuário escolhe 1 ou 2 após o writing-plans, cobra a resolução correta.
 */

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\win',
  '.codex',
  'hook-state',
  'execution-choice-gate.json',
);

function readChoiceState() {
  if (!fs.existsSync(STATE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function readResponse(input) {
  const arg = (input || '').trim() || process.argv[2] || '';
  if (!arg) return '';
  if (fs.existsSync(arg)) {
    return fs.readFileSync(arg, 'utf8');
  }
  return arg;
}

function clearChoiceState() {
  if (fs.existsSync(STATE_PATH)) {
    fs.unlinkSync(STATE_PATH);
  }
}

function hasBaseEvidence(text) {
  return /ORCHESTRATOR_DECISION:/i.test(text);
}

function validateChoiceOne(text, planPath) {
  const sufficientContextPath =
    /(contexto (é|e) suficiente|still have enough context|ja tenho o plano na mem[oó]ria|já tenho o plano na memória)/i.test(
      text,
    ) &&
    /subagent-driven-development/i.test(text) &&
    /update_plan|tracker|tasks/i.test(text) &&
    new RegExp(planPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text);

  const fallbackPath =
    /(contexto insuficiente|insufficient context|higiene de contexto|pr[oó]xima sess[aã]o|próxima sessão)/i.test(
      text,
    ) &&
    new RegExp(planPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text) &&
    /subagent-driven-development|executing-plans/i.test(text);

  return sufficientContextPath || fallbackPath;
}

function validateChoiceTwo(text, planPath) {
  return (
    /(inline execution|execu[cç][aã]o inline|mesma sess[aã]o)/i.test(text) &&
    /update_plan|in_progress|uma tarefa por vez/i.test(text) &&
    new RegExp(planPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text)
  );
}

function main() {
  try {
    const choiceState = readChoiceState();
    if (!choiceState) {
      process.stdout.write('execution-choice: skipped');
      process.exit(0);
    }

    const text = readResponse('');
    const planPath = choiceState.planPath || 'docs/superpowers/plans/<plan>.md';

    if (!hasBaseEvidence(text)) {
      process.stderr.write('BLOCKED: execution choice resolution missing ORCHESTRATOR_DECISION');
      process.exit(1);
    }

    if (choiceState.choice === '1') {
      if (!validateChoiceOne(text, planPath)) {
        process.stderr.write(`
BLOCKED: option 1 requires context sufficiency gate or next-session fallback

For choice 1, the assistant must either:
- explicitly state context is sufficient, cite the plan path, use subagent-driven-development, and start with update_plan/task tracker
or
- explicitly state context is insufficient, avoid starting execution, and provide a complete next-session prompt referencing the plan
`.trim());
        process.exit(1);
      }
    }

    if (choiceState.choice === '2') {
      if (!validateChoiceTwo(text, planPath)) {
        process.stderr.write(`
BLOCKED: option 2 requires inline execution setup

For choice 2, the assistant must explicitly announce inline same-session execution,
reference the plan path, and start sequential execution with update_plan.
`.trim());
        process.exit(1);
      }
    }

    clearChoiceState();
    process.stdout.write('execution-choice: ok');
    process.exit(0);
  } catch (error) {
    process.stderr.write(`execution-choice hook error: ${error.message}`);
    process.exit(1);
  }
}

main();

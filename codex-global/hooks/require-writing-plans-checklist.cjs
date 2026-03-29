#!/usr/bin/env node
/**
 * Hook: require-writing-plans-checklist
 *
 * Exige evidência do workflow interno de writing-plans:
 * explorar código, ler spec, verificar regras/testes, escrever plano,
 * self-review e oferecer escolha de execução.
 */

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\win',
  '.codex',
  'hook-state',
  'writing-plans-gate.json',
);

const CHOICE_STATE_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\win',
  '.codex',
  'hook-state',
  'execution-choice-gate.json',
);

const CHECKLIST_PATTERNS = [
  /update_plan/i,
  /◼|◻|✔|\[ \]|\[x\]/i,
  /in_progress|pending|completed/i,
];

const REQUIRED_PHASES = [
  /Explorar o código atual para o plano/i,
  /Ler a spec aprovada/i,
  /Verificar requirements\/regras\/testes relevantes/i,
  /Escrever o plano de implementação/i,
  /Self-review do plano/i,
  /Oferecer escolha de execução e aguardar decisão/i,
];

const WRITING_SKILL_PATTERNS = [
  /using the writing-plans skill/i,
  /usando a skill writing-plans/i,
];

const CONTEXT_GATHERING_PATTERNS = [
  /explor(ar|e) o c[oó]digo atual/i,
  /read approved spec|ler a spec aprovada/i,
  /requirements|regras|testes relevantes/i,
];

const PLAN_PATH_PATTERNS = [
  /docs\/superpowers\/plans\/[^\s]+\.md/i,
  /docs\\superpowers\\plans\\[^\s]+\.md/i,
];

const EXECUTION_CHOICE_PATTERNS = [
  /duas op[cç][õo]es de execu[cç][aã]o/i,
  /subagent-driven/i,
  /inline execution|execu[cç][aã]o inline/i,
  /qual abordagem|which approach/i,
];

function readResponse(input) {
  const arg = (input || '').trim() || process.argv[2] || '';
  if (!arg) return '';
  if (fs.existsSync(arg)) {
    return fs.readFileSync(arg, 'utf8');
  }
  return arg;
}

function hasOrderedChecklist(text) {
  if (!CHECKLIST_PATTERNS.some((pattern) => pattern.test(text))) return false;

  const positions = [];
  for (const pattern of REQUIRED_PHASES) {
    const match = text.match(pattern);
    if (!match || typeof match.index !== 'number') return false;
    positions.push(match.index);
  }

  for (let index = 1; index < positions.length; index += 1) {
    if (positions[index] < positions[index - 1]) return false;
  }

  return true;
}

function hasWritingPlansEvidence(response) {
  const text = (response || '').trim();
  if (!/ORCHESTRATOR_DECISION:/i.test(text)) return false;
  if (!hasOrderedChecklist(text)) return false;
  if (!WRITING_SKILL_PATTERNS.some((pattern) => pattern.test(text))) return false;
  if (!CONTEXT_GATHERING_PATTERNS.every((pattern) => pattern.test(text))) return false;
  return true;
}

function requiresExecutionChoice(response) {
  const text = (response || '').trim();
  return PLAN_PATH_PATTERNS.some((pattern) => pattern.test(text));
}

function hasExecutionChoice(response) {
  const text = (response || '').trim();
  return EXECUTION_CHOICE_PATTERNS.every((pattern) => pattern.test(text));
}

function clearWritingPlansState() {
  if (fs.existsSync(STATE_PATH)) {
    fs.unlinkSync(STATE_PATH);
  }
}

function writeChoiceState(planPath) {
  fs.mkdirSync(path.dirname(CHOICE_STATE_PATH), { recursive: true });
  fs.writeFileSync(
    CHOICE_STATE_PATH,
    JSON.stringify(
      {
        pending: true,
        phase: 'execution-choice',
        planPath,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
}

function extractPlanPath(text) {
  const match =
    text.match(/docs\/superpowers\/plans\/[^\s`]+\.md/i) ||
    text.match(/docs\\superpowers\\plans\\[^\s`]+\.md/i);
  return match ? match[0] : 'docs/superpowers/plans/<plan>.md';
}

function main() {
  try {
    if (!fs.existsSync(STATE_PATH)) {
      process.stdout.write('writing-plans-checklist: skipped');
      process.exit(0);
    }

    const response = readResponse('');

    if (!hasWritingPlansEvidence(response)) {
      process.stderr.write(`
BLOCKED: writing-plans turn without required plan-writing evidence

This turn was classified as writing-plans. The assistant response must:
- mention ORCHESTRATOR_DECISION
- announce use of the writing-plans skill
- show a visible checklist/update_plan with all writing-plans phases in order
- show exploration of code, reading of approved spec, and verification of relevant rules/tests
`.trim());
      process.exit(1);
    }

    if (requiresExecutionChoice(response) && !hasExecutionChoice(response)) {
      process.stderr.write(`
BLOCKED: plan written without execution-choice gate

After saving the plan, the assistant must:
- show the plan path under docs/superpowers/plans/
- offer exactly two execution approaches
- ask the user which approach they want
- avoid starting execution in the same turn
`.trim());
      process.exit(1);
    }

    if (requiresExecutionChoice(response)) {
      writeChoiceState(extractPlanPath(response));
      clearWritingPlansState();
    }

    process.stdout.write('writing-plans-checklist: ok');
    process.exit(0);
  } catch (error) {
    process.stderr.write(`writing-plans-checklist hook error: ${error.message}`);
    process.exit(1);
  }
}

main();

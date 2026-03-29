#!/usr/bin/env node
/**
 * Hook: require-planning-checklist
 *
 * Quando o turno anterior foi classificado como planning, exige evidência
 * textual de checklist/update_plan na primeira resposta do assistente.
 */

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\win',
  '.codex',
  'hook-state',
  'planning-gate.json',
);

const CHECKLIST_PATTERNS = [
  /update_plan/i,
  /◼|◻|✔|\[ \]|\[x\]/i,
  /in_progress|pending|completed/i,
];

const REQUIRED_PHASES = [
  /Explorar contexto do projeto/i,
  /Perguntas clarificadoras \(1 por vez\)/i,
  /Propor 2-3 abordagens com trade-offs/i,
  /Apresentar design por seções \(aprovação incremental\)/i,
  /Escrever design doc e spec review loop/i,
  /Revisão do usuário e transição para writing-plans/i,
];

const PLAN_COMPLETION_PATTERNS = [
  /Plan complete and saved/i,
  /Plano completo/i,
  /plano conclu[ií]do/i,
  /docs\/superpowers\/plans\//i,
  /implementation plan/i,
];

const SPEC_PATH_PATTERNS = [
  /docs\/superpowers\/specs\/[^\s]+\.md/i,
  /docs\\superpowers\\specs\\[^\s]+\.md/i,
];

const SPEC_REVIEW_LOOP_PATTERNS = [
  /spec escrita e review independente conclu[ií]do/i,
  /spec written and independent review complete/i,
  /reviewer approved/i,
];

const USER_REVIEW_REQUEST_PATTERNS = [
  /revise o arquivo/i,
  /revise a spec/i,
  /please review/i,
  /review it and let me know/i,
  /antes de avan[cç]armos para o plano/i,
  /antes de prosseguir para writing-plans/i,
  /antes de seguir para o plano de implementa[cç][aã]o/i,
];

function readResponse(input) {
  const arg = (input || '').trim() || process.argv[2] || '';
  if (!arg) return '';
  if (fs.existsSync(arg)) {
    return fs.readFileSync(arg, 'utf8');
  }
  return arg;
}

function hasChecklistEvidence(response) {
  const text = (response || '').trim();
  if (!/ORCHESTRATOR_DECISION:/i.test(text)) return false;
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

function requiresUserSpecReview(response) {
  const text = (response || '').trim();
  return (
    SPEC_PATH_PATTERNS.some((pattern) => pattern.test(text)) ||
    SPEC_REVIEW_LOOP_PATTERNS.some((pattern) => pattern.test(text))
  );
}

function hasUserSpecReviewGate(response) {
  const text = (response || '').trim();
  return USER_REVIEW_REQUEST_PATTERNS.some((pattern) => pattern.test(text));
}

function isPlanComplete(response) {
  const text = (response || '').trim();
  return PLAN_COMPLETION_PATTERNS.some((pattern) => pattern.test(text));
}

function clearPlanningState() {
  if (fs.existsSync(STATE_PATH)) {
    fs.unlinkSync(STATE_PATH);
  }
}

function main() {
  try {
    if (!fs.existsSync(STATE_PATH)) {
      process.stdout.write('planning-checklist: skipped');
      process.exit(0);
    }

    const response = readResponse('');

    if (isPlanComplete(response)) {
      process.stderr.write(`
BLOCKED: implementation plan must be written in writing-plans mode

The brainstorming/planning flow may end at approved spec + user review gate.
Actual plan creation must happen in the dedicated writing-plans flow after approval.
Do not save docs/superpowers/plans/... directly from the brainstorming phase.
`.trim());
      process.exit(1);
    }

    if (hasChecklistEvidence(response)) {
      if (requiresUserSpecReview(response) && !hasUserSpecReviewGate(response)) {
        process.stderr.write(`
BLOCKED: independent spec review without explicit user review gate

When the brainstorming flow reaches the written spec stage, the assistant must:
- mention the written spec path under docs/superpowers/specs/
- complete the independent spec review loop
- ask the user to review the spec file before proceeding
- wait for approval before transitioning to writing-plans
`.trim());
        process.exit(1);
      }
      process.stdout.write('planning-checklist: ok');
      process.exit(0);
    }

    process.stderr.write(`
BLOCKED: planning turn without checklist evidence

This turn was classified as planning. The first assistant response must show evidence of planning setup:
- mention ORCHESTRATOR_DECISION
- show a visible checklist/update_plan with TODAS as fases do brainstorming
- preserve the mandatory phase order without skipping steps
`.trim());
    process.exit(1);
  } catch (error) {
    process.stderr.write(`planning-checklist hook error: ${error.message}`);
    process.exit(1);
  }
}

main();

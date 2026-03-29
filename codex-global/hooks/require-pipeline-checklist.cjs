#!/usr/bin/env node
/**
 * Hook: require-pipeline-checklist
 *
 * Quando o turno anterior foi classificado como pipeline, exige evidência
 * textual do checklist completo e ordenado das fases do pipeline.
 */

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\win',
  '.codex',
  'hook-state',
  'pipeline-gate.json',
);

const CHECKLIST_PATTERNS = [
  /update_plan/i,
  /◼|◻|✔|\[ \]|\[x\]/i,
  /in_progress|pending|completed/i,
];

const REQUIRED_PHASES = [
  /Triagem automática/i,
  /Proposta \+ confirmação do usuário/i,
  /Execução em batches/i,
  /Closure \+ validation final/i,
];

const PIPELINE_COMPLETION_PATTERNS = [
  /pipeline complete/i,
  /pipeline conclu[ií]do/i,
  /final validation complete/i,
  /Go\/No-Go:\s*GO/i,
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

function hasPipelineEvidence(response) {
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

function isPipelineComplete(response) {
  const text = (response || '').trim();
  return PIPELINE_COMPLETION_PATTERNS.some((pattern) => pattern.test(text));
}

function clearPipelineState() {
  if (fs.existsSync(STATE_PATH)) {
    fs.unlinkSync(STATE_PATH);
  }
}

function main() {
  try {
    if (!fs.existsSync(STATE_PATH)) {
      process.stdout.write('pipeline-checklist: skipped');
      process.exit(0);
    }

    const response = readResponse('');

    if (hasPipelineEvidence(response)) {
      if (isPipelineComplete(response)) {
        clearPipelineState();
      }
      process.stdout.write('pipeline-checklist: ok');
      process.exit(0);
    }

    process.stderr.write(`
BLOCKED: pipeline turn without full phase checklist evidence

This turn was classified as pipeline. The assistant response must show evidence of pipeline setup:
- mention ORCHESTRATOR_DECISION
- show a visible checklist/update_plan with TODAS as fases do pipeline
- preserve the mandatory phase order without skipping steps
`.trim());
    process.exit(1);
  } catch (error) {
    process.stderr.write(`pipeline-checklist hook error: ${error.message}`);
    process.exit(1);
  }
}

main();

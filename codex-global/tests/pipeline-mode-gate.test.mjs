import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const pipelineHook = 'C:\\Users\\win\\.codex\\hooks\\force-pipeline-agents.cjs';
const requirePipelineChecklistHook =
  'C:\\Users\\win\\.codex\\hooks\\require-pipeline-checklist.cjs';
const pipelineCommand = 'C:\\Users\\win\\.codex\\commands\\pipeline.md';
const pipelineStatePath = 'C:\\Users\\win\\.codex\\hook-state\\pipeline-run.json';

function runHook(prompt) {
  const result = spawnSync(
    process.execPath,
    [pipelineHook, JSON.stringify({ prompt })],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, `hook failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout.trim());
}

function runResponseHook(responseText) {
  return spawnSync(process.execPath, [requirePipelineChecklistHook, responseText], {
    encoding: 'utf8',
  });
}

const PIPELINE_CHECKLIST = `
update_plan
4 tasks
✔ Triagem automática
◼ Proposta + confirmação do usuário
◻ Execução em batches
◻ Closure + validation final
`.trim();

test.afterEach(() => {
  if (fs.existsSync(pipelineStatePath)) {
    fs.unlinkSync(pipelineStatePath);
  }
});

test('slash /pipeline activates pipeline mode and stores state', () => {
  const payload = runHook('/pipeline implementar trilha de auditoria');

  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /PIPELINE DE AGENTES OBRIGATORIO/);
  assert.match(payload.systemMessage, /ORCHESTRATOR_DECISION/i);
  assert.match(payload.systemMessage, /task-orchestrator/i);
  assert.match(payload.systemMessage, /final-validator/i);
  assert.equal(fs.existsSync(pipelineStatePath), true);
});

test('non-trivial implementation request activates pipeline mode', () => {
  const payload = runHook('implemente a feature de analytics com mudanças em vários arquivos');

  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /PIPELINE DE AGENTES OBRIGATORIO/);
  assert.match(payload.systemMessage, /quality-gate-router/i);
  assert.match(payload.systemMessage, /adversarial-reviewer por batch/i);
});

test('response hook blocks pipeline response without full checklist evidence', () => {
  runHook('/pipeline implementar trilha de auditoria');

  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "pipeline"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Nao"
  fluxo: ["triagem", "pipeline"]
  riscos: "..."
`);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /pipeline turn without full phase checklist evidence/i);
  assert.equal(fs.existsSync(pipelineStatePath), true);
});

test('response hook accepts pipeline response with full checklist evidence', () => {
  runHook('/pipeline implementar trilha de auditoria');

  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "pipeline"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Nao"
  fluxo: ["triagem", "confirmação", "execução", "closure"]
  riscos: "..."

${PIPELINE_CHECKLIST}
Vou manter exatamente uma fase in_progress por vez e aguardar a confirmação do usuário antes de entrar em Execução em batches.
`);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(pipelineStatePath), true);
});

test('active pipeline state continues after a short user follow-up', () => {
  runHook('/pipeline implementar trilha de auditoria');

  const first = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "pipeline"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Nao"
  fluxo: ["triagem", "confirmação", "execução", "closure"]
  riscos: "..."

${PIPELINE_CHECKLIST}
Vou manter exatamente uma fase in_progress por vez e aguardar a confirmação do usuário antes de entrar em Execução em batches.
`);

  assert.equal(first.status, 0, first.stderr || first.stdout);

  const payload = runHook('sim, pode continuar');
  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /Estado atual do pipeline validado/i);
  assert.match(payload.systemMessage, /quality-gate/i);
});

test('response hook clears pipeline state when pipeline is completed', () => {
  runHook('/pipeline implementar trilha de auditoria');

  const decisionResult = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "pipeline"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Nao"
  fluxo: ["triagem", "confirmacao", "execucao", "closure"]
  riscos: "..."

update_plan
4 tasks
✔ Triagem automática
✔ Proposta + confirmação do usuário
✔ Execução em batches
✔ Closure + validation final
`);

  assert.equal(decisionResult.status, 0, decisionResult.stderr || decisionResult.stdout);

  const qualityGate = runResponseHook(`
${PIPELINE_CHECKLIST}

PIPELINE_CHECKPOINT:
  phase: "quality-gate"
  status: "approved"
  user_approved: true
  next_phase: "pre-tester"
`);

  assert.equal(qualityGate.status, 0, qualityGate.stderr || qualityGate.stdout);

  const preTester = runResponseHook(`
${PIPELINE_CHECKLIST}

PIPELINE_CHECKPOINT:
  phase: "pre-tester"
  status: "completed"
  artifact_path: "tests/unit/test_pipeline_guard.py"
  next_phase: "execution"
`);

  assert.equal(preTester.status, 0, preTester.stderr || preTester.stdout);

  const execution = runResponseHook(`
${PIPELINE_CHECKLIST}

PIPELINE_CHECKPOINT:
  phase: "execution"
  status: "completed"
  batch_id: "B1"
  scope: ["codex-global/hooks/force-pipeline-agents.cjs"]
`);

  assert.equal(execution.status, 0, execution.stderr || execution.stdout);

  const adversarial = runResponseHook(`
${PIPELINE_CHECKLIST}

PIPELINE_CHECKPOINT:
  phase: "adversarial"
  status: "completed"
  batch_id: "B1"
  next_phase: "sanity"
`);

  assert.equal(adversarial.status, 0, adversarial.stderr || adversarial.stdout);

  const sanity = runResponseHook(`
${PIPELINE_CHECKLIST}

PIPELINE_CHECKPOINT:
  phase: "sanity"
  status: "completed"
  next_phase: "final-validator"
`);

  assert.equal(sanity.status, 0, sanity.stderr || sanity.stdout);

  const result = runResponseHook(`
${PIPELINE_CHECKLIST}

FINAL_VALIDATOR_RESULT:
  status: "GO"
  summary: "Pipeline validado"
  user_approved: true

Pipeline complete. Go/No-Go: GO. final validation complete and handing off to finishing-a-development-branch.
`);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(pipelineStatePath), false);
});

test('pipeline command documents the mandatory four-phase checklist', () => {
  const content = fs.readFileSync(pipelineCommand, 'utf8');

  assert.match(content, /PHASE 0: AUTOMATIC TRIAGE/i);
  assert.match(content, /PHASE 1: PROPOSAL \+ CONFIRMATION/i);
  assert.match(content, /PHASE 2: BATCH EXECUTION/i);
  assert.match(content, /PIPELINE_CHECKPOINT/i);
  assert.match(content, /FINAL_VALIDATOR_RESULT/i);
});

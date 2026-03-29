import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const pipelineHook = 'C:\\Users\\win\\.codex\\hooks\\force-pipeline-agents.cjs';
const requirePipelineChecklistHook =
  'C:\\Users\\win\\.codex\\hooks\\require-pipeline-checklist.cjs';
const pipelineCommand = 'C:\\Users\\win\\.codex\\commands\\pipeline.md';
const pipelineStatePath = 'C:\\Users\\win\\.codex\\hook-state\\pipeline-gate.json';

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
  assert.match(payload.systemMessage, /Triagem automática/i);
  assert.match(payload.systemMessage, /Closure \+ validation final/i);
  assert.equal(fs.existsSync(pipelineStatePath), true);
});

test('non-trivial implementation request activates pipeline mode', () => {
  const payload = runHook('implemente a feature de analytics com mudanças em vários arquivos');

  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /PIPELINE DE AGENTES OBRIGATORIO/);
  assert.match(payload.systemMessage, /update_plan/i);
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
  tem_spec: "Não"
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
  tem_spec: "Não"
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
  tem_spec: "Não"
  fluxo: ["triagem", "confirmação", "execução", "closure"]
  riscos: "..."

${PIPELINE_CHECKLIST}
Vou manter exatamente uma fase in_progress por vez e aguardar a confirmação do usuário antes de entrar em Execução em batches.
`);

  assert.equal(first.status, 0, first.stderr || first.stdout);

  const payload = runHook('sim, pode continuar');
  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /PIPELINE FLOW CONTINUA/);
  assert.match(payload.systemMessage, /Proposta \+ confirmação do usuário/i);
});

test('response hook clears pipeline state when pipeline is completed', () => {
  runHook('/pipeline implementar trilha de auditoria');

  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "pipeline"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["triagem", "confirmação", "execução", "closure"]
  riscos: "..."

update_plan
4 tasks
✔ Triagem automática
✔ Proposta + confirmação do usuário
✔ Execução em batches
✔ Closure + validation final

Pipeline complete. Go/No-Go: GO. final validation complete and handing off to finishing-a-development-branch.
`);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(pipelineStatePath), false);
});

test('pipeline command documents the mandatory four-phase checklist', () => {
  const content = fs.readFileSync(pipelineCommand, 'utf8');

  assert.match(content, /update_plan/i);
  assert.match(content, /Triagem automática/i);
  assert.match(content, /Proposta \+ confirmação do usuário/i);
  assert.match(content, /Execução em batches/i);
  assert.match(content, /Closure \+ validation final/i);
});

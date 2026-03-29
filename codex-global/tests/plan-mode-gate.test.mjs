import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const activatePlanHook = 'C:\\Users\\win\\.codex\\hooks\\activate-plan-mode.cjs';
const activateWritingPlansHook = 'C:\\Users\\win\\.codex\\hooks\\activate-writing-plans-mode.cjs';
const forcePipelineHook = 'C:\\Users\\win\\.codex\\hooks\\force-pipeline-agents.cjs';
const requirePlanningChecklistHook =
  'C:\\Users\\win\\.codex\\hooks\\require-planning-checklist.cjs';
const brainstormCommand = 'C:\\Users\\win\\plugins\\superpowers-codex-global\\commands\\brainstorm.md';
const planningStatePath = 'C:\\Users\\win\\.codex\\hook-state\\planning-gate.json';
const pipelineStatePath = 'C:\\Users\\win\\.codex\\hook-state\\pipeline-gate.json';
const writingPlansStatePath = 'C:\\Users\\win\\.codex\\hook-state\\writing-plans-gate.json';

function runHook(hookPath, prompt) {
  const result = spawnSync(
    process.execPath,
    [hookPath, JSON.stringify({ prompt })],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, `hook failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout.trim());
}

function runResponseHook(responseText) {
  return spawnSync(process.execPath, [requirePlanningChecklistHook, responseText], {
    encoding: 'utf8',
  });
}

const BRAINSTORMING_CHECKLIST = `
update_plan
6 tasks
✔ Explorar contexto do projeto
◼ Perguntas clarificadoras (1 por vez)
◻ Propor 2-3 abordagens com trade-offs
◻ Apresentar design por seções (aprovação incremental)
◻ Escrever design doc e spec self-review
◻ Revisão do usuário e transição para writing-plans
`.trim();

test.afterEach(() => {
  if (fs.existsSync(planningStatePath)) {
    fs.unlinkSync(planningStatePath);
  }
  if (fs.existsSync(pipelineStatePath)) {
    fs.unlinkSync(pipelineStatePath);
  }
  if (fs.existsSync(writingPlansStatePath)) {
    fs.unlinkSync(writingPlansStatePath);
  }
});

test('slash /superpowers:brainstorm activates plan mode message', () => {
  const payload = runHook(activatePlanHook, '/superpowers:brainstorm migrar o plugin');

  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /PLAN MODE OBRIGATORIO/);
  assert.match(payload.systemMessage, /writing-plans/);
  assert.match(payload.systemMessage, /update_plan/i);
  assert.match(payload.systemMessage, /nao-invencao|não-invenção/i);
});

test('textual planning request activates plan mode message', () => {
  const payload = runHook(
    activatePlanHook,
    'faça um plano de implementação para migrar o plugin',
  );

  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /planejamento/i);
  assert.match(payload.systemMessage, /pergunt/i);
  assert.equal(fs.existsSync(planningStatePath), true);
});

test('trivial prompt does not activate plan mode', () => {
  const payload = runHook(activatePlanHook, 'oi');
  assert.deepEqual(payload, { continue: true });
});

test('planning request bypasses pipeline enforcement conflict', () => {
  const payload = runHook(
    forcePipelineHook,
    'faça um plano de implementação para migrar o plugin',
  );

  assert.deepEqual(payload, { continue: true });
});

test('implementation request still triggers pipeline enforcement', () => {
  const payload = runHook(forcePipelineHook, 'implemente a feature de analytics');

  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /PIPELINE DE AGENTES OBRIGATORIO/);
});

test('response hook blocks planning response without checklist evidence', () => {
  runHook(activatePlanHook, '/superpowers:brainstorm migrar o plugin');

  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "criar plano"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["planejar"]
  riscos: "..."
`);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /planning turn without checklist evidence/i);
  assert.equal(fs.existsSync(planningStatePath), true);
});

test('response hook accepts brainstorming response with checklist evidence and keeps planning active', () => {
  runHook(activatePlanHook, '/superpowers:brainstorm migrar o plugin');

  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "criar plano"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["explorar contexto", "perguntas clarificadoras"]
  riscos: "..."

Vou criar o checklist com update_plan e começar por Explorar contexto do projeto antes das Perguntas clarificadoras.
${BRAINSTORMING_CHECKLIST}
`);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(planningStatePath), true);
});

test('active planning state continues after a short user answer', () => {
  runHook(activatePlanHook, '/superpowers:brainstorm migrar o plugin');

  const firstResponse = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "criar plano"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["explorar contexto", "perguntas clarificadoras"]
  riscos: "..."

Vou criar o checklist com update_plan e começar por Explorar contexto do projeto antes das Perguntas clarificadoras.
${BRAINSTORMING_CHECKLIST}
`);

  assert.equal(firstResponse.status, 0, firstResponse.stderr || firstResponse.stdout);

  const payload = runHook(activatePlanHook, 'B');
  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /PLANNING FLOW CONTINUA/);
  assert.match(payload.systemMessage, /pergunta clarificadora/i);
});

test('response hook blocks plan completion inside brainstorming phase', () => {
  runHook(activatePlanHook, '/superpowers:brainstorm migrar o plugin');

  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "criar plano"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["explorar contexto", "perguntas clarificadoras", "writing-plans"]
  riscos: "..."

Plan complete and saved to docs/superpowers/plans/2026-03-29-rollout.md after update_plan and checklist review.
update_plan
6 tasks
✔ Explorar contexto do projeto
✔ Perguntas clarificadoras (1 por vez)
✔ Propor 2-3 abordagens com trade-offs
✔ Apresentar design por seções (aprovação incremental)
✔ Escrever design doc e spec self-review
✔ Revisão do usuário e transição para writing-plans
`);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /implementation plan must be written in writing-plans mode/i);
  assert.equal(fs.existsSync(planningStatePath), true);
});

test('spec approval transitions planning into writing-plans mode', () => {
  runHook(activatePlanHook, '/superpowers:brainstorm migrar o plugin');

  const payload = runHook(activateWritingPlansHook, 'aprovado, pode seguir para o plano');

  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /WRITING-PLANS MODE OBRIGATORIO/);
  assert.equal(fs.existsSync(planningStatePath), false);
  assert.equal(fs.existsSync(writingPlansStatePath), true);
});

test('response hook blocks spec-stage response without explicit user review request', () => {
  runHook(activatePlanHook, '/superpowers:brainstorm migrar o plugin');

  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "criar plano"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["explorar contexto", "design", "spec"]
  riscos: "..."

update_plan
6 tasks
✔ Explorar contexto do projeto
✔ Perguntas clarificadoras (1 por vez)
✔ Propor 2-3 abordagens com trade-offs
✔ Apresentar design por seções (aprovação incremental)
✔ Escrever design doc e spec self-review
◼ Revisão do usuário e transição para writing-plans

Spec escrita e self-review concluído.
Spec salva em docs/superpowers/specs/2026-03-29-rollout-design.md.
`);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /spec self-review without explicit user review gate/i);
  assert.equal(fs.existsSync(planningStatePath), true);
});

test('response hook accepts spec-stage response with explicit user review gate', () => {
  runHook(activatePlanHook, '/superpowers:brainstorm migrar o plugin');

  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "criar plano"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["explorar contexto", "design", "spec"]
  riscos: "..."

update_plan
6 tasks
✔ Explorar contexto do projeto
✔ Perguntas clarificadoras (1 por vez)
✔ Propor 2-3 abordagens com trade-offs
✔ Apresentar design por seções (aprovação incremental)
✔ Escrever design doc e spec self-review
◼ Revisão do usuário e transição para writing-plans

Spec escrita e self-review concluído.
Spec salva em docs/superpowers/specs/2026-03-29-rollout-design.md.
Revise o arquivo e me diga se quer fazer alguma alteração antes de avançarmos para o plano de implementação.
`);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(planningStatePath), true);
});

test('brainstorm command remains a thin deprecated entrypoint to the brainstorming skill', () => {
  const content = fs.readFileSync(brainstormCommand, 'utf8');

  assert.match(content, /deprecated/i);
  assert.match(content, /superpowers:brainstorming/i);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const codexHome = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\win';

const activatePlanHook = path.join(repoRoot, 'codex-global', 'hooks', 'activate-plan-mode.cjs');
const activateWritingPlansHook = path.join(
  repoRoot,
  'codex-global',
  'hooks',
  'activate-writing-plans-mode.cjs',
);
const requireWritingPlansChecklistHook = path.join(
  repoRoot,
  'codex-global',
  'hooks',
  'require-writing-plans-checklist.cjs',
);
const writePlanCommand = path.join(repoRoot, 'commands', 'write-plan.md');
const writingPlansSkill = path.join(repoRoot, 'skills', 'writing-plans', 'SKILL.md');
const planningStatePath = path.join(codexHome, '.codex', 'hook-state', 'planning-gate.json');
const writingPlansStatePath = path.join(
  codexHome,
  '.codex',
  'hook-state',
  'writing-plans-gate.json',
);
const choiceStatePath = path.join(
  codexHome,
  '.codex',
  'hook-state',
  'execution-choice-gate.json',
);

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
  return spawnSync(process.execPath, [requireWritingPlansChecklistHook, responseText], {
    encoding: 'utf8',
  });
}

const WRITING_PLANS_CHECKLIST = `
update_plan
6 tasks
✔ Explorar o código atual para o plano
✔ Ler a spec aprovada
✔ Verificar requirements/regras/testes relevantes
◼ Escrever o plano de implementação
◻ Plan review loop independente
◻ Oferecer escolha de execução e aguardar decisão
`.trim();

test.afterEach(() => {
  if (fs.existsSync(planningStatePath)) {
    fs.unlinkSync(planningStatePath);
  }
  if (fs.existsSync(writingPlansStatePath)) {
    fs.unlinkSync(writingPlansStatePath);
  }
  if (fs.existsSync(choiceStatePath)) {
    fs.unlinkSync(choiceStatePath);
  }
});

test('slash /superpowers:write-plan activates writing-plans mode', () => {
  const payload = runHook(
    activateWritingPlansHook,
    '/superpowers:write-plan docs/superpowers/specs/2026-03-29-rollout-design.md',
  );

  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /WRITING-PLANS MODE OBRIGATORIO/);
  assert.match(payload.systemMessage, /docs\/superpowers\/plans/i);
  assert.equal(fs.existsSync(writingPlansStatePath), true);
});

test('approved spec while planning is active transitions into writing-plans mode', () => {
  runHook(activatePlanHook, '/write-plan criar plano');

  const payload = runHook(
    activateWritingPlansHook,
    'sim, spec aprovada, pode seguir para writing-plans',
  );

  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /WRITING-PLANS MODE OBRIGATORIO/);
  assert.equal(fs.existsSync(planningStatePath), false);
  assert.equal(fs.existsSync(writingPlansStatePath), true);
});

test('response hook blocks writing-plans response without required evidence', () => {
  runHook(activateWritingPlansHook, '/superpowers:write-plan docs/superpowers/specs/foo.md');

  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "writing plans"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["writing-plans"]
  riscos: "..."
`);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /writing-plans turn without required plan-writing evidence/i);
  assert.equal(fs.existsSync(writingPlansStatePath), true);
});

test('response hook blocks plan save without execution choice gate', () => {
  runHook(activateWritingPlansHook, '/superpowers:write-plan docs/superpowers/specs/foo.md');

  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "writing plans"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["writing-plans"]
  riscos: "..."

I'm using the writing-plans skill to create the implementation plan.
${WRITING_PLANS_CHECKLIST}
Vou explorar o código atual para o plano, ler a spec aprovada e verificar requirements/regras/testes relevantes.
Plano completo e salvo em docs/superpowers/plans/2026-03-29-rollout.md.
`);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /reviewed plan without execution-choice gate/i);
  assert.equal(fs.existsSync(writingPlansStatePath), true);
});

test('response hook accepts full writing-plans response and clears state', () => {
  runHook(activateWritingPlansHook, '/superpowers:write-plan docs/superpowers/specs/foo.md');

  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "writing plans"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["writing-plans"]
  riscos: "..."

I'm using the writing-plans skill to create the implementation plan.
update_plan
6 tasks
✔ Explorar o código atual para o plano
✔ Ler a spec aprovada
✔ Verificar requirements/regras/testes relevantes
✔ Escrever o plano de implementação
✔ Plan review loop independente
◼ Oferecer escolha de execução e aguardar decisão

Vou explorar o código atual para o plano, ler a spec aprovada e verificar requirements/regras/testes relevantes.
Review independente do plano concluído.
Plan complete and saved to docs/superpowers/plans/2026-03-29-rollout.md.
Duas opções de execução:
1. Subagent-Driven com fallback para próxima sessão se o contexto estiver insuficiente
2. Inline Execution na mesma sessão com checkpoints
Qual abordagem você quer?
`);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(writingPlansStatePath), false);
  assert.equal(fs.existsSync(choiceStatePath), true);
});

test('write-plan command stays thin while the writing-plans skill documents the mandatory flow', () => {
  const command = fs.readFileSync(writePlanCommand, 'utf8');
  const skill = fs.readFileSync(writingPlansSkill, 'utf8');

  assert.match(command, /deprecated/i);
  assert.match(command, /superpowers writing-plans|superpowers:writing-plans/i);
  assert.match(skill, /Codex Execution Note/i);
  assert.match(skill, /Do not jump straight from "spec approved" to "plan complete"/i);
  assert.match(skill, /If the user chooses option 1, first assess whether same-session context is still sufficient/i);
});

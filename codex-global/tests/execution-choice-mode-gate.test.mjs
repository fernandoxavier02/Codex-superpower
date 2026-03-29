import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const activateChoiceHook = 'C:\\Users\\win\\.codex\\hooks\\activate-execution-choice-mode.cjs';
const requireChoiceHook =
  'C:\\Users\\win\\.codex\\hooks\\require-execution-choice-resolution.cjs';
const choiceStatePath = 'C:\\Users\\win\\.codex\\hook-state\\execution-choice-gate.json';

function runHook(prompt) {
  const result = spawnSync(
    process.execPath,
    [activateChoiceHook, JSON.stringify({ prompt })],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, `hook failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout.trim());
}

function runResponseHook(responseText) {
  return spawnSync(process.execPath, [requireChoiceHook, responseText], {
    encoding: 'utf8',
  });
}

function writeChoiceState(choice = null) {
  fs.mkdirSync('C:\\Users\\win\\.codex\\hook-state', { recursive: true });
  fs.writeFileSync(
    choiceStatePath,
    JSON.stringify(
      {
        pending: true,
        phase: 'execution-choice',
        planPath: 'docs/superpowers/plans/2026-03-29-rollout.md',
        choice,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
}

test.afterEach(() => {
  if (fs.existsSync(choiceStatePath)) {
    fs.unlinkSync(choiceStatePath);
  }
});

test('choice 1 activates context-sufficiency gate', () => {
  writeChoiceState();
  const payload = runHook('1');

  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /EXECUTION CHOICE 1 OBRIGATORIA/);
  assert.match(payload.systemMessage, /contexto suficiente/i);
  assert.match(payload.systemMessage, /pr[oó]xima sess[aã]o/i);
});

test('choice 2 activates inline execution gate', () => {
  writeChoiceState();
  const payload = runHook('2');

  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /EXECUTION CHOICE 2 OBRIGATORIA/);
  assert.match(payload.systemMessage, /Inline Execution/i);
  assert.match(payload.systemMessage, /update_plan/i);
});

test('response hook blocks option 1 without sufficiency statement or fallback', () => {
  writeChoiceState('1');
  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "executar opcao 1"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["opcao 1"]
  riscos: "..."

Vou usar subagent-driven-development agora.
`);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /option 1 requires context sufficiency gate or next-session fallback/i);
});

test('response hook accepts option 1 with sufficient-context path', () => {
  writeChoiceState('1');
  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "executar opcao 1"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["opcao 1"]
  riscos: "..."

O contexto é suficiente e já tenho o plano na memória.
Vou usar subagent-driven-development a partir de docs/superpowers/plans/2026-03-29-rollout.md.
Vou extrair as tasks para update_plan/tracker antes de despachar subagentes.
`);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(choiceStatePath), false);
});

test('response hook accepts option 1 fallback to next session', () => {
  writeChoiceState('1');
  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "executar opcao 1"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["opcao 1"]
  riscos: "..."

O contexto está insuficiente nesta sessão, então vou cair para a próxima sessão por higiene de contexto.
Use superpowers:subagent-driven-development to implement docs/superpowers/plans/2026-03-29-rollout.md.
`);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(choiceStatePath), false);
});

test('response hook accepts option 2 inline execution setup', () => {
  writeChoiceState('2');
  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "executar opcao 2"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["opcao 2"]
  riscos: "..."

Vou fazer inline execution na mesma sessão usando docs/superpowers/plans/2026-03-29-rollout.md.
Vou criar update_plan e manter uma tarefa por vez.
`);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(choiceStatePath), false);
});

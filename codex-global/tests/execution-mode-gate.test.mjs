import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const activateExecutionHook = 'C:\\Users\\win\\.codex\\hooks\\activate-execution-mode.cjs';
const requireExecutionChecklistHook =
  'C:\\Users\\win\\.codex\\hooks\\require-execution-checklist.cjs';
const executePlanCommand = 'C:\\Users\\win\\.codex\\commands\\execute-plan.md';
const writingPlansCommand = 'C:\\Users\\win\\.codex\\commands\\writing-plans.md';
const writingPlansSkill =
  'C:\\Users\\win\\plugins\\superpowers-codex-global\\skills\\writing-plans\\SKILL.md';
const executionStatePath = 'C:\\Users\\win\\.codex\\hook-state\\execution-gate.json';

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
  return spawnSync(process.execPath, [requireExecutionChecklistHook, responseText], {
    encoding: 'utf8',
  });
}

test.afterEach(() => {
  if (fs.existsSync(executionStatePath)) {
    fs.unlinkSync(executionStatePath);
  }
});

test('slash /execute-plan activates execution mode message', () => {
  const payload = runHook(activateExecutionHook, '/execute-plan docs/superpowers/plans/foo.md');
  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /EXECUTION MODE OBRIGATORIO/);
  assert.match(payload.systemMessage, /update_plan/i);
  assert.match(payload.systemMessage, /autoritativo/i);
});

test('textual execution request with plan path activates execution mode', () => {
  const payload = runHook(
    activateExecutionHook,
    'execute o plano docs/superpowers/plans/foo-plan.md em uma nova sessão',
  );
  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /nova sess/i);
  assert.equal(fs.existsSync(executionStatePath), true);
});

test('response hook blocks execution response without staged evidence', () => {
  runHook(activateExecutionHook, '/execute-plan docs/superpowers/plans/foo.md');
  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "executar plano"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["executar"]
  riscos: "..."
`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /execution turn without staged execution evidence/i);
});

test('response hook accepts staged execution evidence and keeps state active', () => {
  runHook(activateExecutionHook, '/execute-plan docs/superpowers/plans/foo.md');
  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "executar plano"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["ler plano", "executar em etapas"]
  riscos: "..."

Vou criar o update_plan a partir do documento, marcar Task 1 como in_progress e executar uma tarefa por vez.
`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(executionStatePath), true);
});

test('execution state continues across a short follow-up', () => {
  runHook(activateExecutionHook, '/execute-plan docs/superpowers/plans/foo.md');
  const first = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "executar plano"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["ler plano", "executar em etapas"]
  riscos: "..."

Vou usar update_plan e marcar Task 1 in_progress.
`);
  assert.equal(first.status, 0, first.stderr || first.stdout);
  const payload = runHook(activateExecutionHook, 'continue');
  assert.equal(payload.continue, true);
  assert.match(payload.systemMessage, /EXECUTION FLOW CONTINUA/);
});

test('response hook clears execution state on completion', () => {
  runHook(activateExecutionHook, '/execute-plan docs/superpowers/plans/foo.md');
  const result = runResponseHook(`
ORCHESTRATOR_DECISION:
  solicitacao: "executar plano"
  tipo: "Feature"
  severidade: "Alta"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a"]
  tem_spec: "Não"
  fluxo: ["ler plano", "executar em etapas", "finalizar"]
  riscos: "..."

All tasks complete. update_plan shows all tasks completed and I am using finishing-a-development-branch.
`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(executionStatePath), false);
});

test('commands and skill describe same-session vs fresh-session handoff', () => {
  const executeCommand = fs.readFileSync(executePlanCommand, 'utf8');
  const writingCommand = fs.readFileSync(writingPlansCommand, 'utf8');
  const writingSkill = fs.readFileSync(writingPlansSkill, 'utf8');

  assert.match(executeCommand, /update_plan/i);
  assert.match(executeCommand, /autoritativo/i);
  assert.match(writingCommand, /subagent-driven-development/i);
  assert.match(writingCommand, /inline execution/i);
  assert.match(writingCommand, /próxima sessão|proxima sessao/i);
  assert.match(writingSkill, /Subagent-Driven/i);
  assert.match(writingSkill, /Inline Execution/i);
  assert.match(writingSkill, /next-session prompt/i);
});

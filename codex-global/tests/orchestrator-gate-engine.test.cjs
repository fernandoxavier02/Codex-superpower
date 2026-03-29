const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const engine = require("../hooks/orchestrator-gate-engine.js");
const {
  parseYamlDecisionBlock,
  parsePipelineCheckpoint,
  parseFinalValidatorResult,
  getMissingFields,
  isDecisionValid,
  requiresConfirmation,
  pickScope,
  evaluateDecisionPrompt,
  loadManifest,
  defaultPipelineState,
  loadPipelineState,
  initializePipelineState,
  applyCheckpointToState,
  applyFinalValidatorResult,
  canConclude,
  ENFORCEMENT_MESSAGE,
} = engine;

const sampleDecisionBlock = `ORCHESTRATOR_DECISION:
  solicitacao: "ajustar fluxo de gate"
  tipo: "Feature"
  severidade: "Baixa"
  persona: "IMPLEMENTER"
  arquivos_provaveis:
    - "AGENTS.md"
    - ".codex/hooks/force-pipeline-agents.cjs"
  tem_spec: "Sim: .kiro/specs/orchestrator-noninventive-contexto-gate/spec.json"
  fluxo:
    - "Validar bloco"
    - "Executar verificacao"
  riscos: "sem risco"
`;

function makeStateOptions() {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-gate-"));
  return { statePath: path.join(stateDir, "pipeline-run.json") };
}

function makeManifestDir() {
  const manifestDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-manifest-"));
  fs.writeFileSync(
    path.join(manifestDir, "global-context-manifest.json"),
    JSON.stringify({ scope: "global", paths: ["C:/Users/win/.codex/.kiro/CONSTITUTION.md"] }),
    "utf8"
  );
  fs.writeFileSync(
    path.join(manifestDir, "local-context-manifest.json"),
    JSON.stringify({ scope: "local", paths: ["D:/repo/.kiro/specs/example/spec.json"] }),
    "utf8"
  );
  return manifestDir;
}

test("TDD: bloqueia quando o bloco ORCHESTRATOR_DECISION nao existe", () => {
  const prompt = "esta tarefa precisa mudar o fluxo";
  const result = evaluateDecisionPrompt(prompt, makeStateOptions());

  assert.equal(result.state, "blocked");
  assert.equal(result.valid, false);
  assert.equal(result.missing.includes("solicitacao"), true);
  assert.ok(result.message.includes("Nao vou seguir ainda"));
  assert.ok(result.message.includes(ENFORCEMENT_MESSAGE));
});

test("TDD: parse de decision block com lista em YAML", () => {
  const parsed = parseYamlDecisionBlock(sampleDecisionBlock);

  assert.equal(parsed.solicitacao, "ajustar fluxo de gate");
  assert.equal(parsed.tipo, "Feature");
  assert.ok(Array.isArray(parsed.arquivos_provaveis));
  assert.equal(parsed.arquivos_provaveis.length, 2);
  assert.ok(Array.isArray(parsed.fluxo));
  assert.equal(parsed.fluxo.length, 2);
});

test("TDD: detecta campo obrigatorio faltante", () => {
  const parsed = parseYamlDecisionBlock(sampleDecisionBlock);
  parsed.riscos = "";
  const missing = getMissingFields(parsed);
  assert.deepEqual(missing, ["riscos"]);
  assert.equal(isDecisionValid(parsed), false);
});

test("TDD: aceita decisao valida completa", () => {
  const parsed = parseYamlDecisionBlock(sampleDecisionBlock);
  assert.equal(isDecisionValid(parsed), true);
});

test("TDD: exige confirmacao para risco medio", () => {
  const parsed = parseYamlDecisionBlock(sampleDecisionBlock);
  parsed.severidade = "Media";
  parsed.riscos = "atualizacao de persistencia e logs";
  assert.equal(requiresConfirmation(parsed), true);
});

test("TDD: exige confirmacao para risco em auth com severidade baixa", () => {
  const parsed = parseYamlDecisionBlock(sampleDecisionBlock);
  parsed.severidade = "Baixa";
  parsed.riscos = "mudanca de auth e seguranca";
  assert.equal(requiresConfirmation(parsed), true);
});

test("TDD: escolhe escopo local quando arquivos de spec foram citados", () => {
  const parsed = parseYamlDecisionBlock(sampleDecisionBlock);
  const scope = pickScope("ajustar .kiro/specs/teste", parsed);
  assert.equal(scope, "local");
});

test("TDD: retorna estado ok para baixa com risco baixo e inicializa pipeline state", () => {
  const options = makeStateOptions();
  const result = evaluateDecisionPrompt(sampleDecisionBlock, { ...options, autoPersist: true });
  const persisted = loadPipelineState(options);

  assert.equal(result.state, "ok");
  assert.equal(result.scope, "local");
  assert.equal(result.valid, true);
  assert.ok(result.message.includes("Decisao valida e contexto carregado"));
  assert.equal(persisted.active, true);
  assert.equal(persisted.current_phase, "quality-gate");
  assert.equal(persisted.tdd.required, true);
  assert.equal(persisted.tdd.quality_gate_generated, true);
});

test("TDD: carrega manifest por escopo global e local", () => {
  const manifestDir = makeManifestDir();
  const globalManifest = loadManifest("global", manifestDir);
  const localManifest = loadManifest("local", manifestDir);
  assert.equal(globalManifest === null ? null : globalManifest.scope, "global");
  assert.equal(localManifest === null ? null : localManifest.scope, "local");
});

test("TDD: detecta parse inline no formato [..] para arrays", () => {
  const prompt = `ORCHESTRATOR_DECISION:
  solicitacao: "x"
  tipo: "Feature"
  severidade: "Baixa"
  persona: "IMPLEMENTER"
  arquivos_provaveis: ["a.md", "b.md"]
  tem_spec: "Nao"
  fluxo: ["passo1", "passo2"]
  riscos: "baixo"`;
  const parsed = parseYamlDecisionBlock(prompt);
  assert.ok(Array.isArray(parsed.arquivos_provaveis));
  assert.equal(parsed.arquivos_provaveis.length, 2);
  assert.ok(Array.isArray(parsed.fluxo));
  assert.equal(parsed.fluxo.length, 2);
});

test("TDD: quality gate aprovado por checkpoint avanca para pre-tester", () => {
  const initial = initializePipelineState(parseYamlDecisionBlock(sampleDecisionBlock));
  const checkpoint = parsePipelineCheckpoint(`PIPELINE_CHECKPOINT:
  phase: "quality-gate"
  status: "approved"
  user_approved: true
  next_phase: "pre-tester"`);
  const next = applyCheckpointToState(initial, checkpoint);

  assert.equal(next.tdd.quality_gate_user_approved, true);
  assert.equal(next.current_phase, "pre-tester");
  assert.equal(next.blocked_reason, null);
});

test("TDD: pre-tester completed exige artefato e libera execution", () => {
  const initial = initializePipelineState(parseYamlDecisionBlock(sampleDecisionBlock));
  initial.current_phase = "pre-tester";
  initial.tdd.quality_gate_user_approved = true;
  const checkpoint = parsePipelineCheckpoint(`PIPELINE_CHECKPOINT:
  phase: "pre-tester"
  status: "completed"
  artifact_path: "tests/unit/test_pipeline_guard.py"
  next_phase: "execution"`);
  const next = applyCheckpointToState(initial, checkpoint);

  assert.equal(next.tdd.pre_tester_completed, true);
  assert.deepEqual(next.tdd.test_files_created, ["tests/unit/test_pipeline_guard.py"]);
  assert.equal(next.current_phase, "execution");
});

test("TDD: pre-tester bloqueia se alterar codigo de producao", () => {
  const initial = initializePipelineState(parseYamlDecisionBlock(sampleDecisionBlock));
  initial.current_phase = "pre-tester";
  const checkpoint = parsePipelineCheckpoint(`PIPELINE_CHECKPOINT:
  phase: "pre-tester"
  status: "completed"
  artifact_path: "tests/unit/test_pipeline_guard.py"
  code_production_altered: true`);

  assert.throws(() => applyCheckpointToState(initial, checkpoint), /codigo de producao/);
});

test("TDD: execution completed abre batch e exige adversarial", () => {
  const initial = initializePipelineState(parseYamlDecisionBlock(sampleDecisionBlock));
  initial.current_phase = "execution";
  initial.tdd.quality_gate_user_approved = true;
  initial.tdd.pre_tester_completed = true;
  const checkpoint = parsePipelineCheckpoint(`PIPELINE_CHECKPOINT:
  phase: "execution"
  status: "completed"
  batch_id: "B1"
  scope: ["executor-implementer.md"]`);
  const next = applyCheckpointToState(initial, checkpoint);

  assert.equal(next.execution.current_batch, 1);
  assert.equal(next.current_phase, "adversarial");
  assert.equal(next.execution.batches[0].executor_completed, true);
  assert.match(next.blocked_reason, /adversarial_required_for_B1/);
});

test("TDD: adversarial completed fecha batch e libera proxima fase", () => {
  const initial = initializePipelineState(parseYamlDecisionBlock(sampleDecisionBlock));
  initial.tdd.quality_gate_user_approved = true;
  initial.tdd.pre_tester_completed = true;
  initial.execution.current_batch = 1;
  initial.current_phase = "adversarial";
  initial.execution.batches.push({
    batch_id: "B1",
    scope: ["executor-implementer.md"],
    executor_completed: true,
    adversarial_completed: false,
    checkpoint_passed: false,
    fix_attempts: 0,
    status: "awaiting_adversarial",
  });
  const checkpoint = parsePipelineCheckpoint(`PIPELINE_CHECKPOINT:
  phase: "adversarial"
  status: "completed"
  batch_id: "B1"
  next_phase: "sanity"`);
  const next = applyCheckpointToState(initial, checkpoint);

  assert.equal(next.execution.batches[0].adversarial_completed, true);
  assert.equal(next.execution.batches[0].checkpoint_passed, true);
  assert.equal(next.current_phase, "sanity");
});

test("TDD: adversarial blocked retorna para execution e esgota no terceiro ciclo", () => {
  const initial = initializePipelineState(parseYamlDecisionBlock(sampleDecisionBlock));
  initial.tdd.quality_gate_user_approved = true;
  initial.tdd.pre_tester_completed = true;
  initial.execution.current_batch = 1;
  initial.current_phase = "adversarial";
  initial.execution.batches.push({
    batch_id: "B1",
    scope: ["executor-implementer.md"],
    executor_completed: true,
    adversarial_completed: false,
    checkpoint_passed: false,
    fix_attempts: 2,
    status: "awaiting_adversarial",
  });
  const checkpoint = parsePipelineCheckpoint(`PIPELINE_CHECKPOINT:
  phase: "adversarial"
  status: "blocked"
  batch_id: "B1"`);
  const next = applyCheckpointToState(initial, checkpoint);

  assert.equal(next.current_phase, "blocked");
  assert.equal(next.blocked_reason, "adversarial_loop_exhausted");
});

test("TDD: approval do usuario destrava quality gate pendente", () => {
  const options = makeStateOptions();
  initializePipelineState(parseYamlDecisionBlock(sampleDecisionBlock), { ...options, autoPersist: true });

  const result = evaluateDecisionPrompt("ok, pode ir", { ...options, autoPersist: true });
  const persisted = loadPipelineState(options);

  assert.equal(result.decision, "QUALITY_GATE_APPROVED");
  assert.equal(persisted.current_phase, "pre-tester");
  assert.equal(persisted.tdd.quality_gate_user_approved, true);
});

test("TDD: bloqueia implementacao sem pre-tester completed", () => {
  const options = makeStateOptions();
  const state = initializePipelineState(parseYamlDecisionBlock(sampleDecisionBlock));
  state.current_phase = "pre-tester";
  engine.savePipelineState(state, options);

  const result = evaluateDecisionPrompt("implemente agora", options);

  assert.equal(result.state, "blocked");
  assert.equal(result.decision, "PRE_TESTER_REQUIRED");
  assert.match(result.message, /pre-tester/i);
});

test("TDD: bloqueia proximo batch sem adversarial do batch atual", () => {
  const options = makeStateOptions();
  const state = initializePipelineState(parseYamlDecisionBlock(sampleDecisionBlock));
  state.current_phase = "adversarial";
  state.tdd.quality_gate_user_approved = true;
  state.tdd.pre_tester_completed = true;
  state.execution.current_batch = 1;
  state.execution.batches.push({
    batch_id: "B1",
    scope: ["a.js"],
    executor_completed: true,
    adversarial_completed: false,
    checkpoint_passed: false,
    fix_attempts: 0,
    status: "awaiting_adversarial",
  });
  engine.savePipelineState(state, options);

  const result = evaluateDecisionPrompt("siga para o batch 2", options);

  assert.equal(result.state, "blocked");
  assert.equal(result.decision, "ADVERSARIAL_REQUIRED");
  assert.match(result.message, /batch_id=B1/);
});

test("TDD: final validator com GO permite conclusao", () => {
  const state = defaultPipelineState();
  state.active = true;
  state.current_phase = "final-validator";
  state.checks.sanity_passed = true;
  state.execution.batches = [
    {
      batch_id: "B1",
      scope: ["a.js"],
      executor_completed: true,
      adversarial_completed: true,
      checkpoint_passed: true,
      fix_attempts: 0,
      status: "completed",
    },
  ];
  const result = parseFinalValidatorResult(`FINAL_VALIDATOR_RESULT:
  status: "GO"`);
  const next = applyFinalValidatorResult(state, result);

  assert.equal(next.current_phase, "done");
  assert.equal(next.checks.final_validator_status, "GO");
  assert.equal(canConclude(next), true);
});

test("TDD: commit e push bloqueados sem final validator e batches fechados", () => {
  const options = makeStateOptions();
  const state = defaultPipelineState();
  state.active = true;
  state.current_phase = "sanity";
  state.execution.batches = [
    {
      batch_id: "B1",
      scope: ["a.js"],
      executor_completed: true,
      adversarial_completed: false,
      checkpoint_passed: false,
      fix_attempts: 0,
      status: "awaiting_adversarial",
    },
  ];
  engine.savePipelineState(state, options);

  const result = evaluateDecisionPrompt("faça o commit e push", options);

  assert.equal(result.state, "blocked");
  assert.equal(result.decision, "FINALIZATION_REQUIRED");
  assert.match(result.message, /FINAL_VALIDATOR_RESULT|sanity/i);
});

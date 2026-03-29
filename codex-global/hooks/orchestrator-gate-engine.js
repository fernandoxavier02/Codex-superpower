const fs = require("fs");
const path = require("path");

const REQUIRED_FIELDS = [
  "solicitacao",
  "tipo",
  "severidade",
  "persona",
  "arquivos_provaveis",
  "tem_spec",
  "fluxo",
  "riscos",
];

const VALID_TIPOS = ["Bug Fix", "Feature", "Hotfix", "Auditoria", "Security"];
const VALID_SEVERIDADE = ["Critica", "Alta", "Media", "Baixa"];
const VALID_PERSONA = ["IMPLEMENTER", "BUGFIX_LIGHT", "BUGFIX_HEAVY", "AUDITOR", "ADVERSARIAL"];
const VALID_CHECKPOINT_PHASES = ["quality-gate", "pre-tester", "execution", "adversarial", "sanity"];
const FINAL_DECISIONS = ["GO", "CONDICIONAL", "NO_GO"];
const PHASE_NEXT_AGENT = {
  "quality-gate": "quality-gate-router",
  "pre-tester": "pre-tester",
  execution: "executor-implementer",
  adversarial: "adversarial-reviewer",
  sanity: "sanity-checker",
  "final-validator": "final-validator",
  blocked: "human-review",
  done: "pipeline-complete",
};

const ENFORCEMENT_MESSAGE = `PIPELINE DE AGENTES OBRIGATORIO
Esta solicitacao e pipeline-worthy.
Execute:
1) Emitir ORCHESTRATOR_DECISION (YAML)
2) task-orchestrator -> context-classifier -> orchestrator-documenter
3) quality-gate-router -> pre-tester -> executor
4) adversarial-reviewer por batch -> sanity-checker -> final-validator`;

const DEFAULT_STATE_VERSION = 1;
const USER_HOME = path.resolve(process.env.USERPROFILE || process.env.HOME || path.resolve(__dirname, "..", ".."));

function codexRootDir() {
  return path.resolve(__dirname, "..");
}

function isGlobalCodexInstall() {
  return path.dirname(codexRootDir()).toLowerCase() === USER_HOME.toLowerCase();
}

function defaultStatePath() {
  return isGlobalCodexInstall()
    ? path.join(codexRootDir(), "hook-state", "pipeline-run.json")
    : path.join(codexRootDir(), "state", "pipeline-run.json");
}

function defaultManifestDir() {
  const repoManifestDir = path.resolve(__dirname, "..", "..", ".kiro", "hooks", "context");
  if (fs.existsSync(repoManifestDir)) {
    return repoManifestDir;
  }
  return path.join(codexRootDir(), "hook-state", "context");
}

function parsePrompt(raw) {
  if (!raw) return "";
  try {
    const data = JSON.parse(raw);
    return data.prompt || data.arguments || data.input || data.text || data.message || "";
  } catch {
    return String(raw);
  }
}

function parseScalar(raw) {
  const value = String(raw).trim();
  if (/^".*"$|^'.*'$/.test(value)) {
    return value.slice(1, -1).trim();
  }
  if (/^(true|false)$/i.test(value)) {
    return /^true$/i.test(value);
  }
  if (/^null$/i.test(value)) {
    return null;
  }
  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }
  return value;
}

function trimQuoted(value) {
  return parseScalar(String(value).replace(/^["']|["']$/g, "").trim());
}

function parseYamlNamedBlock(blockName, prompt) {
  const lines = String(prompt || "").split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^\\s*${blockName}:\\s*$`, "i").test(line));
  if (start < 0) return null;

  const parsed = {};
  let current = null;
  for (let i = start + 1; i < lines.length; i += 1) {
    const row = lines[i];
    if (!/^\s/.test(row)) break;

    const trimmed = row.trim();
    if (!trimmed) continue;

    const kv = trimmed.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      const value = kv[2].trim();
      current = key;
      if (!value) {
        parsed[key] = [];
        continue;
      }
      if (/^\[.*\]$/.test(value)) {
        parsed[key] = value
          .slice(1, -1)
          .split(",")
          .map((item) => trimQuoted(item))
          .filter((item) => item !== "");
      } else {
        parsed[key] = parseScalar(value);
      }
      continue;
    }

    const listItem = trimmed.match(/^\-\s*(.+)$/);
    if (listItem && current) {
      if (!Array.isArray(parsed[current])) {
        parsed[current] = parsed[current] === undefined ? [] : [parsed[current]];
      }
      parsed[current].push(parseScalar(listItem[1]));
    }
  }

  return parsed;
}

function parseYamlDecisionBlock(prompt) {
  return parseYamlNamedBlock("ORCHESTRATOR_DECISION", prompt);
}

function parsePipelineCheckpoint(prompt) {
  return parseYamlNamedBlock("PIPELINE_CHECKPOINT", prompt);
}

function parseFinalValidatorResult(prompt) {
  return parseYamlNamedBlock("FINAL_VALIDATOR_RESULT", prompt);
}

function getMissingFields(decision) {
  const missing = [];
  for (const field of REQUIRED_FIELDS) {
    const value = decision ? decision[field] : undefined;
    if (value === undefined || value === null) {
      missing.push(field);
      continue;
    }
    if (typeof value === "string" && !value.trim()) {
      missing.push(field);
      continue;
    }
    if (Array.isArray(value) && value.length === 0) {
      missing.push(field);
    }
  }
  return missing;
}

function isDecisionValid(decision) {
  const missing = getMissingFields(decision);
  if (missing.length) return false;
  if (!VALID_TIPOS.includes(decision.tipo)) return false;
  if (!VALID_SEVERIDADE.includes(decision.severidade)) return false;
  if (!VALID_PERSONA.includes(decision.persona)) return false;
  if (!Array.isArray(decision.arquivos_provaveis)) return false;
  if (!Array.isArray(decision.fluxo)) return false;
  if (!/^(Sim: .+|Nao)$/.test(String(decision.tem_spec || ""))) return false;
  return true;
}

function pickScope(prompt, decision) {
  const text = `${String(prompt || "")} ${((decision && decision.arquivos_provaveis) || []).join(" ")}`.toLowerCase();
  if (/\.kiro\/specs\//.test(text) || /\.codex\/hooks/.test(text)) return "local";
  return "global";
}

function requiresConfirmation(decision) {
  if (String(decision.severidade).toLowerCase() !== "baixa") return true;
  const risks = String(decision.riscos || "").toLowerCase();
  return /(auth|authz|security|seguranca|persist|dados|sensitive|credit|credito)/.test(risks);
}

function loadManifest(scope, baseDir = defaultManifestDir()) {
  const manifestPath = path.join(baseDir, `${scope}-context-manifest.json`);
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const raw = fs.readFileSync(manifestPath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.paths) ? parsed : null;
  } catch {
    return null;
  }
}

function buildBlockMessage(missing, reason = "") {
  const lines = missing.map((field) => `- ${field}`);
  return [
    "Nao vou seguir ainda. Falta informacao para continuar com seguranca.",
    "Me confirme em uma frase curta.",
    "Opcao 1: voce me passa os campos faltantes.",
    "Opcao 2: quer que eu te mostre um checklist para preencher?",
    reason ? `Motivo: ${reason}` : "",
    lines.length ? `Campos faltantes: ${lines.join(" ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildContextSummary(scope, manifest) {
  const total = manifest && Array.isArray(manifest.paths) ? manifest.paths.length : 0;
  if (!manifest) return "Manifesto de contexto nao encontrado. Usar fontes globais oficiais.";
  return `Escopo ${scope}: contexto carregado com ${total} fontes oficiais.`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultPipelineState() {
  return {
    version: DEFAULT_STATE_VERSION,
    active: false,
    run_id: null,
    request_type: null,
    complexity: null,
    current_phase: "idle",
    current_batch: 0,
    blocked_reason: null,
    execution_mode: null,
    artifacts: {
      spec_path: null,
      plan_path: null,
    },
    approvals: {
      design_approved: false,
      plan_approved: false,
      adversarial_batch_approved: false,
      final_adversarial_approved: false,
    },
    tdd: {
      required: false,
      quality_gate_generated: false,
      quality_gate_user_approved: false,
      pre_tester_completed: false,
      test_files_created: [],
    },
    execution: {
      batch_mode: false,
      current_batch: 0,
      batches: [],
    },
    checks: {
      sanity_passed: false,
      final_validator_status: null,
    },
  };
}

function ensureStateDir(statePath = defaultStatePath()) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
}

function loadPipelineState(options = {}) {
  const statePath = options.statePath || defaultStatePath();
  if (!fs.existsSync(statePath)) {
    return defaultPipelineState();
  }
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    const parsed = JSON.parse(raw);
    return { ...defaultPipelineState(), ...parsed };
  } catch {
    return defaultPipelineState();
  }
}

function savePipelineState(state, options = {}) {
  const statePath = options.statePath || defaultStatePath();
  ensureStateDir(statePath);
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function resetPipelineState(options = {}) {
  const state = defaultPipelineState();
  savePipelineState(state, options);
  return state;
}

function isTddRequired(decision) {
  return String(decision.tipo || "") !== "Auditoria";
}

function initializePipelineState(decision, options = {}) {
  const state = defaultPipelineState();
  const tddRequired = isTddRequired(decision);
  const activePhase = tddRequired ? "quality-gate" : "execution";
  const blockedReason = tddRequired ? "quality_gate_user_approval_required" : null;
  state.active = true;
  state.run_id = `run-${Date.now()}`;
  state.request_type = decision.tipo;
  state.current_phase = activePhase;
  state.blocked_reason = blockedReason;
  state.execution_mode = "pipeline";
  state.tdd.required = tddRequired;
  state.tdd.quality_gate_generated = tddRequired;
  state.tdd.pre_tester_completed = !tddRequired;
  state.execution.batch_mode = true;
  if (options.autoPersist) {
    savePipelineState(state, options);
  }
  return state;
}

function hasActivePipelineState(state) {
  return Boolean(state && state.active && state.current_phase && state.current_phase !== "idle");
}

function normalizePhase(phase) {
  return String(phase || "").trim().toLowerCase();
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function normalizeFinalDecision(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (normalized === "NO-GO") return "NO_GO";
  if (FINAL_DECISIONS.includes(normalized)) return normalized;
  return null;
}

function assertCheckpointPhase(phase) {
  if (!VALID_CHECKPOINT_PHASES.includes(phase)) {
    throw new Error(`PIPELINE_CHECKPOINT phase nao suportada: ${phase}`);
  }
}

function ensureBatch(state, batchId, scope = []) {
  const batches = state.execution.batches;
  let batch = batches.find((entry) => entry.batch_id === batchId);
  if (!batch) {
    batch = {
      batch_id: batchId,
      scope: Array.isArray(scope) ? scope : [],
      executor_completed: false,
      adversarial_completed: false,
      checkpoint_passed: false,
      fix_attempts: 0,
      status: "pending",
    };
    batches.push(batch);
  }
  return batch;
}

function batchNumber(batchId) {
  const match = String(batchId || "").match(/^B(\d+)$/i);
  return match ? Number(match[1]) : null;
}

function applyCheckpointToState(inputState, checkpoint) {
  const state = clone(inputState || defaultPipelineState());
  const phase = normalizePhase(checkpoint.phase);
  const status = normalizeStatus(checkpoint.status);
  assertCheckpointPhase(phase);

  if (phase === "quality-gate") {
    state.active = true;
    state.tdd.required = true;
    state.tdd.quality_gate_generated = true;
    state.tdd.quality_gate_user_approved = Boolean(checkpoint.user_approved) && status === "approved";
    state.current_phase = state.tdd.quality_gate_user_approved ? "pre-tester" : "quality-gate";
    state.blocked_reason = state.tdd.quality_gate_user_approved ? null : "quality_gate_user_approval_required";
    return state;
  }

  if (phase === "pre-tester") {
    if (status !== "completed") {
      throw new Error("PIPELINE_CHECKPOINT pre-tester precisa de status completed");
    }
    if (checkpoint.codigo_producao_alterado === true || checkpoint.code_production_altered === true) {
      throw new Error("PRE-TESTER nao pode alterar codigo de producao");
    }
    const testFiles = [];
    if (Array.isArray(checkpoint.test_files_created)) {
      testFiles.push(...checkpoint.test_files_created);
    }
    if (checkpoint.artifact_path) {
      testFiles.push(checkpoint.artifact_path);
    }
    if (testFiles.length === 0) {
      throw new Error("PRE-TESTER precisa registrar artefato ou arquivos de teste");
    }
    state.tdd.pre_tester_completed = true;
    state.tdd.test_files_created = [...new Set(testFiles.map(String))];
    state.current_phase = "execution";
    state.blocked_reason = null;
    return state;
  }

  if (phase === "execution") {
    if (!state.tdd.pre_tester_completed) {
      throw new Error("Execution nao pode iniciar sem PRE-TESTER completed");
    }
    const batchId = String(checkpoint.batch_id || `B${(state.execution.current_batch || 0) + 1}`);
    const batch = ensureBatch(state, batchId, checkpoint.scope || []);
    batch.executor_completed = status === "completed";
    batch.status = batch.executor_completed ? "awaiting_adversarial" : "pending";
    state.execution.current_batch = batchNumber(batchId) || state.execution.current_batch || 1;
    state.current_batch = state.execution.current_batch;
    state.current_phase = "adversarial";
    state.blocked_reason = batch.executor_completed ? `adversarial_required_for_${batchId}` : "execution_incomplete";
    return state;
  }

  if (phase === "adversarial") {
    const batchId = String(checkpoint.batch_id || `B${state.execution.current_batch || 1}`);
    const batch = ensureBatch(state, batchId, checkpoint.scope || []);
    if (status === "blocked") {
      batch.fix_attempts += 1;
      batch.status = "blocked";
      batch.executor_completed = false;
      batch.adversarial_completed = false;
      batch.checkpoint_passed = false;
      if (batch.fix_attempts >= 3) {
        state.current_phase = "blocked";
        state.blocked_reason = "adversarial_loop_exhausted";
      } else {
        state.current_phase = "execution";
        state.blocked_reason = `executor_pending_fix_${batchId}`;
      }
      return state;
    }

    batch.adversarial_completed = status === "completed";
    batch.checkpoint_passed = batch.adversarial_completed;
    batch.status = batch.adversarial_completed ? "completed" : "pending";
    state.approvals.adversarial_batch_approved = batch.adversarial_completed;
    if (!batch.adversarial_completed) {
      state.current_phase = "adversarial";
      state.blocked_reason = `adversarial_incomplete_${batchId}`;
      return state;
    }

    const nextPhase = normalizePhase(checkpoint.next_phase);
    state.blocked_reason = null;
    if (nextPhase.startsWith("batch")) {
      state.current_phase = "execution";
    } else if (nextPhase === "sanity") {
      state.current_phase = "sanity";
    } else {
      state.current_phase = "execution";
    }
    return state;
  }

  if (phase === "sanity") {
    if (status !== "completed") {
      throw new Error("SANITY checkpoint precisa de status completed");
    }
    state.checks.sanity_passed = true;
    state.current_phase = "final-validator";
    state.blocked_reason = null;
    return state;
  }

  return state;
}

function applyFinalValidatorResult(inputState, result) {
  const state = clone(inputState || defaultPipelineState());
  const decision =
    normalizeFinalDecision(result.decisao_final) ||
    normalizeFinalDecision(result.final_status) ||
    normalizeFinalDecision(result.status);

  if (!decision) {
    throw new Error("FINAL_VALIDATOR_RESULT sem decisao reconhecida");
  }

  state.checks.final_validator_status = decision;
  if (decision === "NO_GO") {
    state.current_phase = "blocked";
    state.blocked_reason = "final_validator_no_go";
    return state;
  }
  state.current_phase = "done";
  state.blocked_reason = null;
  return state;
}

function isExplicitApproval(prompt) {
  const trimmed = String(prompt || "").trim();
  return /^(ok|segue|pode ir|pode seguir|prosseguir|aprovado|aprovo|approved|pode prosseguir)\b/i.test(trimmed);
}

function isCommitOrPushRequest(prompt) {
  return /\b(commit|commitar|push|publique|publicar|merge|pull request|pr)\b/i.test(String(prompt || ""));
}

function isImplementationLikeRequest(prompt) {
  return /\b(implemente|implement|execute|executa|execute|codifique|altere|mude|corrija|fa[çc]a|continue|continua|siga|prossiga|pr[oó]ximo batch|next batch)\b/i.test(
    String(prompt || "")
  );
}

function canConclude(state) {
  if (!state.checks.sanity_passed) return false;
  if (!["GO", "CONDICIONAL"].includes(String(state.checks.final_validator_status || ""))) return false;
  return state.execution.batches.every((batch) => batch.adversarial_completed);
}

function buildPhaseBlockMessage(state, missingCheckpoint) {
  const nextAgent = PHASE_NEXT_AGENT[state.current_phase] || "pipeline";
  return [
    ENFORCEMENT_MESSAGE,
    `PIPELINE BLOQUEADO: fase atual = ${state.current_phase}`,
    `Motivo: ${state.blocked_reason || "checkpoint pendente"}`,
    `Proximo agente obrigatorio: ${nextAgent}`,
    `Checkpoint faltante: ${missingCheckpoint}`,
  ].join("\n");
}

function evaluateStatePrompt(prompt, state, options = {}) {
  const trimmed = String(prompt || "").trim();
  const resultBase = {
    valid: true,
    scope: "local",
    manifest: loadManifest("local", options.manifestDir || defaultManifestDir()),
  };

  if (!hasActivePipelineState(state)) {
    return null;
  }

  if (state.current_phase === "quality-gate") {
    if (isExplicitApproval(trimmed) && state.tdd.quality_gate_generated) {
      const nextState = clone(state);
      nextState.tdd.quality_gate_user_approved = true;
      nextState.current_phase = "pre-tester";
      nextState.blocked_reason = null;
      if (options.autoPersist) {
        savePipelineState(nextState, options);
      }
      return {
        ...resultBase,
        state: "ok",
        decision: "QUALITY_GATE_APPROVED",
        message: `${ENFORCEMENT_MESSAGE}\nAprovacao do quality gate registrada.\nProximo agente obrigatorio: pre-tester`,
        pipelineState: nextState,
      };
    }

    if (isImplementationLikeRequest(trimmed) || isCommitOrPushRequest(trimmed)) {
      return {
        ...resultBase,
        state: "blocked",
        decision: "QUALITY_GATE_REQUIRED",
        message: buildPhaseBlockMessage(state, "PIPELINE_CHECKPOINT phase=quality-gate status=approved"),
        pipelineState: state,
      };
    }
  }

  if (state.current_phase === "pre-tester" && (isImplementationLikeRequest(trimmed) || isCommitOrPushRequest(trimmed))) {
    return {
      ...resultBase,
      state: "blocked",
      decision: "PRE_TESTER_REQUIRED",
      message: buildPhaseBlockMessage(state, "PIPELINE_CHECKPOINT phase=pre-tester status=completed"),
      pipelineState: state,
    };
  }

  if (state.current_phase === "adversarial" && (isImplementationLikeRequest(trimmed) || isCommitOrPushRequest(trimmed))) {
    const batchId = `B${state.execution.current_batch || state.current_batch || 1}`;
    return {
      ...resultBase,
      state: "blocked",
      decision: "ADVERSARIAL_REQUIRED",
      message: buildPhaseBlockMessage(
        state,
        `PIPELINE_CHECKPOINT phase=adversarial status=completed batch_id=${batchId}`
      ),
      pipelineState: state,
    };
  }

  if (["sanity", "final-validator", "blocked"].includes(state.current_phase) && (isImplementationLikeRequest(trimmed) || isCommitOrPushRequest(trimmed))) {
    return {
      ...resultBase,
      state: "blocked",
      decision: "FINALIZATION_REQUIRED",
      message: buildPhaseBlockMessage(
        state,
        state.current_phase === "sanity"
          ? "PIPELINE_CHECKPOINT phase=sanity status=completed"
          : "FINAL_VALIDATOR_RESULT"
      ),
      pipelineState: state,
    };
  }

  if (isCommitOrPushRequest(trimmed) && !canConclude(state)) {
    return {
      ...resultBase,
      state: "blocked",
      decision: "COMMIT_BLOCKED",
      message: buildPhaseBlockMessage(state, "FINAL_VALIDATOR_RESULT com GO ou CONDICIONAL"),
      pipelineState: state,
    };
  }

  return {
    ...resultBase,
    state: "ok",
    decision: "STATE_OK",
    message: `${ENFORCEMENT_MESSAGE}\nEstado atual do pipeline validado.\nFase atual: ${state.current_phase}`,
    pipelineState: state,
  };
}

function evaluateDecisionPrompt(prompt, options = {}) {
  const decision = parseYamlDecisionBlock(prompt);
  const checkpoint = parsePipelineCheckpoint(prompt);
  const finalValidator = parseFinalValidatorResult(prompt);
  const scope = decision ? pickScope(prompt, decision) : "global";
  const manifest = loadManifest(scope, options.manifestDir || defaultManifestDir());
  const state = loadPipelineState(options);

  if (decision) {
    const missing = getMissingFields(decision);
    const valid = isDecisionValid(decision) && missing.length === 0;
    if (!valid) {
      return {
        state: "blocked",
        valid: false,
        decision: "ORCHESTRATOR_DECISION",
        request: decision,
        missing,
        message: `${ENFORCEMENT_MESSAGE}\n${buildBlockMessage(missing)}`,
        scope,
        manifest,
        pipelineState: state,
      };
    }

    const nextState = initializePipelineState(decision, options);
    if (requiresConfirmation(decision)) {
      return {
        state: "confirmation_required",
        valid: true,
        decision: "RISK_CONFIRMATION_REQUIRED",
        request: decision,
        missing: [],
        scope,
        manifest,
        pipelineState: nextState,
        message: `${ENFORCEMENT_MESSAGE}\nConfirmacao necessaria antes de executar.\nSeveridade: ${decision.severidade}\nRiscos: ${decision.riscos}\n${buildContextSummary(scope, manifest)}`,
      };
    }

    return {
      state: "ok",
      valid: true,
      decision: "APPROVED",
      request: decision,
      missing: [],
      scope,
      manifest,
      pipelineState: nextState,
      message: `${ENFORCEMENT_MESSAGE}\nDecisao valida e contexto carregado.\n${buildContextSummary(scope, manifest)}`,
    };
  }

  if (checkpoint) {
    const nextState = applyCheckpointToState(state, checkpoint);
    if (options.autoPersist) {
      savePipelineState(nextState, options);
    }
    return {
      state: "ok",
      valid: true,
      decision: "PIPELINE_CHECKPOINT_APPLIED",
      missing: [],
      scope: "local",
      manifest: loadManifest("local", options.manifestDir || defaultManifestDir()),
      pipelineState: nextState,
      message: `${ENFORCEMENT_MESSAGE}\nCheckpoint aplicado.\nFase atual: ${nextState.current_phase}`,
    };
  }

  if (finalValidator) {
    const nextState = applyFinalValidatorResult(state, finalValidator);
    if (options.autoPersist) {
      savePipelineState(nextState, options);
    }
    return {
      state: nextState.current_phase === "done" ? "ok" : "blocked",
      valid: true,
      decision: "FINAL_VALIDATOR_APPLIED",
      missing: [],
      scope: "local",
      manifest: loadManifest("local", options.manifestDir || defaultManifestDir()),
      pipelineState: nextState,
      message: `${ENFORCEMENT_MESSAGE}\nFinal validator registrado.\nStatus final: ${nextState.checks.final_validator_status}`,
    };
  }

  const stateResult = evaluateStatePrompt(prompt, state, options);
  if (stateResult) {
    return stateResult;
  }

  const missing = getMissingFields(null);
  return {
    state: "blocked",
    valid: false,
    decision: "ORCHESTRATOR_DECISION",
    request: null,
    missing,
    message: `${ENFORCEMENT_MESSAGE}\n${buildBlockMessage(missing, "Bloco ORCHESTRATOR_DECISION nao encontrado.")}`,
    scope,
    manifest,
    pipelineState: state,
  };
}

module.exports = {
  parsePrompt,
  parseScalar,
  trimQuoted,
  parseYamlNamedBlock,
  parseYamlDecisionBlock,
  parsePipelineCheckpoint,
  parseFinalValidatorResult,
  getMissingFields,
  isDecisionValid,
  pickScope,
  requiresConfirmation,
  loadManifest,
  buildBlockMessage,
  buildContextSummary,
  defaultPipelineState,
  loadPipelineState,
  savePipelineState,
  resetPipelineState,
  initializePipelineState,
  hasActivePipelineState,
  applyCheckpointToState,
  applyFinalValidatorResult,
  isExplicitApproval,
  isCommitOrPushRequest,
  isImplementationLikeRequest,
  canConclude,
  evaluateDecisionPrompt,
  ENFORCEMENT_MESSAGE,
  REQUIRED_FIELDS,
  VALID_CHECKPOINT_PHASES,
};

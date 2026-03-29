#!/usr/bin/env node
/**
 * Hook: activate-plan-mode
 *
 * Detecta requests de planejamento e injeta uma instrucao forte para tratar
 * o turno como "plan mode": produzir/seguir planejamento antes de qualquer
 * implementacao.
 *
 * Observacao: este hook nao troca um modo interno nativo do app. Ele faz o
 * routing e enforcement maximos expostos pelos hooks atuais do Codex.
 */

const fs = require('fs');
const path = require('path');

const TRIVIAL_PATTERNS = [
  /^(oi|olá|ola|hey|hi|hello)$/i,
  /^(obrigado|valeu)$/i,
  /^(ok|entendi|certo|sim|não|nao)$/i,
  /^(bom dia|boa tarde|boa noite|tudo bem|beleza)$/i,
];

const PLANNING_COMMAND_PATTERNS = [
  /^\/write-plan\b/i,
  /^\/superpowers:brainstorm\b/i,
  /^\/plan\b/i,
];

const PLANNING_TEXT_PATTERNS = [
  /\b(write[- ]?plan)\b/i,
  /\b(plano de implementa[cç][aã]o)\b/i,
  /\b(plano de execu[cç][aã]o)\b/i,
  /\b(fa[cç]a|crie|gere|monte|escreva)\s+(um\s+)?plano\b/i,
  /\b(preciso de um plano)\b/i,
  /\b(vamos planejar)\b/i,
];

const BRAINSTORMING_PHASES = [
  'Explorar contexto do projeto',
  'Perguntas clarificadoras (1 por vez)',
  'Propor 2-3 abordagens com trade-offs',
  'Apresentar design por seções (aprovação incremental)',
  'Escrever design doc e spec self-review',
  'Revisão do usuário e transição para writing-plans',
];

const PLAN_MODE_MESSAGE = `
PLAN MODE OBRIGATORIO

Esta solicitacao e de planejamento. Trate este turno como plan mode:

1. Emita ORCHESTRATOR_DECISION antes de qualquer conteudo substantivo.
2. Nao implemente codigo neste turno.
3. Crie imediatamente um checklist visivel com update_plan para TODAS as fases de brainstorming.
4. Use o fluxo de planejamento canonico: brainstorming -> writing-plans.
5. Trate perguntas clarificadoras como gate obrigatorio de nao-invencao: se faltar requisito material, pergunte antes de decidir.
6. Se o pedido vier por slash, use o entrypoint /superpowers:brainstorm ou a skill brainstorming.
7. Se precisar esclarecer algo, faca perguntas de planejamento antes de qualquer execucao.
8. Se a plataforma expuser uma UX de plan mode/request_user_input, prefira essa UX.
9. Nao pule fases. Mantenha exatamente uma fase in_progress por vez.

Checklist obrigatorio do brainstorming:
- Explorar contexto do projeto
- Perguntas clarificadoras (1 por vez)
- Propor 2-3 abordagens com trade-offs
- Apresentar design por seções (aprovação incremental)
- Escrever design doc e spec self-review
- Revisão do usuário e transição para writing-plans

Objetivo deste turno: sair com um plano aprovado, nao com codigo implementado.
`.trim();

const CONTINUE_PLANNING_MESSAGE = `
PLANNING FLOW CONTINUA

O brainstorming deste pedido ainda esta ativo.

1. Mantenha ORCHESTRATOR_DECISION.
2. Continue o checklist visivel com update_plan e TODAS as fases listadas.
3. Faca exatamente uma pergunta clarificadora por vez quando ainda houver lacunas.
4. Nao invente requisitos nem pule para implementacao.
5. Preserve a ordem obrigatoria:
   - Explorar contexto do projeto
   - Perguntas clarificadoras (1 por vez)
   - Propor 2-3 abordagens com trade-offs
   - Apresentar design por seções (aprovação incremental)
   - Escrever design doc e spec self-review
   - Revisão do usuário e transição para writing-plans
6. So encerre este fluxo quando o plano estiver efetivamente completo e salvo.
`.trim();

const CLEAR_PLANNING_PATTERNS = [
  /^\/superpowers:write-plan\b/i,
  /^\/superpowers:execute-plan\b/i,
  /^\/writing-plans\b/i,
  /^\/(execute-plan|executing-plans)\b/i,
  /^(cancelar|cancel|abort(ar)?|encerrar planejamento|sair do planning)\b/i,
];

const STATE_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\win',
  '.codex',
  'hook-state',
  'planning-gate.json',
);

function readPrompt(rawInput) {
  const raw = (rawInput || '').trim();
  if (!raw) {
    const argvInput = process.argv.slice(2).join(' ').trim();
    if (!argvInput) return '';
    if (fs.existsSync(argvInput)) {
      return fs.readFileSync(argvInput, 'utf-8');
    }
    try {
      const data = JSON.parse(argvInput);
      return (
        data.prompt ||
        data.arguments ||
        data.input ||
        data.text ||
        data.message ||
        ''
      );
    } catch {
      return argvInput;
    }
  }

  try {
    const data = JSON.parse(raw);
    return (
      data.prompt ||
      data.arguments ||
      data.input ||
      data.text ||
      data.message ||
      ''
    );
  } catch {
    return raw;
  }
}

function matchesAny(prompt, patterns) {
  const trimmed = (prompt || '').trim();
  return patterns.some((pattern) => pattern.test(trimmed));
}

function readPlanningState() {
  if (!fs.existsSync(STATE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writePlanningState(prompt) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(
    STATE_PATH,
    JSON.stringify(
      {
        pending: true,
        phase: 'brainstorming',
        phases: BRAINSTORMING_PHASES,
        prompt,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
}

function clearPlanningState() {
  if (fs.existsSync(STATE_PATH)) {
    fs.unlinkSync(STATE_PATH);
  }
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  try {
    const prompt = readPrompt(input);
    const planningState = readPlanningState();

    if (!prompt) {
      clearPlanningState();
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (matchesAny(prompt, CLEAR_PLANNING_PATTERNS)) {
      clearPlanningState();
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (planningState) {
      if (
        matchesAny(prompt, PLANNING_COMMAND_PATTERNS) ||
        matchesAny(prompt, PLANNING_TEXT_PATTERNS)
      ) {
        writePlanningState(prompt);
        console.log(
          JSON.stringify({
            continue: true,
            systemMessage: PLAN_MODE_MESSAGE,
          }),
        );
        return;
      }

      console.log(
        JSON.stringify({
          continue: true,
          systemMessage: CONTINUE_PLANNING_MESSAGE,
        }),
      );
      return;
    }

    if (matchesAny(prompt, TRIVIAL_PATTERNS)) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (
      matchesAny(prompt, PLANNING_COMMAND_PATTERNS) ||
      matchesAny(prompt, PLANNING_TEXT_PATTERNS)
    ) {
      writePlanningState(prompt);
      console.log(
        JSON.stringify({
          continue: true,
          systemMessage: PLAN_MODE_MESSAGE,
        }),
      );
      return;
    }

    console.log(JSON.stringify({ continue: true }));
  } catch {
    console.log(JSON.stringify({ continue: true }));
  }
});

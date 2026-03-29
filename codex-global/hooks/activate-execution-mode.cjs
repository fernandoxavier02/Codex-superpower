#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\win',
  '.codex',
  'hook-state',
  'execution-gate.json',
);

const TRIVIAL_PATTERNS = [
  /^(oi|olá|ola|hey|hi|hello)$/i,
  /^(obrigado|valeu)$/i,
  /^(ok|entendi|certo|sim|não|nao)$/i,
];

const EXECUTION_COMMAND_PATTERNS = [
  /^\/execute-plan\b/i,
  /^\/executing-plans\b/i,
];

const EXECUTION_TEXT_PATTERNS = [
  /\b(execute[- ]?plan)\b/i,
  /\b(executing[- ]?plans)\b/i,
  /\b(execute|executar|implemente|implementar)\s+.*\b(plan|plano)\b/i,
  /\bdocs\/.*plan.*\.md\b/i,
  /\bdocs\\.*plan.*\.md\b/i,
];

const CLEAR_EXECUTION_PATTERNS = [
  /^\/(write-plan|writing-plans)\b/i,
  /^(cancelar|cancel|abort(ar)?|encerrar execução|encerrar execucao)\b/i,
];

const EXECUTION_MODE_MESSAGE = `
EXECUTION MODE OBRIGATORIO

Esta solicitacao e de execucao de plano. Trate este turno como execution mode:

1. Emita ORCHESTRATOR_DECISION antes de qualquer conteudo substantivo.
2. Leia o documento de plano como contexto autoritativo.
3. Crie imediatamente um update_plan visivel com as tarefas do plano.
4. Execute em etapas, mantendo exatamente uma tarefa in_progress por vez.
5. Se o plano estiver em uma nova sessao, use o markdown do plano como artefato principal de handoff.
6. Se houver lacunas reais no plano, pergunte em vez de inventar.
`.trim();

const CONTINUE_EXECUTION_MESSAGE = `
EXECUTION FLOW CONTINUA

Este plano ainda esta em execucao.

1. Mantenha ORCHESTRATOR_DECISION.
2. Continue o update_plan visivel com progresso real.
3. Execute em etapas, uma tarefa por vez.
4. Se aparecer bloqueio ou lacuna no plano, pergunte antes de decidir.
5. So encerre este fluxo quando a execucao do plano estiver realmente concluida.
`.trim();

function readPrompt(rawInput) {
  const raw = (rawInput || '').trim();
  if (!raw) {
    const argvInput = process.argv.slice(2).join(' ').trim();
    if (!argvInput) return '';
    if (fs.existsSync(argvInput)) {
      return fs.readFileSync(argvInput, 'utf8');
    }
    return argvInput;
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

function readExecutionState() {
  if (!fs.existsSync(STATE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writeExecutionState(prompt) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(
    STATE_PATH,
    JSON.stringify(
      {
        pending: true,
        phase: 'execution',
        prompt,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
}

function clearExecutionState() {
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
    const executionState = readExecutionState();

    if (!prompt) {
      clearExecutionState();
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (matchesAny(prompt, CLEAR_EXECUTION_PATTERNS)) {
      clearExecutionState();
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (executionState) {
      if (
        matchesAny(prompt, EXECUTION_COMMAND_PATTERNS) ||
        matchesAny(prompt, EXECUTION_TEXT_PATTERNS)
      ) {
        writeExecutionState(prompt);
        console.log(JSON.stringify({ continue: true, systemMessage: EXECUTION_MODE_MESSAGE }));
        return;
      }

      console.log(JSON.stringify({ continue: true, systemMessage: CONTINUE_EXECUTION_MESSAGE }));
      return;
    }

    if (matchesAny(prompt, TRIVIAL_PATTERNS)) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (
      matchesAny(prompt, EXECUTION_COMMAND_PATTERNS) ||
      matchesAny(prompt, EXECUTION_TEXT_PATTERNS)
    ) {
      writeExecutionState(prompt);
      console.log(JSON.stringify({ continue: true, systemMessage: EXECUTION_MODE_MESSAGE }));
      return;
    }

    console.log(JSON.stringify({ continue: true }));
  } catch {
    console.log(JSON.stringify({ continue: true }));
  }
});

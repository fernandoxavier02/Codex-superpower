#!/usr/bin/env node
/**
 * Hook: activate-execution-choice-mode
 *
 * Resolve a escolha feita pelo usuário após writing-plans:
 * 1 = subagent-driven com gate de suficiência de contexto
 * 2 = inline execution na mesma sessão
 */

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\win',
  '.codex',
  'hook-state',
  'execution-choice-gate.json',
);

const CHOICE_ONE_PATTERNS = [
  /^1$/,
  /^op[cç][aã]o\s*1$/i,
  /^subagent/i,
];

const CHOICE_TWO_PATTERNS = [
  /^2$/,
  /^op[cç][aã]o\s*2$/i,
  /^inline/i,
];

function readPrompt(rawInput) {
  const raw = (rawInput || '').trim();
  if (!raw) {
    const argvInput = process.argv.slice(2).join(' ').trim();
    if (!argvInput) return '';
    if (fs.existsSync(argvInput)) {
      return fs.readFileSync(argvInput, 'utf8');
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

function readChoiceState() {
  if (!fs.existsSync(STATE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function matchesAny(prompt, patterns) {
  const trimmed = (prompt || '').trim();
  return patterns.some((pattern) => pattern.test(trimmed));
}

function writeChoiceState(currentState, choice) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(
    STATE_PATH,
    JSON.stringify(
      {
        ...(currentState || {}),
        pending: true,
        phase: 'execution-choice',
        choice,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  try {
    const prompt = readPrompt(input);
    const choiceState = readChoiceState();

    if (!choiceState || !prompt) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (matchesAny(prompt, CHOICE_ONE_PATTERNS)) {
      const planPath = choiceState.planPath || 'docs/superpowers/plans/<plan>.md';
      writeChoiceState(choiceState, '1');
      console.log(
        JSON.stringify({
          continue: true,
          systemMessage: `
EXECUTION CHOICE 1 OBRIGATORIA

O usuario escolheu a opcao 1: Subagent-Driven.

1. Emita ORCHESTRATOR_DECISION.
2. Antes de despachar subagentes, avalie explicitamente se ainda ha contexto suficiente nesta sessao para executar o plano com seguranca.
3. Se o contexto for suficiente:
   - diga explicitamente que o contexto e suficiente
   - anuncie uso de subagent-driven-development
   - leia/referencie o plano ${planPath}
   - extraia as tasks para update_plan/tracker
   - so entao comece a despachar subagentes
4. Se o contexto NAO for suficiente ou houver duvida:
   - NAO inicie execucao nesta sessao
   - entregue um prompt completo para a proxima sessao usando ${planPath} como contexto autoritativo
   - explique que o fallback e por higiene/limite de contexto
5. Nao invente que o contexto e suficiente sem declarar a verificacao.
`.trim(),
        }),
      );
      return;
    }

    if (matchesAny(prompt, CHOICE_TWO_PATTERNS)) {
      const planPath = choiceState.planPath || 'docs/superpowers/plans/<plan>.md';
      writeChoiceState(choiceState, '2');
      console.log(
        JSON.stringify({
          continue: true,
          systemMessage: `
EXECUTION CHOICE 2 OBRIGATORIA

O usuario escolheu a opcao 2: Inline Execution na mesma sessao.

1. Emita ORCHESTRATOR_DECISION.
2. Trate este turno como execucao inline do plano ${planPath}.
3. Anuncie explicitamente que vai executar inline na mesma sessao com checkpoints.
4. Leia o plano, crie update_plan, mantenha exatamente uma task in_progress por vez.
5. Execute sequencialmente, com checkpoints claros entre tasks.
6. Se houver lacunas, pergunte antes de decidir.
`.trim(),
        }),
      );
      return;
    }

    console.log(JSON.stringify({ continue: true }));
  } catch {
    console.log(JSON.stringify({ continue: true }));
  }
});

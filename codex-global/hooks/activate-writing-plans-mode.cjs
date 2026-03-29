#!/usr/bin/env node
/**
 * Hook: activate-writing-plans-mode
 *
 * Entra no modo dedicado de escrita de plano depois que a spec foi aprovada,
 * ou quando o usuário invoca diretamente /writing-plans.
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\win',
  '.codex',
  'hook-state',
);

const WRITING_STATE_PATH = path.join(BASE_DIR, 'writing-plans-gate.json');
const PLANNING_STATE_PATH = path.join(BASE_DIR, 'planning-gate.json');

const TRIVIAL_PATTERNS = [
  /^(oi|olá|ola|hey|hi|hello)$/i,
  /^(obrigado|valeu)$/i,
  /^(ok|entendi|certo)$/i,
];

const WRITING_PLANS_COMMAND_PATTERNS = [
  /^\/writing-plans\b/i,
  /^\/superpowers:write-plan\b/i,
];

const WRITING_PLANS_TEXT_PATTERNS = [
  /\b(writing[- ]?plans)\b/i,
  /\b(escreva|crie|gere|monte)\s+(um\s+)?plano de implementa[cç][aã]o\b/i,
  /\b(criar|escrever)\s+o\s+plano\b/i,
];

const SPEC_APPROVAL_PATTERNS = [
  /^(sim|aprovado|approved|pode seguir|pode prosseguir|pode avançar|pode avancar|seguir)\b/i,
  /\b(spec aprovada|spec aprovado|design aprovado)\b/i,
  /\b(pode ir para o plano|vamos para o plano|seguir para writing-plans)\b/i,
];

const CLEAR_WRITING_PLANS_PATTERNS = [
  /^\/superpowers:execute-plan\b/i,
  /^\/(execute-plan|executing-plans)\b/i,
  /^(cancelar|cancel|abort(ar)?|encerrar plano|encerrar planning)\b/i,
];

const WRITING_PLANS_PHASES = [
  'Explorar o código atual para o plano',
  'Ler a spec aprovada',
  'Verificar requirements/regras/testes relevantes',
  'Escrever o plano de implementação',
  'Self-review do plano',
  'Oferecer escolha de execução e aguardar decisão',
];

const WRITING_PLANS_MODE_MESSAGE = `
WRITING-PLANS MODE OBRIGATORIO

Esta solicitacao entrou na fase de escrita do plano. Trate este turno como writing-plans mode:

1. Emita ORCHESTRATOR_DECISION antes de qualquer conteudo substantivo.
2. Anuncie explicitamente que esta usando a skill writing-plans.
3. Crie imediatamente um checklist visivel com update_plan para TODAS as fases do writing-plans.
4. Antes de escrever o plano, explore o codigo atual, leia a spec aprovada e verifique requirements/regras/testes relevantes.
5. Escreva o plano em docs/superpowers/plans/<data>-<topico>.md.
6. Faca self-review do plano antes de declara-lo completo.
7. Ao final, ofereca exatamente duas abordagens de execucao e pergunte qual o usuario quer.
8. Nao comece a executar o plano no mesmo turno em que apresenta as opcoes.
9. Mantenha exatamente uma fase in_progress por vez.

Checklist obrigatorio do writing-plans:
- Explorar o código atual para o plano
- Ler a spec aprovada
- Verificar requirements/regras/testes relevantes
- Escrever o plano de implementação
- Self-review do plano
- Oferecer escolha de execução e aguardar decisão
`.trim();

const CONTINUE_WRITING_PLANS_MESSAGE = `
WRITING-PLANS FLOW CONTINUA

O plano ainda esta sendo escrito neste pedido.

1. Mantenha ORCHESTRATOR_DECISION.
2. Continue o checklist visivel com update_plan e TODAS as fases do writing-plans.
3. Preserve a ordem obrigatoria:
   - Explorar o código atual para o plano
   - Ler a spec aprovada
   - Verificar requirements/regras/testes relevantes
   - Escrever o plano de implementação
   - Self-review do plano
   - Oferecer escolha de execução e aguardar decisão
4. Nao salte direto para "plano completo" sem mostrar exploracao/contexto.
5. Nao inicie a execucao antes do usuario escolher a abordagem.
`.trim();

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

function matchesAny(prompt, patterns) {
  const trimmed = (prompt || '').trim();
  return patterns.some((pattern) => pattern.test(trimmed));
}

function readState(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeWritingPlansState(prompt) {
  fs.mkdirSync(path.dirname(WRITING_STATE_PATH), { recursive: true });
  fs.writeFileSync(
    WRITING_STATE_PATH,
    JSON.stringify(
      {
        pending: true,
        phase: 'writing-plans',
        phases: WRITING_PLANS_PHASES,
        prompt,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
}

function clearState(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
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
    const writingState = readState(WRITING_STATE_PATH);
    const planningState = readState(PLANNING_STATE_PATH);

    if (!prompt) {
      clearState(WRITING_STATE_PATH);
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (matchesAny(prompt, CLEAR_WRITING_PLANS_PATTERNS)) {
      clearState(WRITING_STATE_PATH);
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (writingState) {
      if (
        matchesAny(prompt, WRITING_PLANS_COMMAND_PATTERNS) ||
        matchesAny(prompt, WRITING_PLANS_TEXT_PATTERNS)
      ) {
        writeWritingPlansState(prompt);
        console.log(JSON.stringify({ continue: true, systemMessage: WRITING_PLANS_MODE_MESSAGE }));
        return;
      }

      console.log(JSON.stringify({ continue: true, systemMessage: CONTINUE_WRITING_PLANS_MESSAGE }));
      return;
    }

    if (matchesAny(prompt, TRIVIAL_PATTERNS)) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (planningState && matchesAny(prompt, SPEC_APPROVAL_PATTERNS)) {
      clearState(PLANNING_STATE_PATH);
      writeWritingPlansState(prompt);
      console.log(JSON.stringify({ continue: true, systemMessage: WRITING_PLANS_MODE_MESSAGE }));
      return;
    }

    if (
      matchesAny(prompt, WRITING_PLANS_COMMAND_PATTERNS) ||
      matchesAny(prompt, WRITING_PLANS_TEXT_PATTERNS)
    ) {
      writeWritingPlansState(prompt);
      console.log(JSON.stringify({ continue: true, systemMessage: WRITING_PLANS_MODE_MESSAGE }));
      return;
    }

    console.log(JSON.stringify({ continue: true }));
  } catch {
    console.log(JSON.stringify({ continue: true }));
  }
});

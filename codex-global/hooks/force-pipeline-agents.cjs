#!/usr/bin/env node
/**
 * Hook: force-pipeline-agents v1.1
 *
 * Mantem requests de implementacao no pipeline e deixa requests de
 * planejamento serem tratados pelo planning hook dedicado.
 */

const fs = require('fs');
const path = require('path');

const SKILL_PATTERNS = [
  /^\/(context|commit|code-review|fix|verify|deploy|qa|test)/i,
  /^\/(write-plan|writing-plans|execute-plan|executing-plans)/i,
  /^\/superpowers:(brainstorm|write-plan|execute-plan)\b/i,
  /^\/kiro:/i,
  /^\/prompts:/i,
  /^\/vertical/i,
];

const PIPELINE_COMMAND_PATTERNS = [
  /^\/pipeline\b/i,
];

const IMPLEMENTATION_PATTERNS = [
  /\b(fix|corrig|arrum|consert|resolv)\b/i,
  /\b(implement|criar|crie|adicion|add|desenvolv)\b/i,
  /\b(alter|modific|mud|atualiz|updat)\b/i,
  /\b(remov|delet|exclu|apag)\b/i,
  /\b(refator|refactor|reescrev|rewrite)\b/i,
  /\b(configur|setup|instal)\b/i,
  /\b(migr|convert|transform)\b/i,
  /\b(bug|erro|error|fail|falha|quebr|broken|crash)\b/i,
  /\b(não funciona|nao funciona|not working|doesn't work)\b/i,
  /\b(urgente|urgent|hotfix|produção|producao|production|crítico|critico|critical)\b/i,
  /\b(feature|funcionalidade|novo|nova|new)\b/i,
  /\b(botão|botao|button|tela|screen|página|pagina|page|componente|component)\b/i,
];

const PLANNING_PATTERNS = [
  /^\/(write-plan|writing-plans|plan)\b/i,
  /^\/superpowers:(brainstorm|write-plan)\b/i,
  /\b(write[- ]?plan)\b/i,
  /\b(plano de implementa[cç][aã]o)\b/i,
  /\b(plano de execu[cç][aã]o)\b/i,
  /\b(fa[cç]a|crie|gere|monte|escreva)\s+(um\s+)?plano\b/i,
  /\b(preciso de um plano)\b/i,
  /\b(vamos planejar)\b/i,
];

const PIPELINE_WORTHY_PATTERNS = [
  /\b(analise|analisar|auditar|auditoria|revisar|verificar|investigar|diagnostic|causa raiz|root cause)\b/i,
  /\b(pipeline|agentes|orquestrador|orchestrator|classifier|executor|observabilidade|logs|tracing|correlation|runlog)\b/i,
  /\b(nao esta funcionando|não está funcionando|precario|precário|nao cumprem|não cumprem)\b/i,
  /\b(\.ts|\.tsx|\.js|\.md|\.json)\b/i,
  /\b(functions\/|firestore\.rules|storage\.rules)\b/i,
];

const TRIVIAL_PATTERNS = [
  /^(oi|olá|ola|hey|hi|hello)$/i,
  /^(obrigado|valeu)$/i,
  /^(ok|entendi|certo|sim|não|nao)$/i,
  /^(bom dia|boa tarde|boa noite|tudo bem|beleza)$/i,
];

const ENFORCEMENT_MESSAGE = `
PIPELINE DE AGENTES OBRIGATORIO

Esta solicitacao requer o pipeline de agentes. Voce DEVE:

1. Chamar o Task tool com subagent_type="task-orchestrator"
2. Aguardar o orchestrator classificar e emitir ORCHESTRATOR_DECISION
3. Criar imediatamente um checklist visivel com update_plan para TODAS as fases do pipeline
4. Executar as fases sem excecao e sem pular etapas
5. Manter exatamente uma fase in_progress por vez
6. Se pipeline indicado, continuar com os agentes canonicos
7. Se trivial indicado, executar direto somente apos o ORCHESTRATOR_DECISION

Checklist obrigatorio do pipeline:
- Triagem automática
- Proposta + confirmação do usuário
- Execução em batches
- Closure + validation final

Nao comece a implementar sem chamar o task-orchestrator primeiro.
`.trim();

const CONTINUE_PIPELINE_MESSAGE = `
PIPELINE FLOW CONTINUA

Este pedido ainda esta dentro do pipeline.

1. Mantenha ORCHESTRATOR_DECISION.
2. Continue o update_plan/checklist visivel com TODAS as fases do pipeline.
3. Preserve a ordem obrigatoria:
   - Triagem automática
   - Proposta + confirmação do usuário
   - Execução em batches
   - Closure + validation final
4. Nao pule para execucao antes da proposta + confirmação do usuário.
5. So encerre este fluxo quando a validacao final estiver concluida.
`.trim();

const SKILL_MESSAGE = `Skill detectado - executando diretamente.`.trim();

const CLEAR_PIPELINE_PATTERNS = [
  /^\/superpowers:(brainstorm|write-plan|execute-plan)\b/i,
  /^\/(write-plan|writing-plans|execute-plan|executing-plans)\b/i,
  /^(cancelar|cancel|abort(ar)?|encerrar pipeline|sair do pipeline)\b/i,
];

const STATE_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\win',
  '.codex',
  'hook-state',
  'pipeline-gate.json',
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

function readPipelineState() {
  if (!fs.existsSync(STATE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writePipelineState(prompt) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(
    STATE_PATH,
    JSON.stringify(
      {
        pending: true,
        phase: 'pipeline',
        phases: [
          'Triagem automática',
          'Proposta + confirmação do usuário',
          'Execução em batches',
          'Closure + validation final',
        ],
        prompt,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
}

function clearPipelineState() {
  if (fs.existsSync(STATE_PATH)) {
    fs.unlinkSync(STATE_PATH);
  }
}

function isImplementationRequest(prompt) {
  return matchesAny(prompt, IMPLEMENTATION_PATTERNS);
}

function isPipelineWorthy(prompt) {
  const trimmed = (prompt || '').trim();
  if (!trimmed) return false;
  if (isImplementationRequest(trimmed)) return true;
  if (trimmed.length >= 140) return true;
  return matchesAny(trimmed, PIPELINE_WORTHY_PATTERNS);
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  try {
    const prompt = readPrompt(input);
    const pipelineState = readPipelineState();

    if (!prompt) {
      clearPipelineState();
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (matchesAny(prompt, PLANNING_PATTERNS)) {
      clearPipelineState();
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (matchesAny(prompt, CLEAR_PIPELINE_PATTERNS)) {
      clearPipelineState();
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (pipelineState) {
      if (
        matchesAny(prompt, PIPELINE_COMMAND_PATTERNS) ||
        isPipelineWorthy(prompt)
      ) {
        writePipelineState(prompt);
        console.log(
          JSON.stringify({
            continue: true,
            systemMessage: ENFORCEMENT_MESSAGE,
          }),
        );
        return;
      }

      console.log(
        JSON.stringify({
          continue: true,
          systemMessage: CONTINUE_PIPELINE_MESSAGE,
        }),
      );
      return;
    }

    if (matchesAny(prompt, TRIVIAL_PATTERNS)) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    if (matchesAny(prompt, PIPELINE_COMMAND_PATTERNS)) {
      writePipelineState(prompt);
      console.log(
        JSON.stringify({
          continue: true,
          systemMessage: ENFORCEMENT_MESSAGE,
        }),
      );
      return;
    }

    if (matchesAny(prompt, SKILL_PATTERNS)) {
      console.log(
        JSON.stringify({
          continue: true,
          systemMessage: SKILL_MESSAGE,
        }),
      );
      return;
    }

    if (isPipelineWorthy(prompt)) {
      writePipelineState(prompt);
      console.log(
        JSON.stringify({
          continue: true,
          systemMessage: ENFORCEMENT_MESSAGE,
        }),
      );
      return;
    }

    console.log(
      JSON.stringify({
        continue: true,
        systemMessage:
          'Considere usar o Task tool com task-orchestrator para classificar esta solicitacao.',
      }),
    );
  } catch {
    console.log(JSON.stringify({ continue: true }));
  }
});

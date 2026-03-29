#!/usr/bin/env node
/**
 * Hook: require-orchestrator-decision
 * BLOQUEIA qualquer resposta que nÃ£o contenha ORCHESTRATOR_DECISION
 *
 * Executado ANTES de cada resposta do assistente
 */

const fs = require('fs');
const path = require('path');

// PadrÃµes de exceÃ§Ã£o (literalmente conversacional)
const GREETING_PATTERNS = /^(oi|olÃ¡|hey|hi|hello|obrigado|valeu|ok|entendi|certo|sim|nÃ£o)$/i;

// Skills que podem emitir inline (mas ainda precisam do ORCHESTRATOR_DECISION)
const SKILL_PATTERNS = /^\/(context|commit|help|kiro:)/;

/**
 * Valida se a resposta contÃ©m ORCHESTRATOR_DECISION adequado
 */
function validateOrchestratorDecision(assistantResponse) {
  const response = assistantResponse.trim();

  // ExceÃ§Ã£o 1: Mensagens muito curtas (< 50 chars) provavelmente sÃ£o confirmaÃ§Ãµes
  if (response.length < 50) {
    if (GREETING_PATTERNS.test(response)) {
      return { valid: true, reason: 'greeting_exception' };
    }
  }

  // ExceÃ§Ã£o 2: Skills commands (mas ainda deve ter ORCHESTRATOR_DECISION inline)
  const isSkillCommand = SKILL_PATTERNS.test(response);

  // ValidaÃ§Ã£o obrigatÃ³ria: Deve conter ORCHESTRATOR_DECISION
  const hasOrchestratorBlock = /ORCHESTRATOR_DECISION:/i.test(response);

  if (!hasOrchestratorBlock) {
    return {
      valid: false,
      reason: 'missing_orchestrator_decision',
      message: `
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
â›” BLOQUEADO: ORCHESTRATOR_DECISION ausente
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

Toda resposta DEVE comeÃ§ar com:

\`\`\`yaml
ORCHESTRATOR_DECISION:
  solicitacao: "..."
  tipo: "[Bug Fix | Feature | Hotfix | Auditoria | Security]"
  severidade: "[CrÃ­tica | Alta | MÃ©dia | Baixa]"
  persona: "[IMPLEMENTER | BUGFIX_LIGHT | BUGFIX_HEAVY | AUDITOR | ADVERSARIAL]"
  arquivos_provaveis: ["..."]
  tem_spec: "[Sim: .kiro/specs/X | NÃ£o]"
  fluxo: ["..."]
  riscos: "..."
\`\`\`

Ãšnica exceÃ§Ã£o: saudaÃ§Ãµes literais (oi, olÃ¡, etc)

ReferÃªncia: .claude/rules/00-core.md seÃ§Ã£o 1
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
`
    };
  }

  // ValidaÃ§Ã£o dos campos obrigatÃ³rios
  const requiredFields = ['solicitacao:', 'tipo:', 'persona:', 'severidade:', 'arquivos_provaveis:', 'tem_spec:', 'fluxo:', 'riscos:'];
  const missingFields = requiredFields.filter(field => !response.includes(field));

  if (missingFields.length > 0) {
    return {
      valid: false,
      reason: 'incomplete_orchestrator_decision',
      message: `
â›” ORCHESTRATOR_DECISION incompleto!

Campos faltando: ${missingFields.join(', ')}

Campos obrigatÃ³rios:
- solicitacao: "resumo do pedido"
- tipo: "Bug Fix | Feature | Hotfix | Auditoria | Security"
- persona: "IMPLEMENTER | BUGFIX_LIGHT | BUGFIX_HEAVY | AUDITOR | ADVERSARIAL"
- severidade: "CrÃ­tica | Alta | MÃ©dia | Baixa"
- arquivos_provaveis: ["..."]
- tem_spec: "Sim: .kiro/specs/X | NÃ£o"
- fluxo: ["passo 1", "passo 2"]
- riscos: "..."
`
    };
  }

  return { valid: true, reason: 'orchestrator_present' };
}

/**
 * Main execution
 */
function main() {
  try {
    // Ler resposta do assistente do stdin ou arquivo temporÃ¡rio
    const input = process.argv[2] || '';

    if (!input) {
      console.error('âŒ Erro: Nenhuma resposta fornecida ao hook');
      process.exit(1);
    }

    // Se for um arquivo, ler conteÃºdo
    let assistantResponse = input;
    if (fs.existsSync(input)) {
      assistantResponse = fs.readFileSync(input, 'utf-8');
    }

    // Validar
    const validation = validateOrchestratorDecision(assistantResponse);

    if (!validation.valid) {
      console.error(validation.message);
      process.exit(1); // Bloquear resposta
    }

    // Sucesso
    console.log('âœ… ORCHESTRATOR_DECISION validado');
    process.exit(0);

  } catch (error) {
    console.error('âŒ Erro no hook require-orchestrator-decision:', error.message);
    process.exit(1);
  }
}

main();

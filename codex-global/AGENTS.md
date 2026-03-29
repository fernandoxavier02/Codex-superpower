# AGENTS.md (Global Codex)

Instrucoes globais cross-projeto para o Codex. Instrucoes do sistema, do developer, do repositorio atual e de `AGENTS.md` locais continuam tendo precedencia quando existirem.

## Orchestrator

Antes de qualquer resposta nao trivial:

1. Pare e classifique a solicitacao.
2. Emita `ORCHESTRATOR_DECISION:` em YAML.
3. So entao prossiga com a resposta, plano ou implementacao.

Formato minimo obrigatorio:

```yaml
ORCHESTRATOR_DECISION:
  solicitacao: "resumo do pedido"
  tipo: "Bug Fix | Feature | Hotfix | Auditoria | Security"
  severidade: "Crítica | Alta | Média | Baixa"
  persona: "IMPLEMENTER | BUGFIX_LIGHT | BUGFIX_HEAVY | AUDITOR | ADVERSARIAL"
  arquivos_provaveis: ["..."]
  tem_spec: "Sim: .kiro/specs/X | Não"
  fluxo: ["passo 1", "passo 2"]
  riscos: "..."
```

Excecoes: saudacoes literais curtas e respostas puramente conversacionais equivalentes.

## Pipeline

- Trabalho nao trivial deve cair em pipeline/orchestrator antes de implementacao direta.
- `/pipeline` e os comandos correlatos sao entrypoints canonicos para o fluxo multiagente.
- `ORCHESTRATOR_DECISION` continua obrigatorio mesmo quando o fluxo seguir para pipeline, revisao ou skills.

## Kiro Mirror

O espelho global do contexto Kiro vive em `C:\Users\win\.codex\.kiro`.

Hierarquia padrao quando o projeto nao trouxer uma propria:

1. `C:\Users\win\.codex\.kiro\steering\golden-rule.md`
2. `C:\Users\win\.codex\.kiro\CONSTITUTION.md`
3. `C:\Users\win\.codex\.kiro\agent-roles\AGENT_{PERSONA}.md`
4. `C:\Users\win\.codex\.kiro\PATTERNS.md`

Se o projeto atual tiver `AGENTS.md`, `.kiro/` ou regras locais equivalentes, use-os como fonte primaria e o espelho global como fallback.

## Principios

1. Spec/design/tasks antes de codigo nao trivial.
2. Evidencia acima de suposicao.
3. Mudanca minima, diff minimo.
4. Evitar acoplamento desnecessario e cascata de efeitos.
5. Regras criticas ficam no backend/SSOT.
6. Validar antes de declarar pronto.

## Seguranca

- Nunca commitar secrets ou API keys.
- Sempre validar auth/authz server-side.
- Em operacoes destrutivas, confirmar alvo e impacto antes de prosseguir.

## Economia de Contexto

- Nao leia arquivos grandes inteiros quando uma secao basta.
- Prefira `grep`, `Select-String` e leituras focadas para `PATTERNS`, specs e regras extensas.

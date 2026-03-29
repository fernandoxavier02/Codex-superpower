# PadrÃ£o de Observabilidade para Agentes v1.0

> Este documento define o padrÃ£o de observabilidade que TODOS os agentes devem seguir.
> Objetivo: Visibilidade, Explicabilidade e Verbosidade durante a execuÃ§Ã£o.

---

## PrincÃ­pios

1. **Visibilidade** - O usuÃ¡rio deve ver o que estÃ¡ acontecendo em tempo real
2. **Explicabilidade** - Cada decisÃ£o deve ser justificada
3. **Verbosidade** - Detalhes suficientes para entender e debugar
4. **DocumentaÃ§Ã£o** - Cada agente salva seu trabalho em arquivo MD

---

## PadrÃ£o de Output no Terminal

### 1. Banner de InÃ­cio (OBRIGATÃ“RIO)

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  [NOME_AGENTE] - [DescriÃ§Ã£o curta]                               â•‘
â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£
â•‘  Etapa: [N/6] no pipeline                                        â•‘
â•‘  Status: INICIANDO                                               â•‘
â•‘  Input: [o que recebeu]                                          â•‘
â•‘  Objetivo: [o que vai fazer]                                     â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 2. Log de AÃ§Ãµes (durante execuÃ§Ã£o)

Para CADA aÃ§Ã£o significativa, emitir:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ [TIMESTAMP] [AGENTE] AÃ‡ÃƒO: [descriÃ§Ã£o da aÃ§Ã£o]                  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Motivo: [por que esta aÃ§Ã£o foi escolhida]                       â”‚
â”‚ Entrada: [dados de entrada]                                     â”‚
â”‚ SaÃ­da esperada: [o que espera obter]                            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 3. Log de DecisÃµes

Para CADA decisÃ£o tomada:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âš–ï¸ DECISÃƒO: [tÃ­tulo da decisÃ£o]                                 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ OpÃ§Ãµes consideradas:                                            â”‚
â”‚   â€¢ OpÃ§Ã£o A: [descriÃ§Ã£o] - [por que sim/nÃ£o]                    â”‚
â”‚   â€¢ OpÃ§Ã£o B: [descriÃ§Ã£o] - [por que sim/nÃ£o]                    â”‚
â”‚ DecisÃ£o final: [qual opÃ§Ã£o escolhida]                           â”‚
â”‚ Justificativa: [por que esta opÃ§Ã£o]                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 4. Log de Arquivos

Para CADA arquivo lido/modificado/criado:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ“ ARQUIVO: [operaÃ§Ã£o] [path]                                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ OperaÃ§Ã£o: [READ | WRITE | EDIT | CREATE | DELETE]               â”‚
â”‚ Motivo: [por que este arquivo]                                  â”‚
â”‚ Linhas afetadas: [N-M] ou [todas]                               â”‚
â”‚ MudanÃ§a resumida: [o que foi alterado]                          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 5. Log de Progresso

A cada etapa significativa:

```
â•‘ â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘ 60% â”‚ Etapa 3/5: [nome da etapa]          â•‘
```

### 6. Banner de ConclusÃ£o (OBRIGATÃ“RIO)

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  [NOME_AGENTE] - CONCLUÃDO                                       â•‘
â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£
â•‘  Status: [SUCESSO | FALHA | PAUSADO | BLOQUEADO]                â•‘
â•‘  DuraÃ§Ã£o: [tempo]                                                â•‘
â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£
â•‘  RESUMO DE AÃ‡Ã•ES:                                                â•‘
â•‘  â€¢ [N] decisÃµes tomadas                                          â•‘
â•‘  â€¢ [N] arquivos lidos                                            â•‘
â•‘  â€¢ [N] arquivos modificados                                      â•‘
â•‘  â€¢ [N] arquivos criados                                          â•‘
â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£
â•‘  ARQUIVOS MODIFICADOS:                                           â•‘
â•‘  â€¢ [path1] - [resumo da mudanÃ§a]                                 â•‘
â•‘  â€¢ [path2] - [resumo da mudanÃ§a]                                 â•‘
â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£
â•‘  DECISÃ•ES PRINCIPAIS:                                            â•‘
â•‘  â€¢ [decisÃ£o 1]: [justificativa curta]                            â•‘
â•‘  â€¢ [decisÃ£o 2]: [justificativa curta]                            â•‘
â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£
â•‘  PRÃ“XIMO: [prÃ³ximo agente ou aÃ§Ã£o]                               â•‘
â•‘  DocumentaÃ§Ã£o salva em: [path do arquivo MD]                     â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

---

## PadrÃ£o de DocumentaÃ§Ã£o em Arquivo

### Nomenclatura

```
.kiro/Pre-{nivel}-action/{subpasta}/
â”œâ”€â”€ 00-orchestrator-{timestamp}.md
â”œâ”€â”€ 01-classifier-{timestamp}.md
â”œâ”€â”€ 02-documenter-{timestamp}.md
â”œâ”€â”€ 03-executor-{timestamp}.md
â”œâ”€â”€ 04-adversarial-{timestamp}.md
â”œâ”€â”€ 05-sanity-{timestamp}.md
â””â”€â”€ 06-final-{timestamp}.md
```

### Estrutura do Arquivo MD

```markdown
# [Nome do Agente] - RelatÃ³rio de ExecuÃ§Ã£o

**Timestamp:** [ISO]
**Pipeline:** [ID ou resumo]
**NÃ­vel:** [SIMPLES | MÃ‰DIA | COMPLEXA]

---

## 1. Input Recebido

[Descrever o que foi recebido do agente anterior]

---

## 2. AnÃ¡lise Realizada

### 2.1 Contexto Coletado

| Item | Fonte | ConteÃºdo |
|------|-------|----------|
| [item] | [arquivo:linha] | [resumo] |

### 2.2 DecisÃµes Tomadas

| ID | DecisÃ£o | OpÃ§Ãµes | Escolha | Justificativa |
|----|---------|--------|---------|---------------|
| D-01 | [decisÃ£o] | A, B, C | B | [por que B] |

---

## 3. AÃ§Ãµes Executadas

### 3.1 Arquivos Lidos

| Arquivo | Linhas | Motivo |
|---------|--------|--------|
| [path] | [N-M] | [por que leu] |

### 3.2 Arquivos Modificados

| Arquivo | Tipo | Linhas | MudanÃ§a |
|---------|------|--------|---------|
| [path] | EDIT | [N-M] | [o que mudou] |

### 3.3 Arquivos Criados

| Arquivo | Motivo | ConteÃºdo |
|---------|--------|----------|
| [path] | [por que criou] | [resumo] |

---

## 4. Output Gerado

```yaml
[YAML do output do agente]
```

---

## 5. PrÃ³ximo Agente

**Agente:** [nome]
**Input entregue:** [resumo do que estÃ¡ passando]

---

## 6. MÃ©tricas

| MÃ©trica | Valor |
|---------|-------|
| Arquivos lidos | N |
| Arquivos modificados | N |
| Arquivos criados | N |
| DecisÃµes tomadas | N |
| Tempo de execuÃ§Ã£o | Xms |

---

*Gerado automaticamente por [Nome do Agente] v[versÃ£o]*
```

---

## NÃ­veis de Verbosidade

### MINIMAL (emergÃªncia)

- Apenas banners de inÃ­cio/fim
- Erros crÃ­ticos

### STANDARD (padrÃ£o)

- Banners de inÃ­cio/fim
- DecisÃµes principais
- Arquivos modificados
- Erros e warnings

### VERBOSE (debug)

- Tudo de STANDARD
- Todas as aÃ§Ãµes
- Todas as decisÃµes (incluindo menores)
- Todos os arquivos lidos
- Detalhes de cada mudanÃ§a

### ConfiguraÃ§Ã£o

```yaml
observability:
  level: "STANDARD"  # MINIMAL | STANDARD | VERBOSE

  # Por agente (override)
  per_agent:
    executor: "VERBOSE"  # Mais detalhes no executor
    sanity: "MINIMAL"    # Menos detalhes no sanity
```

---

## Exemplos PrÃ¡ticos

### Exemplo: Executor modificando arquivo

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ“ ARQUIVO: EDIT src/pages/Player.tsx                           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ OperaÃ§Ã£o: EDIT                                                  â”‚
â”‚ Motivo: Adicionar handler para botÃ£o de compartilhar            â”‚
â”‚ Linhas afetadas: 45-52                                          â”‚
â”‚ MudanÃ§a:                                                        â”‚
â”‚   ANTES:                                                        â”‚
â”‚     const handlePlay = () => { ... }                            â”‚
â”‚   DEPOIS:                                                       â”‚
â”‚     const handlePlay = () => { ... }                            â”‚
â”‚     const handleShare = async () => {                           â”‚
â”‚       await navigator.share({ title, url });                    â”‚
â”‚     };                                                          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Exemplo: DecisÃ£o do Orchestrator

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âš–ï¸ DECISÃƒO: Selecionar pipeline                                 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ OpÃ§Ãµes consideradas:                                            â”‚
â”‚   â€¢ Pipeline Light: 3 arquivos, escopo moderado - POSSÃVEL      â”‚
â”‚   â€¢ Pipeline Heavy: Requer aprovaÃ§Ã£o, mais rigoroso - EXCESSIVO â”‚
â”‚   â€¢ SPEC: Feature nova completa - NÃƒO APLICÃVEL                 â”‚
â”‚ DecisÃ£o final: Pipeline Light                                   â”‚
â”‚ Justificativa: Escopo de 3 arquivos, sem regras crÃ­ticas,       â”‚
â”‚                nÃ£o afeta auth/security, estimativa < 100 linhas â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Regras de Ouro

1. **Sempre justificar** - Cada decisÃ£o tem um "por que"
2. **Sempre documentar** - Cada agente salva MD
3. **Sempre mostrar progresso** - UsuÃ¡rio sabe onde estÃ¡
4. **Sempre listar arquivos** - TransparÃªncia total
5. **Sempre resumir no final** - VisÃ£o geral do que foi feito



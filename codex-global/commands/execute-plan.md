---
description: "Alias curto para executar um plano aprovado via executing-plans."
allowed-tools: Skill, Read
argument-hint: <caminho do plano ou descricao do plano>
---

# Execute Plan

## Objetivo

Executar um plano já aprovado usando o fluxo canônico de execução.

## Instruções

1. Use a skill `executing-plans`.
2. Siga a skill exatamente.
3. Trate `$ARGUMENTS` como o caminho do documento de plano e use esse markdown como contexto autoritativo.
4. Crie imediatamente um `update_plan` visível com as tarefas do documento.
5. Execute em etapas, uma tarefa por vez, pedindo clarificação em vez de inventar lacunas.

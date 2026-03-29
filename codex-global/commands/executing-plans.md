---
description: "Invoca a skill oficial executing-plans para executar um plano já escrito com checkpoints."
allowed-tools: Skill, Read
argument-hint: <caminho do plano ou descricao do plano>
---

# Executing Plans

## Objetivo

Usar a skill oficial `executing-plans` para executar um plano escrito com checkpoints, bloqueios e validação.

## Instruções

1. Use a skill `executing-plans`.
2. Siga a skill exatamente.
3. Use `$ARGUMENTS` como referência do plano a executar.
4. Trate o markdown do plano como contexto principal, especialmente em nova sessão.
5. Crie imediatamente um `update_plan` visível com as tarefas do plano.
6. Execute de forma sequencial e faseada.
7. Se houver bloqueio, pare e peça esclarecimento em vez de inventar.

---
description: "Invoca o bootstrap canônico do Superpowers espelhado do Claude global antes de agir."
allowed-tools: Skill, Read
argument-hint: [contexto opcional]
---

# Superpowers

## Objetivo

Ativar o bootstrap canônico do Superpowers no Codex e deixar o agente escolher e seguir a skill correta antes de responder ou agir.

## Instruções

1. Use a skill `using-superpowers`.
2. Siga a skill exatamente.
3. Considere `C:\Users\win\plugins\superpowers-codex-global` como a origem canônica do sistema.
4. Se `$ARGUMENTS` vier preenchido, trate isso como a tarefa inicial a ser encaminhada pelo Superpowers.
5. Não pule para implementação ou resposta final antes da skill decidir o fluxo correto.

## Entrada

- Argumento opcional: contexto, tarefa ou pedido inicial.

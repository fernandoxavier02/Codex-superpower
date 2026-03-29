---
description: "Entrypoint global do pipeline oficial. Invoca a skill pipeline com triagem, gates, revisao adversarial por batch e validacao final."
allowed-tools: Skill, Read, Bash, Task
argument-hint: [diagnostic|continue|review-only|--simples|--media|--complexa|--hotfix|--grill|--plan] <tarefa>
---

# Pipeline

Use a skill oficial `pipeline` como nucleo canonico para trabalho nao trivial.

Este slash command existe para invocar diretamente a skill global `pipeline`,
que espelha o plugin oficial do Claude com triagem, confirmations, gates,
execucao em batches, revisao adversarial e validacao final.

## Instruções

1. Use a skill `pipeline`.
2. Siga a skill exatamente.
3. Use `$ARGUMENTS` como a entrada inicial do pipeline.
4. Crie imediatamente um checklist visível com `update_plan` contendo obrigatoriamente, nesta ordem:
   - `Triagem automática`
   - `Proposta + confirmação do usuário`
   - `Execução em batches`
   - `Closure + validation final`
5. Mantenha exatamente uma fase `in_progress` por vez.
6. Não pule `Proposta + confirmação do usuário` antes de entrar em `Execução em batches`.
7. Preserve os modos oficiais:
   - `FULL`
   - `DIAGNOSTIC`
   - `CONTINUE`
   - `REVIEW-ONLY`
   - `HOTFIX`
8. Preserve os gates oficiais:
   - information-gate
   - confirmacao do usuario
   - quality gate
   - micro-gate
   - adversarial gate
   - final validation

## Regra Principal

Se o trabalho for nao trivial, o comando deve cair na skill `pipeline`.
Se for trivial, a skill decide a execucao direta proporcional.

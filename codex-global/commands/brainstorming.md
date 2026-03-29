---
description: "Invoca a skill oficial brainstorming para refinar uma ideia antes de implementar."
allowed-tools: Skill, Read
argument-hint: <ideia ou tarefa>
---

# Brainstorming

## Objetivo

Usar a skill oficial `brainstorming` para transformar uma ideia em design validado antes de qualquer implementação.

## Instruções

1. Use a skill `brainstorming`.
2. Siga a skill exatamente.
3. Crie imediatamente um checklist visível com `update_plan`, contendo obrigatoriamente estas fases nesta ordem:
   - `Explorar contexto do projeto`
   - `Perguntas clarificadoras (1 por vez)`
   - `Propor 2-3 abordagens com trade-offs`
   - `Apresentar design por seções (aprovação incremental)`
   - `Escrever design doc e spec self-review`
   - `Revisão do usuário e transição para writing-plans`
4. Trate perguntas clarificadoras como gate de não-invenção: se faltar requisito material, pergunte antes de decidir.
5. Faça perguntas uma por vez.
6. Mantenha exatamente uma fase `in_progress` por vez e não pule etapas.
7. Apresente abordagens, design e gate de aprovação antes de continuar.
8. Use `$ARGUMENTS` como o tema inicial.

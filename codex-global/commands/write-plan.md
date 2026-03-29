---
description: "Ativa o planning flow canônico. Roteia para writing-plans com enforcement de plan mode."
allowed-tools: Skill, Read
argument-hint: <spec, design ou contexto para planejar>
---

# Write Plan

## Objetivo

Entrar no fluxo canônico de planejamento antes de qualquer implementação.

## Instruções

1. Trate este turno como planejamento apenas.
2. Se ainda não existir spec/design aprovado, use primeiro a skill `brainstorming`.
3. Durante `brainstorming`, crie imediatamente um checklist visível com `update_plan`, contendo obrigatoriamente:
   - `Explorar contexto do projeto`
   - `Perguntas clarificadoras (1 por vez)`
   - `Propor 2-3 abordagens com trade-offs`
   - `Apresentar design por seções (aprovação incremental)`
   - `Escrever design doc e spec self-review`
   - `Revisão do usuário e transição para writing-plans`
4. Durante `brainstorming`, trate perguntas clarificadoras como gate de não-invenção.
5. Durante `brainstorming`, mantenha exatamente uma fase `in_progress` por vez e não pule etapas.
6. Quando a spec for escrita, faça o self-review inline, salve em `docs/superpowers/specs/...` e peça explicitamente que o usuário revise o arquivo antes de continuar.
7. Mantenha `Revisão do usuário e transição para writing-plans` como a única fase `in_progress` até o usuário aprovar a spec escrita.
8. Só depois de design/spec aprovados, use a skill `writing-plans`.
9. Se já houver spec/design aprovado em `$ARGUMENTS`, pode usar `writing-plans` direto.
10. Ao final do plano, ofereça duas abordagens de execução: mesma sessão ou nova sessão com prompt baseado no documento gerado.
11. Não implemente código neste turno.

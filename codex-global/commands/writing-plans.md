---
description: "Invoca a skill oficial writing-plans para escrever um plano detalhado de implementação."
allowed-tools: Skill, Read
argument-hint: <spec, design ou tarefa aprovada>
---

# Writing Plans

## Objetivo

Usar a skill oficial `writing-plans` para gerar um plano de implementação detalhado e executável.

## Instruções

1. Use a skill `writing-plans`.
2. Siga a skill exatamente.
3. Use `$ARGUMENTS` como a entrada inicial.
4. Anuncie explicitamente que está usando a skill `writing-plans`.
5. Crie imediatamente um checklist visível com `update_plan` contendo obrigatoriamente, nesta ordem:
   - `Explorar o código atual para o plano`
   - `Ler a spec aprovada`
   - `Verificar requirements/regras/testes relevantes`
   - `Escrever o plano de implementação`
   - `Self-review do plano`
   - `Oferecer escolha de execução e aguardar decisão`
6. Antes de escrever o plano, explore o código atual, leia a spec aprovada e verifique requirements/regras/testes relevantes.
7. O plano deve sair com tarefas pequenas, caminhos de arquivo exatos, verificação e handoff claro para execução.
8. Salve o plano em `docs/superpowers/plans/...`.
9. Ao final, ofereça explicitamente duas abordagens:
   - opção 1: `subagent-driven-development`
   - opção 2: `inline execution` na mesma sessão com checkpoints
10. Se o usuário escolher a opção 1, primeiro avalie explicitamente se ainda há contexto suficiente nesta sessão.
11. Se houver contexto suficiente, prossiga com `subagent-driven-development`; se não houver, entregue um prompt completo para a próxima sessão usando o documento do plano como contexto autoritativo.
12. Se o usuário escolher a opção 2, execute inline na mesma sessão com checkpoints e `update_plan`.
13. Pergunte explicitamente qual abordagem o usuário quer.
14. Não inicie a execução do plano no mesmo turno em que apresenta as opções.

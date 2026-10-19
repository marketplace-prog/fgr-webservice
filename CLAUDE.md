# CLAUDE.md

> Diretrizes para o Claude Code ao trabalhar no repositório **fgr-webservice**.

A fonte única de verdade sobre arquitetura, convenções, stack e regras do projeto está no arquivo:
👉 **[AGENTS.md](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/AGENTS.md)**

---

## ⚡ Comandos e Regras Rápidas

- **Gerenciador de Pacotes:** Use EXCLUSIVAMENTE o `bun`. Nunca utilize `npm`, `yarn` ou `pnpm`.
  - Instalar: `bun install`
  - Dev server: `bun run dev`
  - Build: `bun run build`
  - Checagem de tipos: `bun run typecheck`
  - Lint e formatação: `bun run lint:fix` e `bun run format`
- **Sintaxe Vue:** Sempre utilize `<script setup lang="ts">` com ordem de blocos: `<script>`, `<template>`, `<style>`.
- **Estilização:** Use os tokens semânticos do Tailwind CSS v4 definidos em `app/assets/css/tailwind.css`. Nunca use cores hexadecimais arbitrárias.
- **Tabelas:** Ao trabalhar com `@tanstack/vue-table`, registre as features necessárias em `app/components/monitored-inventory/features.ts` para respeitar o tree-shaking da v9.
- **Webhooks & Integrações:** Consulte [docs/INTEGRATIONS-AND-CRONS.md](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/docs/INTEGRATIONS-AND-CRONS.md) e [docs/PITFALLS.md](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/docs/PITFALLS.md) antes de alterar rotas de webhook ou cron jobs.
- **Checklist final:** Antes de reportar a conclusão de uma tarefa, execute obrigatoriamente `bun run typecheck` e `bun run lint`.

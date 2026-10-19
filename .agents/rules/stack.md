# Regra: Stack Tecnológica e Comandos

> Fonte detalhada: [AGENTS.md](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/AGENTS.md#2-stack-tecnol%C3%B3gica-e-vers%C3%B5es-exatas)

- **Runtime & Package Manager:** Use **EXCLUSIVAMENTE** `bun`. NUNCA use `npm`, `yarn` ou `pnpm` (evita corromper `bun.lock`).
- **Framework:** Nuxt 4 (`^4.5.2`) com Vue 3.5 (`^3.5.42`).
- **Sintaxe Vue:** Todo componente `.vue` DEVE usar `<script setup lang="ts">`.
- **Ordem de Blocos:** 1º `<script>`, 2º `<template>`, 3º `<style>` (reforçado pelo ESLint `vue/block-order`).
- **Imports:** Tipos sempre com `import type { ... }`. Nuxt auto-importa composables do Vue, Nuxt e Nitro; não importe manualmente o que for global.
- **Formatação e Lint:** Sem ponto e vírgula (`semi: false`), aspas simples (`singleQuote: true`), vírgula final (`trailingComma: 'all'`).
- **Comandos de validação pré-entrega:**
  - `bun run typecheck`
  - `bun run lint:fix`
  - `bun run format`

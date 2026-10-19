# Regra: UI Components, Design System e Tabelas

> Fonte detalhada: [AGENTS.md](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/AGENTS.md#6-conven%C3%A7%C3%B5es-de-ui-e-design-system)

- **shadcn-nuxt:** Primitivas residem em `app/components/ui/` com prefixo vazio (`prefix: ""` em `nuxt.config.ts`).
- **Tailwind CSS v4:** Utilize sempre tokens semânticos (`bg-background`, `text-foreground`, `bg-card`, `bg-primary`, `border-border`, etc.) definidos em `app/assets/css/tailwind.css`.
- **Proibição de Cores Arbitrárias:** NUNCA faça hardcode de cores hexadecimais (`#fff`, `#111`) nas classes se existir token semântico correspondente.
- **Utilitário `cn()`:** Use sempre `cn()` de `~/lib/utils` para interpolação condicional de classes Tailwind.
- **Modais Responsivos:** Use sempre `ResponsiveModal.vue` para diálogos (adapta-se para `Dialog` no desktop e `Drawer` no mobile).
- **Tabelas (@tanstack/vue-table v9):** Todas as features usadas pela tabela DEVEM ser registradas em `app/components/monitored-inventory/features.ts` para preservar o tree-shaking da versão 9.
- **Formulários:** Schemas Zod residem em `shared/schemas/*.schema.ts`, acoplados ao VeeValidate com `toTypedSchema()`.

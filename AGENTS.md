# AGENTS.md — Guia do Desenvolvedor e Fonte Única de Verdade

> **Última revisão:** 19 de outubro de 2026  
> **Aviso obrigatório:** Se você alterar a stack, a estrutura de diretórios, schemas ou fluxos de integração/cron, atualize este arquivo e os documentos em `docs/` no mesmo commit.

---

## 1. Visão Geral e Propósito

O **`fgr-webservice`** (FGR Sports) é um monorail fullstack construído em **Nuxt 4** que desempenha duas funções vitais:

1. **Hub de Integração de E-commerce (Magazord ➔ Discord):** Recebe webhooks da plataforma Magazord (novos pedidos e atualizações de situação), processa regras de negócio gerando insights estratégicos (viabilidade de frete, risco de inadimplência, cupom, cross-sell) e despacha alertas ricos via Discord Embeds.
2. **Painel Administrativo & Gestão de Estoque:** Aplicação interna autenticada via Supabase para monitorar níveis mínimos de estoque de SKUs e alertar a equipe quando houver necessidade de reposição.

---

## 2. Stack Tecnológica e Versões Exatas

Valores extraídos diretamente de [package.json](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/package.json):

| Tecnologia                    | Versão Declarada                 | Finalidade                                   |
| :---------------------------- | :------------------------------- | :------------------------------------------- |
| **Nuxt**                      | `^4.5.2`                         | Framework Fullstack (App + Motor Nitro)      |
| **Vue**                       | `^3.5.42`                        | Camada de UI reativa                         |
| **TypeScript**                | `5.9.3`                          | Tipagem estrita                              |
| **Bun**                       | Runtime & Package Manager        | `bun.lock` presente                          |
| **Tailwind CSS**              | `^4.3.3` com `@tailwindcss/vite` | Estilização utility-first moderna            |
| **tw-animate-css**            | `^1.4.0`                         | Utilitários de animação                      |
| **shadcn-nuxt**               | `2.8.2`                          | Wrapper de componentes para Nuxt             |
| **reka-ui**                   | `^2.11.0`                        | Primitivas headless acessíveis (Radix Vue)   |
| **@lucide/vue**               | `^1.57.0`                        | Ícones SVG                                   |
| **@tanstack/vue-table**       | `^9.2.4`                         | Tabelas headless v9 com tree-shaking         |
| **vee-validate**              | `^4.15.1`                        | Gerenciamento de formulários                 |
| **zod**                       | `^4.6.5`                         | Schemas de validação e inferência de tipos   |
| **@vee-validate/zod**         | `^4.15.1`                        | Adaptador typed schema                       |
| **vue-sonner**                | `^2.0.9`                         | Notificações toast                           |
| **@nuxtjs/supabase**          | `2.0.10`                         | Módulo oficial Supabase para Nuxt            |
| **@supabase/supabase-js**     | `^2.117.2`                       | SDK client do Supabase                       |
| **@vueuse/core**              | `^15.0.0`                        | Composables essenciais                       |
| **clsx** / **tailwind-merge** | `^2.1.1` / `^3.7.0`              | Mesclagem condicional de classes             |
| **cn**                        | `^0.4.0`                         | CLI / utilitário de classes                  |
| **@nuxt/eslint** / **eslint** | `^1.17.0` / `^10.11.0`           | Linter                                       |
| **prettier**                  | `^3.9.9`                         | Formatador com `prettier-plugin-tailwindcss` |
| **vue-tsc**                   | `^3.3.12`                        | Checagem de tipos Vue/Nuxt                   |

---

## 3. Comandos Essenciais

> [!CAUTION]
> **Use EXCLUSIVAMENTE o `bun`.** NUNCA execute `npm`, `yarn` ou `pnpm` neste repositório. O uso de outros gerenciadores corrompe o `bun.lock` e gera incompatibilidades de resolução de módulos.

| Comando                | Descrição                                            |
| :--------------------- | :--------------------------------------------------- |
| `bun install`          | Instala dependências respeitando o `bun.lock`        |
| `bun run dev`          | Inicia o servidor de desenvolvimento local           |
| `bun run build`        | Compila a aplicação para produção com o Nitro        |
| `bun run preview`      | Pré-visualiza localmente o build de produção         |
| `bun run postinstall`  | Executa `nuxt prepare` para gerar tipos do Nuxt      |
| `bun run lint`         | Executa a verificação do ESLint                      |
| `bun run lint:fix`     | Corrige problemas automáticos de lint                |
| `bun run format`       | Formata o código com o Prettier                      |
| `bun run format:check` | Valida se todos os arquivos estão formatados         |
| `bun run typecheck`    | Executa a verificação estrita de tipos via `vue-tsc` |

---

## 4. Estrutura de Diretórios

```
fgr-webservice/
├── .agents/                        # Configurações de IA, skills e regras
│   ├── rules/                      # Regras temáticas para assistentes (Antigravity/Cursor)
│   └── skills/                     # Skills locais (Supabase, Postgres, etc.)
├── app/                            # Camada Frontend (Nuxt 4 app directory)
│   ├── app.vue                     # Componente raiz (<NuxtLayout>, <NuxtPage>, <Toaster>)
│   ├── assets/css/tailwind.css     # Estilos globais, tokens @theme e CSS variables (oklch)
│   ├── components/                 # Componentes de negócio e navegação
│   │   ├── AppSidebar.vue          # Sidebar principal da aplicação
│   │   ├── NavMain.vue             # Itens de menu expansíveis
│   │   ├── NavUser.vue             # Perfil do usuário e ação de logout
│   │   ├── ResponsiveModal.vue     # Modal híbrido (Dialog no desktop, Drawer no mobile)
│   │   ├── monitored-inventory/    # Componentes da tela de estoque (tabela, forms)
│   │   └── ui/                     # Primitivas shadcn-nuxt / Reka UI
│   ├── layouts/                    # Layouts Nuxt (default.vue com sidebar, NoSidebar.vue)
│   ├── lib/utils.ts                # Utilitário central cn()
│   ├── pages/                      # Roteamento baseado em arquivos
│   │   ├── index.vue               # Dashboard inicial (FGR Sports)
│   │   ├── login.vue               # Tela de autenticação Supabase
│   │   └── inventory/              # Gestão de inventário
│   │       └── monitored-inventory.vue
│   ├── plugins/                    # Plugins Vue/Nuxt (ex: ssr-width.ts para @vueuse)
│   └── server/                     # [Atenção] Ver nota sobre app/server vs server/
│       └── api/cron/check-stock.ts
├── docs/                           # Documentação técnica e de arquitetura
│   ├── ARCHITECTURE.md             # Arquitetura, fluxo de dados e Mermaid
│   ├── INTEGRATIONS-AND-CRONS.md   # Especificação de webhooks, crons e scripts
│   └── PITFALLS.md                 # Armadilhas conhecidas e problemas mapeados
│   └── UI-PATTERNS.md               # Padrões de interação e componentes da interface
├── public/                         # Arquivos públicos e scripts estáticos injetáveis
│   └── track-shipping-request.js   # Script para captura de frete e disparo GA4
├── server/                         # Backend do Nitro (APIs e Webhooks)
│   ├── api/
│   │   ├── cron/
│   │   │   └── check-stock.get.ts  # Rota oficial Vercel Cron de verificação de estoque
│   │   ├── health.get.ts           # Health check endpoint
│   │   ├── inventory/
│   │   │   ├── check-single.post.ts# Verificação sob demanda de estoque de um SKU
│   │   │   └── product-by-sku.get.ts# Consulta do nome de produto na API Magazord
│   │   └── webhook/
│   │       ├── pedido-registrado.post.ts  # Webhook novo pedido Magazord
│   │       └── pedido-alterado.post.ts    # Webhook atualização pedido Magazord
│   └── utils/
│       ├── magazord-api.ts         # URL HTTPS e autenticação Basic compartilhadas da Magazord
│       └── stock-service.ts        # Serviço de consulta de estoque e alertas Discord
├── shared/                         # Código compartilhado (auto-importado no app e server)
│   ├── schemas/                    # Schemas Zod de validação (inventory, login)
│   ├── types/                      # Tipagens TypeScript (magazord.ts, database.types.ts)
│   └── utils/                      # Funções utilitárias puras (magazord.ts)
├── supabase/                       # Migrações e esquemas do Supabase
│   └── migrations/
│       └── 20261019_create_stock_monitors.sql # Tabela stock_monitors com RLS
├── .editorconfig                   # Configurações de charset, tabs e line-ending (LF)
├── .env.example                    # Exemplo de variáveis de ambiente necessárias
├── .prettierrc                     # Regras Prettier (sem ponto e vírgula, aspas simples)
├── components.json                 # Configuração do gerador shadcn-vue
├── eslint.config.mjs               # Configuração flat do ESLint com @nuxt/eslint
├── nuxt.config.ts                  # Configuração global do Nuxt 4
├── package.json                    # Dependências e scripts do projeto
├── tsconfig.json                   # Configuração base de TypeScript
└── vercel.json                     # Cron de estoque diário às 07:00 BRT (10:00 UTC)
```

> [!NOTE]
> **Atenção à pasta `app/server`:** O arquivo `app/server/api/cron/check-stock.ts` foi criado dentro de `app/server/`, mas a convenção do Nitro no Nuxt 4 e a rota declarada no `vercel.json` (`/api/cron/check-stock`) esperam rotas de servidor em `server/api/`. Consulte [docs/PITFALLS.md](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/docs/PITFALLS.md) para detalhes.

---

## 5. Convenções de Código

### TypeScript Estrito

- Todo código deve ser tipado. Evite `any`.
- Imports de tipos DEVEM usar a sintaxe explícita `import type { ... }` para respeitar a regra `@typescript-eslint/consistent-type-imports`.
- Variáveis não utilizadas devem ser prefixadas com `_` (regra `argsIgnorePattern: '^_'`).

### Componentes Vue (`.vue`)

- **Sintaxe obrigatória:** SEMPRE utilize `<script setup lang="ts">`.
- **Ordem de blocos no arquivo** (reforçada por `vue/block-order`):
  1. `<script setup lang="ts">`
  2. `<template>`
  3. `<style>` (apenas se estritamente necessário; prefira Tailwind)
- **Nomenclatura de arquivos:**
  - Componentes comuns: `PascalCase.vue` (ex: `ResponsiveModal.vue`, `MonitoredProductForm.vue`).
  - Primitivas shadcn em `app/components/ui/`: Podem ter nomes de uma palavra (`Button.vue`, `Input.vue`), exceção liberada no ESLint.
  - Páginas e rotas: `kebab-case.vue` (ex: `monitored-inventory.vue`).
  - Handlers de API Nitro: `kebab-case.<metodo>.ts` (ex: `pedido-registrado.post.ts`, `health.get.ts`).

### Documentação e commits de features

- Toda feature deve atualizar a documentação correspondente em `docs/` no mesmo conjunto de mudanças.
- Entregue cada feature em um commit próprio, com mensagem no padrão Conventional Commits e escopo claro (ex: `feat(inventory): allow choosing visible columns`).
- Antes do commit, valide o comportamento e execute as verificações de tipo e lint do projeto.

### Auto-Imports do Nuxt

- Nuxt auto-importa composables do Vue (`ref`, `computed`, `watch`, `onMounted`), do Nuxt (`useRuntimeConfig`, `navigateTo`, `definePageMeta`), do Nitro (`defineEventHandler`, `readBody`, `createError`, `$fetch`), do Supabase (`useSupabaseClient`, `useSupabaseUser`) e utilitários em `shared/utils/`.
- **NÃO** importe manualmente o que o Nuxt já provê globalmente.

### Erros HTTP no Nitro

- Ao usar `createError()`, coloque mensagens descritivas em `message`, não em `statusMessage`. O H3 pode sanitizar `statusMessage`; reserve-o para rótulos curtos e seguros quando necessário.

### ESLint e Prettier

Regras ativas no repositório ([eslint.config.mjs](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/eslint.config.mjs) e [.prettierrc](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/.prettierrc)):

- Sem ponto e vírgula: `semi: false`.
- Aspas simples: `singleQuote: true`.
- Vírgula final em estruturas multilinha: `trailingComma: 'all'`.
- Largura máxima de linha: `printWidth: 100`.
- Indentação: 2 espaços (`tabWidth: 2`).
- Fim de linha: `lf` (`endOfLine: 'lf'`).
- `no-console`: Apenas `console.warn` e `console.error` são permitidos. Remova ou substitua `console.log` antes de submeter alterações.

---

## 6. Convenções de UI e Design System

### shadcn-nuxt e Reka UI

- Primitivas residem em `app/components/ui/` e são configuradas em [components.json](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/components.json).
- O prefixo de componente é vazio (`prefix: ""` em `nuxt.config.ts`), portanto componentes são importados diretamente como `Button`, `Dialog`, `Input`, etc.
- Ao criar novos componentes compostos, utilize os componentes shadcn existentes em vez de recriar elementos nativos HTML.

### Tailwind CSS v4 e Design Tokens

- Estilos e tokens semânticos definidos em [app/assets/css/tailwind.css](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/app/assets/css/tailwind.css) usando valores modernos `oklch()`.
- **PROIBIDO** hardcode de cores hexadecimais (`#fff`, `#000`) nas classes de template quando existir token semântico.
- Tokens semânticos disponíveis:
  - Cores de fundo e texto: `bg-background`, `text-foreground`
  - Superfícies: `bg-card`, `text-card-foreground`, `bg-popover`, `text-popover-foreground`
  - Ações primárias e secundárias: `bg-primary`, `text-primary-foreground`, `bg-secondary`, `text-secondary-foreground`
  - Estados atenuados: `bg-muted`, `text-muted-foreground`
  - Destaques e alertas: `bg-accent`, `text-accent-foreground`, `bg-destructive`
  - Bordas e inputs: `border-border`, `bg-input`, `ring-ring`
  - Sidebar: `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-primary`, `bg-sidebar-accent`
- **Mesclagem de classes:** Utilize SEMPRE a função `cn()` exportada de `~/lib/utils`:
  ```ts
  import { cn } from '~/lib/utils'
  // Exemplo: cn('base-class', isActive && 'active-class', props.class)
  ```

### Padrão de Modais Responsivos

- Para diálogos modais na aplicação, utilize [`ResponsiveModal.vue`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/app/components/ResponsiveModal.vue). Ele renderiza `Dialog` em telas desktop ($\ge 640\text{px}$) e `Drawer` em mobile, garantindo usabilidade ergonômica sem duplicação de lógica.

---

## 7. Padrão de Tabelas (@tanstack/vue-table v9)

A versão 9 do TanStack Table introduziu o registro granular de funcionalidades (_tree-shaking_). Para evitar bundle inflado e garantir consistência:

1. **Features Centralizadas:** Todas as features que a tabela necessita devem ser declaradas em [`features.ts`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/app/components/monitored-inventory/features.ts) via `tableFeatures({ ... })`.
2. **Definição de Colunas:** Utilize `createColumnHelper<DataTableFeatures, TData>()` passando o tipo `DataTableFeatures`.
3. **Instanciação da Tabela:**
   ```ts
   import { useTable } from '@tanstack/vue-table'
   import { features } from './features'

   const table = useTable({
     features,
     get data() {
       return props.data
     },
     get columns() {
       return props.columns
     },
   })
   ```
4. **NUNCA** instancie o `useTable` com features implícitas ou fora do objeto `features` para não quebrar a compilação ou o suporte de tipos.
5. **Visibilidade das colunas:** permita escolher as colunas visíveis usando `columnVisibilityFeature` e o menu documentado em [`docs/UI-PATTERNS.md`](./docs/UI-PATTERNS.md). Colunas essenciais ou de ações podem desabilitar ocultação explicitamente.
6. **Cópia de identificadores:** quando SKU ou outro identificador exibido na tabela puder ser copiado, torne o valor um botão acessível e confirme sucesso ou falha com toast, conforme [`docs/UI-PATTERNS.md`](./docs/UI-PATTERNS.md).
7. **Ações de linha:** agrupe as ações de cada linha em um `DropdownMenu` com gatilho acessível, itens dentro de `DropdownMenuGroup` e variantes adequadas para ações destrutivas, conforme [`docs/UI-PATTERNS.md`](./docs/UI-PATTERNS.md).

---

## 8. Padrão de Formulários (VeeValidate + Zod)

1. **Schemas Centralizados:** Schemas Zod devem residir em `shared/schemas/*.schema.ts` para permitir reutilização e validação idêntica tanto no frontend quanto no backend Nitro.
2. **Integração com VeeValidate:**
   - Converta o schema Zod com `toTypedSchema(schema)` de `@vee-validate/zod`.
   - Inicialize o formulário via `useForm({ validationSchema, initialValues })`.
3. **Template de Campo:** Utilize o padrão shadcn com `VeeField`:
   ```vue
   <VeeField v-slot="{ componentField, errors }" name="campo">
     <Field :data-invalid="!!errors.length">
       <FieldLabel for="campo">Rótulo</FieldLabel>
       <Input id="campo" v-bind="componentField" :aria-invalid="!!errors.length" />
       <FieldError v-if="errors.length" :errors="errors" />
     </Field>
   </VeeField>
   ```

---

## 9. Supabase (Auth, Client & Segurança)

1. **Client Frontend:**
   - Obtenha o cliente com `useSupabaseClient()`.
   - Obtenha o usuário autenticado reativo com `useSupabaseUser()`.
2. **Server / Nitro Handlers:**
   - Para contexto autenticado do usuário da requisição: `serverSupabaseClient(event)` e `serverSupabaseUser(event)`.
   - Para tarefas de background / cron / webhooks sem sessão de usuário: utilize `serverSupabaseServiceRole(event)` com cautela extrema.
3. **Segurança e RLS (Row Level Security):**
   - **NUNCA** exponha chaves `service_role` no cliente frontend ou em variáveis `public` do `runtimeConfig`.
   - Toda e qualquer tabela criada no PostgreSQL DEVE ter RLS ativado (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) com policies explícitas para leitura e escrita baseadas em `auth.uid()`.
   - Tipos de banco gerados devem ser exportados em `shared/types/database.types.ts` (já incluso no ignore do ESLint).

---

## 10. Variáveis de Ambiente

As variáveis necessárias estão registradas no [.env.example](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/.env.example) e configuradas no [nuxt.config.ts](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/nuxt.config.ts):

| Variável                        | Escopo         | Descrição                                                                   |
| :------------------------------ | :------------- | :-------------------------------------------------------------------------- |
| `PORT`                          | Local          | Porta do servidor de desenvolvimento (ex: 3000)                             |
| `SUPABASE_URL`                  | Público        | URL do projeto Supabase                                                     |
| `SUPABASE_KEY`                  | Público        | Anon/Public API Key do Supabase                                             |
| `SUPABASE_SERVICE_KEY`          | Privado/Server | Chave Service Role para bypass de RLS em rotas internas                     |
| `DISCORD_WEBHOOK_NOVOS_PEDIDOS` | Privado/Server | Webhook do Discord para avisos de novas vendas                              |
| `DISCORD_WEBHOOK_ATUALIZACOES`  | Privado/Server | Webhook do Discord para avisos de alteração de situação                     |
| `DISCORD_WEBHOOK_ESTOQUE_BAIXO` | Privado/Server | Webhook do Discord para canal de alertas de estoque baixo                   |
| `MAGAZORD_API_URL`              | Privado/Server | URL base HTTPS da API Magazord (ex: `https://loja.com.br/api`)              |
| `MAGAZORD_API_TOKEN`            | Privado/Server | Token da API Magazord usado no HTTP Basic Auth                              |
| `MAGAZORD_API_PASSWORD`         | Privado/Server | Senha da API Magazord usada no HTTP Basic Auth                              |
| `CRON_SECRET`                   | Privado/Server | _TODO: confirmar com o time_ — Token para proteger a rota do cron da Vercel |

---

## 11. Regras de Ouro (Do & Don't)

### DO (Faça)

- ✅ Execute sempre `bun run typecheck` e `bun run lint` antes de concluir uma tarefa.
- ✅ Utilize `shared/` para qualquer tipo, schema ou utilitário consumido tanto pelo Nuxt quanto pelo Nitro.
- ✅ Trate payloads de webhook prevendo tanto formato direto `{ ... }` quanto envelopado `{ payload: { ... } }`.
- ✅ Trate datas da Magazord com `parseMagazordDate()` para corrigir offsets de timezone incompletos (ex: `-03` para `-03:00`).
- ✅ Autentique todas as chamadas REST à Magazord com `Authorization: Basic ${base64(token + ':' + senha)}` e use exclusivamente HTTPS. Mantenha token e senha em variáveis privadas do servidor; nunca registre o header ou as credenciais em logs.
- ✅ Trunque campos de embeds do Discord usando `truncate()` para nunca estourar o limite de 1024 caracteres da API.

### DON'T (Não Faça)

- ❌ NUNCA instale pacotes ou rode scripts com `npm`, `yarn` ou `pnpm`.
- ❌ NUNCA faça commit de segredos, webhooks reais ou chaves privadas.
- ❌ NUNCA utilize cores arbitrárias em hex no Tailwind quando houver token semântico no design system.
- ❌ NUNCA remova ou altere o `features.ts` do `@tanstack/vue-table` sem checar o impacto de tree-shaking.
- ❌ NUNCA desative RLS em tabelas do Supabase.
- ❌ NUNCA deixe chamadas de `console.log` passarem para produção (utilize `console.warn` ou `console.error` quando apropriado).

---

## 12. Checklist Obrigatório Antes de Finalizar Qualquer Tarefa

- [ ] Código escrito com `<script setup lang="ts">` e tipagem estrita (sem `any` implícito).
- [ ] Nenhum `console.log` deixado no código.
- [ ] `bun run typecheck` executado sem erros.
- [ ] `bun run lint` e `bun run format:check` executados com sucesso.
- [ ] Nenhuma chave ou URL confidencial exposta em arquivos commitáveis.
- [ ] Se novas rotas de webhook, cron ou schemas foram adicionados, os documentos em `docs/` e este `AGENTS.md` foram atualizados.

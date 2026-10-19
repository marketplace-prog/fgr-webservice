# Padrões de interface

Este documento registra interações reutilizáveis da interface administrativa. Ao introduzir
comportamentos equivalentes em outra tela, reutilize as primitivas existentes e mantenha o padrão.

## Tabelas TanStack

Use `@tanstack/vue-table` e os componentes de tabela existentes. Registre explicitamente em
`features.ts` cada feature utilizada para preservar o tree-shaking.

### Escolha de colunas visíveis

- Disponibilize um menu "Colunas" junto à tabela usando `DropdownMenuCheckboxItem`.
- Liste apenas colunas com `getCanHide()` e vincule o estado a `getIsVisible()` e
  `toggleVisibility()`.
- Marque colunas essenciais ou de ações com `enableHiding: false`.
- Use `getVisibleLeafColumns().length` para o `colspan` de estados vazios.
- Mantenha a ordenação nos cabeçalhos interativos e indique a direção atual com ícones e
  `aria-sort`.

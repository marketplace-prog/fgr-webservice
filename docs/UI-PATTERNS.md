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

### Copiar identificadores

- Exiba SKUs e identificadores copiáveis em um botão acessível, não em um elemento não interativo.
- Copie o valor exato usando `navigator.clipboard.writeText()` apenas após a ação do usuário.
- Dê feedback explícito via toast em sucesso e falha; registre o erro de cópia para diagnóstico.

### Ações de linha

- Agrupe as ações de cada linha em um `DropdownMenu` para reduzir ruído visual na tabela.
- Use um gatilho de ícone com nome acessível e mantenha os itens dentro de `DropdownMenuGroup`.
- Preserve regras de habilitação das ações e use a variante `destructive` para exclusões.

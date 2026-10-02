// @ts-check
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  { ignores: ['shared/types/database.types.ts'] },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'warn',
      'vue/block-order': ['warn', { order: ['script', 'template', 'style'] }],
      'vue/define-macros-order': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // shadcn gera componentes com nomes de uma palavra (Button, Input...)
  {
    files: ['app/components/ui/**/*.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  // Sempre por último: roda o Prettier como regra do ESLint e desliga regras conflitantes
  prettierRecommended,
)

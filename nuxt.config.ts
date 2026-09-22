// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    discord: {
      novos_pedidos: process.env.DISCORD_WEBHOOK_NOVOS_PEDIDOS || '',
      atualizacoes: process.env.DISCORD_WEBHOOK_ATUALIZACOES || '',
    }
  }
})

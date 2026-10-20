import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  vite: {
    plugins: [tailwindcss()],
  },

  css: ['~/assets/css/tailwind.css'],

  runtimeConfig: {
    supabase: {
      serviceKey: process.env.NUXT_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || '',
      secretKey:
        process.env.NUXT_SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        '',
    },
    magazord: {
      apiUrl: process.env.MAGAZORD_API_URL || '',
      apiToken: process.env.MAGAZORD_API_TOKEN || '',
      apiPassword: process.env.MAGAZORD_API_PASSWORD || '',
    },
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
    discord: {
      novos_pedidos: process.env.DISCORD_WEBHOOK_NOVOS_PEDIDOS || '',
      atualizacoes: process.env.DISCORD_WEBHOOK_ATUALIZACOES || '',
      estoque_baixo: process.env.DISCORD_WEBHOOK_ESTOQUE_BAIXO || '',
    },
  },

  supabase: {
    types: '~~/shared/types/database.types.ts',
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/lp/.*'],
    },
  },

  modules: ['shadcn-nuxt', '@nuxt/eslint', '@nuxtjs/supabase'],

  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: '~/components/ui',
  },
})

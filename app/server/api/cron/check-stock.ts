import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Usamos a service_role para ler todos os alertas bypassando o RLS
  const supabase = serverSupabaseServiceRole(event)

  // 1. Busca todos os monitores ativos
  const { data: monitors, error } = await supabase
    .from('stock_monitors')
    .select('*')
    .eq('is_active', true)

  if (error || !monitors) {
    return { success: false, error: 'Erro ao buscar monitores' }
  }

  for (const monitor of monitors) {
    // 2. Consulta o estoque real.
    // Aqui você integra com o endpoint de "Consulta de Estoque" da API do Magazord
    const currentStock = await fetchMagazordStock(monitor.sku)

    // 3. Verifica a condição e dispara o Discord Webhook
    if (currentStock !== null && currentStock <= monitor.min_quantity) {
      await sendDiscordAlert(monitor.discord_webhook_url, monitor.sku, currentStock, monitor.min_quantity)
    }
  }

  return { success: true, processed: monitors.length }
})

// Função simulada para buscar o estoque no Magazord
async function fetchMagazordStock(sku: string): Promise<number | null> {
  // Implemente sua chamada HTTP para a API de Estoque do Magazord[cite: 36]
  // utilizando a estrutura já existente em `shared/utils/magazord.ts`
  return 5; // Retorno estático para exemplo
}

// Disparo da mensagem para o Discord
async function sendDiscordAlert(webhookUrl: string, sku: string, currentStock: number, minStock: number) {
  const payload = {
    username: "Alerta de Estoque",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/6853/6853339.png",
    embeds: [
      {
        title: "🚨 Estoque Mínimo Atingido!",
        color: 16711680, // Vermelho
        fields: [
          { name: "SKU Monitorado", value: `\`${sku}\``, inline: true },
          { name: "Estoque Atual", value: `**${currentStock}**`, inline: true },
          { name: "Mínimo Configurado", value: `${minStock}`, inline: true }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(err => console.error(`Falha ao notificar Discord para o SKU ${sku}:`, err))
}

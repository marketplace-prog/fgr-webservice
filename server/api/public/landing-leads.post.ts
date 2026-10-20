import { serverSupabaseServiceRole } from '#supabase/server'
import { landingPageLeadSchema } from '~~/shared/schemas/landing-page-lead.schema'

export default defineEventHandler(async (event) => {
  const body = await readBody<unknown>(event)
  const result = landingPageLeadSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Revise os dados do formulário e tente novamente.',
      data: result.error.flatten(),
    })
  }

  if (result.data.landingSlug !== 'redes-de-futebol') {
    throw createError({
      statusCode: 400,
      message: 'Esta landing page não está disponível para cadastro.',
    })
  }

  const supabase = serverSupabaseServiceRole(event)
  const { data, error } = await supabase
    .from('landing_page_leads')
    .insert({
      landing_slug: result.data.landingSlug,
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone,
      thread_color: result.data.threadColor,
      thread_thickness_mm: result.data.threadThicknessMm,
      mesh_size_cm: result.data.meshSizeCm,
      length_cm: result.data.lengthCm,
      height_cm: result.data.heightCm,
      upper_recess_cm: result.data.upperRecessCm,
      lower_recess_cm: result.data.lowerRecessCm,
      utm_source: result.data.utmSource || null,
      utm_medium: result.data.utmMedium || null,
      utm_campaign: result.data.utmCampaign || null,
      utm_term: result.data.utmTerm || null,
      utm_content: result.data.utmContent || null,
      referrer: result.data.referrer || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[Landing page lead] Falha ao salvar cadastro:', error)
    throw createError({
      statusCode: 500,
      message: 'Não foi possível salvar seu pedido agora. Tente novamente em instantes.',
    })
  }

  return { id: data.id }
})

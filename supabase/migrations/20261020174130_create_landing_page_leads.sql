CREATE TABLE public.landing_page_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  thread_color TEXT NOT NULL CHECK (thread_color IN ('preta', 'branca', 'azul', 'verde')),
  thread_thickness_mm SMALLINT NOT NULL CHECK (thread_thickness_mm IN (3, 4, 6)),
  mesh_size_cm SMALLINT NOT NULL CHECK (mesh_size_cm IN (10, 12, 13, 15, 16)),
  length_cm NUMERIC(8, 2) NOT NULL CHECK (length_cm > 0),
  height_cm NUMERIC(8, 2) NOT NULL CHECK (height_cm > 0),
  upper_recess_cm NUMERIC(8, 2) NOT NULL CHECK (upper_recess_cm > 0),
  lower_recess_cm NUMERIC(8, 2) NOT NULL CHECK (lower_recess_cm > 0),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT landing_page_leads_contact_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX landing_page_leads_created_at_idx
  ON public.landing_page_leads (created_at DESC);
CREATE INDEX landing_page_leads_slug_idx
  ON public.landing_page_leads (landing_slug, created_at DESC);

ALTER TABLE public.landing_page_leads ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.landing_page_leads FROM anon, authenticated;
GRANT SELECT ON public.landing_page_leads TO authenticated;
GRANT ALL ON public.landing_page_leads TO service_role;

CREATE POLICY "Admins can read landing page leads"
  ON public.landing_page_leads
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
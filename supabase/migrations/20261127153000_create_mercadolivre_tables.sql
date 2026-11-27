-- Tabelas da integração gerencial com Mercado Livre (conta única, OAuth 2.0 + cache analítico)

CREATE TABLE IF NOT EXISTS public.ml_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id BIGINT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  site_id TEXT NOT NULL DEFAULT 'MLB',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  scope TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  reputation_level_id TEXT,
  power_seller_status TEXT,
  reputation_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,
  connected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ml_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id BIGINT NOT NULL UNIQUE,
  seller_id BIGINT NOT NULL,
  pack_id BIGINT,
  date_created TIMESTAMPTZ NOT NULL,
  date_closed TIMESTAMPTZ,
  status TEXT NOT NULL,
  currency_id TEXT NOT NULL DEFAULT 'BRL',
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  sale_fee NUMERIC(14, 2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  logistic_type TEXT,
  shipping_status TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  buyer_nickname TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ml_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL UNIQUE,
  seller_id BIGINT NOT NULL,
  sku TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  listing_type_id TEXT,
  logistic_type TEXT,
  permalink TEXT,
  thumbnail TEXT,
  health NUMERIC(5, 4),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ml_ads_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id BIGINT NOT NULL,
  date DATE NOT NULL,
  cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  prints INTEGER NOT NULL DEFAULT 0,
  direct_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  indirect_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  acos NUMERIC(8, 2),
  roas NUMERIC(8, 2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ml_ads_daily_seller_date_unique UNIQUE (seller_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ml_orders_seller_date
  ON public.ml_orders (seller_id, date_created DESC);

CREATE INDEX IF NOT EXISTS idx_ml_orders_status_date
  ON public.ml_orders (status, date_created DESC);

CREATE INDEX IF NOT EXISTS idx_ml_items_seller_status
  ON public.ml_items (seller_id, status);

CREATE INDEX IF NOT EXISTS idx_ml_items_sold
  ON public.ml_items (sold_quantity DESC);

CREATE INDEX IF NOT EXISTS idx_ml_ads_daily_seller_date
  ON public.ml_ads_daily (seller_id, date DESC);

-- Row Level Security (RLS)
-- ml_connections guarda tokens OAuth: acesso exclusivo via service_role no backend Nitro
ALTER TABLE public.ml_connections ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ml_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_ads_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read ml_orders"
  ON public.ml_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read ml_items"
  ON public.ml_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read ml_ads_daily"
  ON public.ml_ads_daily FOR SELECT TO authenticated USING (true);

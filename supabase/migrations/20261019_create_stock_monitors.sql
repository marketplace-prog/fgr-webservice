-- Reset: Remove e recria a tabela stock_monitors do zero
-- Execute este script para garantir um schema limpo e atualizado.

-- 1. Remove a tabela existente (cascata derruba também policies e índices)
DROP TABLE IF EXISTS public.stock_monitors CASCADE;

-- 2. Recria a tabela com o schema completo e atualizado
CREATE TABLE public.stock_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  sku_type TEXT NOT NULL DEFAULT 'variation' CHECK (sku_type IN ('variation', 'parent')),
  min_quantity INTEGER NOT NULL DEFAULT 5 CHECK (min_quantity >= 0),
  current_stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  last_alerted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT stock_monitors_sku_type_unique UNIQUE (sku, sku_type)
);

-- 3. Índices para buscas rápidas pelo cron e listagem no painel
CREATE INDEX idx_stock_monitors_active ON public.stock_monitors (is_active) WHERE is_active = true;
CREATE INDEX idx_stock_monitors_sku ON public.stock_monitors (sku);
CREATE INDEX idx_stock_monitors_created_at ON public.stock_monitors (created_at DESC);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.stock_monitors ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de acesso para usuários autenticados
CREATE POLICY "Allow authenticated users to read stock monitors"
  ON public.stock_monitors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert stock monitors"
  ON public.stock_monitors FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update stock monitors"
  ON public.stock_monitors FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete stock monitors"
  ON public.stock_monitors FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

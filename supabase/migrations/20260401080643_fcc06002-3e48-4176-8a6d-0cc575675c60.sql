
CREATE TABLE public.simulation_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  career_id UUID NOT NULL,
  career_title TEXT NOT NULL,
  grades JSONB NOT NULL DEFAULT '{}',
  met_count INTEGER NOT NULL DEFAULT 0,
  total_required INTEGER NOT NULL DEFAULT 0,
  readiness_percent INTEGER NOT NULL DEFAULT 0,
  gaps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own simulations" ON public.simulation_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulations" ON public.simulation_results
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own simulations" ON public.simulation_results
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

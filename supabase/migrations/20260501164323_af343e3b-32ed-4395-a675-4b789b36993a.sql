ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS subjects text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
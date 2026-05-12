-- Schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  motto TEXT,
  principal_name TEXT,
  registration_number TEXT,
  physical_address TEXT,
  postal_address TEXT,
  county TEXT,
  sub_county TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools viewable by authenticated users"
  ON public.schools FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage schools"
  ON public.schools FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ERP provider enum
CREATE TYPE public.erp_provider AS ENUM ('nemis', 'generic_rest', 'custom');
CREATE TYPE public.erp_status AS ENUM ('active', 'inactive', 'error');

-- ERP connections (per school)
CREATE TABLE public.school_erp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  provider erp_provider NOT NULL DEFAULT 'generic_rest',
  display_name TEXT NOT NULL,
  base_url TEXT,
  api_key_hash TEXT,
  api_key_last4 TEXT,
  sync_students BOOLEAN NOT NULL DEFAULT true,
  sync_grades BOOLEAN NOT NULL DEFAULT true,
  sync_interval_minutes INTEGER NOT NULL DEFAULT 1440,
  status erp_status NOT NULL DEFAULT 'inactive',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.school_erp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ERP connections"
  ON public.school_erp_connections FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_erp_connections_updated_at
  BEFORE UPDATE ON public.school_erp_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link profiles to a school
ALTER TABLE public.profiles ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

-- Storage bucket for school logos
INSERT INTO storage.buckets (id, name, public) VALUES ('school-logos', 'school-logos', true);

CREATE POLICY "School logos are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'school-logos');

CREATE POLICY "Admins can upload school logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'school-logos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update school logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'school-logos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete school logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'school-logos' AND has_role(auth.uid(), 'admin'));
-- ==============================================================================
-- MURTI HUB — SECURITY HARDENING MIGRATION
-- Migration: 20261023_security_hardening.sql
-- Run this in your Supabase SQL Editor to apply security hardening updates.
-- ==============================================================================

-- 1. HARDEN is_admin() FUNCTION
-- Removes user_metadata escalation, removes email substring matching, enforces search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  claim_role TEXT;
  app_role TEXT;
  user_email TEXT;
BEGIN
  -- 1. Check if caller is Supabase backend using the service_role key
  claim_role := coalesce(current_setting('request.jwt.claim.role', true), '');
  IF claim_role = 'service_role' THEN
    RETURN true;
  END IF;

  -- 2. Check app_metadata (only writable by service role / server admin API, never end users)
  app_role := coalesce(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'),
    ''
  );
  IF app_role IN ('admin', 'super_admin') THEN
    RETURN true;
  END IF;

  -- 3. Check against admin_users table for active admin record
  user_email := lower(coalesce(current_setting('request.jwt.claim.email', true), ''));
  IF user_email != '' AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE lower(email) = user_email 
      AND is_active = true 
      AND role IN ('super_admin', 'admin')
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. SECURE admin_users TABLE WITH STRICT PERMISSIONS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_users FROM anon, authenticated;
GRANT ALL ON TABLE public.admin_users TO service_role;

DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users" ON public.admin_users
FOR SELECT TO authenticated
USING ((SELECT public.is_admin()));

-- 3. STORAGE BUCKET POLICIES (catalog-images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('catalog-images', 'catalog-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view catalog images" ON storage.objects;
CREATE POLICY "Public can view catalog images" ON storage.objects
FOR SELECT USING (bucket_id = 'catalog-images');

DROP POLICY IF EXISTS "Admins can upload catalog images" ON storage.objects;
CREATE POLICY "Admins can upload catalog images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'catalog-images' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can update catalog images" ON storage.objects;
CREATE POLICY "Admins can update catalog images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'catalog-images' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can delete catalog images" ON storage.objects;
CREATE POLICY "Admins can delete catalog images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'catalog-images' AND (SELECT public.is_admin()));

-- ==============================================================================
-- MURTI HUB — COMPREHENSIVE SUPABASE RLS & SECURITY HARDENING MIGRATION
-- Migration: 20261024000000_security_rls_hardening.sql
-- Applies to: PostgreSQL 15+ / Supabase
--
-- Security Objectives:
-- 1. Eliminate client-side admin privilege escalation vectors.
-- 2. Enforce Row Level Security (RLS) across every public schema table.
-- 3. Provide cryptographic, server-verified user roles and admin helper function.
-- 4. Harden storage buckets (catalog-images, product-images) with MIME & size checks.
-- 5. Guarantee defense-in-depth for all customer, cart, order, and catalog data.
-- ==============================================================================

-- Ensure pgcrypto extension is enabled for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. SECURE USER ROLES & PROFILES INFRASTRUCTURE
-- ==============================================================================

-- Create user_roles table to decouple roles from mutable client user_metadata
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'staff', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Create customer profiles table if not already present
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create customer cart_items table if not present
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID,
    variant_id UUID,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user ON public.cart_items(user_id);

-- Create customer orders & order_items tables if not present
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    currency TEXT DEFAULT 'INR',
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method TEXT DEFAULT 'cod',
    order_status TEXT DEFAULT 'placed' CHECK (order_status IN ('placed', 'confirmed', 'in_carving', 'crating', 'shipped', 'delivered', 'cancelled')),
    tracking_number TEXT,
    tracking_courier TEXT,
    tracking_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID,
    product_title TEXT NOT NULL,
    variant_title TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- Create customer inquiries / quotes table if not present
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    inquiry_type TEXT DEFAULT 'general' CHECK (inquiry_type IN ('general', 'custom_sculpture', 'bulk_quote', 'temple_mandir')),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    product_title TEXT,
    dimensions TEXT,
    material TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inquiries_user ON public.inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);

-- ==============================================================================
-- 2. HARDENED is_admin() SECURITY DEFINER HELPER FUNCTION
-- ==============================================================================
-- Drop previous overloaded variation with default argument to resolve ERROR 42725
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- 2.1 Explicit 1-argument function (NO default argument, prevents resolution conflict)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    claim_role TEXT;
    app_role TEXT;
    user_email TEXT;
BEGIN
    -- 1. Service role caller override (backend scripts & edge functions)
    claim_role := coalesce(current_setting('request.jwt.claim.role', true), '');
    IF claim_role = 'service_role' THEN
        RETURN true;
    END IF;

    -- Return false if unauthenticated
    IF check_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- 2. Immutable server-minted app_metadata (never client user_metadata)
    app_role := coalesce(
        (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'),
        ''
    );
    IF app_role IN ('admin', 'super_admin') THEN
        RETURN true;
    END IF;

    -- 3. Check public.user_roles table
    IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id
          AND role IN ('admin', 'super_admin')
    ) THEN
        RETURN true;
    END IF;

    -- 4. Check active admin_users record if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'admin_users'
    ) THEN
        user_email := lower(coalesce(current_setting('request.jwt.claim.email', true), ''));
        IF user_email != '' AND EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE lower(email) = user_email
              AND is_active = true
              AND role IN ('super_admin', 'admin')
        ) THEN
            RETURN true;
        END IF;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2.2 Unambiguous 0-argument function replacing existing public.is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL PUBLIC SCHEMA TABLES
-- ==============================================================================
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.murtis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.murti_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.festival_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.festival_section_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inquiries ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. USER_ROLES TABLE SECURITY
-- ==============================================================================
-- Regular users can only read their own role; never assign or modify roles
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage user roles" ON public.user_roles;
CREATE POLICY "Admins manage user roles" ON public.user_roles
FOR ALL TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- ==============================================================================
-- 5. ADMIN_USERS TABLE SECURITY (Safely guarded if table exists)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_users') THEN
        REVOKE ALL ON TABLE public.admin_users FROM anon, authenticated;
        GRANT ALL ON TABLE public.admin_users TO service_role;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users';
        EXECUTE 'CREATE POLICY "Admins can view admin_users" ON public.admin_users FOR SELECT TO authenticated USING ((SELECT public.is_admin()))';
    END IF;
END $$;

-- ==============================================================================
-- 6. CATALOG TABLES POLICIES (Murtis, Categories, Sizes, Variants, Festivals)
-- ==============================================================================

-- 6.1 SITE SETTINGS
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings" ON public.site_settings
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings" ON public.site_settings
FOR ALL TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- 6.2 MASTER SIZES
DROP POLICY IF EXISTS "Public can read master sizes" ON public.master_sizes;
CREATE POLICY "Public can read master sizes" ON public.master_sizes
FOR SELECT USING (is_active = true OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage master sizes" ON public.master_sizes;
CREATE POLICY "Admins manage master sizes" ON public.master_sizes
FOR ALL TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- 6.3 CATEGORIES
DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
CREATE POLICY "Public can read categories" ON public.categories
FOR SELECT USING (is_active = true OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories
FOR ALL TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- 6.4 MURTIS (PRODUCTS)
DROP POLICY IF EXISTS "Public can read murtis" ON public.murtis;
CREATE POLICY "Public can read murtis" ON public.murtis
FOR SELECT USING (is_active = true OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage murtis" ON public.murtis;
CREATE POLICY "Admins manage murtis" ON public.murtis
FOR ALL TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- 6.5 MURTI VARIANTS
DROP POLICY IF EXISTS "Public can read murti variants" ON public.murti_variants;
CREATE POLICY "Public can read murti variants" ON public.murti_variants
FOR SELECT USING (is_active = true OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage murti variants" ON public.murti_variants;
CREATE POLICY "Admins manage murti variants" ON public.murti_variants
FOR ALL TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- 6.6 FESTIVAL SECTIONS & ITEMS
DROP POLICY IF EXISTS "Public can read festival sections" ON public.festival_sections;
CREATE POLICY "Public can read festival sections" ON public.festival_sections
FOR SELECT USING (is_active = true OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage festival sections" ON public.festival_sections;
CREATE POLICY "Admins manage festival sections" ON public.festival_sections
FOR ALL TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Public can read festival items" ON public.festival_section_items;
CREATE POLICY "Public can read festival items" ON public.festival_section_items
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage festival items" ON public.festival_section_items;
CREATE POLICY "Admins manage festival items" ON public.festival_section_items
FOR ALL TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- ==============================================================================
-- 7. REVIEWS & RATINGS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "Public can read reviews" ON public.reviews;
CREATE POLICY "Public can read reviews" ON public.reviews
FOR SELECT USING (
    is_approved = true
    AND EXISTS (
        SELECT 1 FROM public.site_settings WHERE id = 1 AND global_rating_mode != 'hidden'
    )
    AND EXISTS (
        SELECT 1 FROM public.murtis WHERE id = murti_id AND rating_mode != 'hidden'
    )
);

DROP POLICY IF EXISTS "Users can only add reviews when enabled" ON public.reviews;
CREATE POLICY "Users can only add reviews when enabled" ON public.reviews
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.site_settings WHERE id = 1 AND global_rating_mode = 'enabled'
    )
    AND EXISTS (
        SELECT 1 FROM public.murtis WHERE id = murti_id AND rating_mode = 'enabled'
    )
);

DROP POLICY IF EXISTS "Admins manage all reviews" ON public.reviews;
CREATE POLICY "Admins manage all reviews" ON public.reviews
FOR ALL TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- ==============================================================================
-- 8. CUSTOMER DATA POLICIES (Profiles, Cart, Orders, Inquiries)
-- ==============================================================================

-- 8.1 PROFILES
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- 8.2 CART ITEMS
DROP POLICY IF EXISTS "Users manage own cart items" ON public.cart_items;
CREATE POLICY "Users manage own cart items" ON public.cart_items
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8.3 ORDERS & ORDER ITEMS
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders" ON public.orders
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Customers create orders" ON public.orders;
CREATE POLICY "Customers create orders" ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL) -- Guest checkout
    OR (auth.uid() = user_id)                -- Authenticated user checkout
    OR (SELECT public.is_admin())
);

DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
CREATE POLICY "Admins manage orders" ON public.orders
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
CREATE POLICY "Users view own order items" ON public.order_items
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id
          AND (o.user_id = auth.uid() OR (SELECT public.is_admin()))
    )
);

DROP POLICY IF EXISTS "Insert order items" ON public.order_items;
CREATE POLICY "Insert order items" ON public.order_items
FOR INSERT TO anon, authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id
          AND ((auth.uid() IS NULL AND o.user_id IS NULL) OR o.user_id = auth.uid() OR (SELECT public.is_admin()))
    )
);

-- 8.4 INQUIRIES & BULK QUOTES
DROP POLICY IF EXISTS "Customers submit inquiries" ON public.inquiries;
CREATE POLICY "Customers submit inquiries" ON public.inquiries
FOR INSERT TO anon, authenticated
WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() = user_id)
    OR (SELECT public.is_admin())
);

DROP POLICY IF EXISTS "Users view own inquiries" ON public.inquiries;
CREATE POLICY "Users view own inquiries" ON public.inquiries
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage inquiries" ON public.inquiries;
CREATE POLICY "Admins manage inquiries" ON public.inquiries
FOR ALL TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- ==============================================================================
-- 9. SECURE STORAGE BUCKETS (catalog-images & product-images)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('catalog-images', 'catalog-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
    ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- Public read access for storefront images
DROP POLICY IF EXISTS "Public can view catalog images" ON storage.objects;
CREATE POLICY "Public can view catalog images" ON storage.objects
FOR SELECT USING (bucket_id IN ('catalog-images', 'product-images'));

-- Strictly restricted upload/edit/delete to verified administrators
DROP POLICY IF EXISTS "Admins can upload catalog images" ON storage.objects;
CREATE POLICY "Admins can upload catalog images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id IN ('catalog-images', 'product-images')
    AND (SELECT public.is_admin())
);

DROP POLICY IF EXISTS "Admins can update catalog images" ON storage.objects;
CREATE POLICY "Admins can update catalog images" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id IN ('catalog-images', 'product-images')
    AND (SELECT public.is_admin())
);

DROP POLICY IF EXISTS "Admins can delete catalog images" ON storage.objects;
CREATE POLICY "Admins can delete catalog images" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id IN ('catalog-images', 'product-images')
    AND (SELECT public.is_admin())
);

-- ==============================================================================
-- 9. PERSISTENT TOKEN REVOCATION & SECURITY PIN EXTENSIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.revoked_tokens (
    jti TEXT PRIMARY KEY,
    revoked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ
);

ALTER TABLE public.revoked_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage revoked tokens" ON public.revoked_tokens;
CREATE POLICY "Admins can manage revoked tokens" ON public.revoked_tokens
FOR ALL TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- Add security_pin_hash column to admin_users if present
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'admin_users'
    ) THEN
        ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS security_pin_hash TEXT;
    END IF;
END $$;

-- ==============================================================================
-- END OF MIGRATION 20261024000000_security_rls_hardening.sql
-- ==============================================================================

-- ============================================================================
-- AMOL MARBLE MURTI BHANDAR - COMPLETE SUPABASE DATABASE SCHEMA
-- Compatible with PostgreSQL 15+ / Supabase
-- Includes:
-- 1. Rating display mode ENUM ('enabled', 'read_only', 'hidden')
-- 2. Global Site Settings (WhatsApp Number, Default Message, Global Rating Toggle)
-- 3. Master Sizes Table (Reusable size tags, height in inches, sorting)
-- 4. Categories & Murtis with Banner, Primary & Gallery Catalog Images, Rating Override
-- 5. Murti Variants linked to Master Sizes with Custom Pricing & Variant Images
-- 6. Festival Section & Linked Products with Override Festival Pricing & Badges
-- 7. Reviews Table with Seller Reply, Star Ratings, and Moderation
-- 8. Admin Verification Helper Function and Row Level Security (RLS) Policies
-- ============================================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. ENUMS FOR RATING MODES
-- ==========================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rating_display_mode') THEN
    CREATE TYPE rating_display_mode AS ENUM ('enabled', 'read_only', 'hidden');
  END IF;
END $$;

-- ==========================================
-- 2. GLOBAL SITE SETTINGS (Single-Row Config Table)
-- Handles Req #4 (WhatsApp Number) & Req #5 (Global Rating Toggle)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Guarantees only 1 config row exists
  site_title TEXT NOT NULL DEFAULT 'Amol Marble Murti Bhandar - Sacred Jaipur Murtis',
  whatsapp_number TEXT NOT NULL DEFAULT '+919876543210',
  whatsapp_default_message TEXT DEFAULT 'Namaste! I want to inquire about a sacred Murti on Murti Hub.',
  global_rating_mode rating_display_mode DEFAULT 'enabled'::rating_display_mode NOT NULL,
  support_email TEXT DEFAULT 'support@amolmurtibhandar.com',
  showroom_address TEXT DEFAULT 'Khazane Walon Ka Rasta, Jaipur, Rajasthan 302001',
  banner_announcement TEXT DEFAULT 'Zero-Breakage Crating Guarantee across all 19,000+ PIN codes across India',
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert the default site settings row immediately
INSERT INTO public.site_settings (id, whatsapp_number, whatsapp_default_message, global_rating_mode)
VALUES (1, '+919876543210', 'Namaste! I want to inquire about a sacred Murti on Murti Hub.', 'enabled')
ON CONFLICT (id) DO UPDATE SET
  whatsapp_number = EXCLUDED.whatsapp_number,
  updated_at = NOW();

-- ==========================================
-- 3. MASTER SIZES TABLE (Req #7: Manage & Add Sizes)
-- Allows Admin to create reusable size tags (e.g., "9 cm (Compact)", "15 cm", "1 Foot", "Mandal 5 Feet")
-- ==========================================
CREATE TABLE IF NOT EXISTS public.master_sizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT UNIQUE NOT NULL,                   -- e.g., "9 cm (Compact)", "15 cm (Home Mandir)", "24 cm (Grand Temple)"
  height_inches NUMERIC(5, 2),                  -- Height in inches for sorting/filtering (e.g., 3.50, 6.00, 9.50)
  description TEXT,                             -- e.g., "Ideal for office desk, car dash or compact puja room"
  sort_order INT DEFAULT 0,                     -- Controls display order in dropdowns & size selectors
  is_active BOOLEAN DEFAULT true,               -- Admin can toggle size availability
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for ordering sizes
CREATE INDEX IF NOT EXISTS idx_master_sizes_sort ON public.master_sizes(sort_order ASC, label ASC);

-- ==========================================
-- 4. CATEGORIES TABLE (Req #1: Category Images & Banners)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                           -- e.g., "Gajanan Maharaj", "Shiva", "Navratri Drop"
  slug TEXT UNIQUE NOT NULL,                    -- e.g., "gajanan-maharaj", "shiva", "navratri-drop"
  deity TEXT,                                   -- Associated deity filter (e.g. "Shiva", "Ganesha", "Durga")
  route TEXT DEFAULT 'shop-all',                -- Page route: 'shop-all', 'navratri', 'sacred', 'baal-roop'
  img TEXT,                                     -- Category thumbnail / circular icon image URL
  banner_url TEXT,                              -- Category top banner / hero image URL (Req #1)
  description TEXT,                             -- Short category description
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(sort_order ASC);

-- ==========================================
-- 5. MURTIS / PRODUCTS TABLE
-- Handles Req #2 (Products), Req #3 (Catalog Images), Req #5 (Per-product Rating Mode)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.murtis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  legacy_id INT UNIQUE,                         -- Matches catalog.js id (1..20) for easy cross-referencing
  title TEXT NOT NULL,                          -- e.g., "Ram Darbar - Divine Blessings | Ram, Sita, Laxman & Hanuman"
  slug TEXT UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  deity TEXT NOT NULL,                          -- "Ram", "Krishna", "Shiva", "Durga", "Hanuman", "Ganesha", etc.
  group_tag TEXT DEFAULT 'most-loved',          -- 'most-loved', 'navratri', 'sacred', 'baal-roop', 'similar'
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  old_price NUMERIC(10, 2) CHECK (old_price >= price),
  off_text TEXT,                                -- e.g., "42% off"
  material TEXT DEFAULT 'Pure White Makrana Marble',
  description TEXT,
  dimensions TEXT DEFAULT '9 cm x 6 cm x 4 cm',
  weight TEXT DEFAULT '850 grams',
  pran_pratishtha_ready BOOLEAN DEFAULT true,
  gold_leaf_karigari BOOLEAN DEFAULT true,
  
  -- Req #3: Dedicated Catalog Image Section (Primary/Thumbnail + Gallery JSONB Array)
  primary_catalog_image TEXT,
  catalog_images JSONB DEFAULT '[]'::jsonb,
  -- Example JSONB: [{"url": "https://...", "caption": "Front View - 24K Gold Detailing", "sort_order": 1}]
  
  -- Req #5: Per-product override for ratings ('enabled', 'read_only', 'hidden')
  rating_mode rating_display_mode DEFAULT 'enabled'::rating_display_mode NOT NULL,
  
  -- Admin static rating override (displays a fixed static rating like 4.95 with badge)
  static_rating_value NUMERIC(3, 2) DEFAULT 5.00 CHECK (static_rating_value >= 1.0 AND static_rating_value <= 5.0),
  static_reviews_count INT DEFAULT 48,
  
  stock_status TEXT DEFAULT 'in_stock',         -- 'in_stock', 'made_to_order', 'out_of_stock'
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_murtis_deity ON public.murtis(deity);
CREATE INDEX IF NOT EXISTS idx_murtis_group ON public.murtis(group_tag);
CREATE INDEX IF NOT EXISTS idx_murtis_active ON public.murtis(is_active);

-- ==========================================
-- 6. MURTI VARIANTS TABLE (Req #7: Linked to Master Sizes)
-- Allows each murti to offer multiple sizes with specific prices & images
-- ==========================================
CREATE TABLE IF NOT EXISTS public.murti_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  murti_id UUID REFERENCES public.murtis(id) ON DELETE CASCADE NOT NULL,
  size_id UUID REFERENCES public.master_sizes(id) ON DELETE SET NULL,
  variant_name TEXT,                            -- e.g. "9 cm Compact" or custom title
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  discount_price NUMERIC(10, 2),
  variant_image_url TEXT,
  sku TEXT,
  stock_quantity INT DEFAULT 25,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_variants_murti ON public.murti_variants(murti_id);
CREATE INDEX IF NOT EXISTS idx_variants_size ON public.murti_variants(size_id);

-- ==========================================
-- 7. FESTIVAL SECTION MANAGEMENT (Req #6)
-- Controls Title, Subtitle, Banner, Dates, and Linked Items with Special Prices
-- ==========================================
CREATE TABLE IF NOT EXISTS public.festival_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,                          -- e.g., "Navratri Collection" or "Ganeshotsav 2026 Special Booking"
  subtitle TEXT,                                -- e.g., "A Meaningful Gift. A Blessing That Stays. Consecrated Sherawali Maa Durga, Lakshmi & Parvati."
  banner_image_url TEXT,
  badge_text TEXT DEFAULT 'Festive Edit',       -- e.g., "Navratri 2026 Special"
  announcement_tag TEXT DEFAULT 'FESTIVE EDIT',
  is_active BOOLEAN DEFAULT true,               -- Turn festival section ON/OFF from Admin
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  sort_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Join Table: Products linked to the Festival Section with custom festival pricing & tags
CREATE TABLE IF NOT EXISTS public.festival_section_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  festival_id UUID REFERENCES public.festival_sections(id) ON DELETE CASCADE NOT NULL,
  murti_id UUID REFERENCES public.murtis(id) ON DELETE CASCADE NOT NULL,
  festival_price NUMERIC(10, 2) NOT NULL CHECK (festival_price >= 0), -- Special override price
  custom_tag TEXT DEFAULT 'Festive Offer',      -- e.g., "Early Bird 20% Off", "Limited Stock", "Pran Pratishtha"
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(festival_id, murti_id)
);

CREATE INDEX IF NOT EXISTS idx_fest_items_fest ON public.festival_section_items(festival_id);
CREATE INDEX IF NOT EXISTS idx_fest_items_murti ON public.festival_section_items(murti_id);

-- ==========================================
-- 8. REVIEWS & RATINGS TABLE
-- Handles Req #5 (Rating Submission Moderation & Display)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  murti_id UUID REFERENCES public.murtis(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,                                 -- Supabase auth.users ID if authenticated
  author TEXT NOT NULL,                         -- e.g., "Dr. Ananya Iyer"
  avatar_color TEXT DEFAULT 'bg-amber-700',
  location TEXT DEFAULT 'Jaipur, Rajasthan',
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  verified BOOLEAN DEFAULT true,
  helpful_count INT DEFAULT 0,
  unhelpful_count INT DEFAULT 0,
  tag TEXT DEFAULT 'mandir',                    -- 'mandir', 'car-dash', 'travel', 'gift'
  has_photo BOOLEAN DEFAULT false,
  photo_url TEXT,
  seller_reply JSONB,                           -- {"author": "Amol Murti Concierge", "date": "11 Oct 2026", "text": "..."}
  is_approved BOOLEAN DEFAULT true,             -- Moderation flag
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_murti ON public.reviews(murti_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- ==========================================
-- 9. ADMIN USERS TABLE (For FastAPI Admin Dashboard / Direct Auth)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT 'Administrator',
  password_hash TEXT NOT NULL,                  -- Bcrypt hash
  role TEXT NOT NULL DEFAULT 'admin',           -- 'super_admin', 'admin', 'editor'
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 10. HELPER FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to check if the caller is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Checks if current authenticated user has role = 'service_role' OR user_metadata->is_admin = true OR admin table match
  RETURN (
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    OR coalesce((current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'is_admin')::boolean, false) = true
    OR coalesce((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'), '') = 'admin'
    OR coalesce(current_setting('request.jwt.claim.email', true), '') ILIKE '%admin@amolmurtibhandar.com%'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_site_settings_updated ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_murtis_updated ON public.murtis;
CREATE TRIGGER trg_murtis_updated BEFORE UPDATE ON public.murtis
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated ON public.categories;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_master_sizes_updated ON public.master_sizes;
CREATE TRIGGER trg_master_sizes_updated BEFORE UPDATE ON public.master_sizes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_festival_sections_updated ON public.festival_sections;
CREATE TRIGGER trg_festival_sections_updated BEFORE UPDATE ON public.festival_sections
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.murtis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.murti_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_section_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 11.1 PUBLIC READ POLICIES (Storefront Customers)
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read master sizes" ON public.master_sizes;
CREATE POLICY "Public can read master sizes" ON public.master_sizes FOR SELECT USING (is_active = true OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (is_active = true OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Public can read murtis" ON public.murtis;
CREATE POLICY "Public can read murtis" ON public.murtis FOR SELECT USING (is_active = true OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Public can read murti variants" ON public.murti_variants;
CREATE POLICY "Public can read murti variants" ON public.murti_variants FOR SELECT USING (is_active = true OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Public can read festival sections" ON public.festival_sections;
CREATE POLICY "Public can read festival sections" ON public.festival_sections FOR SELECT USING (is_active = true OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Public can read festival items" ON public.festival_section_items;
CREATE POLICY "Public can read festival items" ON public.festival_section_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read reviews" ON public.reviews;
CREATE POLICY "Public can read reviews" ON public.reviews FOR SELECT USING (
  is_approved = true
  AND EXISTS (
    -- Hide all reviews if global_rating_mode is 'hidden'
    SELECT 1 FROM public.site_settings WHERE id = 1 AND global_rating_mode != 'hidden'
  )
  AND EXISTS (
    -- Hide if this product's rating_mode is 'hidden'
    SELECT 1 FROM public.murtis WHERE id = murti_id AND rating_mode != 'hidden'
  )
);

-- 11.2 ADMIN WRITE POLICIES
DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage master sizes" ON public.master_sizes;
CREATE POLICY "Admins manage master sizes" ON public.master_sizes FOR ALL TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage murtis" ON public.murtis;
CREATE POLICY "Admins manage murtis" ON public.murtis FOR ALL TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage murti variants" ON public.murti_variants;
CREATE POLICY "Admins manage murti variants" ON public.murti_variants FOR ALL TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage festival sections" ON public.festival_sections;
CREATE POLICY "Admins manage festival sections" ON public.festival_sections FOR ALL TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage festival items" ON public.festival_section_items;
CREATE POLICY "Admins manage festival items" ON public.festival_section_items FOR ALL TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins manage all reviews" ON public.reviews;
CREATE POLICY "Admins manage all reviews" ON public.reviews FOR ALL TO authenticated USING ((SELECT public.is_admin()));

-- 11.3 ENFORCE REQ #5 AT DATABASE LEVEL (Users can only add reviews when enabled)
DROP POLICY IF EXISTS "Authenticated users create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can only add reviews when enabled" ON public.reviews;

CREATE POLICY "Users can only add reviews when enabled" ON public.reviews
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND EXISTS (
    SELECT 1 FROM public.site_settings WHERE id = 1 AND global_rating_mode = 'enabled'
  )
  AND EXISTS (
    SELECT 1 FROM public.murtis WHERE id = murti_id AND rating_mode = 'enabled'
  )
);

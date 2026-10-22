# Amol Marble Murti Bhandar — FastAPI & Supabase Backend

Production-grade, asynchronous backend API built with **FastAPI** and **Supabase (PostgreSQL 15+)** for Amol Marble Murti Bhandar (Murti Hub).

---

## 🏛️ Architecture Overview

- **Framework**: FastAPI (Python 3.12+)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: JWT Bearer Tokens with bcrypt password hashing
- **File & Media Storage**: Supabase Storage (`catalog-images` bucket) with local fallback
- **Interactive Documentation**: Swagger UI at `/docs` and ReDoc at `/redoc`

---

## ⚡ Admin Operations Implemented

| # | Feature | Endpoints | Description |
|---|---|---|---|
| **1** | **Category Images Section** | `PUT /api/categories/{id}`<br>`GET /api/categories` | Edit category icon image (`img`) and top hero banner image (`banner_url`), sort order, and active status. |
| **2** | **Product Management & Listing** | `GET /api/products`<br>`POST /api/products`<br>`PUT /api/products/{id}`<br>`DELETE /api/products/{id}` | Complete CRUD for idols, pricing, discount pills, materials, stock status, and filters (deity, group, price). |
| **3** | **Dedicated Catalog Image Section** | Included in Murti schema:<br>`primary_catalog_image`<br>`catalog_images` (JSONB) | In every product, a dedicated catalog image section with primary image and gallery JSONB array with captions and sort orders. |
| **4** | **WhatsApp Number Change** | `PATCH /api/settings/whatsapp`<br>`PUT /api/settings` | Admin can update WhatsApp concierge number & default inquiry greeting message dynamically. |
| **5** | **On/Off/Static Rating Section** | `PATCH /api/settings/rating-mode`<br>`POST /api/reviews/product/{id}` | Global toggle + per-product override (`enabled`, `read_only`, `hidden`). In `read_only` mode, users can only see ratings, and submissions return **403 Forbidden**. Supports static rating values (e.g. 5.00, 4.95). |
| **6** | **Festival Section Management** | `GET /api/festivals/active`<br>`PUT /api/festivals/{id}`<br>`POST /api/festivals/{id}/items` | Edit festival title, subtitle, banner, badge, and link products with custom festival override prices & promotional tags. |
| **7** | **Master Sizes Management** | `GET, POST, PUT, DELETE /api/sizes`<br>`POST /api/products/{id}/variants` | Manage reusable size tags (e.g. "9 cm Compact", "15 cm Mandir", "1.5 Feet", "Mandal 5 Feet") and link product size variants. |
| **+** | **Standard Admin Operations** | `POST /api/auth/login`<br>`GET /api/admin/dashboard`<br>`PUT /api/reviews/admin/{id}` | JWT auth, dashboard analytics overview, review moderation, seller reply posting, and database sync. |

---

## 🚀 Quick Start (Running Locally)

### 1. Set Up Python Virtual Environment
```bash
cd backend

# Create virtual environment
uv venv .venv --python "D:\Python312\python.exe"

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\activate

# Install dependencies
uv pip install -r requirements.txt
```

### 2. Configure Environment (`.env`)
Copy `.env.example` to `.env`:
```ini
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Supabase Credentials (optional for local in-memory testing)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Credentials
ADMIN_EMAIL=admin@amolmurtibhandar.com
ADMIN_PASSWORD=admin123
JWT_SECRET=amol-murti-secret-key-jaipur-2026-bhandar
```
> **Note**: If `SUPABASE_URL` is empty, the backend automatically runs in persistent local store mode (`backend/data/store.json`), so all product changes, categories, WhatsApp settings, size variants, and festival campaigns are automatically saved to disk and survive server restarts!

### 3. Start FastAPI Server
```bash
python run.py
```
Or with uvicorn:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Open Swagger API Docs: **[http://localhost:8000/docs](http://localhost:8000/docs)**
- Health Check: **[http://localhost:8000/health](http://localhost:8000/health)**

### 4. Run Automated Test Suite
```bash
.\.venv\Scripts\python.exe test_api.py
```
This tests all 7 admin operations, auth, WhatsApp update, rating mode enforcement, and size creation.

---

## 🗄️ Supabase Database Setup

### Step 1: Execute Schema SQL
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** -> **New Query**.
3. Copy the contents of [`backend/supabase/schema.sql`](supabase/schema.sql) and click **Run**.
4. This creates:
   - `rating_display_mode` ENUM (`enabled`, `read_only`, `hidden`)
   - `public.site_settings`
   - `public.master_sizes`
   - `public.categories` (with `banner_url`)
   - `public.murtis` (with `primary_catalog_image`, `catalog_images` JSONB, `rating_mode`, and `static_rating_value`)
   - `public.murti_variants` (linked to `master_sizes`)
   - `public.festival_sections` & `public.festival_section_items`
   - `public.reviews`
   - `public.admin_users`
   - Triggers for `updated_at`
   - Database-level RLS policies enforcing rating mode and admin privileges

### Step 2: Seed Initial Data
1. In Supabase **SQL Editor**, open [`backend/supabase/seed.sql`](supabase/seed.sql) and click **Run**.
2. Or use the 1-click Admin endpoint: `POST /api/admin/seed`.

---

## 🛡️ Database-Level Rating Enforcement (Req #5)

In addition to FastAPI route validation, Supabase Row Level Security (RLS) guarantees at the database engine level that no user can insert a review when ratings are disabled or set to static view-only mode:

```sql
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
```

---

## 💻 Running the Full-Stack Application

1. **Terminal 1 (FastAPI Backend)**:
   ```bash
   cd backend
   .\.venv\Scripts\python.exe run.py
   ```
2. **Terminal 2 (React Frontend)**:
   ```bash
   cd murti-hub
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.
3. Click the **"Admin Portal"** button in the header navbar (or footer) to log in with:
   - **Email**: `admin@amolmurtibhandar.com`
   - **Password**: `admin123`
4. Experience all 7 admin operations visually with real-time storefront synchronization!

import os
import json
import uuid
import datetime
from typing import Optional, List, Dict, Any
from app.config import settings

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STORE_FILE = os.path.join(DATA_DIR, "store.json")

# Global flag for whether Supabase is active
_supabase_client = None

def get_supabase():
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    
    url = settings.SUPABASE_URL.strip()
    key = (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY).strip()
    
    if url and url.startswith("https://") and "your-project" not in url and key and len(key) > 20:
        try:
            from supabase import create_client, Client
            _supabase_client = create_client(url, key)
            return _supabase_client
        except Exception as e:
            print(f"[Supabase] Warning: Could not initialize Supabase client ({e}). Using local persistent store.")
            return None
    return None

_tables_verified = False

def is_supabase_connected() -> bool:
    global _tables_verified
    client = get_supabase()
    if client is None:
        return False
    # Supabase must have the service role key to bypass RLS and perform admin CRUD mutations
    if not settings.SUPABASE_SERVICE_ROLE_KEY or len(settings.SUPABASE_SERVICE_ROLE_KEY.strip()) < 10:
        return False
    if _tables_verified:
        return True
    try:
        # Verify schema tables exist
        res = client.table("site_settings").select("id").limit(1).execute()
        _tables_verified = True
        return True
    except Exception as e:
        # Schema tables not yet created in Supabase SQL Editor
        return False

# ============================================================================
# PERSISTENT LOCAL DATA REPOSITORY (Pre-seeded with rich catalog data)
# ============================================================================
class LocalStore:
    def __init__(self):
        self.reset(save_to_disk=False)
        if not self.load():
            self.save()
        
    def save(self):
        try:
            os.makedirs(DATA_DIR, exist_ok=True)
            data = {
                "site_settings": self.site_settings,
                "master_sizes": self.master_sizes,
                "categories": self.categories,
                "murtis": self.murtis,
                "festival_sections": self.festival_sections,
                "reviews": self.reviews,
                "orders": getattr(self, "orders", []),
                "admin_users": getattr(self, "admin_users", []),
                "revoked_tokens": getattr(self, "revoked_tokens", []),
                "rate_limits": getattr(self, "rate_limits", {})
            }
            def json_serial(obj):
                if isinstance(obj, (datetime.datetime, datetime.date)):
                    return obj.isoformat()
                raise TypeError(f"Type {type(obj)} not serializable")

            with open(STORE_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, default=json_serial, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[LocalStore] Warning: Failed to persist store to {STORE_FILE}: {e}")

    def load(self) -> bool:
        if not os.path.exists(STORE_FILE):
            return False
        try:
            with open(STORE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            if "site_settings" in data:
                self.site_settings = data["site_settings"]
            if "master_sizes" in data:
                self.master_sizes = data["master_sizes"]
            if "categories" in data:
                self.categories = data["categories"]
            if "murtis" in data:
                self.murtis = data["murtis"]
            if "festival_sections" in data:
                self.festival_sections = data["festival_sections"]
            if "reviews" in data:
                self.reviews = data["reviews"]
            self.orders = data.get("orders", [])
            self.admin_users = data.get("admin_users", [])
            self.revoked_tokens = data.get("revoked_tokens", [])
            self.rate_limits = data.get("rate_limits", {})
            if not self.admin_users:
                self.admin_users = [
                    {
                        "id": "66666666-6666-6666-6666-666666660001",
                        "email": settings.ADMIN_EMAIL or "admin@amolmurtibhandar.com",
                        "full_name": "Master Sculptor Admin",
                        "password_hash": "$2b$12$8S1EN29QkuUKjDYUOeRS4uAcbUYxvGQSnWEZj9KfbFFkdF0tx7FbK",
                        "role": "super_admin",
                        "is_active": True
                    }
                ]
            return True
        except Exception as e:
            print(f"[LocalStore] Warning: Could not read {STORE_FILE}: {e}. Keeping seeded defaults.")
            return False

    def reset(self, save_to_disk=True):
        # 1. Site Settings (Req #4 & Req #5)
        self.site_settings = {
            "id": 1,
            "site_title": "Amol Marble Murti Bhandar - Sacred Jaipur Murtis",
            "whatsapp_number": "+919876543210",
            "whatsapp_default_message": "Namaste! I want to inquire about a Murti on Murti Hub.",
            "global_rating_mode": "enabled",
            "support_email": "support@amolmurtibhandar.com",
            "showroom_address": "Khazane Walon Ka Rasta, Jaipur, Rajasthan 302001",
            "banner_announcement": "Zero-Breakage Crating Guarantee across all 19,000+ PIN codes across India",
            "updated_at": datetime.datetime.now(datetime.timezone.utc)
        }
        
        # 2. Master Sizes (Req #7)
        self.master_sizes = [
            {
                "id": "11111111-1111-1111-1111-111111110001",
                "label": "9 cm (Compact)",
                "height_inches": 3.54,
                "description": "Ideal for office desk, car dash or compact puja room",
                "sort_order": 1,
                "is_active": True,
                "created_at": datetime.datetime.now(datetime.timezone.utc)
            },
            {
                "id": "11111111-1111-1111-1111-111111110002",
                "label": "15 cm (Home Mandir)",
                "height_inches": 5.90,
                "description": "Our most popular size for everyday home mandir worship",
                "sort_order": 2,
                "is_active": True,
                "created_at": datetime.datetime.now(datetime.timezone.utc)
            },
            {
                "id": "11111111-1111-1111-1111-111111110003",
                "label": "24 cm (Grand Temple)",
                "height_inches": 9.45,
                "description": "Substantial idol for dedicated temple rooms & altars",
                "sort_order": 3,
                "is_active": True,
                "created_at": datetime.datetime.now(datetime.timezone.utc)
            },
            {
                "id": "11111111-1111-1111-1111-111111110004",
                "label": "1.5 Feet (18 Inches)",
                "height_inches": 18.00,
                "description": "Hand-carved single Makrana marble block for large mandirs",
                "sort_order": 4,
                "is_active": True,
                "created_at": datetime.datetime.now(datetime.timezone.utc)
            },
            {
                "id": "11111111-1111-1111-1111-111111110005",
                "label": "Mandal 3 Feet",
                "height_inches": 36.00,
                "description": "Sanctified temple installation piece with high relief chiselwork",
                "sort_order": 5,
                "is_active": True,
                "created_at": datetime.datetime.now(datetime.timezone.utc)
            }
        ]
        
        # 3. Categories (Req #1: Banners & images)
        self.categories = [
            {
                "id": "22222222-2222-2222-2222-222222220001",
                "name": "Gajanan Maharaj",
                "slug": "gajanan-maharaj",
                "deity": "Gajanan Maharaj",
                "route": "shop-all",
                "img": "/images/categories/gajanan-maharaj@2x.png",
                "banner_url": "/images/categories/gajanan-maharaj@2x.png",
                "description": "Sant Shiromani Shri Gajanan Maharaj idols in Makrana marble",
                "sort_order": 1,
                "is_active": True
            },
            {
                "id": "22222222-2222-2222-2222-222222220002",
                "name": "Navratri Drop",
                "slug": "navratri-drop",
                "deity": "Durga",
                "route": "navratri",
                "img": "/images/categories/navratri-drop@2x.png",
                "banner_url": "/images/categories/navratri-drop@2x.png",
                "description": "Limited edition Navratri idols of Maa Durga, Lakshmi & Parvati",
                "sort_order": 2,
                "is_active": True
            },
            {
                "id": "22222222-2222-2222-2222-222222220003",
                "name": "Shiva",
                "slug": "shiva",
                "deity": "Shiva",
                "route": "shop-all",
                "img": "/images/categories/shiva@2x.png",
                "banner_url": "/images/categories/shiva@2x.png",
                "description": "Mahadev, Narmadeshwar Shivling and sacred Nandi idols",
                "sort_order": 3,
                "is_active": True
            },
            {
                "id": "22222222-2222-2222-2222-222222220004",
                "name": "Hanuman",
                "slug": "hanuman",
                "deity": "Hanuman",
                "route": "shop-all",
                "img": "/images/categories/hanuman@2x.png",
                "banner_url": "/images/categories/hanuman@2x.png",
                "description": "Veer Hanuman Ji, Sanjeevani and Anjali Mudra murtis",
                "sort_order": 4,
                "is_active": True
            },
            {
                "id": "22222222-2222-2222-2222-222222220005",
                "name": "Krishna",
                "slug": "krishna",
                "deity": "Krishna",
                "route": "shop-all",
                "img": "/images/categories/krishna@2x.png",
                "banner_url": "/images/categories/krishna@2x.png",
                "description": "Bal Gopal and Kanha with Bansuri hand-carved murtis",
                "sort_order": 5,
                "is_active": True
            },
            {
                "id": "22222222-2222-2222-2222-222222220006",
                "name": "Ganpati",
                "slug": "ganpati",
                "deity": "Ganesha",
                "route": "shop-all",
                "img": "/images/categories/ganpati@2x.png",
                "banner_url": "/images/categories/ganpati@2x.png",
                "description": "Vighnaharta Ganesha in white Makrana marble with modak",
                "sort_order": 6,
                "is_active": True
            },
            {
                "id": "22222222-2222-2222-2222-222222220007",
                "name": "Ram",
                "slug": "ram",
                "deity": "Ram",
                "route": "shop-all",
                "img": "/images/categories/ram@2x.png",
                "banner_url": "/images/categories/ram@2x.png",
                "description": "Ayodhya Shri Ram Darbar complete family altar idols",
                "sort_order": 7,
                "is_active": True
            },
            {
                "id": "22222222-2222-2222-2222-222222220008",
                "name": "Durga & Shakti",
                "slug": "durga-shakti",
                "deity": "Durga",
                "route": "shop-all",
                "img": "/images/categories/durga-shakti@2x.png",
                "banner_url": "/images/categories/durga-shakti@2x.png",
                "description": "Sherawali Maa Durga 8-armed sanctified marble idols",
                "sort_order": 8,
                "is_active": True
            },
            {
                "id": "22222222-2222-2222-2222-222222220009",
                "name": "Murugan",
                "slug": "murugan",
                "deity": "Murugan",
                "route": "shop-all",
                "img": "/images/categories/murugan@2x.png",
                "banner_url": "/images/categories/murugan@2x.png",
                "description": "Lord Murugan and Bhagwan Dattatreya trimurti idols",
                "sort_order": 9,
                "is_active": True
            },
            {
                "id": "22222222-2222-2222-2222-222222220010",
                "name": "Hand Paint",
                "slug": "hand-paint",
                "deity": "Sacred Art",
                "route": "sacred",
                "img": "/images/categories/hand-paint@2x.png",
                "banner_url": "/images/categories/hand-paint@2x.png",
                "description": "24K gold foil embossed hand-painted sacred artifacts",
                "sort_order": 10,
                "is_active": True
            }
        ]
        
        # 4. Products / Murtis (Req #2, Req #3: Catalog Images, Req #5: Rating mode)
        self.murtis = [
            {
                "id": "33333333-3333-3333-3333-333333330001",
                "legacy_id": 1,
                "title": "Ram Darbar - Divine Blessings | Ram, Sita, Laxman & Hanuman in Pure White Marble",
                "slug": "ram-darbar-divine-blessings",
                "category_id": "22222222-2222-2222-2222-222222220007",
                "deity": "Ram",
                "group_tag": "most-loved",
                "price": 1499.00,
                "old_price": 2599.00,
                "off_text": "42% off",
                "material": "Pure White Makrana Marble",
                "description": "Sanctified Shri Ram Darbar featuring Prabhu Ram, Mata Sita, Lakshman Ji and Bhakt Hanuman in eternal devotion. Hand-carved in Grade-A Makrana marble with delicate 24K gold foil accents.",
                "dimensions": "9 cm x 6 cm x 4 cm",
                "weight": "850 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/ram-darbar.png",
                "catalog_images": [
                    {"url": "/images/products/ram-darbar.png", "caption": "Front Sacred View - Golden Mukut & Bow", "sort_order": 1},
                    {"url": "/images/products/ram-darbar.png", "caption": "Detailed Hand Carving of Lakshman & Hanuman", "sort_order": 2},
                    {"url": "/images/products/ram-darbar.png", "caption": "Back Inscription & Makrana Polished Marble", "sort_order": 3}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 5.00,
                "static_reviews_count": 48,
                "stock_status": "in_stock",
                "is_featured": True,
                "is_active": True,
                "sort_order": 1,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": [
                    {
                        "id": "v101",
                        "murti_id": "33333333-3333-3333-3333-333333330001",
                        "size_id": "11111111-1111-1111-1111-111111110001",
                        "variant_name": "9 cm Compact",
                        "price": 1499.00,
                        "discount_price": 2599.00,
                        "variant_image_url": "/images/products/ram-darbar.png",
                        "stock_quantity": 50,
                        "is_active": True,
                        "sort_order": 1
                    },
                    {
                        "id": "v102",
                        "murti_id": "33333333-3333-3333-3333-333333330001",
                        "size_id": "11111111-1111-1111-1111-111111110002",
                        "variant_name": "15 cm Home Mandir",
                        "price": 2099.00,
                        "discount_price": 3199.00,
                        "variant_image_url": "/images/products/ram-darbar.png",
                        "stock_quantity": 30,
                        "is_active": True,
                        "sort_order": 2
                    },
                    {
                        "id": "v103",
                        "murti_id": "33333333-3333-3333-3333-333333330001",
                        "size_id": "11111111-1111-1111-1111-111111110003",
                        "variant_name": "24 cm Grand Temple",
                        "price": 2999.00,
                        "discount_price": 4599.00,
                        "variant_image_url": "/images/products/ram-darbar.png",
                        "stock_quantity": 15,
                        "is_active": True,
                        "sort_order": 3
                    }
                ]
            },
            {
                "id": "33333333-3333-3333-3333-333333330002",
                "legacy_id": 2,
                "title": "Bal Ganesha & Kanha with Bansuri - 9 cm Hand-Carved Marble Murti",
                "slug": "bal-ganesha-kanha-bansuri",
                "category_id": "22222222-2222-2222-2222-222222220005",
                "deity": "Krishna",
                "group_tag": "most-loved",
                "price": 1499.00,
                "old_price": 1999.00,
                "off_text": "25% off",
                "material": "Pure White Makrana Marble",
                "description": "Tender Baal Roop depicting Little Krishna with his flute alongside Bal Ganesha with laddu. Fills every room with innocence, joy and protection.",
                "dimensions": "9 cm x 7 cm x 4 cm",
                "weight": "750 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/bal-ganesha-flute.png",
                "catalog_images": [
                    {"url": "/images/products/bal-ganesha-flute.png", "caption": "Pran Pratishtha Ready Baal Roop", "sort_order": 1},
                    {"url": "/images/products/bal-ganesha-flute.png", "caption": "Golden Bansuri & Mor Pankh Detailing", "sort_order": 2}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 5.00,
                "static_reviews_count": 34,
                "stock_status": "in_stock",
                "is_featured": True,
                "is_active": True,
                "sort_order": 2,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330003",
                "legacy_id": 3,
                "title": "Standing Mahadev with Golden Trishul, Damru & Crescent Moon",
                "slug": "standing-mahadev-golden-trishul",
                "category_id": "22222222-2222-2222-2222-222222220003",
                "deity": "Shiva",
                "group_tag": "most-loved",
                "price": 1499.00,
                "old_price": 2599.00,
                "off_text": "42% off",
                "material": "Pure White Makrana Marble",
                "description": "Majestic standing Lord Shiva holding the Trishul and Damru with Chandra crescent and holy Ganga emanating from His Jata. High Polish finish.",
                "dimensions": "12 cm x 5 cm x 4 cm",
                "weight": "900 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/standing-shiva-trishul.png",
                "catalog_images": [
                    {"url": "/images/products/standing-shiva-trishul.png", "caption": "Standing Mahadev with Golden Trishul", "sort_order": 1},
                    {"url": "/images/products/standing-shiva-trishul.png", "caption": "Hand-Polished Serpent Hood & Damru", "sort_order": 2}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 4.95,
                "static_reviews_count": 62,
                "stock_status": "in_stock",
                "is_featured": True,
                "is_active": True,
                "sort_order": 3,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330004",
                "legacy_id": 4,
                "title": "Black Narmadeshwar Shivling with Sacred Rudraksha Mala Altar",
                "slug": "black-narmadeshwar-shivling-rudraksha",
                "category_id": "22222222-2222-2222-2222-222222220003",
                "deity": "Shiva",
                "group_tag": "most-loved",
                "price": 1299.00,
                "old_price": 1599.00,
                "off_text": "18% off",
                "material": "Natural Narmada River Stone & White Marble",
                "description": "Consecrated naturally formed Narmadeshwar Shivling nestled on a white marble Yoni Peeth with an authentic 108 Panchamukhi Rudraksha garland.",
                "dimensions": "8 cm x 6 cm x 6 cm",
                "weight": "650 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": False,
                "primary_catalog_image": "/images/products/black-shivling-rudraksha.png",
                "catalog_images": [
                    {"url": "/images/products/black-shivling-rudraksha.png", "caption": "Natural Sacred Narmadeshwar Stone", "sort_order": 1}
                ],
                "rating_mode": "read_only",
                "static_rating_value": 4.90,
                "static_reviews_count": 27,
                "stock_status": "in_stock",
                "is_featured": False,
                "is_active": True,
                "sort_order": 4,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330007",
                "legacy_id": 7,
                "title": "Maa Lakshmi & Parvati – The Grace of Abundance | 24K Gold Zaree Detailing",
                "slug": "maa-lakshmi-parvati-grace",
                "category_id": "22222222-2222-2222-2222-222222220002",
                "deity": "Durga",
                "group_tag": "navratri",
                "price": 1499.00,
                "old_price": 1999.00,
                "off_text": "25% OFF",
                "material": "Pure White Makrana Marble with 24K Gold",
                "description": "Divine pair of Maa Lakshmi and Mata Parvati hand-sculpted for prosperity, peace and auspiciousness during Navratri and Diwali pooja.",
                "dimensions": "10 cm x 8 cm x 4 cm",
                "weight": "950 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/parvati-lakshmi.png",
                "catalog_images": [
                    {"url": "/images/products/parvati-lakshmi.png", "caption": "Maa Lakshmi & Parvati 24K Gold Zaree", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 5.00,
                "static_reviews_count": 42,
                "stock_status": "in_stock",
                "is_featured": True,
                "is_active": True,
                "sort_order": 7,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330008",
                "legacy_id": 8,
                "title": "Maa Durga – The Spirit of Celebration | Hand-Finished Lion-Riding Idol",
                "slug": "maa-durga-spirit-celebration",
                "category_id": "22222222-2222-2222-2222-222222220002",
                "deity": "Durga",
                "group_tag": "navratri",
                "price": 1499.00,
                "old_price": 1999.00,
                "off_text": "25% OFF",
                "material": "Pure White Makrana Marble",
                "description": "Hand-finished lion-riding idol consecrated for Navratri Golu, home temple installation and festive gifting.",
                "dimensions": "11 cm x 8 cm x 5 cm",
                "weight": "1.1 kg",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/durga-sherawali.png",
                "catalog_images": [
                    {"url": "/images/products/durga-sherawali.png", "caption": "Maa Durga Festive Drop Special", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 5.00,
                "static_reviews_count": 55,
                "stock_status": "in_stock",
                "is_featured": True,
                "is_active": True,
                "sort_order": 8,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330009",
                "legacy_id": 9,
                "title": "Bhagwan Dattatreya (Trimurti Brahma, Vishnu & Shiva) with Kamadhenu Cow",
                "slug": "bhagwan-dattatreya-trimurti",
                "category_id": "22222222-2222-2222-2222-222222220009",
                "deity": "Murugan",
                "group_tag": "navratri",
                "price": 1499.00,
                "old_price": 1999.00,
                "off_text": "25% OFF",
                "material": "Pure White Makrana Marble",
                "description": "Tri-avatar of Brahma, Vishnu and Shiva with four dogs representing four Vedas and sacred Kamadhenu wish-fulfilling cow.",
                "dimensions": "10 cm x 7 cm x 4 cm",
                "weight": "800 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/dattatreya-kamadhenu.png",
                "catalog_images": [
                    {"url": "/images/products/dattatreya-kamadhenu.png", "caption": "Bhagwan Dattatreya with Kamadhenu", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 4.90,
                "static_reviews_count": 21,
                "stock_status": "in_stock",
                "is_featured": False,
                "is_active": True,
                "sort_order": 9,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330010",
                "legacy_id": 10,
                "title": "Handcrafted Brass Temple Shikhar Kalash – Golden Temple Finial",
                "slug": "handcrafted-brass-temple-shikhar-kalash",
                "category_id": "22222222-2222-2222-2222-222222220003",
                "deity": "Shiva",
                "group_tag": "navratri",
                "price": 1499.00,
                "old_price": 1999.00,
                "off_text": "25% OFF",
                "material": "Heavy Mirror-Polished Brass",
                "description": "Sacred temple kalash finial cast in virgin temple brass to sanctify temple mandir peaks, gopurams and household sanctums.",
                "dimensions": "15 cm x 8 cm x 8 cm",
                "weight": "1.2 kg",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/brass-shikhar-kalash.png",
                "catalog_images": [
                    {"url": "/images/products/brass-shikhar-kalash.png", "caption": "Temple Brass Shikhar Kalash", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 5.00,
                "static_reviews_count": 39,
                "stock_status": "in_stock",
                "is_featured": False,
                "is_active": True,
                "sort_order": 10,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330015",
                "legacy_id": 15,
                "title": "Sant Shiromani Shri Gajanan Maharaj Seated Idol in White Makrana Marble",
                "slug": "sant-gajanan-maharaj-seated",
                "category_id": "22222222-2222-2222-2222-222222220001",
                "deity": "Gajanan Maharaj",
                "group_tag": "sacred",
                "price": 1299.00,
                "old_price": 1999.00,
                "off_text": "35% OFF",
                "material": "Pure White Makrana Marble",
                "description": "Shegaon divine saint Gajanan Maharaj seated in meditative samadhi posture with gentle compassionate gaze.",
                "dimensions": "9 cm x 6 cm x 5 cm",
                "weight": "850 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/gajanan-maharaj.png",
                "catalog_images": [
                    {"url": "/images/products/gajanan-maharaj.png", "caption": "Shri Gajanan Maharaj Seated Avatar", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 5.00,
                "static_reviews_count": 88,
                "stock_status": "in_stock",
                "is_featured": True,
                "is_active": True,
                "sort_order": 15,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330005",
                "legacy_id": 5,
                "title": "Sacred Shivling with Golden Sheshnaag Hood on Marble Pedestal",
                "slug": "sacred-shivling-golden-sheshnaag",
                "category_id": "22222222-2222-2222-2222-222222220003",
                "deity": "Shiva",
                "group_tag": "most-loved",
                "price": 999.00,
                "old_price": 2999.00,
                "off_text": "66% off",
                "material": "Pure White Makrana Marble & Brass",
                "description": "Sacred Shivling crowned with a 5-headed golden Sheshnaag protective serpent canopy resting on a polished marble Yoni base.",
                "dimensions": "10 cm x 7 cm x 7 cm",
                "weight": "850 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/shivling-sheshnaag.png",
                "catalog_images": [
                    {"url": "/images/products/shivling-sheshnaag.png", "caption": "Golden Sheshnaag Protective Canopy", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 4.90,
                "static_reviews_count": 52,
                "stock_status": "in_stock",
                "is_featured": True,
                "is_active": True,
                "sort_order": 5,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330006",
                "legacy_id": 6,
                "title": "Sherawali Maa Durga on Lion - 8 Armed Sanctified Marble Idol",
                "slug": "sherawali-maa-durga-lion",
                "category_id": "22222222-2222-2222-2222-222222220008",
                "deity": "Durga",
                "group_tag": "baal-roop",
                "price": 1299.00,
                "old_price": 1999.00,
                "off_text": "35% off",
                "material": "Pure White Makrana Marble",
                "description": "Ashtabhuja (8-armed) Sherawali Mata riding her fearless lion, holding divine Astras. Hand-painted with 24K gold foil trim.",
                "dimensions": "12 cm x 9 cm x 5 cm",
                "weight": "1.2 kg",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/durga-sherawali.png",
                "catalog_images": [
                    {"url": "/images/products/durga-sherawali.png", "caption": "Sherawali Maa Durga 8-Armed Sanctified View", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 5.00,
                "static_reviews_count": 76,
                "stock_status": "in_stock",
                "is_featured": True,
                "is_active": True,
                "sort_order": 6,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330011",
                "legacy_id": 11,
                "title": "Veer Hanuman Ji Carrying Dronagiri Sanjeevani Mountain & Gada",
                "slug": "veer-hanuman-sanjeevani-mountain",
                "category_id": "22222222-2222-2222-2222-222222220004",
                "deity": "Hanuman",
                "group_tag": "similar",
                "price": 1299.00,
                "old_price": 1999.00,
                "off_text": "35% OFF",
                "material": "Pure White Makrana Marble",
                "description": "Sankat Mochan Hanuman in flying posture bearing the life-giving Sanjeevani mountain on His right palm and golden Gada in His left hand.",
                "dimensions": "11 cm x 8 cm x 4 cm",
                "weight": "850 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/hanuman-sanjeevani.png",
                "catalog_images": [
                    {"url": "/images/products/hanuman-sanjeevani.png", "caption": "Veer Hanuman with Sanjeevani Mountain", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 5.00,
                "static_reviews_count": 64,
                "stock_status": "in_stock",
                "is_featured": False,
                "is_active": True,
                "sort_order": 11,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330012",
                "legacy_id": 12,
                "title": "Bhakt Hanuman Ji in Pranam - Anjali Mudra on Crimson Altar",
                "slug": "bhakt-hanuman-pranam-anjali",
                "category_id": "22222222-2222-2222-2222-222222220004",
                "deity": "Hanuman",
                "group_tag": "similar",
                "price": 1999.00,
                "old_price": 2999.00,
                "off_text": "33% OFF",
                "material": "Pure White Makrana Marble",
                "description": "Sublime seated Hanuman Ji in folded hands (Pranam / Anjali Mudra) in absolute devotion to Prabhu Shri Ram. Ideal for consecrated altars.",
                "dimensions": "13 cm x 7 cm x 6 cm",
                "weight": "1.3 kg",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/hanuman-pranam.png",
                "catalog_images": [
                    {"url": "/images/products/hanuman-pranam.png", "caption": "Bhakt Hanuman in Anjali Pranam Mudra", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 5.00,
                "static_reviews_count": 47,
                "stock_status": "in_stock",
                "is_featured": False,
                "is_active": True,
                "sort_order": 12,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330013",
                "legacy_id": 13,
                "title": "Ganesha Trio - White Marble with Golden Crowns & Modak",
                "slug": "ganesha-trio-white-marble",
                "category_id": "22222222-2222-2222-2222-222222220006",
                "deity": "Ganesha",
                "group_tag": "similar",
                "price": 1999.00,
                "old_price": 2999.00,
                "off_text": "33% OFF",
                "material": "Pure White Makrana Marble",
                "description": "Auspicious trio of Lord Ganesha in varied mudras holding the Modak and Ankusha. Bestows Vighnaharta blessings for home entryways.",
                "dimensions": "10 cm x 14 cm x 4 cm",
                "weight": "1.4 kg",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/ganesha-trio.png",
                "catalog_images": [
                    {"url": "/images/products/ganesha-trio.png", "caption": "Ganesha Trio with Golden Crowns", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 4.95,
                "static_reviews_count": 38,
                "stock_status": "in_stock",
                "is_featured": False,
                "is_active": True,
                "sort_order": 13,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330014",
                "legacy_id": 14,
                "title": "Sacred Nandi Bull - Hand-Polished White Marble with Golden Horns",
                "slug": "sacred-nandi-bull-golden-horns",
                "category_id": "22222222-2222-2222-2222-222222220003",
                "deity": "Shiva",
                "group_tag": "similar",
                "price": 799.00,
                "old_price": 1499.00,
                "off_text": "47% OFF",
                "material": "Pure White Makrana Marble",
                "description": "Hand-polished Nandi Bull gazing towards Lord Shiva in serene seated posture, adorned with golden bells and embroidered royal saddle.",
                "dimensions": "8 cm x 9 cm x 4 cm",
                "weight": "600 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/nandi-bull.png",
                "catalog_images": [
                    {"url": "/images/products/nandi-bull.png", "caption": "Sacred Nandi with Golden Horns & Bells", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 4.85,
                "static_reviews_count": 29,
                "stock_status": "in_stock",
                "is_featured": False,
                "is_active": True,
                "sort_order": 14,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330016",
                "legacy_id": 16,
                "title": "Shri Gajanan Maharaj Shegaon Avatar with Marigold Garland - Hand-Finished Marble",
                "slug": "shri-gajanan-maharaj-shegaon-garland",
                "category_id": "22222222-2222-2222-2222-222222220001",
                "deity": "Gajanan Maharaj",
                "group_tag": "sacred",
                "price": 1499.00,
                "old_price": 2299.00,
                "off_text": "34% OFF",
                "material": "Pure White Makrana Marble",
                "description": "Exquisite Shegaon Gajanan Maharaj idol adorned with hand-carved orange marigold garland and sacred tilak. An emblem of spiritual shelter.",
                "dimensions": "12 cm x 7 cm x 5 cm",
                "weight": "950 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/gajanan-maharaj.png",
                "catalog_images": [
                    {"url": "/images/products/gajanan-maharaj.png", "caption": "Gajanan Maharaj with Marigold Garland", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 5.00,
                "static_reviews_count": 91,
                "stock_status": "in_stock",
                "is_featured": False,
                "is_active": True,
                "sort_order": 16,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330017",
                "legacy_id": 17,
                "title": "Grand Temple Kalash Pinnacle Tower - Mirror-Polished Brass",
                "slug": "grand-temple-kalash-pinnacle",
                "category_id": "22222222-2222-2222-2222-222222220003",
                "deity": "Shiva",
                "group_tag": "sacred",
                "price": 899.00,
                "old_price": 1499.00,
                "off_text": "40% OFF",
                "material": "Heavy Temple Brass",
                "description": "Multi-tier temple Kalash spire finial crafted with precision concentric brass rings to anchor cosmic energies atop home mandir domes.",
                "dimensions": "14 cm x 7 cm x 7 cm",
                "weight": "900 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": False,
                "primary_catalog_image": "/images/products/golden-kalash-shikhar.png",
                "catalog_images": [
                    {"url": "/images/products/golden-kalash-shikhar.png", "caption": "Grand Temple Brass Kalash Finial", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 4.90,
                "static_reviews_count": 31,
                "stock_status": "in_stock",
                "is_featured": False,
                "is_active": True,
                "sort_order": 17,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330018",
                "legacy_id": 18,
                "title": "Trimurti Bhagwan Dattatreya with Kamadhenu & Four Sacred Vedas",
                "slug": "trimurti-dattatreya-sacred-vedas",
                "category_id": "22222222-2222-2222-2222-222222220009",
                "deity": "Murugan",
                "group_tag": "sacred",
                "price": 1499.00,
                "old_price": 1999.00,
                "off_text": "25% OFF",
                "material": "Pure White Makrana Marble",
                "description": "Sacred Dattatreya idol featuring three faces of Brahma, Vishnu, Mahesh accompanied by Kamadhenu under the Audumbar tree canopy.",
                "dimensions": "11 cm x 8 cm x 4 cm",
                "weight": "850 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/dattatreya-kamadhenu.png",
                "catalog_images": [
                    {"url": "/images/products/dattatreya-kamadhenu.png", "caption": "Lord Dattatreya Trimurti Makrana Marble", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 4.95,
                "static_reviews_count": 40,
                "stock_status": "in_stock",
                "is_featured": False,
                "is_active": True,
                "sort_order": 18,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330019",
                "legacy_id": 19,
                "title": "Baal Roop Kaali Mata & Durga Lion-Rider Idol",
                "slug": "baal-roop-kaali-mata-durga",
                "category_id": "22222222-2222-2222-2222-222222220008",
                "deity": "Durga",
                "group_tag": "baal-roop",
                "price": 1299.00,
                "old_price": 1999.00,
                "off_text": "35% OFF",
                "material": "Pure White Makrana Marble",
                "description": "Tender and protective Baal Roop of Maa Durga with radiant abhaya mudra. Hand-sculpted in Jaipur with natural stone pigments.",
                "dimensions": "10 cm x 7 cm x 4 cm",
                "weight": "750 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/durga-sherawali.png",
                "catalog_images": [
                    {"url": "/images/products/durga-sherawali.png", "caption": "Baal Roop Durga Lion Rider", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 4.90,
                "static_reviews_count": 25,
                "stock_status": "in_stock",
                "is_featured": False,
                "is_active": True,
                "sort_order": 19,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            },
            {
                "id": "33333333-3333-3333-3333-333333330020",
                "legacy_id": 20,
                "title": "Pavan Sut Hanuman Ji with Sanjeevani Mountain - Road Guardian",
                "slug": "pavan-sut-hanuman-road-guardian",
                "category_id": "22222222-2222-2222-2222-222222220004",
                "deity": "Hanuman",
                "group_tag": "baal-roop",
                "price": 1499.00,
                "old_price": 1999.00,
                "off_text": "25% OFF",
                "material": "Pure White Makrana Marble",
                "description": "Compact consecrated Pavan Sut Maruti idol specifically chiseled for vehicle dash altars and travel protection with Gada and Parvat.",
                "dimensions": "9 cm x 6 cm x 4 cm",
                "weight": "650 grams",
                "pran_pratishtha_ready": True,
                "gold_leaf_karigari": True,
                "primary_catalog_image": "/images/products/hanuman-sanjeevani.png",
                "catalog_images": [
                    {"url": "/images/products/hanuman-sanjeevani.png", "caption": "Road Guardian Pavan Sut Hanuman", "sort_order": 1}
                ],
                "rating_mode": "enabled",
                "static_rating_value": 5.00,
                "static_reviews_count": 83,
                "stock_status": "in_stock",
                "is_featured": False,
                "is_active": True,
                "sort_order": 20,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "variants": []
            }
        ]
        
        # 5. Festival Sections & Linked Items (Req #6)
        self.festival_sections = [
            {
                "id": "44444444-4444-4444-4444-444444440001",
                "title": "Navratri Collection",
                "subtitle": "A Meaningful Gift. A Blessing That Stays. Consecrated Sherawali Maa Durga, Lakshmi & Parvati in pristine white Makrana marble with 24K gold foil detailing.",
                "banner_image_url": "/images/categories/navratri-drop@2x.png",
                "badge_text": "Navratri 2026 Special",
                "announcement_tag": "FESTIVE EDIT",
                "is_active": True,
                "start_date": datetime.datetime.now(datetime.timezone.utc),
                "end_date": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30),
                "sort_order": 1,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "updated_at": datetime.datetime.now(datetime.timezone.utc),
                "items": [
                    {
                        "id": "fi-1",
                        "festival_id": "44444444-4444-4444-4444-444444440001",
                        "murti_id": "33333333-3333-3333-3333-333333330007",
                        "festival_price": 1349.00,
                        "custom_tag": "Navratri Special 25% Off",
                        "sort_order": 1,
                        "murti_title": "Maa Lakshmi & Parvati – The Grace of Abundance",
                        "murti_image": "/images/products/parvati-lakshmi.png",
                        "original_price": 1499.00
                    },
                    {
                        "id": "fi-2",
                        "festival_id": "44444444-4444-4444-4444-444444440001",
                        "murti_id": "33333333-3333-3333-3333-333333330008",
                        "festival_price": 1349.00,
                        "custom_tag": "Early Devotee Blessing",
                        "sort_order": 2,
                        "murti_title": "Maa Durga – The Spirit of Celebration",
                        "murti_image": "/images/products/durga-sherawali.png",
                        "original_price": 1499.00
                    },
                    {
                        "id": "fi-3",
                        "festival_id": "44444444-4444-4444-4444-444444440001",
                        "murti_id": "33333333-3333-3333-3333-333333330009",
                        "festival_price": 1399.00,
                        "custom_tag": "Limited Handcrafted Run",
                        "sort_order": 3,
                        "murti_title": "Bhagwan Dattatreya (Trimurti Brahma, Vishnu & Shiva)",
                        "murti_image": "/images/products/dattatreya-kamadhenu.png",
                        "original_price": 1499.00
                    },
                    {
                        "id": "fi-4",
                        "festival_id": "44444444-4444-4444-4444-444444440001",
                        "murti_id": "33333333-3333-3333-3333-333333330010",
                        "festival_price": 1299.00,
                        "custom_tag": "Temple Kalash Offer",
                        "sort_order": 4,
                        "murti_title": "Handcrafted Brass Temple Shikhar Kalash",
                        "murti_image": "/images/products/brass-shikhar-kalash.png",
                        "original_price": 1499.00
                    }
                ]
            }
        ]
        
        # 6. Reviews (Req #5)
        self.reviews = [
            {
                "id": "55555555-5555-5555-5555-555555550001",
                "murti_id": "33333333-3333-3333-3333-333333330001",
                "author": "Radha Raman S.",
                "avatar_color": "bg-amber-700",
                "location": "Jaipur, Rajasthan",
                "rating": 5,
                "title": "The divine serenity on the face is hypnotic — sits beautifully in my home mandir!",
                "content": "Ordered this sacred murti for our home mandir. The weight and finish of the Makrana marble is exceptional, and the hand-painted 24K gold accents catch the morning light beautifully during aarti. Pran Pratishtha fragrance was still fresh when unboxed!",
                "verified": True,
                "helpful_count": 42,
                "unhelpful_count": 1,
                "tag": "car-dash",
                "has_photo": True,
                "photo_url": "/images/products/ram-darbar.png",
                "seller_reply": {
                    "author": "Amol Murti Concierge (Master Sculptor Team)",
                    "date": "11 Oct 2026",
                    "text": "Namaste Radha Raman ji! We are deeply humbled to know that Bhagwan is accompanying your journeys with grace and safety. May every drive bring divine peace and protection to you and your family. Jai Shri Krishna!"
                },
                "is_approved": True,
                "created_at": datetime.datetime.now(datetime.timezone.utc)
            },
            {
                "id": "55555555-5555-5555-5555-555555550002",
                "murti_id": "33333333-3333-3333-3333-333333330001",
                "author": "Dr. Ananya Iyer",
                "avatar_color": "bg-emerald-700",
                "location": "Bengaluru, Karnataka",
                "rating": 5,
                "title": "Arrived in a 7-layer cushioned wooden crate in pristine condition",
                "content": "Living in South India, I was initially anxious about fragile marble delivery from Rajasthan. But the packaging exceeded all expectations! The idol was nestled inside custom impact-resistant velvet casing within an outer wooden crate. Flawless chisel symmetry, no scratches, pure white Makrana marble stone density. Highly recommended for home mandir installation.",
                "verified": True,
                "helpful_count": 29,
                "unhelpful_count": 0,
                "tag": "mandir",
                "has_photo": False,
                "photo_url": None,
                "seller_reply": {
                    "author": "Amol Murti Concierge",
                    "date": "05 Oct 2026",
                    "text": "Pranam Dr. Ananya ji! Thank you for placing your faith in our Jaipur artisans. Our Zero-Breakage Crating guarantee exists precisely so devotees across India receive their sanctified idols without a scratch. Shubham Bhavatu!"
                },
                "is_approved": True,
                "created_at": datetime.datetime.now(datetime.timezone.utc)
            }
        ]

        # 6. Authoritative Orders & Dispatches (Checklist Section 4)
        self.orders = [
            {
                "order_id": "MH-20261",
                "items": [
                    {
                        "product_id": "33333333-3333-3333-3333-333333330001",
                        "title": "Ram Darbar - Divine Blessings | Ram, Sita, Laxman & Hanuman in Pure White Marble",
                        "unit_price": 1499.0,
                        "qty": 1,
                        "subtotal": 1499.0,
                        "stock_status": "in_stock",
                        "is_available": True,
                        "img": "/images/products/ram-darbar.png"
                    }
                ],
                "subtotal": 1499.0,
                "discount_amount": 225.0,
                "shipping_fee": 0.0,
                "total": 1274.0,
                "shipping": {
                    "full_name": "Ramesh Kumar Sharma",
                    "phone": "+919876543210",
                    "email": "ramesh@example.com",
                    "address": "42, Shanti Nagar, Malviya Nagar",
                    "city": "Jaipur",
                    "state": "Rajasthan",
                    "pincode": "302017",
                    "notes": "Handle with sacred care"
                },
                "payment_method": "cod",
                "payment_status": "cod_verified",
                "order_status": "dispatched",
                "tracking_number": "BD9482104IN",
                "courier": "BlueDart Express Air",
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "timeline": [
                    { "title": "Order Confirmed & Sanctification Prayer", "desc": "Vedic mantras chanted by temple priests", "done": True, "time": "Oct 14, 10:30 AM" },
                    { "title": "Master Artisan Quality Verification", "desc": "Inspection of pure Makrana marble density & gold detailing", "done": True, "time": "Oct 14, 03:45 PM" },
                    { "title": "7-Layer Cushioned Wooden Crate Packed", "desc": "Zero-breakage shock-absorbing insulation applied", "done": True, "time": "Oct 15, 09:15 AM" },
                    { "title": "In Transit — Express Air Cargo", "desc": "Package cleared sorting hub in Jaipur", "done": True, "time": "Oct 15, 12:20 PM" },
                    { "title": "Out for Sacred Doorstep Delivery", "desc": "Expected in 48-72 hours with OTP verification", "done": False, "time": "Estimated Oct 18" }
                ]
            }
        ]
        
        # 7. Admin Users (Hashed bcrypt passwords, zero plaintext)
        self.admin_users = getattr(self, "admin_users", [
            {
                "id": "66666666-6666-6666-6666-666666660001",
                "email": settings.ADMIN_EMAIL or "admin@amolmurtibhandar.com",
                "full_name": "Master Sculptor Admin",
                "password_hash": "$2b$12$8S1EN29QkuUKjDYUOeRS4uAcbUYxvGQSnWEZj9KfbFFkdF0tx7FbK",
                "role": "super_admin",
                "is_active": True
            }
        ])
        if save_to_disk:
            self.save()

local_store = LocalStore()


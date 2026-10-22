from fastapi import APIRouter, Depends
from app.schemas.auth import DashboardStats
from app.schemas.common import ApiResponse
from app.database import get_supabase, is_supabase_connected, local_store
from app.auth import get_current_admin
from app.logger import logger

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard & Stats"])

@router.get("/dashboard", response_model=ApiResponse[DashboardStats], summary="Admin overview dashboard statistics")
def get_dashboard_stats(admin: dict = Depends(get_current_admin)):
    """
    Standard admin operation: Overview metrics for the admin console.
    """
    if is_supabase_connected():
        try:
            client = get_supabase()
            prod_count = len(client.table("murtis").select("id").execute().data or [])
            cat_count = len(client.table("categories").select("id").execute().data or [])
            size_count = len(client.table("master_sizes").select("id").execute().data or [])
            reviews = client.table("reviews").select("id, is_approved").execute().data or []
            fest = client.table("festival_sections").select("title, is_active").eq("is_active", True).limit(1).execute()
            settings_res = client.table("site_settings").select("whatsapp_number, global_rating_mode").eq("id", 1).execute()
            
            # Fallback to local_store if Supabase tables are empty
            if prod_count == 0:
                prod_count = len(local_store.murtis)
            if cat_count == 0:
                cat_count = len(local_store.categories)
            if size_count == 0:
                size_count = len(local_store.master_sizes)
            if len(reviews) == 0:
                reviews = local_store.reviews

            wa_num = "+919876543210"
            rat_mode = "enabled"
            if settings_res.data and len(settings_res.data) > 0:
                wa_num = settings_res.data[0].get("whatsapp_number", wa_num)
                rat_mode = settings_res.data[0].get("global_rating_mode", rat_mode)
                
            fest_title = None
            fest_active = False
            if fest.data and len(fest.data) > 0:
                fest_title = fest.data[0].get("title")
                fest_active = fest.data[0].get("is_active", False)
            elif len(local_store.festival_sections) > 0:
                fest_title = local_store.festival_sections[0].get("title")
                fest_active = local_store.festival_sections[0].get("is_active", True)
                
            return ApiResponse(
                success=True,
                message="Supabase live dashboard statistics",
                data=DashboardStats(
                    total_products=prod_count,
                    total_categories=cat_count,
                    total_sizes=size_count,
                    total_reviews=len(reviews),
                    pending_reviews=len([r for r in reviews if not r.get("is_approved")]),
                    active_festival_title=fest_title,
                    festival_is_active=fest_active,
                    whatsapp_number=wa_num,
                    global_rating_mode=rat_mode
                )
            )
        except Exception as e:
            logger.warning(f"[Supabase Warning: get_dashboard_stats failed ({e}). Falling back to local store]")
        
    # Local store
    active_fest = next((f for f in local_store.festival_sections if f.get("is_active")), None)
    return ApiResponse(
        success=True,
        message="Local store dashboard statistics",
        data=DashboardStats(
            total_products=len(local_store.murtis),
            total_categories=len(local_store.categories),
            total_sizes=len(local_store.master_sizes),
            total_reviews=len(local_store.reviews),
            pending_reviews=len([r for r in local_store.reviews if not r.get("is_approved")]),
            active_festival_title=active_fest["title"] if active_fest else None,
            festival_is_active=bool(active_fest),
            whatsapp_number=local_store.site_settings.get("whatsapp_number", "+919876543210"),
            global_rating_mode=local_store.site_settings.get("global_rating_mode", "enabled")
        )
    )

@router.post("/seed", response_model=ApiResponse[dict], summary="Seed or sync database with default catalog data (Admin only)")
def seed_database(admin: dict = Depends(get_current_admin)):
    """
    Standard admin operation: Seeds Supabase (or resets local store) with:
    - Master sizes (9 cm, 15 cm, 24 cm, 1.5 ft, 3 ft)
    - Categories with banners & images
    - Products with primary catalog image & catalog gallery JSONB
    - Festival section & special pricing
    - Initial reviews & ratings
    """
    if is_supabase_connected():
        try:
            client = get_supabase()
            seeded_info = {"sizes": 0, "categories": 0, "products": 0, "festivals": 0}
            
            # 1. Master sizes
            for s in local_store.master_sizes:
                client.table("master_sizes").upsert(s).execute()
                seeded_info["sizes"] += 1
                
            # 2. Categories
            for c in local_store.categories:
                client.table("categories").upsert(c).execute()
                seeded_info["categories"] += 1
                
            # 3. Products
            for p in local_store.murtis:
                p_copy = p.copy()
                variants = p_copy.pop("variants", [])
                client.table("murtis").upsert(p_copy).execute()
                seeded_info["products"] += 1
                for v in variants:
                    client.table("murti_variants").upsert(v).execute()
                    
            # 4. Festival Section
            for f in local_store.festival_sections:
                f_copy = f.copy()
                items = f_copy.pop("items", [])
                client.table("festival_sections").upsert(f_copy).execute()
                seeded_info["festivals"] += 1
                for item in items:
                    client.table("festival_section_items").upsert({
                        "id": item["id"],
                        "festival_id": item["festival_id"],
                        "murti_id": item["murti_id"],
                        "festival_price": item["festival_price"],
                        "custom_tag": item.get("custom_tag", "Festive Offer"),
                        "sort_order": item.get("sort_order", 0)
                    }).execute()
                    
            return ApiResponse(
                success=True,
                message="Supabase database seeded successfully with all catalog data!",
                data=seeded_info
            )
        except Exception as e:
            logger.warning(f"[Supabase Warning: seed_database failed ({e}). Seeding local in-memory store]")
            
    local_store.reset()
    return ApiResponse(
        success=True,
        message="Local data store reset and seeded successfully",
        data={"products": len(local_store.murtis), "categories": len(local_store.categories)}
    )

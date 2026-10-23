import sys
import os
import json

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_access_token

client = TestClient(app)

# Generate an admin auth header
token = create_access_token({"sub": "admin@amolmurtibhandar.com", "role": "admin"})
auth_headers = {"Authorization": f"Bearer {token}"}

def extract_data(resp):
    j = resp.json()
    if isinstance(j, dict) and "data" in j and "success" in j:
        return j["data"]
    return j

def run_tests():
    print("=== STARTING FULL SUITE TEST ===")
    
    # 1. Test Categories
    print("\n--- 1. Testing Categories API ---")
    cat_payload = {
        "name": "Test Ganpati Bappa",
        "slug": "test-ganpati-bappa",
        "description": "Exquisite white marble Ganesha idols",
        "icon_url": "https://example.com/icon.jpg",
        "banner_url": "https://example.com/banner.jpg",
        "display_order": 99,
        "is_active": True
    }
    r = client.post("/api/categories", json=cat_payload, headers=auth_headers)
    assert r.status_code in [200, 201], f"Failed to create category: {r.text}"
    created_cat = extract_data(r)
    cat_id = created_cat["id"]
    print(f"Created category: {created_cat['name']} (ID: {cat_id})")

    r = client.get("/api/categories")
    assert r.status_code == 200, f"Failed to list categories: {r.text}"
    cats = extract_data(r)
    assert any(c["id"] == cat_id for c in cats), "Created category not in list!"
    print(f"Verified category exists in list of {len(cats)} categories.")

    # 2. Test Master Sizes (with unit and size_value)
    print("\n--- 2. Testing Master Sizes API ---")
    size_payload = {
        "label": "36 Inches (3 Feet)",
        "dimensions": "36\" x 24\" x 12\"",
        "size_value": 36.0,
        "unit": "in",
        "display_order": 1,
        "is_popular": True
    }
    r = client.post("/api/sizes", json=size_payload, headers=auth_headers)
    assert r.status_code in [200, 201], f"Failed to create master size: {r.text}"
    created_size = extract_data(r)
    size_id = created_size["id"]
    assert created_size["unit"] == "in"
    assert created_size["size_value"] == 36.0
    print(f"Created master size: {created_size['label']} (unit: {created_size['unit']}, value: {created_size['size_value']})")

    r = client.get("/api/sizes")
    assert r.status_code == 200, f"Failed to list sizes: {r.text}"
    sizes = extract_data(r)
    assert any(s["id"] == size_id for s in sizes), "Created size not in list!"
    print(f"Verified size exists in list of {len(sizes)} master sizes.")

    # 3. Test Product / Murtis (with measurement_unit and available_sizes)
    print("\n--- 3. Testing Products API with Units and Available Sizes ---")
    murti_payload = {
        "title": "Divine White Makrana Ram Lalla",
        "deity": "Ram",
        "category_id": cat_id,
        "size_id": size_id,
        "dimensions": "36 x 24 x 14",
        "measurement_unit": "in",
        "available_sizes": ["12 in", "24 in", "36 in", "48 in"],
        "price": 125000.0,
        "old_price": 150000.0,
        "material": "Makrana Pure White Marble",
        "primary_catalog_image": "uploads/products/ram-lalla-test.jpg",
        "catalog_images": [
            {"url": "uploads/products/ram-lalla-angle1.jpg", "caption": "Front Angle", "sort_order": 1},
            {"url": "uploads/products/ram-lalla-angle2.jpg", "caption": "Side Profile", "sort_order": 2}
        ],
        "is_featured": True,
        "stock_status": "in_stock"
    }
    r = client.post("/api/products", json=murti_payload, headers=auth_headers)
    assert r.status_code in [200, 201], f"Failed to create product: {r.text}"
    created_murti = extract_data(r)
    murti_id = created_murti["id"]
    assert created_murti["measurement_unit"] == "in"
    assert created_murti["available_sizes"] == ["12 in", "24 in", "36 in", "48 in"]
    assert len(created_murti["catalog_images"]) == 2
    print(f"Created product: {created_murti['title']} (ID: {murti_id})")
    print(f"  - Measurement unit: {created_murti['measurement_unit']}")
    print(f"  - Available sizes: {created_murti['available_sizes']}")
    print(f"  - Catalog images: {len(created_murti['catalog_images'])}")

    # 4. Test Site Settings (with collection_* fields)
    print("\n--- 4. Testing Site Settings API with Sacred Collection Content ---")
    settings_payload = {
        "whatsapp_number": "+919876543210",
        "collection_title": "DIVINE MAKRANA SACRED COLLECTION 2026",
        "collection_badge": "HAND-CARVED BY NATIONAL AWARD ARTISANS",
        "collection_subtitle": "Consecrated Heritage Masterpieces",
        "collection_description": "Exclusive hand-sculpted Makrana marble murtis with 24K real gold leaf work.",
        "collection_price_from": "₹45,000",
        "collection_old_price": "₹65,000",
        "collection_discount_text": "30% CONSECRATION DISCOUNT",
        "collection_tag": "LIMITED EDITION 2026",
        "collection_image_url": "uploads/banners/sacred-collection-hero.jpg"
    }
    r = client.put("/api/settings", json=settings_payload, headers=auth_headers)
    assert r.status_code == 200, f"Failed to update settings: {r.text}"
    updated_settings = extract_data(r)
    assert updated_settings["collection_title"] == "DIVINE MAKRANA SACRED COLLECTION 2026"
    assert updated_settings["collection_discount_text"] == "30% CONSECRATION DISCOUNT"
    print(f"Updated Site Settings with Hero Collection:")
    print(f"  - Title: {updated_settings['collection_title']}")
    print(f"  - Discount: {updated_settings['collection_discount_text']}")

    # 5. Test Festival Product Linking & Unlinking
    print("\n--- 5. Testing Festival Product Linking API ---")
    r = client.get("/api/festivals/active")
    active_festival = extract_data(r) if r.status_code == 200 else None
    
    if not active_festival:
        r = client.get("/api/festivals")
        festivals = extract_data(r)
        if festivals:
            active_festival = festivals[0]
            
    if active_festival:
        fest_id = active_festival["id"]
        print(f"Testing with festival: {active_festival.get('festival_name')} (ID: {fest_id})")
        
        # Link murti to festival
        link_payload = {
            "murti_id": murti_id,
            "festival_price": 89000.0,
            "custom_tag": "Diwali Mahotsav Special"
        }
        r = client.post(f"/api/festivals/{fest_id}/items", json=link_payload, headers=auth_headers)
        assert r.status_code in [200, 201], f"Failed to link product to festival: {r.text}"
        link_resp = extract_data(r)
        print("Successfully linked product to festival:", link_resp)
        
        # Verify linked product appears in festival items
        r = client.get("/api/festivals/active")
        active_fest_after = extract_data(r)
        items = active_fest_after.get("items", [])
        found = any(str(it.get("murti_id")) == str(murti_id) for it in items)
        print(f"Verified linked product in active festival items: {found} (Total items: {len(items)})")
        
        # Unlink product
        r = client.delete(f"/api/festivals/{fest_id}/items/{murti_id}", headers=auth_headers)
        assert r.status_code in [200, 204], f"Failed to unlink product: {r.text}"
        print("Successfully unlinked product from festival.")
    else:
        print("No active festival found, skipping link verification.")

    # Clean up test entities so test runs never pollute the database
    if cat_id:
        client.delete(f"/api/categories/{cat_id}", headers=auth_headers)
    if size_id:
        client.delete(f"/api/sizes/{size_id}", headers=auth_headers)
    if murti_id:
        client.delete(f"/api/products/{murti_id}", headers=auth_headers)

    print("\n=== ALL TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()

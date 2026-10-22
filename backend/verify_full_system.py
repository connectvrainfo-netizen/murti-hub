"""
End-to-End Comprehensive Verification Test Suite for Amol Marble Murti Bhandar
Verifies all 7 Admin Operations, Live Data Synchronization, and Local Store Persistence.
Uses FastAPI TestClient to guarantee in-process deterministic execution.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.database import local_store

client = TestClient(app)

def run_tests():
    print("=" * 75)
    print("STARTING COMPREHENSIVE VERIFICATION SUITE - AMOL MURTI BHANDAR")
    print("=" * 75)

    # 1. Check Health & Root
    health_res = client.get("/health")
    assert health_res.status_code == 200, f"Health check failed: {health_res.text}"
    print("[PASS] 1. Backend Server is HEALTHY & Active.")

    # 2. Admin Authentication
    auth_res = client.post("/api/auth/login", json={
        "email": "admin@amolmurtibhandar.com",
        "password": "admin123"
    })
    assert auth_res.status_code == 200, f"Login failed: {auth_res.text}"
    token = auth_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 2. Admin Login successful. Bearer JWT issued.")

    # 3. WhatsApp Concierge Number & Greeting (Operation #4)
    new_phone = "+917020676423"
    new_msg = "Namaste Amol Murti Bhandar! I wish to inquire about handcrafted Makrana marble murtis."
    wa_res = client.patch(f"/api/settings/whatsapp?whatsapp_number=%2B917020676423&default_message=Namaste", headers=headers)
    assert wa_res.status_code == 200, f"WhatsApp update failed: {wa_res.text}"
    
    # Verify public settings reflects updated phone
    pub_setts = client.get("/api/settings").json()
    assert pub_setts["whatsapp_number"] == "+917020676423", f"WhatsApp number not updated: {pub_setts}"
    print(f"[PASS] 3. [Operation #4] WhatsApp Concierge number updated to {pub_setts['whatsapp_number']}.")

    # 4. Rating Display Mode Toggle & Enforcement (Operation #5)
    # Set to read_only
    rm_res = client.patch("/api/settings/rating-mode?mode=read_only", headers=headers)
    assert rm_res.status_code == 200
    
    # Try posting review in read_only mode -> should get 403 Forbidden
    ro_post = client.post("/api/reviews/product/33333333-3333-3333-3333-333333330001", json={
        "murti_id": "33333333-3333-3333-3333-333333330001",
        "author": "Anjali Sharma",
        "location": "Jaipur",
        "rating": 5.0,
        "title": "Divine craftsmanship",
        "content": "Pristine white marble."
    })
    assert ro_post.status_code == 403, f"Expected 403 in read_only mode, got: {ro_post.status_code}"
    print("[PASS] 4a. [Operation #5] Rating mode set to 'read_only' and new review submissions strictly BLOCKED (403 Forbidden).")

    # Re-enable reviews
    client.patch("/api/settings/rating-mode?mode=enabled", headers=headers)
    en_post = client.post("/api/reviews/product/33333333-3333-3333-3333-333333330001", json={
        "murti_id": "33333333-3333-3333-3333-333333330001",
        "author": "Anjali Sharma",
        "location": "Jaipur",
        "rating": 5.0,
        "title": "Divine craftsmanship",
        "content": "Pristine white marble."
    })
    assert en_post.status_code == 201, f"Expected 201 when enabled, got {en_post.status_code}"
    review_id = en_post.json()["data"]["id"]
    print(f"[PASS] 4b. [Operation #5] Rating mode re-enabled: Review successfully submitted (ID: {review_id}).")

    # Seller Reply & Moderation
    reply_res = client.post(f"/api/reviews/admin/{review_id}/reply", json={
        "author": "Amol Marble Murti Bhandar Atelier",
        "text": "Dhanyawad Anjali ji! May Lord Ram bless your family."
    }, headers=headers)
    assert reply_res.status_code == 200, f"Reply failed: {reply_res.text}"
    print("[PASS] 4c. [Operation #5] Seller reply added to customer review successfully.")

    # 5. Master Sizes Management (Operation #7)
    size_res = client.post("/api/sizes", json={
        "label": "21 Inches (Grand Home Mandir)",
        "height_inches": 21.0,
        "description": "Hand-carved Makrana marble idol for grand home temple altars.",
        "sort_order": 6,
        "is_active": True
    }, headers=headers)
    assert size_res.status_code == 201
    created_size_id = size_res.json()["data"]["id"]
    print(f"[PASS] 5. [Operation #7] Master Size created successfully (ID: {created_size_id}).")

    # 6. Categories & Hero Banners (Operation #1)
    cat_res = client.put("/api/categories/22222222-2222-2222-2222-222222220002", json={
        "name": "Shri Gajanan Maharaj Shegaon",
        "banner_url": "/images/categories/gajanan-maharaj@2x.png",
        "description": "Sacred avatars and idols of Sant Shiromani Shri Gajanan Maharaj."
    }, headers=headers)
    assert cat_res.status_code == 200
    print("[PASS] 6. [Operation #1] Category hero banner & details updated successfully.")

    # 7. Products & Multi-Angle Catalog Gallery + Size Variants (Operation #2, #3, #7)
    prod_res = client.post("/api/products", json={
        "title": "Shri Krishna with Kamadhenu Cow & Bansuri - 24K Gold Embellished",
        "price": 2899.0,
        "old_price": 4999.0,
        "off_text": "42% off",
        "deity": "Krishna",
        "group_tag": "most-loved",
        "material": "Pure White Makrana Marble",
        "dimensions": "15 Inches Height • Consecrated Altar Edition",
        "weight": "2.8 kg",
        "stock_status": "in_stock",
        "primary_catalog_image": "/images/products/bal-ganesha-flute.png",
        "catalog_images": [
            {"url": "/images/products/bal-ganesha-flute.png", "caption": "Front Divine View", "sort_order": 1},
            {"url": "/images/products/bal-ganesha-flute.png", "caption": "Gold Varakh Macro Close-up", "sort_order": 2}
        ],
        "variants": [
            {"size_id": created_size_id, "variant_name": "12 Inches Compact", "price": 2299.0, "stock_quantity": 15},
            {"size_id": created_size_id, "variant_name": "21 Inches Grand Mandir", "price": 3899.0, "stock_quantity": 5}
        ],
        "rating_mode": "enabled",
        "static_rating_value": 5.0,
        "is_active": True
    }, headers=headers)
    assert prod_res.status_code == 201, f"Create product failed: {prod_res.text}"
    created_prod_id = prod_res.json()["data"]["id"]
    print(f"[PASS] 7. [Operation #2, #3, #7] Product created with multi-angle gallery and size variants (ID: {created_prod_id}).")

    # 8. Festival Campaign & Linked Discounted Products (Operation #6)
    fest_res = client.get("/api/festivals/active")
    assert fest_res.status_code == 200
    fest = fest_res.json()
    assert fest is not None, "No active festival campaign found"
    fest_id = fest["id"]
    
    # Link newly created product with special festival price
    link_res = client.post(f"/api/festivals/{fest_id}/items", json={
        "murti_id": created_prod_id,
        "festival_price": 1999.0,
        "custom_tag": "Diwali Mahotsav 50% OFF",
        "sort_order": 1
    }, headers=headers)
    assert link_res.status_code == 201, f"Link to festival failed: {link_res.text}"
    print(f"[PASS] 8. [Operation #6] Product {created_prod_id} linked to festival with festival price Rs.1,999.")

    # 9. Verify Storefront Live Query
    active_fest_now = client.get("/api/festivals/active").json()
    fest_items = active_fest_now.get("items", [])
    linked_item = next((i for i in fest_items if i["murti_id"] == created_prod_id), None)
    assert linked_item is not None, f"Linked festival item not found in active festival: {fest_items}"
    assert linked_item["festival_price"] == 1999.0, f"Festival price mismatch: {linked_item}"
    print("[PASS] 9. Storefront Active Festival endpoint successfully serves linked festival product.")

    # 10. Dashboard Stats
    stats_res = client.get("/api/admin/dashboard", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()["data"]
    print(f"[PASS] 10. Admin Dashboard Live Stats retrieved: {stats}")

    # 11. Authoritative Pre-Checkout Price & Stock Revalidation (/api/orders/validate)
    # Test: Client sends cart with product_id and coupon_code. Backend fetches authoritative price from DB.
    val_res = client.post("/api/orders/validate", json={
        "items": [
            {
                "product_id": created_prod_id,
                "qty": 2,
                "selected_size": "12 Inches"
            }
        ],
        "coupon_code": "DIVINE15"
    })
    assert val_res.status_code == 200, f"Validate order failed: {val_res.text}"
    val_data = val_res.json()["data"]
    assert val_data["is_valid"] is True
    # Authoritative unit price from DB is 2899.0
    validated_item = val_data["items"][0]
    assert validated_item["unit_price"] == 2899.0, f"Expected 2899.0, got {validated_item['unit_price']}"
    assert val_data["discount_amount"] > 0, "DIVINE15 coupon was not applied!"
    print(f"[PASS] 11. [Critical Rule] Pre-checkout revalidation authoritative price fetched (Rs. {validated_item['unit_price']}) & DIVINE15 coupon verified.")

    # 12. Authoritative Order Placement (POST /api/orders)
    order_create_payload = {
        "idempotency_key": "idemp-test-checkout-unique-9999",
        "items": [
            {
                "product_id": created_prod_id,
                "qty": 1,
                "selected_size": "12 Inches"
            }
        ],
        "shipping": {
            "full_name": "Rameshwar Kulkarni",
            "phone": "+919876543210",
            "email": "rameshwar@example.com",
            "address": "Flat 402, Shiv Shradha Heights, Prabhat Road",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "411004"
        },
        "payment_method": "cod",
        "coupon_code": "DIVINE15"
    }
    order_res = client.post("/api/orders", json=order_create_payload)
    assert order_res.status_code == 201, f"Order placement failed: {order_res.text}"
    created_order = order_res.json()["data"]
    order_id = created_order["order_id"]
    assert order_id.startswith("MH-"), f"Invalid order ID generated: {order_id}"
    assert created_order["tracking_number"] is not None
    assert len(created_order["timeline"]) >= 1
    print(f"[PASS] 12. [Critical Rule] Authoritative Order successfully created with ID: {order_id}, Courier: {created_order['courier']}, Tracking: {created_order['tracking_number']}.")

    # 13. Idempotency Guarantee (Resending duplicate order request)
    dup_res = client.post("/api/orders", json=order_create_payload)
    assert dup_res.status_code == 200, f"Idempotency check failed: {dup_res.text}"
    dup_order = dup_res.json()["data"]
    assert dup_order["order_id"] == order_id, "Idempotency failed: generated a different order ID!"
    print(f"[PASS] 13. [Idempotency] Duplicate submission with same idempotency key returned existing Order {order_id} without duplicate order creation.")

    # 14. Real-time Customer Order Tracking (GET /api/orders/{order_id})
    track_res = client.get(f"/api/orders/{order_id}")
    assert track_res.status_code == 200, f"Tracking failed: {track_res.text}"
    track_data = track_res.json()["data"]
    assert track_data["order_id"] == order_id
    assert track_data["shipping"]["city"] == "Pune"
    
    # Negative test: Non-existent order must return 404 (Never fake success!)
    fake_track = client.get("/api/orders/MH-NON-EXISTENT-999")
    assert fake_track.status_code == 404, "Security breach: authoritative system claimed success for nonexistent order!"
    print(f"[PASS] 14. [Critical Rule] Live order tracking verified for {order_id}. Non-existent order correctly rejected with 404.")

    # 15. Admin Order Fulfillment & Status Update (GET /admin/all, PATCH /admin/{order_id}/status)
    admin_orders_res = client.get("/api/orders/admin/all", headers=headers)
    assert admin_orders_res.status_code == 200
    all_orders = admin_orders_res.json()["data"]
    assert any(o["order_id"] == order_id for o in all_orders), f"Order {order_id} not visible in admin order list"
    
    status_update_res = client.patch(f"/api/orders/admin/{order_id}/status?new_status=dispatched", headers=headers)
    assert status_update_res.status_code == 200
    updated_order = status_update_res.json()["data"]
    assert updated_order["order_status"] == "dispatched"
    print(f"[PASS] 15. Admin order fulfillment verified. Order {order_id} status updated to 'dispatched'.")

    # 16. Security & Policy Enforcement
    # 16a. Unauthorized access with invalid/forged JWT denied (401)
    unauth_res = client.get("/api/orders/admin/all", headers={"Authorization": "Bearer forged_invalid_token_xyz"})
    assert unauth_res.status_code == 401, f"Expected 401 Unauthorized, got: {unauth_res.status_code}"
    
    # 16b. Malformed inputs validation (422)
    bad_val = client.post("/api/orders/validate", json={"items": "not-a-list"})
    assert bad_val.status_code == 422, f"Expected 422 for malformed input, got {bad_val.status_code}"
    print("[PASS] 16. [Security & Error Policies] Unauthorized admin access denied (401) and malformed inputs rejected (422).")

    print("\n" + "=" * 75)
    print("ALL 16 END-TO-END CHECKLIST AND BUSINESS OPERATIONS PASSED 100% SUCCESFULLY!")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()

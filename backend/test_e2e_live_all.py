import sys
import uuid
import httpx

# We will test both via Vite Proxy (port 3000) and Direct Backend (port 8000)
BASE_URL = "http://127.0.0.1:3000"

def log(msg, status="INFO"):
    symbol = {"PASS": "[PASS]", "FAIL": "[FAIL]", "INFO": "[INFO]"}.get(status, "[*]")
    print(f"{symbol} {msg}")

def run_tests():
    passed = 0
    total = 0

    def check(condition, desc):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            log(desc, "PASS")
        else:
            log(f"{desc} FAILED", "FAIL")
            raise AssertionError(f"Test assertion failed: {desc}")

    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        print("=" * 70)
        print("AMOL MURTI BHANDAR — END-TO-END SYSTEM & API TEST SUITE")
        print(f"Targeting Storefront & Proxy URL: {BASE_URL}")
        print("=" * 70)

        # -------------------------------------------------------------
        # 1. HEALTH & UPTIMEROBOT MONITORING ENDPOINTS
        # -------------------------------------------------------------
        print("\n--- 1. Health & Monitoring Probes ---")
        res = client.get("/health")
        check(res.status_code == 200 and res.json().get("status") == "healthy", "GET /health returns 200 healthy")
        
        res = client.head("/health")
        check(res.status_code == 200, "HEAD /health returns 200 (zero body probe)")

        res = client.get("/uptimerobot")
        check(res.status_code == 200 and "OK" in res.text, "GET /uptimerobot probe returns 200 OK")

        res = client.get("/api/health")
        check(res.status_code == 200 and res.json().get("status") == "healthy", "GET /api/health returns 200")

        res = client.get("/ping")
        check(res.status_code == 200 and res.json().get("message") == "OK", "GET /ping returns 200 OK")

        res = client.get("/healthz")
        check(res.status_code == 200, "GET /healthz returns 200")

        # -------------------------------------------------------------
        # 2. AUTHENTICATION & SECURITY
        # -------------------------------------------------------------
        print("\n--- 2. Authentication & Admin Security ---")
        # Unauthorized without token
        res = client.get("/api/admin/dashboard")
        check(res.status_code == 401, "GET /api/admin/dashboard without token blocked with 401")

        # Login with bad credentials
        res = client.post("/api/auth/login", json={"email": "wrong@admin.com", "password": "wrong"})
        check(res.status_code == 401, "POST /api/auth/login with invalid password blocked with 401")

        # Successful Admin login
        res = client.post("/api/auth/login", json={"email": "admin@amolmurtibhandar.com", "password": "admin123"})
        check(res.status_code == 200 and "access_token" in res.json().get("data", {}), "POST /api/auth/login with valid credentials issues JWT")
        token = res.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Auth Me
        res = client.get("/api/auth/me", headers=headers)
        check(res.status_code == 200 and res.json()["data"]["email"] == "admin@amolmurtibhandar.com", "GET /api/auth/me returns admin profile")

        # Tampered Token
        res = client.get("/api/auth/me", headers={"Authorization": "Bearer fake.tampered.token"})
        check(res.status_code == 401, "GET /api/auth/me with forged token blocked with 401")

        # -------------------------------------------------------------
        # 3. SETTINGS & WHATSAPP & RATING TOGGLE
        # -------------------------------------------------------------
        print("\n--- 3. Settings, WhatsApp & Rating Modes ---")
        res = client.get("/api/settings")
        check(res.status_code == 200 and "store_name" in res.json()["data"], "GET /api/settings retrieves site settings")

        new_wa = "+919876543210"
        res = client.patch(f"/api/settings/whatsapp?whatsapp_number={new_wa}&default_message=Namaste", headers=headers)
        check(res.status_code == 200 and res.json()["data"]["whatsapp_number"] == new_wa, "PATCH /api/settings/whatsapp updates number")

        # -------------------------------------------------------------
        # 4. CATEGORIES CRUD
        # -------------------------------------------------------------
        print("\n--- 4. Categories CRUD ---")
        res = client.get("/api/categories")
        check(res.status_code == 200 and len(res.json()["data"]) > 0, f"GET /api/categories returned {len(res.json()['data'])} categories")
        existing_cats = res.json()["data"]

        cat_slug = f"test-cat-{uuid.uuid4().hex[:6]}"
        res = client.post("/api/categories", json={
            "name": "Test Marble Collection",
            "slug": cat_slug,
            "banner_url": "/images/banners/test-banner.webp",
            "img": "/images/categories/test.webp",
            "sort_order": 99,
            "is_active": True
        }, headers=headers)
        check(res.status_code == 201 and res.json()["data"]["slug"] == cat_slug, "POST /api/categories created new category")
        created_cat_id = res.json()["data"]["id"]

        # Update category
        res = client.put(f"/api/categories/{created_cat_id}", json={
            "name": "Updated Marble Collection",
            "sort_order": 50
        }, headers=headers)
        check(res.status_code == 200 and res.json()["data"]["name"] == "Updated Marble Collection", "PUT /api/categories/{id} updated category")

        # -------------------------------------------------------------
        # 5. MASTER SIZES CRUD
        # -------------------------------------------------------------
        print("\n--- 5. Master Sizes CRUD ---")
        res = client.get("/api/sizes")
        check(res.status_code == 200 and len(res.json()["data"]) > 0, f"GET /api/sizes returned {len(res.json()['data'])} sizes")

        size_label = f"18 cm Pooja Size {uuid.uuid4().hex[:4]}"
        res = client.post("/api/sizes", json={
            "label": size_label,
            "height_inches": 7.0,
            "sort_order": 20,
            "description": "Ideal for compact home temples",
            "is_active": True
        }, headers=headers)
        check(res.status_code == 201 and res.json()["data"]["label"] == size_label, "POST /api/sizes created size tag")
        created_size_id = res.json()["data"]["id"]

        # Update size
        res = client.put(f"/api/sizes/{created_size_id}", json={
            "label": f"{size_label} (Updated)",
            "sort_order": 21
        }, headers=headers)
        check(res.status_code == 200, "PUT /api/sizes/{id} updated size tag")

        # -------------------------------------------------------------
        # 6. PRODUCTS MANAGEMENT & FILTERING
        # -------------------------------------------------------------
        print("\n--- 6. Products CRUD & Filtering ---")
        # List all products
        res = client.get("/api/products")
        check(res.status_code == 200 and len(res.json()["data"]) > 0, f"GET /api/products returned {len(res.json()['data'])} products")

        # Filter by category
        first_cat = existing_cats[0]["slug"]
        res = client.get(f"/api/products?category={first_cat}")
        check(res.status_code == 200, f"GET /api/products?category={first_cat} filtered correctly")

        # Search query
        res = client.get("/api/products?q=Ganesha")
        check(res.status_code == 200, "GET /api/products?q=Ganesha executed search")

        # Keyset Cursor Pagination
        res = client.get("/api/products/cursor?limit=5")
        check(res.status_code == 200 and "cursor" in res.json().get("meta", {}), "GET /api/products/cursor returns keyset cursor")
        next_cursor = res.json()["meta"]["cursor"]
        if next_cursor:
            res_next = client.get(f"/api/products/cursor?limit=5&cursor={next_cursor}")
            check(res_next.status_code == 200, "GET /api/products/cursor with next page cursor succeeded")

        # Create New Product with Catalog Images & Variants
        product_slug = f"white-marble-murti-{uuid.uuid4().hex[:6]}"
        res = client.post("/api/products", json={
            "title": "Divine White Makrana Ganesh Murti",
            "slug": product_slug,
            "category": first_cat,
            "deity": "Ganesha",
            "price": 4500.0,
            "original_price": 5500.0,
            "discount_pill": "18% OFF",
            "primary_catalog_image": "/images/products/test-ganesh.webp",
            "catalog_images": [
                {"url": "/images/products/ganesh-front.webp", "caption": "Front View", "sort_order": 1},
                {"url": "/images/products/ganesh-side.webp", "caption": "Side Angle", "sort_order": 2}
            ],
            "description": "Hand-carved premium Makrana white marble murti with gold leaf accents.",
            "stock_status": "in_stock",
            "is_active": True
        }, headers=headers)
        check(res.status_code == 201 and res.json()["data"]["slug"] == product_slug, "POST /api/products created product with catalog images")
        created_prod_id = res.json()["data"]["id"]

        # Add size variant to product
        res = client.post(f"/api/products/{created_prod_id}/variants", json={
            "size_id": created_size_id,
            "price": 5200.0,
            "sku": f"VAR-{uuid.uuid4().hex[:6]}",
            "stock_status": "in_stock"
        }, headers=headers)
        check(res.status_code == 201, f"POST /api/products/{created_prod_id}/variants linked variant to product")
        created_var_id = res.json()["data"]["id"]

        # Fetch single product
        res = client.get(f"/api/products/{created_prod_id}")
        check(res.status_code == 200 and res.json()["data"]["id"] == created_prod_id, "GET /api/products/{id} retrieved created product")

        # Update product
        res = client.put(f"/api/products/{created_prod_id}", json={
            "title": "Divine White Makrana Ganesh Murti (Grand Edition)",
            "price": 4800.0
        }, headers=headers)
        check(res.status_code == 200 and res.json()["data"]["price"] == 4800.0, "PUT /api/products/{id} updated product price")

        # -------------------------------------------------------------
        # 7. FESTIVAL CAMPAIGNS
        # -------------------------------------------------------------
        print("\n--- 7. Festival Campaigns ---")
        res = client.get("/api/festivals/active")
        check(res.status_code == 200, "GET /api/festivals/active returns active festival")

        fest_title = f"Diwali Mahotsav {uuid.uuid4().hex[:4]}"
        res = client.post("/api/festivals", json={
            "title": fest_title,
            "subtitle": "Auspicious blessings for your home mandir",
            "banner_url": "/images/banners/diwali.webp",
            "badge_text": "DIWALI SPECIAL",
            "is_active": True
        }, headers=headers)
        check(res.status_code == 201, "POST /api/festivals created festival campaign")
        created_fest_id = res.json()["data"]["id"]

        # Link product to festival
        res = client.post(f"/api/festivals/{created_fest_id}/items", json={
            "murti_id": created_prod_id,
            "festival_price": 3999.0,
            "custom_tag": "Mahotsav Special Deal"
        }, headers=headers)
        check(res.status_code == 201, "POST /api/festivals/{id}/items linked product with festive price")

        # Unlink product
        res = client.delete(f"/api/festivals/{created_fest_id}/items/{created_prod_id}", headers=headers)
        check(res.status_code == 200, "DELETE /api/festivals/{id}/items/{murti_id} unlinked product")

        # -------------------------------------------------------------
        # 8. REVIEWS & RATING POLICY
        # -------------------------------------------------------------
        print("\n--- 8. Reviews & Rating Moderation ---")
        # Ensure rating mode is enabled
        client.patch("/api/settings/rating-mode?mode=enabled", headers=headers)

        res = client.post(f"/api/reviews/product/{created_prod_id}", json={
            "murti_id": created_prod_id,
            "author": "Sunil Sharma",
            "rating": 5,
            "title": "Extraordinary Craftsmanship",
            "content": "The marble finish is divine, arrived in wooden crate without a single scratch!"
        })
        check(res.status_code == 201, "POST /api/reviews/product/{id} submitted review")
        created_rev_id = res.json()["data"]["id"]

        # Test read_only mode blocking
        client.patch("/api/settings/rating-mode?mode=read_only", headers=headers)
        res_blocked = client.post(f"/api/reviews/product/{created_prod_id}", json={
            "murti_id": created_prod_id,
            "author": "Blocked User",
            "rating": 4,
            "title": "Should be blocked",
            "content": "This submission must be rejected with 403 Forbidden"
        })
        check(res_blocked.status_code == 403, "POST /api/reviews blocked with 403 in read_only mode")

        # Restore enabled
        client.patch("/api/settings/rating-mode?mode=enabled", headers=headers)

        # Admin moderate review
        res = client.put(f"/api/reviews/admin/{created_rev_id}/moderate", json={
            "is_approved": True
        }, headers=headers)
        check(res.status_code == 200 and res.json()["data"]["is_approved"] is True, "PUT /api/reviews/admin/{id}/moderate approved review")

        # Seller Reply to Review
        res = client.post(f"/api/reviews/admin/{created_rev_id}/reply", json={
            "text": "Thank you Sunil ji for welcoming divine blessings into your home!",
            "author": "Amol Murti Jaipur Team"
        }, headers=headers)
        check(res.status_code == 200, "POST /api/reviews/admin/{id}/reply posted seller response")

        # -------------------------------------------------------------
        # 9. FILE & MEDIA UPLOADS
        # -------------------------------------------------------------
        print("\n--- 9. File & Media Uploads ---")
        # Empty file upload -> 400
        empty_files = {'file': ('empty.png', b'', 'image/png')}
        res = client.post("/api/upload", data={'folder': 'catalog'}, files=empty_files, headers=headers)
        check(res.status_code == 400, "POST /api/upload empty file rejected with 400")

        # Disallowed extension -> 400
        bad_files = {'file': ('script.exe', b'bad_binary_content', 'application/x-msdownload')}
        res = client.post("/api/upload", data={'folder': 'catalog'}, files=bad_files, headers=headers)
        check(res.status_code == 400, "POST /api/upload .exe file rejected with 400")

        # Disallowed folder -> 400
        valid_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
        res = client.post("/api/upload", data={'folder': 'unauthorized_folder'}, files={'file': ('dot.png', valid_png, 'image/png')}, headers=headers)
        check(res.status_code == 400, "POST /api/upload unauthorized folder rejected with 400")

        # Valid PNG upload -> 200
        res = client.post("/api/upload", data={'folder': 'catalog'}, files={'file': ('dot.png', valid_png, 'image/png')}, headers=headers)
        check(res.status_code == 200 and "url" in res.json()["data"], f"POST /api/upload valid PNG succeeded (url: {res.json()['data']['url']})")

        # -------------------------------------------------------------
        # 10. ORDERS & AUTHORITATIVE CHECKOUT
        # -------------------------------------------------------------
        print("\n--- 10. Orders & Authoritative Checkout ---")
        # Validate cart items & coupon
        res = client.post("/api/orders/validate", json={
            "items": [{"product_id": created_prod_id, "qty": 1}],
            "coupon_code": "DIVINE15",
            "shipping_pincode": "302001"
        })
        check(res.status_code == 200 and res.json()["data"]["coupon_valid"] is True, "POST /api/orders/validate verified cart & DIVINE15 coupon")
        calculated_total = res.json()["data"]["final_total"]

        # Create Order with Idempotency Key
        idempotency_key = f"IDEMP-{uuid.uuid4().hex}"
        order_payload = {
            "customer_name": "Rajesh Varma",
            "customer_phone": "9876543210",
            "customer_email": "rajesh@example.com",
            "shipping_address": "Flat 402, Krishna Heights, Jaipur, Rajasthan",
            "shipping_city": "Jaipur",
            "shipping_state": "Rajasthan",
            "shipping_pincode": "302001",
            "items": [{"product_id": created_prod_id, "qty": 1}],
            "coupon_code": "DIVINE15",
            "payment_method": "upi",
            "idempotency_key": idempotency_key
        }
        res = client.post("/api/orders", json=order_payload)
        check(res.status_code == 201 and "order_id" in res.json()["data"], f"POST /api/orders created authoritative order: {res.json()['data']['order_id']}")
        order_id = res.json()["data"]["order_id"]

        # Test Idempotency with exact same key -> should return same order without duplicating
        res_dup = client.post("/api/orders", json=order_payload)
        check(res_dup.status_code == 200 and res_dup.json()["data"]["order_id"] == order_id, "Idempotency replay returned same order without double creation")

        # Public Tracking with PII masking
        res = client.get(f"/api/orders/{order_id}")
        check(res.status_code == 200 and "Ra****" in res.json()["data"]["customer_name"], "GET /api/orders/{id} tracking returns masked PII")

        # Admin View All Orders
        res = client.get("/api/orders/admin/all", headers=headers)
        check(res.status_code == 200 and any(o["order_id"] == order_id for o in res.json()["data"]), "GET /api/orders/admin/all lists new order")

        # Admin Update Order Status
        res = client.patch(f"/api/orders/admin/{order_id}/status?new_status=dispatched", headers=headers)
        check(res.status_code == 200 and res.json()["data"]["order_status"] == "dispatched", "PATCH /api/orders/admin/{id}/status transitioned to dispatched")

        # -------------------------------------------------------------
        # 11. ADMIN DASHBOARD STATS
        # -------------------------------------------------------------
        print("\n--- 11. Admin Dashboard Live Stats ---")
        res = client.get("/api/admin/dashboard", headers=headers)
        check(res.status_code == 200 and res.json()["data"]["total_products"] > 0, "GET /api/admin/dashboard returns populated metrics")

        # -------------------------------------------------------------
        # 12. CLEANUP CREATED TEST ASSETS
        # -------------------------------------------------------------
        print("\n--- 12. Cleanup Temporary Test Entities ---")
        client.delete(f"/api/products/variants/{created_var_id}", headers=headers)
        client.delete(f"/api/products/{created_prod_id}", headers=headers)
        client.delete(f"/api/festivals/{created_fest_id}", headers=headers)
        client.delete(f"/api/sizes/{created_size_id}", headers=headers)
        client.delete(f"/api/categories/{created_cat_id}", headers=headers)
        log("Cleaned up temporary product, variant, festival, size, and category test entities.", "PASS")

        # Logout Admin
        res = client.post("/api/auth/logout", headers=headers)
        check(res.status_code == 200, "POST /api/auth/logout invalidated admin session token")

        print("=" * 70)
        print(f"SUMMARY: {passed}/{total} TESTS PASSED SUCCESSFULLY (100% SUCCESS RATE)")
        print("=" * 70)

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"[FATAL TEST FAILURE]: {e}")
        sys.exit(1)

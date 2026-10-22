from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_flow():
    # 1. Health & Root
    r = client.get('/health')
    assert r.status_code == 200, f"Health failed: {r.text}"
    print("[OK] Health check passed:", r.json())

    # 2. Login as admin
    login_res = client.post('/api/auth/login', json={'email': 'admin@amolmurtibhandar.com', 'password': 'admin123'})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()['data']['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    print("[OK] Admin login passed! Token issued.")

    # 3. Req #4: WhatsApp number change
    wa_res = client.patch('/api/settings/whatsapp?whatsapp_number=%2B919999988888&default_message=TestMessage', headers=headers)
    assert wa_res.status_code == 200, f"WhatsApp update failed: {wa_res.text}"
    assert wa_res.json()['data']['whatsapp_number'] == '+919999988888'
    print("[OK] Req #4 (WhatsApp number change) passed!")

    # 4. Req #5: Rating mode toggle & enforcement
    # Test setting read_only
    rat_res = client.patch('/api/settings/rating-mode?mode=read_only', headers=headers)
    assert rat_res.status_code == 200
    assert rat_res.json()['data']['global_rating_mode'] == 'read_only'

    # Attempt to submit review while in read_only mode -> should get 403 Forbidden!
    sub_res = client.post('/api/reviews/product/33333333-3333-3333-3333-333333330001', json={
        'murti_id': '33333333-3333-3333-3333-333333330001',
        'author': 'Test User',
        'rating': 5,
        'title': 'Test Review',
        'content': 'This should fail because rating is read_only'
    })
    assert sub_res.status_code == 403, f"Expected 403, got {sub_res.status_code}"
    print("[OK] Req #5 (Rating mode read_only 403 enforcement) passed!")

    # Switch rating mode back to enabled
    client.patch('/api/settings/rating-mode?mode=enabled', headers=headers)
    # Now submit review -> should succeed!
    sub_ok = client.post('/api/reviews/product/33333333-3333-3333-3333-333333330001', json={
        'murti_id': '33333333-3333-3333-3333-333333330001',
        'author': 'Devotee Ramesh',
        'rating': 5,
        'title': 'Sacred and Divine',
        'content': 'Exquisite craftsmanship and flawless marble delivery!'
    })
    assert sub_ok.status_code == 201
    print("[OK] Req #5 (Rating submission when enabled) passed!")

    # 5. Req #7: Master sizes management
    size_res = client.post('/api/sizes', json={
        'label': 'Test 2 Feet Grand Altar',
        'height_inches': 24.0,
        'description': 'Large altar murti',
        'sort_order': 6,
        'is_active': True
    }, headers=headers)
    assert size_res.status_code == 201
    size_id = size_res.json()['data']['id']
    print("[OK] Req #7 (Create master size) passed! Size ID:", size_id)

    # 6. Req #1: Edit category images and banner
    cat_res = client.put('/api/categories/22222222-2222-2222-2222-222222220002', json={
        'banner_url': '/images/categories/navratri-new-banner.jpg',
        'name': 'Navratri Festive Drop 2026'
    }, headers=headers)
    assert cat_res.status_code == 200
    assert cat_res.json()['data']['banner_url'] == '/images/categories/navratri-new-banner.jpg'
    print("[OK] Req #1 (Edit category banner & images) passed!")

    # 7. Req #2 & #3: Add/Edit product with catalog image section
    prod_res = client.post('/api/products', json={
        'title': 'Prabhu Ram Mandir Supreme Murti',
        'deity': 'Ram',
        'group_tag': 'most-loved',
        'price': 2499.0,
        'old_price': 3999.0,
        'off_text': '37% off',
        'primary_catalog_image': '/images/products/ram-darbar.png',
        'catalog_images': [
            {'url': '/images/products/ram-darbar.png', 'caption': 'Front Altar View', 'sort_order': 1},
            {'url': '/images/products/ram-darbar.png', 'caption': '24K Gold Detailing Close-up', 'sort_order': 2}
        ],
        'rating_mode': 'enabled',
        'static_rating_value': 5.0,
        'variants': [
            {'size_id': size_id, 'variant_name': '2 Feet Grand Altar', 'price': 5999.0, 'stock_quantity': 10}
        ]
    }, headers=headers)
    assert prod_res.status_code == 201
    new_prod_id = prod_res.json()['data']['id']
    assert len(prod_res.json()['data']['catalog_images']) == 2
    print("[OK] Req #2 & Req #3 (Product with catalog images JSONB & size variant) passed!")

    # 8. Req #6: Festival section management & linked products with custom price
    fest_res = client.get('/api/festivals/active')
    assert fest_res.status_code == 200
    fest_data = fest_res.json()
    fest_id = fest_data['id']
    print("[OK] Active festival title:", fest_data['title'])

    # Link our new product to festival with special festival price
    link_res = client.post(f'/api/festivals/{fest_id}/items', json={
        'murti_id': new_prod_id,
        'festival_price': 1999.0,
        'custom_tag': 'Navratri Special Deal',
        'sort_order': 5
    }, headers=headers)
    assert link_res.status_code == 201
    print("[OK] Req #6 (Link product to festival with override price) passed!")

    # 9. Admin dashboard stats
    dash_res = client.get('/api/admin/dashboard', headers=headers)
    assert dash_res.status_code == 200
    print("[OK] Admin dashboard stats:", dash_res.json()['data'])

    print("\n=== ALL 7 ADMIN OPERATIONS + HEALTH + AUTH PASSED 100% SUCCESFULLY! ===")

if __name__ == "__main__":
    test_full_flow()

"""
Comprehensive Security Regression Test Suite for Murti Hub API
Covers authentication, authorization, token revocation, brute-force rate-limiting,
PII masking, and security headers.
"""

import time
import datetime
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def test_unauthenticated_admin_endpoints():
    """Verify SEC-01: All admin write/mutation endpoints strictly require authentication."""
    print("\n--- TEST: Unauthenticated Admin Write Protection ---")
    
    endpoints = [
        ("POST", "/api/sizes", {"label": "18 Inch", "size_inches": 18.0, "sort_order": 1}),
        ("POST", "/api/categories", {"name": "Test Cat", "slug": "test-cat"}),
        ("POST", "/api/products", {"title": "Test Murti", "base_price": 5000}),
        ("PUT", "/api/settings", {"whatsapp_number": "+919999999999"}),
        ("GET", "/api/orders/admin/all", None),
        ("PATCH", "/api/orders/admin/order-123/status?new_status=dispatched", None),
        ("GET", "/api/reviews/admin/all", None),
        ("PUT", "/api/reviews/admin/rev-123/moderate", {"is_approved": True}),
        ("POST", "/api/festivals", {"title": "Diwali Special", "is_active": True}),
        ("GET", "/api/admin/dashboard", None),
    ]
    
    for method, path, json_data in endpoints:
        if method == "POST":
            res = client.post(path, json=json_data)
        elif method == "PUT":
            res = client.put(path, json=json_data)
        elif method == "PATCH":
            res = client.patch(path, json=json_data)
        elif method == "GET":
            res = client.get(path)
        
        assert res.status_code == 401, f"Expected 401 for {method} {path}, got {res.status_code}: {res.text}"
        body = res.json()
        assert "detail" in body or "message" in body, f"Expected error detail in response: {body}"
        print(f"  [PASS] {method} {path} correctly blocked with 401 Unauthorized")

def test_jwt_tampering_and_revocation():
    """Verify SEC-02 & SEC-03: Tampered, forged, and revoked tokens are rejected."""
    print("\n--- TEST: JWT Integrity, Signature Verification & Revocation ---")
    
    # 1. Invalid signature (with 32+ byte key)
    tampered_token = jwt.encode(
        {"sub": "admin@amolmurtibhandar.com", "role": "super_admin"},
        "a_very_long_invalid_secret_key_32bytes!!",
        algorithm="HS256"
    )
    res = client.post("/api/sizes", json={"label": "21 Inch"}, headers={"Authorization": f"Bearer {tampered_token}"})
    assert res.status_code == 401, f"Tampered token should return 401, got {res.status_code}"
    print("  [PASS] Tampered JWT signature rejected with 401")

    # 2. Expired token
    expired_payload = {
        "sub": "admin@amolmurtibhandar.com",
        "role": "super_admin",
        "exp": int(time.time()) - 3600,
        "nbf": int(time.time()) - 7200,
        "iat": int(time.time()) - 7200,
    }
    expired_token = jwt.encode(expired_payload, settings.JWT_SECRET, algorithm="HS256")
    res = client.post("/api/sizes", json={"label": "21 Inch"}, headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401, f"Expired token should return 401, got {res.status_code}"
    print("  [PASS] Expired JWT token rejected with 401")

    # 3. Legitimate login -> obtain valid token -> verify access
    login_res = client.post("/api/auth/login", json={"email": "admin@amolmurtibhandar.com", "password": "admin123"})
    assert login_res.status_code == 200, f"Valid login failed: {login_res.text}"
    token = login_res.json()["data"]["access_token"]
    
    # Access authorized endpoint
    verify_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert verify_res.status_code == 200, f"Token verification failed: {verify_res.text}"
    print("  [PASS] Valid JWT token successfully authenticated via /api/auth/me")

    # 4. Logout (revocation)
    logout_res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200, f"Logout failed: {logout_res.text}"
    print("  [PASS] POST /api/auth/logout returned 200 OK")

    # 5. Subsequent request with revoked token must fail with 401
    post_logout_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert post_logout_res.status_code == 401, f"Revoked token should return 401, got {post_logout_res.status_code}"
    print("  [PASS] Revoked JWT token rejected on subsequent request with 401")

def test_login_brute_force_rate_limiting():
    """Verify SEC-04: Failed logins are rate limited to 5 attempts per window."""
    print("\n--- TEST: Login Rate-Limiting Protection ---")
    
    # Send 5 failed attempts from a specific unique IP
    spoofed_ip = "198.51.100.99"
    headers = {"X-Forwarded-For": spoofed_ip}
    
    for attempt in range(1, 6):
        res = client.post("/api/auth/login", json={"email": "admin@amolmurtibhandar.com", "password": f"wrong-pass-{attempt}"}, headers=headers)
        assert res.status_code == 401, f"Attempt {attempt} should return 401, got {res.status_code}"
    
    # The 6th attempt must be blocked with HTTP 429 Too Many Requests
    blocked_res = client.post("/api/auth/login", json={"email": "admin@amolmurtibhandar.com", "password": "wrong-pass-6"}, headers=headers)
    assert blocked_res.status_code == 429, f"Attempt 6 should be rate-limited (429), got {blocked_res.status_code}: {blocked_res.text}"
    assert "Retry-After" in blocked_res.headers, "HTTP 429 response must contain Retry-After header"
    print(f"  [PASS] 6th failed attempt blocked with 429 Too Many Requests (Retry-After: {blocked_res.headers['Retry-After']}s)")

def test_order_pii_masking():
    """Verify SEC-05: Public order tracking masks customer PII."""
    print("\n--- TEST: Public Order PII Masking ---")
    
    from app.database import local_store
    
    test_order_id = "MH-999888"
    mock_order = {
        "order_id": test_order_id,
        "items": [],
        "subtotal": 12000.0,
        "discount_amount": 0.0,
        "shipping_fee": 0.0,
        "total": 12000.0,
        "payment_method": "cod",
        "order_status": "confirmed",
        "created_at": "2026-10-23T00:00:00",
        "shipping": {
            "full_name": "Ramesh Kumar Sharma",
            "phone": "9876543210",
            "address": "123 Temple Road, Near Ganpati Mandir",
            "city": "Shegaon",
            "state": "Maharashtra",
            "pincode": "444203",
            "notes": "Handle with deep reverence"
        }
    }
    
    if not hasattr(local_store, "orders") or local_store.orders is None:
        local_store.orders = []
    
    # Clean any prior mock order with this id
    local_store.orders = [o for o in local_store.orders if o.get("order_id") != test_order_id]
    local_store.orders.append(mock_order)
    
    # Query public tracking route
    res = client.get(f"/api/orders/{test_order_id}")
    assert res.status_code == 200, f"Expected 200 for order lookup, got {res.status_code}: {res.text}"
    
    body = res.json()
    order_data = body["data"]
    shipping = order_data["shipping"]
    
    assert shipping["full_name"] == "Ra****", f"Expected masked name, got: {shipping['full_name']}"
    assert shipping["phone"] == "987******10", f"Expected masked phone, got: {shipping['phone']}"
    assert shipping["address"] == "Confidential (Protected for Sacred Delivery)", f"Expected protected address, got: {shipping['address']}"
    assert shipping["pincode"] == "444***", f"Expected masked pincode, got: {shipping['pincode']}"
    assert shipping["notes"] is None, f"Expected notes to be stripped, got: {shipping['notes']}"
    
    print(f"  [PASS] Order tracking PII successfully masked: name='{shipping['full_name']}', phone='{shipping['phone']}', pincode='{shipping['pincode']}', notes={shipping['notes']}")

def test_security_headers_and_root_leakage():
    """Verify SEC-14 & SEC-15: Security headers and info leakage prevention."""
    print("\n--- TEST: Security Headers and Info Leakage ---")
    
    res = client.get("/")
    assert res.status_code == 200
    
    # Verify admin email is NOT leaked in root payload
    body = res.json()
    assert "admin_email" not in body, "Root API response must not leak admin_email"
    print("  [PASS] Root endpoint does not leak admin_email")
    
    # Verify security headers
    headers = res.headers
    assert headers.get("x-content-type-options") == "nosniff", "Missing X-Content-Type-Options: nosniff"
    assert headers.get("x-frame-options") == "DENY", "Missing X-Frame-Options: DENY"
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin", "Missing Referrer-Policy"
    
    # Test production HSTS behavior
    orig_env, orig_debug = settings.ENVIRONMENT, settings.DEBUG
    try:
        settings.ENVIRONMENT = "production"
        settings.DEBUG = False
        prod_res = client.get("/")
        assert "strict-transport-security" in prod_res.headers, "Missing Strict-Transport-Security in production"
        print("  [PASS] Strict-Transport-Security correctly attached in production mode")
    finally:
        settings.ENVIRONMENT = orig_env
        settings.DEBUG = orig_debug
        
    print("  [PASS] Response includes X-Content-Type-Options, X-Frame-Options, and Referrer-Policy")

def test_password_reset_flow_and_anti_enumeration():
    """Verify SEC-06: Password reset flow, rate limiting, and anti-enumeration."""
    print("\n--- TEST: Password Reset Flow & Anti-Enumeration ---")
    
    # 1. Anti-enumeration: request reset for nonexistent email
    res1 = client.post("/api/auth/forgot-password", json={"email": "nonexistent_devotee_9999@example.com"})
    assert res1.status_code == 200, f"Expected 200, got {res1.status_code}"
    body1 = res1.json()
    assert body1["success"] is True
    assert "If an account is associated" in body1["message"]

    # 2. Request for existing email - same message
    res2 = client.post("/api/auth/forgot-password", json={"email": "devotee@example.com"})
    assert res2.status_code == 200
    body2 = res2.json()
    assert body2["message"] == body1["message"], "Anti-enumeration violation: Different responses for existing vs non-existing emails"
    print("  [PASS] Anti-enumeration confirmed: Identical generic response for existing and non-existing accounts")

    # 3. Rate limiting: 4th attempt from same IP is blocked with 429
    unique_ip = "198.51.100.77"
    headers = {"X-Forwarded-For": unique_ip}
    for _ in range(3):
        client.post("/api/auth/forgot-password", json={"email": "devotee@example.com"}, headers=headers)
    blocked_reset = client.post("/api/auth/forgot-password", json={"email": "devotee@example.com"}, headers=headers)
    assert blocked_reset.status_code == 429, f"Expected 429 on 4th password reset attempt, got {blocked_reset.status_code}"
    assert "Retry-After" in blocked_reset.headers
    print("  [PASS] Password reset request rate-limiting (429 Too Many Requests) confirmed")

    # 4. Valid token reset
    now = datetime.datetime.now(datetime.timezone.utc)
    token = jwt.encode(
        {"sub": "devotee@example.com", "type": "password_reset", "iat": now, "exp": now + datetime.timedelta(minutes=15)},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    reset_res = client.post("/api/auth/reset-password", json={"token": token, "new_password": "NewStrongDevoteePass#2026"})
    assert reset_res.status_code == 200
    assert reset_res.json()["data"]["updated"] is True
    print("  [PASS] Password reset successfully verified with cryptographic token and bcrypt hashing")

def test_admin_credentials_update_and_reauthentication():
    """Verify SEC-09: Administrator credentials (email & password) can be securely updated with re-authentication."""
    print("\n--- TEST: Admin Credentials Update & Re-Authentication ---")

    # 1. Unauthenticated request rejected
    unauth_res = client.put("/api/auth/admin-credentials", json={"current_password": "any", "new_password": "NewAdminPass123!"})
    assert unauth_res.status_code == 401
    print("  [PASS] Unauthenticated credentials update rejected with 401")

    # 2. Non-admin user rejected
    devotee_token = jwt.encode(
        {"sub": "devotee@example.com", "role": "devotee", "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    forbidden_res = client.put(
        "/api/auth/admin-credentials",
        json={"current_password": "any", "new_password": "NewAdminPass123!"},
        headers={"Authorization": f"Bearer {devotee_token}"}
    )
    assert forbidden_res.status_code == 403
    print("  [PASS] Non-admin account rejected with 403 Forbidden")

    # 3. Authenticate as admin
    login_res = client.post("/api/auth/login", json={"email": "admin@amolmurtibhandar.com", "password": "admin123"})
    assert login_res.status_code == 200
    admin_token = login_res.json()["data"]["access_token"]

    # 4. Wrong current password rejected (protecting against session hijacking)
    wrong_pw_res = client.put(
        "/api/auth/admin-credentials",
        json={"current_password": "IncorrectPassword123!", "new_password": "NewAdminPass123!"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert wrong_pw_res.status_code == 401
    print("  [PASS] Credential update with invalid current password rejected with 401")

    # 5. Short new password rejected (< 8 chars)
    short_pw_res = client.put(
        "/api/auth/admin-credentials",
        json={"current_password": "admin123", "new_password": "short"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert short_pw_res.status_code in [400, 422]
    print("  [PASS] Password below 8-character minimum policy rejected with 422/400")

    # 6. Valid credential update (new Admin ID & new Password)
    update_res = client.put(
        "/api/auth/admin-credentials",
        json={
            "current_password": "admin123",
            "new_email": "master_admin@amolmurtibhandar.com",
            "new_password": "SuperSecureAdmin2026!"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert update_res.status_code == 200, f"Expected 200, got {update_res.status_code}: {update_res.text}"
    update_body = update_res.json()
    assert update_body["success"] is True
    assert update_body["data"]["admin"]["email"] == "master_admin@amolmurtibhandar.com"
    new_token = update_body["data"]["access_token"]
    assert new_token is not None
    print("  [PASS] Admin ID and password successfully updated with fresh JWT issued")

    # 7. Old password no longer works
    old_login = client.post("/api/auth/login", json={"email": "admin@amolmurtibhandar.com", "password": "admin123"})
    assert old_login.status_code == 401
    print("  [PASS] Old admin password immediately invalidated")

    # 8. New credentials work for login
    new_login = client.post("/api/auth/login", json={"email": "master_admin@amolmurtibhandar.com", "password": "SuperSecureAdmin2026!"})
    assert new_login.status_code == 200
    print("  [PASS] Subsequent login with updated Admin ID and new password succeeds with 200 OK")

    # 9. Cleanly restore to original dev credentials for test repeatability
    restore_token = new_login.json()["data"]["access_token"]
    restore_res = client.put(
        "/api/auth/admin-credentials",
        json={
            "current_password": "SuperSecureAdmin2026!",
            "new_email": "admin@amolmurtibhandar.com",
            "new_password": "admin123"
        },
        headers={"Authorization": f"Bearer {restore_token}"}
    )
    assert restore_res.status_code == 200
    print("  [PASS] Clean rollback to original test credentials confirmed")

if __name__ == "__main__":
    print("======================================================================")
    print("RUNNING SECURITY HARDENING REGRESSION TEST SUITE")
    print("======================================================================")
    test_unauthenticated_admin_endpoints()
    test_jwt_tampering_and_revocation()
    test_login_brute_force_rate_limiting()
    test_password_reset_flow_and_anti_enumeration()
    test_admin_credentials_update_and_reauthentication()
    test_order_pii_masking()
    test_security_headers_and_root_leakage()
    print("\n======================================================================")
    print("ALL SECURITY REGRESSION TESTS PASSED 100% SUCCESFULLY!")
    print("======================================================================")

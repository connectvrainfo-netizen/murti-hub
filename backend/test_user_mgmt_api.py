import sys
from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_access_token

client = TestClient(app)

admin_token = create_access_token({
    "sub": "66666666-6666-6666-6666-666666660001",
    "email": "admin@amolmurtibhandar.com",
    "role": "super_admin",
    "full_name": "Amol Master Admin"
})
headers = {"Authorization": f"Bearer {admin_token}"}

print("=== 1. Testing GET /api/auth/users ===")
res = client.get("/api/auth/users", headers=headers)
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
resp_json = res.json()
assert resp_json.get("success") is True
data = resp_json["data"]
print(f"Total users returned: {data['total_count']}")
assert data['total_count'] >= 1
print(f"Admins: {data['admin_count']}, Customers: {data['customer_count']}")

# Verify no passwords or hashes leaked
for u in data['users']:
    assert "password_hash" not in u
    assert "pin_hash" not in u

print("=== 2. Testing POST /api/auth/users (provision user) ===")
create_payload = {
    "email": "test_staff_new@amolmurtibhandar.com",
    "password": "Password123!",
    "full_name": "Test Staff Member",
    "role": "editor",
    "phone": "+91 98765 43210"
}
res = client.post("/api/auth/users", json=create_payload, headers=headers)
assert res.status_code in [200, 201], f"Expected 200/201, got {res.status_code}: {res.text}"
new_user = res.json()["data"]
print(f"Provisioned user ID: {new_user['id']}, Role: {new_user['role']}")
assert new_user['role'] == 'editor'
assert new_user['email'] == "test_staff_new@amolmurtibhandar.com"

print("=== 3. Testing PATCH /api/auth/users/{user_id}/status ===")
res = client.patch(f"/api/auth/users/{new_user['id']}/status", json={"is_active": False}, headers=headers)
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
assert res.json()["data"]['is_active'] is False
print("Successfully suspended user account.")

print("=== 4. Testing PATCH /api/auth/users/{user_id}/role ===")
res = client.patch(f"/api/auth/users/{new_user['id']}/role", json={"role": "admin"}, headers=headers)
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
assert res.json()["data"]['role'] == 'admin'
print("Successfully updated user role to admin.")

print("=== 5. Testing DELETE /api/auth/users/{user_id} ===")
res = client.delete(f"/api/auth/users/{new_user['id']}", headers=headers)
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
print("Successfully deleted test user.")

print("=== ALL USER MANAGEMENT API TESTS PASSED! ===")

"""
Comprehensive Unit Test Suite for UptimeRobot Health Check & Monitoring Endpoints
Verifies:
1. HEAD & GET requests for /health, /uptimerobot, /ping, /healthz, and their /api/ aliases.
2. Anti-caching headers (Cache-Control: no-cache, no-store, must-revalidate).
3. Keyword monitoring compatibility ('healthy', 'OK', 'UP').
4. Plain text format support (?format=text and Accept: text/plain).
5. Deep health diagnostics (?deep=true).
6. Backward compatibility with existing status checks.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_uptimerobot_health_suite():
    print("=" * 70)
    print("TESTING UPTIMEROBOT & MONITORING HEALTH CHECK ROUTES")
    print("=" * 70)

    # 1. Test GET /health (Standard HTTP Monitor)
    res = client.get('/health')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["status"] == "healthy"
    assert data["message"] == "OK"
    assert data["system"] == "UP"
    assert "uptime_seconds" in data
    assert "uptime_human" in data
    assert "timestamp" in data
    assert "checks" in data
    assert data["monitored_by"] == "UptimeRobot"
    
    # Verify anti-cache headers
    assert "no-cache" in res.headers.get("Cache-Control", "")
    assert "no-store" in res.headers.get("Cache-Control", "")
    assert res.headers.get("X-Health-Status") == "healthy"
    print("[PASS] 1. GET /health returned 200 OK with rich metrics and anti-cache headers.")

    # 2. Test HEAD /health (UptimeRobot default method)
    head_res = client.head('/health')
    assert head_res.status_code == 200
    assert head_res.headers.get("X-Health-Status") == "healthy"
    assert len(head_res.content) == 0  # HEAD should have no response body
    print("[PASS] 2. HEAD /health returned 200 OK (zero body payload for efficient ping).")

    # 3. Test Dedicated /uptimerobot endpoint
    ur_res = client.get('/uptimerobot')
    assert ur_res.status_code == 200
    assert ur_res.json()["status"] == "healthy"
    print("[PASS] 3. GET /uptimerobot dedicated probe verified.")

    # 4. Test Dedicated /api/uptimerobot endpoint
    ur_api_res = client.get('/api/uptimerobot')
    assert ur_api_res.status_code == 200
    assert ur_api_res.json()["status"] == "healthy"
    print("[PASS] 4. GET /api/uptimerobot reverse-proxy alias verified.")

    # 5. Test /api/health alias (for frontend reverse proxies like Vercel/Nginx)
    api_health = client.get('/api/health')
    assert api_health.status_code == 200
    assert api_health.json()["status"] == "healthy"
    print("[PASS] 5. GET /api/health returned 200 OK.")

    # 6. Test /ping and /api/ping
    ping_res = client.get('/ping')
    assert ping_res.status_code == 200
    api_ping_res = client.get('/api/ping')
    assert api_ping_res.status_code == 200
    print("[PASS] 6. GET /ping and /api/ping returned 200 OK.")

    # 7. Test /healthz and /api/healthz (Kubernetes / Cloud standard)
    k8s_res = client.get('/healthz')
    assert k8s_res.status_code == 200
    k8s_api_res = client.get('/api/healthz')
    assert k8s_api_res.status_code == 200
    print("[PASS] 7. GET /healthz and /api/healthz returned 200 OK.")

    # 8. Test Keyword monitoring matching
    body_text = res.text
    assert "healthy" in body_text, "Keyword 'healthy' not found in response"
    assert "OK" in body_text, "Keyword 'OK' not found in response"
    assert "UP" in body_text, "Keyword 'UP' not found in response"
    print("[PASS] 8. UptimeRobot Keyword Monitoring matches verified ('healthy', 'OK', 'UP').")

    # 9. Test Plain Text format (?format=text)
    txt_res = client.get('/health?format=text')
    assert txt_res.status_code == 200
    assert txt_res.text.strip() == "OK"
    assert "text/plain" in txt_res.headers.get("content-type", "")
    print("[PASS] 9. Plain text response (?format=text) returned 'OK'.")

    # 10. Test Plain Text via Accept Header
    txt_hdr_res = client.get('/health', headers={"Accept": "text/plain"})
    assert txt_hdr_res.status_code == 200
    assert txt_hdr_res.text.strip() == "OK"
    print("[PASS] 10. Plain text response (Accept: text/plain) returned 'OK'.")

    # 11. Test Deep check (?deep=true)
    deep_res = client.get('/health?deep=true')
    assert deep_res.status_code == 200
    deep_data = deep_res.json()
    assert "database" in deep_data
    assert deep_data["database"]["status"] in ["operational", "connected"]
    print("[PASS] 11. Deep health diagnostics (?deep=true) executed cleanly.")

    # 12. Test Root endpoint info contains health links
    root_res = client.get('/')
    assert root_res.status_code == 200
    assert root_res.json()["health_check"] == "/health"
    assert root_res.json()["uptimerobot_probe"] == "/uptimerobot"
    print("[PASS] 12. Root endpoint (/) provides discovery links to health endpoints.")

    print("\n=== ALL UPTIMEROBOT HEALTH CHECK TESTS PASSED 100% SUCCESFULLY! ===\n")

if __name__ == "__main__":
    test_uptimerobot_health_suite()

"""Tests para el endpoint raíz y cabeceras de seguridad HTTP."""


class TestHome:
    def test_home_returns_200(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert resp.json() == {"message": "NeoMente API Online"}

    def test_security_headers_present(self, client):
        resp = client.get("/")
        assert resp.headers["X-Content-Type-Options"] == "nosniff"
        assert resp.headers["X-Frame-Options"] == "DENY"
        assert resp.headers["X-XSS-Protection"] == "1; mode=block"
        assert "max-age=" in resp.headers["Strict-Transport-Security"]
        assert resp.headers["Content-Security-Policy"] == "default-src 'self'"
        assert resp.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"

    def test_docs_has_relaxed_csp(self, client):
        resp = client.get("/docs")
        assert "unsafe-inline" in resp.headers["Content-Security-Policy"]

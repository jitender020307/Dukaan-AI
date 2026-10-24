"""DukaanAI demo API with Supabase Auth and server-side role checks."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json, os, re
from forecast import recommend

ROOT = Path(__file__).resolve().parent.parent
# Optional local configuration file; production should use host-provided environment variables.
for line in (Path(__file__).resolve().parent / ".env").read_text().splitlines() if (Path(__file__).resolve().parent / ".env").exists() else []:
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        name, value = line.split("=", 1); os.environ.setdefault(name.strip(), value.strip().strip('"').strip("'"))
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
P = {"milk":{"name":"Amul Taaza Milk","stock":20,"unit":"packets","lead":2,"safety":5,"sales":[10,13,11,14,9,13,14]},"bread":{"name":"Brown Bread","stock":9,"unit":"loaves","lead":1,"safety":4,"sales":[7,8,6,9,8,10,9]},"eggs":{"name":"Farm Eggs","stock":6,"unit":"trays","lead":1,"safety":3,"sales":[4,5,3,6,4,5,6]},"rice":{"name":"Basmati Rice (1 kg)","stock":32,"unit":"packs","lead":3,"safety":8,"sales":[3,4,3,2,5,4,3]}}
D = {"sales":8450,"profit":1920,"items":67,"weekly":[6120,7340,6890,8120,7650,9010,8450],"days":["Sat","Sun","Mon","Tue","Wed","Thu","Fri"],"top":[["Amul Taaza Milk",14,"packets"],["Brown Bread",10,"loaves"],["Farm Eggs",6,"trays"]]}

class ApiError(Exception):
    def __init__(self, message, status=400): self.message, self.status = message, status

def supabase_request(path, method="GET", *, token=None, body=None, prefer=None):
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ApiError("Backend Supabase URL and publishable key are not configured.", 503)
    needs_service_key = path.startswith("/auth/v1/admin/") or path.startswith("/auth/v1/invite") or (path.startswith("/rest/v1/") and token is None)
    if needs_service_key and not SUPABASE_SERVICE_ROLE_KEY:
        raise ApiError("Owner team administration needs SUPABASE_SERVICE_ROLE_KEY in backend/.env. Use a Supabase server-side secret key; never put it in frontend variables.", 503)
    key = SUPABASE_SERVICE_ROLE_KEY if needs_service_key else SUPABASE_ANON_KEY
    headers = {"apikey": key, "Authorization": "Bearer " + (token or key), "Accept": "application/json"}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if prefer: headers["Prefer"] = prefer
    req = Request(SUPABASE_URL + path, data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=10) as response:
            payload = response.read()
            return json.loads(payload) if payload else None
    except HTTPError as exc:
        try:
            error_body = json.loads(exc.read())
            detail = error_body.get("msg") or error_body.get("message")
        except Exception: detail = None
        raise ApiError(detail or "Supabase request failed.", 502)
    except URLError:
        raise ApiError("Could not connect to Supabase.", 503)

def require_user(handler):
    auth = handler.headers.get("Authorization", "")
    token = auth[7:].strip() if auth.lower().startswith("bearer ") else ""
    if not token: raise ApiError("Sign in is required.", 401)
    user = supabase_request("/auth/v1/user", token=token)
    uid = user.get("id") if isinstance(user, dict) else None
    if not uid: raise ApiError("Your session is invalid. Sign in again.", 401)
    rows = supabase_request("/rest/v1/profiles?id=eq." + quote(uid) + "&select=id,email,role,store_id", token=token)
    if not rows or rows[0].get("role") not in ("owner", "manager", "staff") or not rows[0].get("store_id"):
        raise ApiError("Your account has no store role yet. Ask the owner to finish setup.", 403)
    profile = rows[0]
    profile["email"] = user.get("email", profile.get("email", ""))
    return profile

def require_owner(profile):
    if profile["role"] != "owner": raise ApiError("Only the store owner can manage team access.", 403)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs): super().__init__(*args, directory=str(ROOT / "frontend"), **kwargs)
    def reply(self, payload, status=200):
        data = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status); self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data))); self.send_header("Cache-Control", "no-store")
        self.end_headers(); self.wfile.write(data)
    def body(self, max_bytes=4096):
        size = int(self.headers.get("Content-Length", "0"))
        if size > max_bytes: raise ApiError("Request too large.", 413)
        try: return json.loads(self.rfile.read(size) or b"{}")
        except (ValueError, UnicodeDecodeError): raise ApiError("Send valid JSON.", 400)
    def dispatch(self, callback):
        try: callback()
        except ApiError as exc: self.reply({"error": exc.message}, exc.status)
        except (ValueError, TypeError, AttributeError): self.reply({"error": "Invalid request."}, 400)
    def do_GET(self): self.dispatch(self._get)
    def _get(self):
        path = urlparse(self.path).path
        if path == "/api/health": return self.reply({"ok": True})
        if not path.startswith("/api/"): return super().do_GET()
        profile = require_user(self)
        if path == "/api/me": return self.reply({"profile": profile})
        if path == "/api/dashboard":
            alerts = [{"id":k,"name":p["name"],"stock":p["stock"],"unit":p["unit"],"reason":"Stock delivery se pehle kam pad sakta hai."} for k,p in P.items() if p["stock"] <= recommend(p)["leadDemand"] + p["safety"]]
            return self.reply({"summary": D, "alerts": alerts, "sampleData": True})
        if path == "/api/users":
            require_owner(profile)
            users = supabase_request("/rest/v1/profiles?store_id=eq." + quote(profile["store_id"]) + "&select=id,email,role,store_id&order=email")
            return self.reply({"users": users})
        return self.reply({"error":"Not found"}, 404)
    def do_POST(self): self.dispatch(self._post)
    def _post(self):
        path = urlparse(self.path).path
        if not path.startswith("/api/"): return self.reply({"error":"Not found"}, 404)
        profile = require_user(self)
        if path == "/api/restock":
            data = self.body(); key = data.get("productId")
            if key not in P: return self.reply({"error":"Product not found"}, 404)
            return self.reply(recommend(P[key]))
        if path == "/api/users":
            require_owner(profile)
            data = self.body(); email = str(data.get("email", "")).strip().lower(); role = data.get("role")
            if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email): raise ApiError("Enter a valid email address.")
            if role not in ("manager", "staff"): raise ApiError("Invites can be assigned Manager or Staff. Owner role is reserved.")
            invited = supabase_request("/auth/v1/invite", "POST", body={"email":email,"data":{"store_id":profile["store_id"]}})
            uid = invited.get("id") if isinstance(invited, dict) else None
            if not uid: raise ApiError("Invitation was sent, but the account profile was not returned.", 502)
            rows = supabase_request("/rest/v1/profiles?id=eq." + quote(uid), "PATCH", body={"store_id":profile["store_id"],"role":role}, prefer="return=representation")
            if not rows: raise ApiError("The invitation was created, but its role profile could not be assigned. Check the Supabase migration.", 502)
            return self.reply({"ok":True}, 201)
        return self.reply({"error":"Not found"}, 404)
    def do_PATCH(self): self.dispatch(self._patch)
    def _patch(self):
        path = urlparse(self.path).path
        match = re.fullmatch(r"/api/users/([0-9a-fA-F-]{36})/role", path)
        if not match: return self.reply({"error":"Not found"}, 404)
        profile = require_user(self); require_owner(profile); data = self.body(); role = data.get("role")
        if role not in ("manager", "staff"): raise ApiError("Owner role cannot be assigned here.")
        uid = match.group(1)
        if uid == profile["id"]: raise ApiError("Owners cannot change their own role.", 400)
        rows = supabase_request("/rest/v1/profiles?id=eq." + quote(uid) + "&store_id=eq." + quote(profile["store_id"]) + "&select=id", "PATCH", body={"role":role}, prefer="return=representation")
        if not rows: raise ApiError("Team member not found in this store.", 404)
        return self.reply({"ok":True})
    def log_message(self, fmt, *args): print("%s - %s" % (self.address_string(), fmt % args))

if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print("DukaanAI at http://localhost:%d" % port)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()

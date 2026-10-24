from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import json
from forecast import recommend
ROOT=Path(__file__).resolve().parent.parent
P={"milk":{"name":"Amul Taaza Milk","stock":20,"unit":"packets","lead":2,"safety":5,"sales":[10,13,11,14,9,13,14]},"bread":{"name":"Brown Bread","stock":9,"unit":"loaves","lead":1,"safety":4,"sales":[7,8,6,9,8,10,9]},"eggs":{"name":"Farm Eggs","stock":6,"unit":"trays","lead":1,"safety":3,"sales":[4,5,3,6,4,5,6]},"rice":{"name":"Basmati Rice (1 kg)","stock":32,"unit":"packs","lead":3,"safety":8,"sales":[3,4,3,2,5,4,3]}}
D={"sales":8450,"profit":1920,"items":67,"weekly":[6120,7340,6890,8120,7650,9010,8450],"days":["Sat","Sun","Mon","Tue","Wed","Thu","Fri"],"top":[["Amul Taaza Milk",14,"packets"],["Brown Bread",10,"loaves"],["Farm Eggs",6,"trays"]]}
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT/"frontend"),**kw)
 def reply(self,x,status=200):
  b=json.dumps(x,ensure_ascii=False).encode();self.send_response(status);self.send_header("Content-Type","application/json; charset=utf-8");self.send_header("Content-Length",str(len(b)));self.send_header("Cache-Control","no-store");self.end_headers();self.wfile.write(b)
 def do_GET(self):
  path=urlparse(self.path).path
  if path=="/api/health":return self.reply({"ok":True})
  if path=="/api/dashboard":
   alerts=[{"id":k,"name":p["name"],"stock":p["stock"],"unit":p["unit"],"reason":"Stock delivery se pehle kam pad sakta hai."} for k,p in P.items() if p["stock"]<=recommend(p)["leadDemand"]+p["safety"]]
   return self.reply({"summary":D,"alerts":alerts,"sampleData":True})
  return super().do_GET()
 def do_POST(self):
  if urlparse(self.path).path!="/api/restock":return self.reply({"error":"Not found"},404)
  try:
   n=int(self.headers.get("Content-Length","0"))
   if n>4096:return self.reply({"error":"Request too large"},413)
   k=json.loads(self.rfile.read(n) or b"{}").get("productId")
   if k not in P:return self.reply({"error":"Product not found"},404)
   return self.reply(recommend(P[k]))
  except (ValueError,TypeError,AttributeError):return self.reply({"error":"Send JSON with productId"},400)
if __name__=="__main__":
 print("DukaanAI at http://localhost:8000")
 ThreadingHTTPServer(("127.0.0.1",8000),Handler).serve_forever()

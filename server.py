#!/usr/bin/env python3
"""灵兽录 游戏服务器 — 静态文件 + 云存档"""
import http.server
import json
import os
import urllib.parse

PORT = 8081
DATA_DIR = os.path.expanduser("~/.lingshoulu_saves")
os.makedirs(DATA_DIR, exist_ok=True)

class GameHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/save":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                device = data.get("device_id", self.client_address[0])
                save_path = os.path.join(DATA_DIR, f"{device}.json")
                
                # 冲突检测：如果云端存档比客户端新，拒绝覆盖
                client_time = data.get("save_time", 0)
                existing = {}
                if os.path.exists(save_path):
                    with open(save_path, "r", encoding="utf-8") as f:
                        existing = json.load(f)
                    cloud_time = existing.get("save_time", 0)
                    if client_time < cloud_time:
                        self.send_json({
                            "ok": False,
                            "conflict": True,
                            "error": "云端有更新的存档，请重新加载"
                        })
                        return
                
                with open(save_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False)
                self.send_json({"ok": True})
            except Exception as e:
                self.send_json({"ok": False, "error": str(e)})
        else:
            self.send_error(404)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/load":
            qs = urllib.parse.parse_qs(parsed.query)
            device = qs.get("device_id", [self.client_address[0]])[0]
            save_path = os.path.join(DATA_DIR, f"{device}.json")
            if os.path.exists(save_path):
                with open(save_path, encoding="utf-8") as f:
                    data = json.load(f)
                self.send_json(data)
            else:
                self.send_json({"ok": False, "error": "no_save"})
        else:
            super().do_GET()

    def send_json(self, data):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

if __name__ == "__main__":
    chdir_to = os.path.join(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(chdir_to)
    server = http.server.HTTPServer(("0.0.0.0", PORT), GameHandler)
    print(f"灵兽录服务器: http://0.0.0.0:{PORT}")
    server.serve_forever()

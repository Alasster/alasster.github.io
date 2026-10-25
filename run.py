import os
import sys
import socket
import runpy

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

root_dir = os.path.dirname(os.path.abspath(__file__))
cabinet_dir = os.path.join(root_dir, "Личный кабинет")
os.chdir(cabinet_dir)
sys.path.insert(0, cabinet_dir)

lan_ip = "127.0.0.1"
try:
    hostname = socket.gethostname()
    for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
        ip = info[4][0]
        if not ip.startswith(("127.", "169.254.", "100.")):
            lan_ip = ip
            break
except Exception:
    pass

public_url = "https://6a.tailc56f23.ts.net"
runtime_path = os.path.join(cabinet_dir, ".runtime", "public_url.txt")
if os.path.exists(runtime_path):
    try:
        with open(runtime_path, "r", encoding="utf-8-sig") as f:
            p = f.read().strip()
            if p:
                public_url = p
    except Exception:
        pass

print("======================================================================")
print("     ЕДИНЫЙ СЕРВЕР: ЛИЧНЫЙ КАБИНЕТ + ГЕНЕРАТОР ТЕСТОВ (СОР/СОЧ)       ")
print("======================================================================")
print(f"  Кабинет учителя (ПК):        http://127.0.0.1:8010")
print(f"  По локальному Wi-Fi / LAN:   http://{lan_ip}:8010")
print(f"  Интернет для учеников:       {public_url}/generator/exam/<ID>")
print("======================================================================")
print()

runpy.run_path(os.path.join(cabinet_dir, "server.py"), run_name="__main__")


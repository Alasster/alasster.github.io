import os
import sys
import subprocess
import socket
import webbrowser
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
CABINET_DIR = os.path.join(ROOT_DIR, "Личный кабинет")
os.chdir(CABINET_DIR)
sys.path.insert(0, CABINET_DIR)

# 1. Check requirements
print("[1/3] Проверка библиотек...")
required = ["fastapi", "uvicorn", "aiosqlite", "openpyxl", "multipart"]
missing = []
for pkg in required:
    try:
        __import__(pkg)
    except ImportError:
        missing.append(pkg)

if missing:
    print(f"      Установка недостающих библиотек: {missing}...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=False)

print("[2/3] Библиотеки проверены.")

# 2. Firewall rule (silent)
try:
    subprocess.run(["netsh", "advfirewall", "firewall", "add", "rule", "name=Alasster Cabinet", "dir=in", "action=allow", "protocol=TCP", "localport=8010"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    subprocess.run(["netsh", "advfirewall", "firewall", "add", "rule", "name=Alasster Student Gateway", "dir=in", "action=allow", "protocol=TCP", "localport=8001"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
except Exception:
    pass

# 3. Detect LAN IP
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
runtime_path = os.path.join(CABINET_DIR, ".runtime", "public_url.txt")
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
print()
print("  СЕРВЕР УСПЕШНО ЗАПУЩЕН И ГОТОВ К РАБОТЕ!")
print()
print("  Вход для учителя:")
print("    -> С этого компьютера:       http://127.0.0.1:8010")
print(f"    -> По школьному Wi-Fi / LAN: http://{lan_ip}:8010")
print()
print("  ДЛЯ УЧЕНИКОВ (сдача тестов с любых телефонов / мобильного интернета):")
print(f"    -> ИНТЕРНЕТ (Tailscale):     {public_url}/generator/exam/<id_работы>")
print(f"    -> В локальном Wi-Fi:        http://{lan_ip}:8010/generator/exam/<id_работы>")
print()
print("  Сервисы единого сервера:")
print("    [+] Личный кабинет учителя (порт 8010)")
print("    [+] Генератор тестов, СОР и СОЧ")
print("    [+] Интернет-шлюз для учеников (порт 8001 / Tailscale Funnel)")
print("    [+] Онлайн мониторинг и проведение")
print("    [+] Раздел «Мои материалы»")
print()
print("  Для остановки сервера нажмите Ctrl + C в этом окне.")
print("======================================================================")
print()

# Auto-open browser for teacher convenience
def open_browser():
    time.sleep(1.2)
    try:
        webbrowser.open("http://127.0.0.1:8010/")
    except Exception:
        pass

import threading
threading.Thread(target=open_browser, daemon=True).start()

# Launch uvicorn
import uvicorn
uvicorn.run("server:app", host="0.0.0.0", port=8010, reload=False)

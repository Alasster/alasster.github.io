import os
import sys
import time
import socket
import ctypes
import warnings
import threading
import webbrowser
import urllib.request
import runpy

warnings.filterwarnings("ignore", category=DeprecationWarning)

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
    try:
        kernel32 = ctypes.windll.kernel32
        for handle_id in (-11, -12):
            handle = kernel32.GetStdHandle(handle_id)
            mode = ctypes.c_uint32()
            if kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
                kernel32.SetConsoleMode(handle, mode.value | 0x0004)
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

print("======================================================================")
print("     ЕДИНЫЙ СЕРВЕР: ЛИЧНЫЙ КАБИНЕТ + ГЕНЕРАТОР ТЕСТОВ (СОР/СОЧ)       ")
print("======================================================================")
print(f"  Кабинет учителя (на этом ПК):    http://127.0.0.1:8010")
print(f"  Кабинет со смартфонов (Wi-Fi):   http://{lan_ip}:8010")
print(f"  Экзамены для учеников (LAN):     http://{lan_ip}:8010/generator/exam/<ID>")
print("  Внешний интернет-туннель (4G):   запускается автоматически...")
print("======================================================================")
print()


def _open_cabinet_when_ready():
    import subprocess
    code_cmd = os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.cmd")
    for _ in range(30):
        try:
            with urllib.request.urlopen("http://127.0.0.1:8010/health", timeout=1) as r:
                if r.status == 200:
                    if os.path.exists(code_cmd):
                        subprocess.run([code_cmd, "--open-url", "vscode://alasster.alasster-open-cabinet/open"], capture_output=True)
                    webbrowser.open("http://127.0.0.1:8010")
                    return
        except Exception:
            pass
        time.sleep(0.5)


if os.environ.get("NO_AUTO_BROWSER") != "1":
    threading.Thread(target=_open_cabinet_when_ready, daemon=True).start()

runpy.run_path(os.path.join(cabinet_dir, "server.py"), run_name="__main__")

import os
import sys
import socket
import ctypes
import warnings
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
print(f"  Вход по Wi-Fi / Хотспоту (LAN):  http://{lan_ip}:8001/generator/exam/<ID>")
print("  Внешний интернет-туннель (4G):   запускается автоматически...")
print("======================================================================")
print()

runpy.run_path(os.path.join(cabinet_dir, "server.py"), run_name="__main__")

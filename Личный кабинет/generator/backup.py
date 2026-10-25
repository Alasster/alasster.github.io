import os
import sqlite3
import shutil
import logging
from datetime import datetime

logger = logging.getLogger("bagalau.backup")
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
BACKUP_DIR = os.path.join(BASE_DIR, "backups")
DB_PATH = os.path.join(DATA_DIR, "bagalau.sqlite3")

import re

def create_backup(custom_name: str = None) -> str:
    os.makedirs(BACKUP_DIR, exist_ok=True)
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database not found at {DB_PATH}")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if custom_name and custom_name.strip():
        # Очищаем имя от недопустимых символов для файловой системы
        safe_name = re.sub(r'[^a-zA-Z0-9а-яА-ЯёЁ_\- ]', '', custom_name.strip())
        safe_name = re.sub(r'\s+', '_', safe_name)[:50]
        backup_filename = f"bagalau_{timestamp}_{safe_name}.sqlite3"
    else:
        backup_filename = f"bagalau_backup_{timestamp}.sqlite3"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)

    # Используем SQLite online backup API для безопасного создания снимка даже под нагрузкой
    src = sqlite3.connect(DB_PATH)
    dst = sqlite3.connect(backup_path)
    with dst:
        src.backup(dst, pages=100)
    dst.close()
    src.close()

    logger.info("Backup created successfully: %s", backup_path)
    return backup_filename

def list_backups() -> list:
    if not os.path.exists(BACKUP_DIR):
        return []
    files = [f for f in os.listdir(BACKUP_DIR) if f.endswith(".sqlite3")]
    files.sort(reverse=True)
    result = []
    for f in files:
        full_path = os.path.join(BACKUP_DIR, f)
        try:
            stat = os.stat(full_path)
            size_kb = round(stat.st_size / 1024, 1)
            created_at = datetime.fromtimestamp(stat.st_mtime).isoformat()
        except Exception:
            size_kb = 0
            created_at = datetime.now().isoformat()
        result.append({
            "filename": f,
            "size_kb": size_kb,
            "created_at": created_at
        })
    return result

def delete_backup(backup_filename: str) -> bool:
    # Защита от path traversal
    safe_file = os.path.basename(backup_filename)
    if not safe_file.endswith(".sqlite3"):
        raise ValueError("Invalid backup filename")
    backup_path = os.path.join(BACKUP_DIR, safe_file)
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file not found: {safe_file}")
    os.remove(backup_path)
    logger.info("Backup deleted successfully: %s", backup_path)
    return True

def restore_backup(backup_filename: str) -> bool:
    backup_path = os.path.join(BACKUP_DIR, backup_filename)
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file not found: {backup_path}")

    # Проверяем целостность файла бэкапа
    conn = sqlite3.connect(backup_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA integrity_check;")
    res = cursor.fetchone()
    conn.close()

    if not res or res[0] != "ok":
        raise ValueError(f"Backup integrity check failed: {res}")

    # Копируем файл поверх основной базы данных
    shutil.copy2(backup_path, DB_PATH)
    # Удаляем сопутствующие WAL / SHM файлы при наличии
    for ext in ["-wal", "-shm"]:
        sidecar = DB_PATH + ext
        if os.path.exists(sidecar):
            try:
                os.remove(sidecar)
            except Exception:
                pass

    logger.info("Restored database from backup: %s", backup_filename)
    return True

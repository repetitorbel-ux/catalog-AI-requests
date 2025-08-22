import os
import shutil
from datetime import datetime
from config import DATABASE_URI, BACKUP_DIR
from sqlalchemy.engine import url as sql_url
import re
import logging
from flask import current_app

def normalize(text):
    return re.sub(r'\W+', ' ', text).strip().lower()

def get_db_file():
    # В тестовом режиме URI может не быть файлом, возвращаем None
    if current_app.config.get('TESTING'):
        return None
    parsed = sql_url.make_url(DATABASE_URI)
    return parsed.database

def create_backup():
    # Не создаем бэкапы в режиме тестирования
    if current_app.config.get('TESTING'):
        return

    db_file = get_db_file()
    if not db_file or not os.path.exists(db_file):
        logging.warning(f"Database file not found at {db_file}. Skipping backup.")
        return

    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
    
    backup_file = os.path.join(BACKUP_DIR, f"catalog_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db")
    shutil.copy2(db_file, backup_file)
    logging.info(f"Backup created: {backup_file}")

def restore_backup(backup_file):
    # Не восстанавливаем в режиме тестирования
    if current_app.config.get('TESTING'):
        return

    db_file = get_db_file()
    if not db_file:
        logging.error("Database file path could not be determined. Skipping restore.")
        return

    shutil.copy2(backup_file, db_file)
    logging.info(f"Restored from backup: {backup_file}")
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --- Основная конфигурация базы данных ---

# --- Удаленная БД (Neon) ---
SQLALCHEMY_DATABASE_URI = 'postgresql://neondb_owner:npg_T9OUgFcmw7Ct@ep-tiny-leaf-afbopbk9-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# --- Локальная тестовая БД (для разработки и проверки бэкапов) ---
# SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:12345678@localhost:5432/catalog_local'

SQLALCHEMY_TRACK_MODIFICATIONS = False

# Настройки для отказоустойчивости подключения к БД
SQLALCHEMY_POOL_RECYCLE = 299
SQLALCHEMY_POOL_PRE_PING = True

# Пути к файлам и папкам
BACKUP_DIR = os.path.join(BASE_DIR, "backups")
MARKDOWN_FILE = os.path.join(BASE_DIR, "catalog.md")
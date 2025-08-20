import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URI = f'sqlite:///{os.path.join(BASE_DIR, "instance", "catalog.db")}'
BACKUP_DIR = os.path.join(BASE_DIR, "backups")
MARKDOWN_FILE = os.path.join(BASE_DIR, "catalog.md")
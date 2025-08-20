import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URI = 'postgresql://neondb_owner:npg_T9OUgFcmw7Ct@ep-tiny-leaf-afbopbk9-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
BACKUP_DIR = os.path.join(BASE_DIR, "backups")
MARKDOWN_FILE = os.path.join(BASE_DIR, "catalog.md")
import os
import subprocess
from datetime import datetime
from urllib.parse import urlparse
from config import SQLALCHEMY_DATABASE_URI, BACKUP_DIR
import re
import logging
from flask import current_app

def normalize(text):
    return re.sub(r'\W+', ' ', text).strip().lower()

def _get_db_env():
    """Parses the database URI and returns a dictionary of environment variables for pg tools."""
    parsed_uri = urlparse(SQLALCHEMY_DATABASE_URI)
    env = os.environ.copy()
    env['PGHOST'] = parsed_uri.hostname or ''
    env['PGPORT'] = str(parsed_uri.port or 5432)
    env['PGUSER'] = parsed_uri.username or ''
    env['PGPASSWORD'] = parsed_uri.password or ''
    env['PGDATABASE'] = parsed_uri.path.lstrip('/')
    return env

def create_backup():
    """
    Creates a backup of the PostgreSQL database using pg_dump.
    The backup is created in a custom format for pg_restore.
    """
    if current_app.config.get('TESTING'):
        logging.info("Skipping backup in testing mode.")
        return

    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
    
    backup_filename = f"catalog_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sqlc"
    backup_filepath = os.path.join(BACKUP_DIR, backup_filename)
    
    db_env = _get_db_env()
    command = [
        'pg_dump',
        '--format', 'c',  # custom-format archive, best for pg_restore
        '--file', backup_filepath
    ]

    try:
        process = subprocess.run(command, check=True, capture_output=True, text=True, encoding='utf-8', env=db_env)
        logging.info(f"Backup created successfully: {backup_filename}")
        if process.stderr:
            logging.warning(f"pg_dump stderr: {process.stderr}")
    except FileNotFoundError:
        logging.error("pg_dump command not found. Make sure PostgreSQL client tools are installed and in your PATH.")
        raise
    except subprocess.CalledProcessError as e:
        logging.error(f"Failed to create backup. pg_dump exited with error code {e.returncode}: {e.stderr}")
        raise

def restore_backup(backup_filepath):
    """
    Restores a backup to the PostgreSQL database using pg_restore.
    """
    if current_app.config.get('TESTING'):
        logging.info("Skipping restore in testing mode.")
        return

    db_env = _get_db_env()
    command = [
        'pg_restore',
        '--dbname', db_env['PGDATABASE'],
        '--clean',
        '--if-exists',
        '--no-privileges',
        '--no-owner',
        '--verbose',
        backup_filepath
    ]

    try:
        # Let pg_restore write directly to the console without capturing
        process = subprocess.run(command, check=True, env=db_env)
        logging.info(f"Restored from backup: {os.path.basename(backup_filepath)}")
    except FileNotFoundError:
        logging.error("pg_restore command not found. Make sure PostgreSQL client tools are installed and in your PATH.")
        raise
    except subprocess.CalledProcessError as e:
        # Since output is not captured, we can't log e.stderr here.
        # The error will be visible in the console.
        logging.error(f"Failed to restore backup. pg_restore exited with error code {e.returncode}.")
        raise
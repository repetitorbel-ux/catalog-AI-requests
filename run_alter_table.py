import subprocess
from app import create_app
from utils import _get_db_env

# Нам нужен контекст приложения для доступа к конфигурации
app = create_app()
with app.app_context():
    print("Preparing to run ALTER TABLE command...")
    db_env = _get_db_env()
    sql_command = "ALTER TABLE url ADD COLUMN description VARCHAR;"
    
    # Команда для psql
    command = ['psql', '-c', sql_command]
    
    print(f"Executing command: {' '.join(command)}")
    
    try:
        process = subprocess.run(command, check=True, capture_output=True, text=True, encoding='utf-8', env=db_env)
        print("Command executed successfully.")
        if process.stdout:
            print(f"psql stdout:\n{process.stdout}")
        if process.stderr:
            print(f"psql stderr:\n{process.stderr}")
    except FileNotFoundError:
        print("ERROR: 'psql' command not found. Please ensure PostgreSQL client tools are installed and in your system's PATH.")
    except subprocess.CalledProcessError as e:
        print(f"ERROR: Failed to execute command. psql exited with error code {e.returncode}.")
        print(f"stderr:\n{e.stderr}")


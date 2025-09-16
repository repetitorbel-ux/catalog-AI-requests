import os
import logging
from flask import Flask
from extensions import db

def create_app(config_overrides=None, skip_db_create_all=False):
    app = Flask(__name__, template_folder="templates", static_folder="static")

    # Загрузка базовой конфигурации из файла config.py
    # Это делается для того, чтобы основные настройки были в одном месте,
    # а для тестов мы могли их переопределять.
    app.config.from_pyfile('config.py')

    # Применение переданных настроек (для тестов)
    if config_overrides:
        app.config.update(config_overrides)

    # Настройка логирования
    logging.basicConfig(
        filename=os.path.join(os.path.dirname(__file__), 'app.log'),
        level=logging.DEBUG,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

    # Проверка и создание директории backups
    backup_dir = app.config.get('BACKUP_DIR')
    if backup_dir and not os.path.exists(backup_dir):
        os.makedirs(backup_dir)

    # Инициализация базы данных
    db.init_app(app)

    # Установка search_path для Neon DB через событие SQLAlchemy.
    # Это решает проблему "unsupported startup parameter" при работе с пулером,
    # а также ошибку "no schema has been selected" при создании таблиц.
    from sqlalchemy import event
    from sqlalchemy.engine import Engine

    @event.listens_for(Engine, "connect")
    def set_search_path(dbapi_connection, connection_record):
        # Используем прокси-объект `db` для доступа к текущему движку
        if db.engine.dialect.name == 'postgresql':
            cursor = dbapi_connection.cursor()
            cursor.execute("SET search_path TO public")
            cursor.close()

    # Установка search_path для Neon DB через событие SQLAlchemy.
    # Это решает проблему "unsupported startup parameter" при работе с пулером.
    from sqlalchemy import event
    from sqlalchemy.engine import Engine

    @event.listens_for(Engine, "connect")
    def set_search_path(dbapi_connection, connection_record):
        # Используем прокси-объект `db` для доступа к текущему движку
        if db.engine.dialect.name == 'postgresql':
            cursor = dbapi_connection.cursor()
            cursor.execute("SET search_path TO public")
            cursor.close()

    # Импорт и регистрация Blueprint
    from routes import catalog_bp
    app.register_blueprint(catalog_bp)

    if not skip_db_create_all:
        # Импорт моделей. Создание таблиц вынесено в CLI команду.
        with app.app_context():
            from models import Category, Subcategory, Entry, Url

    # --- CLI Commands ---
    @app.cli.command("init-db")
    def init_db_command():
        """Creates the database tables."""
        db.create_all()
        print("Initialized the database.")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)

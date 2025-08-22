import os
import logging
from flask import Flask
from extensions import db

def create_app(config_overrides=None):
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

    # Импорт и регистрация Blueprint
    from routes import catalog_bp
    app.register_blueprint(catalog_bp)

    # Импорт моделей и создание таблиц в контексте приложения
    with app.app_context():
        from models import Category, Subcategory, Entry, Url
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)

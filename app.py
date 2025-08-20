from flask import Flask
import os
import logging
from sqlalchemy.engine import url as sql_url
from config import DATABASE_URI, BACKUP_DIR
from extensions import db

# Настройка логирования
logging.basicConfig(
    filename=os.path.join(os.path.dirname(__file__), 'app.log'),
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Проверка и создание директории instance
db_uri = app.config['SQLALCHEMY_DATABASE_URI']
parsed = sql_url.make_url(db_uri)
db_path = parsed.database
db_dir = os.path.dirname(db_path)
if not os.path.exists(db_dir):
    os.makedirs(db_dir)

# Проверка и создание директории backups
if not os.path.exists(BACKUP_DIR):
    os.makedirs(BACKUP_DIR)

# Инициализация базы данных
db.init_app(app)

# Импорт моделей
from models import Category, Subcategory, Entry, Url

# Импорт и регистрация Blueprint
from routes import catalog_bp
app.register_blueprint(catalog_bp)

if __name__ == "__main__":
    app.run(debug=True)
import pytest
from app import create_app, db
from models import Category, Subcategory, Entry

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Создаем экземпляр приложения с тестовой конфигурацией
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "WTF_CSRF_ENABLED": False,
        "BACKUP_DIR": "tests/backups"
    })

    # Контекст приложения необходим для работы с базой данных
    with app.app_context():
        # Таблицы уже создаются в create_app, но на всякий случай убедимся
        db.create_all()
        yield app
        # Очистка после тестов не нужна, т.к. база в памяти
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

def test_home_page(client):
    """Тест на успешную загрузку главной страницы."""
    response = client.get('/')
    assert response.status_code == 200
    assert b'\xd0\xa3\xd0\xbf\xd1\x80\xd0\xb0\xd0\xb2\xd0\xbb\xd0\xb5\xd0\xbd\xd0\xb8\xd0\xb5 \xd0\xba\xd0\xb0\xd1\x82\xd0\xb0\xd0\xbb\xd0\xbe\xd0\xb3\xd0\xbe\xd0\xbc' in response.data

def test_add_entry(client, app):
    """Тест на добавление новой категории, подкатегории и записи."""
    # Отправляем POST-запрос для добавления
    response = client.post('/add', data={
        'category_select': '__new__',
        'new_category': 'Тестовая Категория',
        'subcategory_select': '__new__',
        'new_subcategory': 'Тестовая Подкатегория',
        'entry_title': 'Тестовая Запись',
        'urls': 'http://example.com/test'
    }, follow_redirects=True)

    # Проверяем, что после добавления страница успешно загрузилась
    assert response.status_code == 200

    # Проверяем, что данные действительно появились в базе данных
    with app.app_context():
        category = Category.query.filter_by(name='Тестовая Категория').first()
        assert category is not None

        subcategory = Subcategory.query.filter_by(name='Тестовая Подкатегория').first()
        assert subcategory is not None
        assert subcategory.category_id == category.id

        entry = Entry.query.filter_by(title='Тестовая Запись').first()
        assert entry is not None
        assert entry.subcategory_id == subcategory.id
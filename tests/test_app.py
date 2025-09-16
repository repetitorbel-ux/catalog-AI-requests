import pytest
from app import create_app, db
from models import Category, Subcategory, Entry, Url

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

def test_add_entry_ajax(client, app):
    """Тест на добавление записи через AJAX."""
    response = client.post('/add', data={
        'category_select': '__new__',
        'new_category': 'AJAX Категория',
        'subcategory_select': '__new__',
        'new_subcategory': 'AJAX Подкатегория',
        'entry_title': 'AJAX Запись',
        'urls': 'http://example.com/ajax\nhttp://example.com/ajax2',
        'url_descriptions': 'Описание для AJAX 1\nОписание для AJAX 2'
    })

    # 1. Проверяем, что ответ успешный и в формате JSON
    assert response.status_code == 200
    assert response.content_type == 'application/json'

    # 2. Проверяем содержимое JSON-ответа
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert 'data' in json_data
    assert 'category_id' in json_data['data']
    assert 'subcategory_id' in json_data['data']
    assert 'entry_id' in json_data['data']

    # 3. Проверяем, что данные действительно были добавлены в БД
    with app.app_context():
        category = Category.query.filter_by(name='AJAX Категория').first()
        assert category is not None
        assert category.id == json_data['data']['category_id']

        subcategory = Subcategory.query.filter_by(name='AJAX Подкатегория').first()
        assert subcategory is not None
        assert subcategory.id == json_data['data']['subcategory_id']

        entry = Entry.query.filter_by(title='AJAX Запись').first()
        assert entry is not None
        assert entry.id == json_data['data']['entry_id']

        # 4. Проверяем, что URL и описания сохранились
        assert len(entry.urls) == 2
        assert entry.urls[0].url == 'http://example.com/ajax'
        assert entry.urls[0].description == 'Описание для AJAX 1'
        assert entry.urls[1].url == 'http://example.com/ajax2'
        assert entry.urls[1].description == 'Описание для AJAX 2'

def test_update_url(client, app):
    """Тест на обновление URL и его описания."""
    # 1. Сначала создадим начальные данные
    with app.app_context():
        cat = Category(name="Update Cat")
        sub = Subcategory(name="Update Sub", category=cat)
        entry = Entry(title="Update Entry", subcategory=sub)
        url = Url(url="http://original.com", description="Original desc", entry=entry)
        db.session.add_all([cat, sub, entry, url])
        db.session.commit()
        url_id = url.id

    # 2. Отправляем POST-запрос на обновление
    response = client.post(f'/update_url/{url_id}', json={
        'url': 'http://updated.com',
        'description': 'Updated desc'
    })

    # 3. Проверяем ответ
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'success'

    # 4. Проверяем, что данные в БД изменились
    with app.app_context():
        updated_url = Url.query.get(url_id)
        assert updated_url.url == 'http://updated.com'
        assert updated_url.description == 'Updated desc'

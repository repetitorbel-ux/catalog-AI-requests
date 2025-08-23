from flask import Blueprint, render_template, request, redirect, url_for, jsonify, send_file, flash
import os
from sqlalchemy import text
from models import Category, Subcategory, Entry, Url
from utils import normalize, create_backup, restore_backup
from config import MARKDOWN_FILE, BACKUP_DIR
from extensions import db
import logging

# Инициализация логгера
logger = logging.getLogger(__name__)

catalog_bp = Blueprint('catalog', __name__)

@catalog_bp.route('/', methods=['GET'])
def index():
    categories = Category.query.all()
    logger.debug(f"Загружено категорий: {len(categories)}")
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
    backup_files = sorted([f for f in os.listdir(BACKUP_DIR) if f.endswith('.sqlc') or f.endswith('.sql') or f.endswith('.db')], reverse=True)
    return render_template('interface.html', categories=categories, backup_files=backup_files)

@catalog_bp.route('/add', methods=['POST'])
def add():
    data = request.form
    category_name = data.get('category_select')
    new_category = data.get('new_category', '').strip()
    subcategory_name = data.get('subcategory_select')
    new_subcategory = data.get('new_subcategory', '').strip()

    if category_name == '__new__' and new_category:
        category_name = new_category
    if subcategory_name == '__new__' and new_subcategory:
        subcategory_name = new_subcategory

    entry_title = data.get('entry_title')
    urls_str = data.get('urls', '')
    urls = [url.strip() for url in urls_str.split('\n') if url.strip()] if urls_str else []

    if not category_name or not subcategory_name or not entry_title or not urls:
        flash('Все поля, кроме выбора существующих, должны быть заполнены для добавления записи.', 'error')
        return redirect(url_for('catalog.index'))

    category = Category.query.filter_by(name=category_name).first()
    if not category:
        category = Category(name=category_name)
        db.session.add(category)
        db.session.commit()
        logger.info(f"Создана новая категория: {category_name}")

    subcategory = Subcategory.query.filter_by(name=subcategory_name, category_id=category.id).first()
    if not subcategory:
        subcategory = Subcategory(name=subcategory_name, category_id=category.id)
        db.session.add(subcategory)
        db.session.commit()
        logger.info(f"Создана новая подкатегория: {subcategory_name}")

    entry = Entry.query.filter_by(title=entry_title, subcategory_id=subcategory.id).first()
    if not entry:
        entry = Entry(title=entry_title, subcategory_id=subcategory.id)
        db.session.add(entry)
        db.session.commit()
        logger.info(f"Создана новая запись: {entry_title}")

    Url.query.filter_by(entry_id=entry.id).delete()
    for url_str in urls:
        if url_str:
            db.session.add(Url(url=url_str, entry_id=entry.id))
    db.session.commit()
    flash(f"Запись '{entry_title}' успешно добавлена в '{category_name}/{subcategory_name}'", 'success')
    
    return redirect(url_for('catalog.index'))

@catalog_bp.route('/edit', methods=['POST'])
def edit():
    data = request.form
    entry_id = data.get('entry_id')
    entry = Entry.query.get(entry_id)
    if entry:
        entry.title = data.get('entry_title')
        Url.query.filter_by(entry_id=entry_id).delete()
        urls_str = data.get('urls', '')
        urls = [url.strip() for url in urls_str.split('\n') if url.strip()] if urls_str else []
        for url_str in urls:
            if url_str:
                db.session.add(Url(url=url_str, entry_id=entry_id))
        db.session.commit()
        flash(f"Запись '{entry.title}' успешно обновлена.", 'success')
        logger.info(f"Отредактирована запись: '{entry.title}' (ID: {entry_id})")
    else:
        flash("Ошибка: Запись для редактирования не найдена.", 'error')
        logger.warning(f"Запись с ID {entry_id} не найдена")
    
    return redirect(url_for('catalog.index'))

@catalog_bp.route('/delete/entry', methods=['POST'])
def delete_entry():
    entry_id = request.form.get('entry_id')
    entry = Entry.query.get(entry_id)
    if entry:
        entry_name = entry.title
        db.session.delete(entry)
        db.session.commit()
        flash(f"Запись '{entry_name}' успешно удалена.", 'success')
        logger.info(f"Entry {entry_name} deleted successfully")
    else:
        flash("Ошибка: Запись для удаления не найдена.", 'error')
        logger.warning(f"Entry with ID {entry_id} not found")
    
    return redirect(url_for('catalog.index'))

@catalog_bp.route('/delete/category', methods=['POST'])
def delete_category():
    category_id = request.form.get('category_id')
    category = Category.query.get(category_id)
    if category:
        category_name = category.name
        db.session.delete(category)
        db.session.commit()
        flash(f"Категория '{category_name}' и все ее содержимое удалены.", 'success')
        logger.info(f"Category {category_name} deleted successfully")
    else:
        flash("Ошибка: Категория для удаления не найдена.", 'error')
        logger.warning(f"Category with ID {category_id} not found")
    
    return redirect(url_for('catalog.index'))

@catalog_bp.route('/delete/subcategory', methods=['POST'])
def delete_subcategory():
    subcategory_id = request.form.get('subcategory_id')
    subcategory = Subcategory.query.get(subcategory_id)
    if subcategory:
        subcategory_name = subcategory.name
        db.session.delete(subcategory)
        db.session.commit()
        flash(f"Подкатегория '{subcategory_name}' и все ее содержимое удалены.", 'success')
        logger.info(f"Subcategory {subcategory_name} deleted successfully")
    else:
        flash("Ошибка: Подкатегория для удаления не найдена.", 'error')
        logger.warning(f"Subcategory with ID {subcategory_id} not found")
    
    return redirect(url_for('catalog.index'))

@catalog_bp.route('/backup', methods=['POST'])
def backup():
    try:
        create_backup()
        flash("Резервная копия успешно создана!", 'success')
        logger.info("Backup created successfully by user.")
    except Exception as e:
        flash(f"Ошибка при создании резервной копии: {e}", 'error')
        logger.error(f"Failed to create backup by user: {e}")
    return redirect(url_for('catalog.index'))

@catalog_bp.route('/restore/<path:filename>', methods=['POST'])
def restore(filename):
    backup_file_path = os.path.join(BACKUP_DIR, filename)
    if os.path.exists(backup_file_path):
        try:
            restore_backup(backup_file_path)
            flash(f"База данных успешно восстановлена из файла {filename}.", 'success')
            logger.info(f"База данных восстановлена из файла: {filename}")
        except Exception as e:
            flash(f"Ошибка при восстановлении: {e}", 'error')
            logger.error(f"Failed to restore backup: {e}")
    else:
        flash(f"Файл бэкапа не найден: {filename}", 'error')
        logger.error(f"Файл бэкапа не найден: {filename}")
    return redirect(url_for('catalog.index'))


@catalog_bp.route('/get_subcategories', methods=['GET'])
def get_subcategories():
    category_id = request.args.get('category_id')
    category_name = request.args.get('category')
    logger.debug(f"Запрос подкатегорий: category_id={category_id}, category_name={category_name}")
    if category_id:
        category = Category.query.get(category_id)
    elif category_name:
        category = Category.query.filter_by(name=category_name).first()
    else:
        logger.warning("No category_id or category_name provided for get_subcategories")
        return jsonify([]), 400
    if category:
        subcategories = [{'id': sub.id, 'name': sub.name} for sub in category.subcategories]
        logger.debug(f"Найдено подкатегорий: {len(subcategories)} для категории {category.name}")
        return jsonify(subcategories)
    logger.warning(f"Category not found for ID {category_id} or name {category_name}")
    return jsonify([]), 404

@catalog_bp.route('/get_entries', methods=['GET'])
def get_entries():
    category_name = request.args.get('category')
    subcategory_name = request.args.get('subcategory')
    logger.debug(f"Получение записей: category={category_name}, subcategory={subcategory_name}")
    category = Category.query.filter_by(name=category_name).first()
    if category:
        subcategory = Subcategory.query.filter_by(name=subcategory_name, category_id=category.id).first()
        if subcategory:
            entries = [{'id': entry.id, 'title': entry.title} for entry in subcategory.entries]
            logger.debug(f"Найдено записей: {len(entries)} для подкатегории {subcategory_name}")
            return jsonify(entries)
        else:
            logger.warning(f"Подкатегория {subcategory_name} не найдена в категории {category_name}")
    else:
        logger.warning(f"Категория {category_name} не найдена")
    return jsonify([]), 404

@catalog_bp.route('/get_entry_details', methods=['GET'])
def get_entry_details():
    category_name = request.args.get('category')
    subcategory_name = request.args.get('subcategory')
    logger.debug(f"Запрос деталей: category={category_name}, subcategory={subcategory_name}")
    if category_name and subcategory_name:
        category = Category.query.filter_by(name=category_name).first()
        if category:
            subcategory = Subcategory.query.filter_by(name=subcategory_name, category_id=category.id).first()
            if subcategory:
                entries = Entry.query.filter_by(subcategory_id=subcategory.id).all()
                entry_details = [
                    {
                        'id': entry.id,
                        'title': entry.title,
                        'urls': [url.url for url in entry.urls]
                    } for entry in entries
                ]
                logger.debug(f"Найдено записей: {len(entry_details)} для подкатегории {subcategory_name} в категории {category_name}")
                return jsonify(entry_details)
            else:
                logger.warning(f"Подкатегория {subcategory_name} не найдена в категории {category_name}")
        else:
            logger.warning(f"Категория {category_name} не найдена")
    else:
        logger.warning("Не указаны category или subcategory")
    return jsonify([]), 404

@catalog_bp.route('/edit_entry', methods=['POST'])
def edit_entry():
    data = request.json
    entry_id = data.get('entry_id')
    entry = Entry.query.get(entry_id)
    if entry:
        entry.title = data.get('new_title', entry.title)
        Url.query.filter_by(entry_id=entry_id).delete()
        urls = data.get('new_urls', [])
        for url_str in urls:
            if url_str:
                db.session.add(Url(url=url_str, entry_id=entry_id))
        db.session.commit()
        flash(f"Запись '{entry.title}' успешно обновлена.", 'success')
        logger.info(f"Запись {entry.title} (ID: {entry_id}) отредактирована")
        return jsonify({'status': 'success'})
    logger.warning(f"Запись с ID {entry_id} не найдена")
    return jsonify({'status': 'error'}), 404

@catalog_bp.route('/export', methods=['GET'])
def export():
    with open(MARKDOWN_FILE, 'w', encoding='utf-8') as f:
        for category in Category.query.all():
            f.write(f"# {category.name}\n\n")
            for subcategory in category.subcategories:
                f.write(f"## {subcategory.name}\n\n")
                for entry in subcategory.entries:
                    f.write(f"### {entry.title}\n\n")
                    for url in entry.urls:
                        f.write(f"- {url.url}\n")
                    f.write("\n")
    flash("Каталог успешно экспортирован в Markdown.", 'info')
    logger.info("Каталог экспортирован в Markdown")
    return send_file(MARKDOWN_FILE, as_attachment=True)
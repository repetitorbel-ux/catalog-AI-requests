from extensions import db

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    subcategories = db.relationship('Subcategory', backref='category', lazy=True, cascade='all, delete-orphan')

class Subcategory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    entries = db.relationship('Entry', backref='subcategory', lazy=True, cascade='all, delete-orphan')

class Entry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    subcategory_id = db.Column(db.Integer, db.ForeignKey('subcategory.id'), nullable=False)
    urls = db.relationship('Url', backref='entry', lazy=True, cascade='all, delete-orphan')

class Url(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String, nullable=False)
    description = db.Column(db.String, nullable=True)
    entry_id = db.Column(db.Integer, db.ForeignKey('entry.id'), nullable=False)
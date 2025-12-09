from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    app.config['SQLALCHEMY_DATABASE_URI'] = \
        "{db}://{user}:{password}@{host}/{dbName}?charset=utf8mb4".format(
            db="mysql",
            user="sd-4",
            password="sd-4",
            host="localhost",
            dbName="sd-4"
        )
    db.init_app(app)
    return db


# ============================
# Users テーブル
# ============================
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    login_id = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # 1ユーザーが持つマーカー / 補充記録
    markers = db.relationship("Marker", backref="user", lazy=True)
    restocks = db.relationship("Restock", backref="user", lazy=True)


# ============================
# Markers テーブル（自販機）
# ============================
class Marker(db.Model):
    __tablename__ = "markers"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    name = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    taken_at = db.Column(db.DateTime, nullable=True)
    photo_path = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # この自販機への補充記録
    restocks = db.relationship("Restock", backref="marker", lazy=True)


# ============================
# Products テーブル（商品）
# ============================
class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)

    restocks = db.relationship("Restock", backref="product", lazy=True)


# ============================
# Restocks テーブル（補充記録）
# ============================
class Restock(db.Model):
    __tablename__ = "restocks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    marker_id = db.Column(db.Integer, db.ForeignKey("markers.id"), nullable=False)

    quantity = db.Column(db.Integer, nullable=False)
    restocked_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

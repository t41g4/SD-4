from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

def init_db(app):
    app.config['SQLALCHEMY_DATABASE_URI'] = \
        "{db}://{user}:{password}@{host}/{dbName}?charset=utf8".format(
            db = "mysql",
            user = "sd-4",
            password = "sd-4",
            host = "localhost",
            dbName = "sd-4"
        )
    db.init_app(app)
    return db

db = SQLAlchemy()
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    login_id = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow 
    )
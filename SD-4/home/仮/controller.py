from flask import render_template, jsonify, request, redirect, session
from sqlalchemy import func
from model import db, User
from datetime import datetime
from werkzeug.security import check_password_hash, generate_password_hash
import os
import openpyxl

def top():
    if "user_id" not in session:
            return redirect("/login")
    return render_template("index.html")

def j_users():
    users = User.query.all()
    return [{
        "id": u.id,
        "login_id": u.login_id,
        "created_at": u.created_at.isoformat()
    } for u in users]

def json(data):
    if data == "user":
        j = j_users()
    return(jsonify(j))

def login():
    if request.method == "POST":
        login_id = request.form["login_id"]
        password = request.form["password"]

        user = User.query.filter_by(login_id=login_id).first()

        if user and check_password_hash(user.password_hash, password):
            session["user_id"] = user.id
            session["login_id"] = user.login_id
            return redirect("/")
        else:
            return render_template("login.html", error="ユーザー名またはパスワードが違います")

    return render_template("login.html")

# ---------- ログアウト ----------
def logout():
    session.clear()
    return redirect("/login")

# ---------- ログイン必須ページ ----------
def mypage():
    if "user_id" not in session:
        return redirect("/login")
    return f"ようこそ、{session['login_id']} さん！"
# ---------- ユーザー登録 ----------
def register():
    if request.method == "POST":
        login_id = request.form["login_id"]
        password = request.form["password"]

        existing_user = User.query.filter_by(login_id=login_id).first()
        if existing_user:
            return render_template("register.html", error="このログインIDは既に使用されています。")

        password_hash = generate_password_hash(password)

        new_user = User(
            login_id=login_id,
            password_hash=password_hash,
            created_at=datetime.utcnow()
        )
        db.session.add(new_user)
        db.session.commit()

        return redirect("/login")

    return render_template("register.html")

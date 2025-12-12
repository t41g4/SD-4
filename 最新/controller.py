from flask import render_template, jsonify, request, redirect, session
from sqlalchemy import func
from model import db, User, Marker, Product, Restock
from datetime import datetime
from werkzeug.security import check_password_hash, generate_password_hash
import os
import openpyxl

# ------------------------------
# 改良場所：管理者判定関数
# ------------------------------
def is_admin():
    return session.get("user_id") == 0 and session.get("login_id") == "kanrisya"
# ------------------------------
# -ここまで-
# ------------------------------


def top():
    if "user_id" not in session:
            return redirect("/login")
    return render_template("map.html")

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
            # ------------------------------
            # 改良場所：管理者なら専用ページへ
            # ------------------------------
            if user.id == 0 and user.login_id == "kanrisya":
                return redirect("/kanrisya")
            # ------------------------------
            # -ここまで-
            # ------------------------------

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

def save_marker():
    data = request.json
    marker = Marker(
        user_id=session["user_id"],  # セッションから取得も可
        name=data.get("name", ""),
        latitude=data["lat"],
        longitude=data["lng"],
        taken_at=datetime.fromisoformat(data.get("taken_at")) if data.get("taken_at") else None,
        photo_path=data.get("photo_path", "")
    )
    db.session.add(marker)
    db.session.commit()
    return jsonify({"id": marker.id})

def get_markers():
    markers = Marker.query.all()
    result = [
        {
            "id": m.id,
            "name": m.name,
            "lat": m.latitude,
            "lng": m.longitude,
            "taken_at": m.taken_at.isoformat() if m.taken_at else "",
            "photo_path": m.photo_path
        } for m in markers
    ]
    return jsonify(result)

def delete_marker(marker_id):
    marker = Marker.query.get(marker_id)
    if not marker:
        return jsonify({"error": "not found"}), 404

    db.session.delete(marker)
    db.session.commit()
    return jsonify({"message": "deleted"})

def general_public_map():
    return render_template("Generalpublicmap.html")

# -----------------------------------------
# 管理者専用ユーザー一覧ページ
# -----------------------------------------
def admin_users():
    if not is_admin():
        return "アクセス権がありません", 403

    users = User.query.all()
    return render_template("admin_users.html", users=users)


def admin_delete_user(user_id):
    if not is_admin():
        return "アクセス権がありません", 403

    if user_id == 0:
        return "管理者自身を削除することはできません", 400

    user = User.query.get(user_id)
    if not user:
        return "ユーザーが見つかりません", 404

    Restock.query.filter_by(user_id=user_id).delete()
    Marker.query.filter_by(user_id=user_id).delete()

    db.session.delete(user)
    db.session.commit()

    return redirect("/admin/users")


# -----------------------------------------
# 改良場所：管理者専用ページ
# -----------------------------------------
def kanrisya_page():
    if not is_admin():
        return "アクセス権がありません", 403
    return render_template("kanrisya.html")
# -----------------------------------------
# -ここまで-
# -----------------------------------------

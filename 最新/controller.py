from flask import render_template, jsonify, request, redirect, session, send_file
from sqlalchemy import func
from model import db, User, Marker, Product, Restock, Route, RouteMarker
from datetime import datetime
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
import os
import openpyxl
import io
import pandas as pd

# 改良場所：管理者判定関数
def is_admin():
    return session.get("user_id") == 0 and session.get("login_id") == "kanrisya"
# -ここまで-

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
            # 改良場所：管理者なら専用ページへ
            if user.id == 0 and user.login_id == "kanrisya":
                return redirect("/kanrisya")
            # -ここまで-
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
    # 画像保存処理
    photo_path = None # Noneで初期化
    if 'photo' in request.files:
        file = request.files['photo']
        if file.filename != '':
            filename = secure_filename(file.filename)
            file.save(os.path.join(UPLOAD_FOLDER, filename))
            photo_path = f"/static/uploads/{filename}"

    try:
        # IDが送られてきているか確認
        marker_id = request.form.get("id")
        
        if marker_id:
            # --- 更新処理 ---
            marker = Marker.query.get(marker_id)
            if not marker:
                return jsonify({"error": "Marker not found"}), 404
            
            # 各フィールドを更新
            marker.name = request.form.get("name", "")
            marker.latitude = float(request.form.get("latitude"))
            marker.longitude = float(request.form.get("longitude"))
            
            # 写真は新しいものがアップロードされた場合のみ更新
            if photo_path:
                marker.photo_path = photo_path
            
            # 日付は「更新日時」として現在時刻にするか、そのままにするか選べます
            # ここでは更新のたびに現在日時で上書きする仕様にします
            marker.taken_at = datetime.now()

        else:
            # --- 新規作成処理 ---
            marker = Marker(
                user_id=session["user_id"],
                name=request.form.get("name", ""),
                latitude=float(request.form.get("latitude")),
                longitude=float(request.form.get("longitude")),
                taken_at=datetime.now(),
                photo_path=photo_path if photo_path else ""
            )
            db.session.add(marker)

        db.session.commit()
        
        # 保存後の写真パスを返す（更新しなかった場合は元のパスを返すため再取得）
        return jsonify({"id": marker.id, "photo_path": marker.photo_path})
        
    except Exception as e:
        print(f"Save Error: {e}")
        db.session.rollback()
        return jsonify({"error": "Save failed"}), 500

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

def save_route():
    data = request.json

    route = Route(
        name=data["name"],
        start_lat=data["start"]["lat"],
        start_lng=data["start"]["lng"],
        goal_lat=data["goal"]["lat"],
        goal_lng=data["goal"]["lng"],
        mode=data["mode"]
    )

    db.session.add(route)
    db.session.commit()

    for m in data["markers"]:
        rm = RouteMarker(
            route_id=route.id,
            marker_id=m.get("id"),
            lat=m["lat"],
            lng=m["lng"],
            order_num=m["order"]
        )
        db.session.add(rm)

    db.session.commit()

    return jsonify({"status": "ok", "id": route.id})

def list_routes():
        routes = Route.query.order_by(Route.created_at.desc()).all()
        result = [
            {
                "id": r.id,
                "name": r.name,
                "created_at": r.created_at.isoformat(),
                "mode": r.mode
            }
            for r in routes
        ]
        return jsonify(result)

def get_route(route_id):
        route = Route.query.get(route_id)
        if not route:
            return jsonify({"error": "not found"}), 404

        markers = [
            {
                "marker_id": rm.marker_id,
                "lat": rm.lat,
                "lng": rm.lng,
                "order": rm.order_num
            }
            for rm in route.markers
        ]

        result = {
            "id": route.id,
            "name": route.name,
            "start": {"lat": route.start_lat, "lng": route.start_lng},
            "goal": {"lat": route.goal_lat, "lng": route.goal_lng},
            "mode": route.mode,
            "markers": markers
        }
        return jsonify(result)

# ---------- API: 商品リスト取得 ----------
def get_products():
    """
    データベースから全ての商品リストをJSON形式で返す
    """
    products = Product.query.all()
    result = [
        {
            "id": p.id,
            "name": p.name,
            "image_url": p.image_url
        } for p in products
    ]
    return jsonify(result)

# ---------- API: 在庫補充データ保存 ----------
def save_restock():
    """
    マーカーに対する在庫補充データをデータベースに保存する
    """
    data = request.json
    
    if not all(k in data for k in ["marker_id", "product_id", "quantity"]):
        return jsonify({"error": "Missing required fields"}), 400

    user_id = session.get("user_id")
    if not user_id:
         return jsonify({"error": "User not authenticated"}), 401
    
    try:
        new_restock = Restock(
            user_id=user_id,
            product_id=data["product_id"],
            marker_id=data["marker_id"],
            # intに変換して保存（DBエラー回避）
            quantity=int(data["quantity"]), 
            restocked_at=datetime.now()
        )
        db.session.add(new_restock)
        db.session.commit()
        
        return jsonify({"status": "ok", "id": new_restock.id}), 201
        
    except Exception as e:
        print(f"在庫補充保存エラー: {e}")
        db.session.rollback()
        return jsonify({"error": "Database error during restock save"}), 500

# ---------- API: 補充履歴一覧取得 ----------
def get_restocks():
    restocks = Restock.query.order_by(Restock.restocked_at.desc()).all()
    
    result = []
    for r in restocks:
        result.append({
            "id": r.id,
            "product_name": r.product.name,
            "image_url": r.product.image_url,
            "quantity": r.quantity,
            "marker_name": r.marker.name if r.marker.name else "名称未設定",
            "marker_id": r.marker_id,
            
            # ★追加: 担当者名（ログインID）を含める
            "user_name": r.user.login_id,
            
            "date": r.restocked_at.strftime('%Y-%m-%d %H:%M')
        })
        
    return jsonify(result)

# ---------- API: 補充履歴削除 ----------
def delete_restock(restock_id):
    # ログインチェック
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    target = Restock.query.get(restock_id)
    if not target:
        return jsonify({"error": "Not found"}), 404

    try:
        db.session.delete(target)
        db.session.commit()
        return jsonify({"message": "Deleted"})
    except Exception as e:
        print(e)
        return jsonify({"error": "Database error"}), 500

# ---------- Excel出力 ----------
def download_excel():
    # データ取得
    restocks = Restock.query.order_by(Restock.restocked_at.desc()).all()
    
    # データフレーム用リスト作成
    data_list = []
    for r in restocks:
        data_list.append({
            "ID": r.id,
            "商品名": r.product.name,
            "補充数": r.quantity,
            "自販機名": r.marker.name if r.marker.name else "名称未設定",
            "日時": r.restocked_at.strftime('%Y-%m-%d %H:%M'),
            "担当者ID": r.user.login_id
        })
    
    # pandasでDataFrame作成
    df = pd.DataFrame(data_list)
    
    # メモリ上のバイナリストリームに出力
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='補充履歴')
        
    output.seek(0)
    
    return send_file(
        output,
        as_attachment=True,
        download_name=f"restock_history_{datetime.now().strftime('%Y%m%d')}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

# ---------- ページ表示用 ----------
def post_page():
    if "user_id" not in session:
        return redirect("/login")
    return render_template("post.html")

UPLOAD_FOLDER = './static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

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
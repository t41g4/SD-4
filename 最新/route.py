from flask import request, session, redirect, render_template
import controller

def create_route(app):

    @app.route("/")
    def index():
        return controller.top()

    @app.route("/json", methods=["GET","POST"])
    def json():
        d = request.args.get("data")
        if d in ["user"]:
            return controller.json(d)
        return "GETパラメータ data を指定してください"
    
    @app.route("/login", methods=["GET", "POST"])
    def login():
        return controller.login()

    @app.route("/logout")
    def logout():
        return controller.logout()

    @app.route("/mypage")
    def mypage():
        return controller.mypage()

    @app.route("/register", methods=["GET", "POST"])
    def register():
        return controller.register()
    @app.route("/api/markers", methods=["POST"])
    def save_marker():
        return controller.save_marker()
    @app.route("/api/markers", methods=["GET"])
    def get_markers():
        return controller.get_markers()
    @app.route("/api/markers/<int:marker_id>", methods=["DELETE"])
    def api_delete_marker(marker_id):
        return controller.delete_marker(marker_id)
    @app.route("/Generalpublicmap.html")
    def general_public_map():
        return controller.general_public_map()
    @app.route("/api/routes", methods=["POST"])
    def save_route_api():
        return controller.save_route()
    @app.route("/api/routes", methods=["GET"])
    def list_routes():
        return controller.list_routes()
    # 特定ルートの詳細取得
    @app.route("/api/routes/<int:route_id>", methods=["GET"])
    def get_route(route_id=None):
        return controller.get_route(route_id)
    # 商品リスト取得
    @app.route("/api/products", methods=["GET"])
    def get_products_api():
        return controller.get_products()
    
    # 在庫補充データ保存
    @app.route("/api/restocks", methods=["POST"])
    def save_restock_api():
        return controller.save_restock()
    
    @app.route("/post")
    def post_view():
        return controller.post_page()

    @app.route("/api/restocks", methods=["GET"])
    def get_restocks_api():
        return controller.get_restocks()

    @app.route("/api/restocks/<int:restock_id>", methods=["DELETE"])
    def delete_restock_api(restock_id):
        return controller.delete_restock(restock_id)
        
    @app.route("/download/excel")
    def download_excel_api():
        return controller.download_excel()
    
    
    # -----------------------------------------
    # 改良場所：管理者専用ページ（kanrisya.html）
    # -----------------------------------------
    @app.route("/kanrisya")
    def kanrisya():
        return controller.kanrisya_page()

    @app.route("/admin/users")
    def admin_users():
        return controller.admin_users()


    @app.route("/admin/users/delete/<int:user_id>", methods=["POST"])
    def admin_delete_user(user_id):
        return controller.admin_delete_user(user_id)

    @app.route("/routes")
    def route_list():
        return render_template("routes.html")
    # -----------------------------------------
    # -ここまで-
    # -----------------------------------------
    @app.route("/api/search_address", methods=["GET"])
    def search_address():
        return controller.search_address_proxy()
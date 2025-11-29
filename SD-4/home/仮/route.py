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
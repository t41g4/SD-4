from flask import request
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
    

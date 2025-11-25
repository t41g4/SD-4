from flask import request, redirect, send_from_directory
import controller

def create_route(app):

    @app.route("/")
    def index():
        return controller.top()
    
    @app.route("/json", methods=["GET","POST"])
    def json():
        if "data" in request.args:
            d = request.args.get("data")
            if d in ["user","item","category","dept"]:
                return controller.json(d)
        return("GETパラメータを指定してください")
    
    @app.route("/item_list", methods=["GET","POST"])
    def item_list():
        k = request.form.get("key") if "key" in request.form else ""
        return controller.f_item(k)

    @app.route("/item_detail", methods=["GET","POST"])
    def item_detail():
        if "id" in request.args:
            id = request.args.get("id")
            return controller.d_item(id)
        return("GETパラメータを指定してください")
    

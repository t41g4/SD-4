from flask import Flask,render_template

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("ex_boot3.html")

@app.route("/web")
def web():
    return render_template("ex_boot3.html")

@app.route("/python")
def python():
    return render_template("ex_boot3.html")

@app.route("/boot")
def boot():
    return render_template("ex_boot3.html")

if __name__ == "__main__":
    app.run()
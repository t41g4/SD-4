from flask import render_template, jsonify
from sqlalchemy import func
from model import db, User
from datetime import datetime
import os
import openpyxl

def top():
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



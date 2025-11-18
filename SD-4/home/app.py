from flask import Flask, request, jsonify, send_from_directory
import json, os

app = Flask(__name__, static_folder='.')

ROUTES_FILE = 'routes.json'

@app.route('/save_route', methods=['POST'])
def save_route():
    data = request.get_json()
    if not data or 'points' not in data:
        return jsonify({'error': 'invalid payload'}), 400

    name = data.get('name', 'default')
    all_routes = {}
    if os.path.exists(ROUTES_FILE):
        try:
            with open(ROUTES_FILE, 'r', encoding='utf-8') as f:
                all_routes = json.load(f)
        except Exception:
            all_routes = {}

    all_routes[name] = {
        'points': data['points'],
        'created_at': data.get('created_at')
    }

    with open(ROUTES_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_routes, f, ensure_ascii=False, indent=2)

    return jsonify({'status': 'ok'})

@app.route('/load_route')
def load_route():
    name = request.args.get('name', 'default')
    if not os.path.exists(ROUTES_FILE):
        return jsonify({'points': []})
    try:
        with open(ROUTES_FILE, 'r', encoding='utf-8') as f:
            all_routes = json.load(f)
    except Exception:
        all_routes = {}
    route = all_routes.get(name)
    if not route:
        return jsonify({'points': []})
    return jsonify(route)

# 静的ファイル（index.html）を配信
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    app.run(debug=True)

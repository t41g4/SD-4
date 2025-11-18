from flask import Flask, request, jsonify, send_from_directory
import json, os, re
from datetime import datetime

app = Flask(__name__, static_folder='.')

ROUTES_FILE = 'routes.json'

def read_routes():
    if not os.path.exists(ROUTES_FILE):
        return {}
    try:
        with open(ROUTES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}

def write_routes(d):
    with open(ROUTES_FILE, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2)

@app.route('/save_route', methods=['POST'])
def save_route():
    data = request.get_json()
    if not data or 'points' not in data:
        return jsonify({'error': 'invalid payload'}), 400

    name = data.get('name', 'default')

    # validate name must be slot-0 .. slot-9
    m = re.match(r'^slot-(\d+)$', name)
    if not m:
        return jsonify({'error': 'invalid name format'}), 400
    idx = int(m.group(1))
    if idx < 0 or idx > 9:
        return jsonify({'error': 'slot out of range'}), 400

    # optional: validate points is a list of {lat, lng}
    points = data['points']
    if not isinstance(points, list):
        return jsonify({'error': 'points must be list'}), 400

    # store route with timestamp
    all_routes = read_routes()
    all_routes[name] = {
        'points': points,
        'created_at': data.get('created_at', datetime.utcnow().isoformat())
    }
    write_routes(all_routes)
    return jsonify({'status': 'ok', 'name': name})

@app.route('/load_route')
def load_route():
    name = request.args.get('name', 'default')
    # optionally validate name format
    m = re.match(r'^slot-(\d+)$', name)
    if not m:
        return jsonify({'error': 'invalid name format'}), 400

    all_routes = read_routes()
    r = all_routes.get(name)
    if not r:
        return jsonify({'points': []})
    return jsonify(r)

@app.route('/list_routes')
def list_routes():
    """
    Return a JSON object describing all 10 slots.
    Example:
    {
      "slot-0": {"exists": true, "created_at": "2025-11-18T12:34:00"},
      "slot-1": {"exists": false, "created_at": null},
      ...
    }
    """
    all_routes = read_routes()
    result = {}
    for i in range(10):
        key = f"slot-{i}"
        if key in all_routes and 'created_at' in all_routes[key]:
            created = all_routes[key]['created_at']
            # Try to normalize to readable format (leave as-is if parse fails)
            try:
                # If stored as ISO, create nicer local string
                dt = datetime.fromisoformat(created)
                created_str = dt.strftime('%Y-%m-%d %H:%M:%S')
            except Exception:
                created_str = created
            result[key] = {'exists': True, 'created_at': created_str}
        else:
            result[key] = {'exists': False, 'created_at': None}
    return jsonify(result)

# serve index.html (static) if present
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    # debug mode for development
    app.run(debug=True)

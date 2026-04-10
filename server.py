import os
import json
from flask import Flask, send_file, send_from_directory, jsonify, request
import zipfile
import io
import shutil

app = Flask(__name__, static_folder='wwwroot', static_url_path='')
DATA_FOLDER = 'data'
ICON_FOLDER = 'icons'
def build_tree(path):
    tree = []

    for item in os.listdir(path):
        full_path = os.path.join(path, item)

        if os.path.isdir(full_path):
            tree.append({
                "type": "folder",
                "name": item,
                "children": build_tree(full_path)
            })
        elif item.endswith('.geojson'):
            tree.append({
                "type": "file",
                "name": item,
                "path": full_path.replace(DATA_FOLDER, '').replace("\\", "/")
            })

    return tree


@app.route('/tree')
def get_tree():
    return jsonify(build_tree(DATA_FOLDER))

@app.route('/export_data')
def export_data():
    memory_file = io.BytesIO()

    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(DATA_FOLDER):
            for file in files:
                full_path = os.path.join(root, file)
                arcname = os.path.relpath(full_path, DATA_FOLDER)
                zf.write(full_path, arcname)

    memory_file.seek(0)

    return send_file(
        memory_file,
        download_name='data.zip',
        as_attachment=True
    )
@app.route('/upload_icons', methods=['POST'])
def upload_icons():
    files = request.files.getlist('files')

    for file in files:
        if file.filename.endswith('.svg'):
            path = os.path.join(ICON_FOLDER, file.filename)
            file.save(path)

    return {"status": "ok"}
@app.route('/import_data', methods=['POST'])
def import_data():
    if 'file' not in request.files:
        return {"error": "no file"}, 400

    file = request.files['file']

    if not file.filename.endswith('.zip'):
        return {"error": "only zip allowed"}, 400

    temp_path = 'temp.zip'
    file.save(temp_path)

    # удаляем старую data
    if os.path.exists(DATA_FOLDER):
        shutil.rmtree(DATA_FOLDER)

    os.makedirs(DATA_FOLDER, exist_ok=True)

    # распаковываем
    with zipfile.ZipFile(temp_path, 'r') as zf:
        zf.extractall(DATA_FOLDER)

    os.remove(temp_path)

    return {"status": "ok"}

@app.route('/data/<path:filename>')
def data(filename):
    return send_from_directory(DATA_FOLDER, filename)


@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/delete', methods=['POST'])
def delete_features():
    data = request.json

    grouped = {}

    # группируем по файлам
    for item in data:
        path = item['path']
        full_path = os.path.join(DATA_FOLDER, path.strip("/"))

        if full_path not in grouped:
            grouped[full_path] = []

        grouped[full_path].append(item['id'])

    for file_path, ids in grouped.items():
        with open(file_path, 'r', encoding='utf-8') as f:
            geo = json.load(f)

        geo['features'] = [
            f for f in geo['features']
            if f.get('id') not in ids
        ]

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(geo, f, ensure_ascii=False, indent=2)

    return {"status": "ok"}

@app.route('/set_style', methods=['POST'])
def set_style():
    data = request.json

    path = data['path']
    style = data['style']

    file_path = os.path.join(DATA_FOLDER, path.strip("/"))

    with open(file_path, 'r', encoding='utf-8') as f:
        geo = json.load(f)

    geo['style'] = style

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(geo, f, ensure_ascii=False, indent=2)

    return {"status": "ok"}

@app.route('/icons')
def get_icons():
    icons_folder = ICON_FOLDER

    icons = []
    for file in os.listdir(icons_folder):
        if file.endswith('.svg'):
            icons.append(file)

    return icons
@app.route('/icons/<path:filename>')
def serve_icons(filename):
    return send_from_directory('icons', filename)

@app.route('/add_point', methods=['POST'])
def add_point():
    data = request.json

    path = data['path']
    lat = data['lat']
    lon = data['lon']
    name = data['name']

    file_path = os.path.join(DATA_FOLDER, path.strip("/"))

    with open(file_path, 'r', encoding='utf-8') as f:
        geo = json.load(f)

    import uuid

    geo['features'].append({
        "type": "Feature",
        "id": str(uuid.uuid4()),
        "properties": {
            "name": name
        },
        "geometry": {
            "type": "Point",
            "coordinates": [lon, lat]
        }
    })

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(geo, f, ensure_ascii=False, indent=2)

    return {"status": "ok"}
if __name__ == '__main__':
    app.run(debug=True)
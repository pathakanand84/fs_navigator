from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from pathlib import Path
import os
import urllib.parse

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
CORS(app)  # Enable CORS

def get_dir_tree(path, depth=3, show_hidden=False):
    """Generate directory tree without duplicates"""
    try:
        path = Path(path).expanduser().resolve()
        
        if not path.exists():
            return {"error": f"Path not found: {path}"}
        
        def build_tree(current_path, current_depth):
            entry = {
                "name": current_path.name,
                "path": str(current_path),
                "type": "directory" if current_path.is_dir() else "file",
                "size": current_path.stat().st_size if current_path.is_file() else 0,
                "children": []
            }
            
            if current_path.is_dir() and current_depth < depth:
                try:
                    # Use set() to avoid duplicates
                    children = set(child for child in current_path.iterdir() 
                                 if show_hidden or not child.name.startswith('.'))
                    for child in sorted(children):  # Sort for consistent order
                        child_entry = build_tree(child, current_depth + 1)
                        if child_entry:
                            entry["children"].append(child_entry)
                except PermissionError:
                    entry["error"] = "Permission denied"
            
            return entry
        
        return build_tree(path, 0)
    
    except Exception as e:
        return {"error": str(e)}

@app.route('/api/tree')
def api_tree():
    """API endpoint for directory tree"""
    try:
        raw_path = urllib.parse.unquote(request.args.get('path', '~'))
        path = raw_path.strip('"\'')  # Remove quotes
        depth = int(request.args.get('depth', 3))
        show_hidden = request.args.get('hidden', 'false').lower() == 'true'
        
        tree = get_dir_tree(path, depth, show_hidden)
        return jsonify(tree)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('../frontend', filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
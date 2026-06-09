"""
Data Collector API
==================
Flask server untuk collect training data dari AgriSense Mobile app.
Mobile app mengirim sensor readings + actual outcomes untuk training.
"""

from flask import Flask, request, jsonify
from datetime import datetime
import json
import csv
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
DATA_DIR = Path(__file__).parent / "data"
DATA_FILE = DATA_DIR / "training_data.csv"

# Ensure data directory exists
DATA_DIR.mkdir(exist_ok=True)

# CSV columns
CSV_COLUMNS = ['timestamp', 'suhu', 'kelembapan', 'ec', 'tds', 'suhuAir', 'crop', 'outcome', 'growthDays', 'notes']

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'data_file': str(DATA_FILE),
        'data_count': _get_data_count()
    })

@app.route('/api/data/collect', methods=['POST'])
def collect_data():
    """
    Collect training data from mobile app
    
    Expected JSON:
    {
        "sensors": {
            "suhu": 25.5,
            "kelembapan": 70,
            "ec": 1200,
            "tds": 600,
            "suhuAir": 22.5
        },
        "crop": "selada",
        "outcome": "success",
        "growthDays": 35,
        "notes": "Optimal conditions"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'sensors' not in data or 'crop' not in data:
            return jsonify({'error': 'Missing required fields: sensors, crop'}), 400
        
        sensors = data['sensors']
        required_sensors = ['suhu', 'kelembapan', 'ec', 'tds', 'suhuAir']
        
        if not all(s in sensors for s in required_sensors):
            return jsonify({'error': f'Missing sensor fields. Required: {required_sensors}'}), 400
        
        # Prepare row
        timestamp = datetime.now().isoformat()
        row = {
            'timestamp': timestamp,
            'suhu': sensors.get('suhu'),
            'kelembapan': sensors.get('kelembapan'),
            'ec': sensors.get('ec'),
            'tds': sensors.get('tds'),
            'suhuAir': sensors.get('suhuAir'),
            'crop': data.get('crop'),
            'outcome': data.get('outcome', 'unknown'),
            'growthDays': data.get('growthDays', ''),
            'notes': data.get('notes', '')
        }
        
        # Write to CSV
        file_exists = DATA_FILE.exists()
        with open(DATA_FILE, 'a', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
            if not file_exists:
                writer.writeheader()
            writer.writerow(row)
        
        return jsonify({
            'status': 'ok',
            'message': f'Data collected for {row["crop"]}',
            'timestamp': timestamp,
            'data_count': _get_data_count()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/list', methods=['GET'])
def list_data():
    """List all collected data"""
    try:
        if not DATA_FILE.exists():
            return jsonify({'data': [], 'count': 0}), 200
        
        data = []
        with open(DATA_FILE, 'r') as f:
            reader = csv.DictReader(f)
            data = list(reader)
        
        # Group by crop
        by_crop = {}
        for row in data:
            crop = row.get('crop', 'unknown')
            if crop not in by_crop:
                by_crop[crop] = 0
            by_crop[crop] += 1
        
        return jsonify({
            'data': data,
            'count': len(data),
            'by_crop': by_crop
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/stats', methods=['GET'])
def stats():
    """Get data collection statistics"""
    try:
        if not DATA_FILE.exists():
            return jsonify({
                'total': 0,
                'by_crop': {},
                'by_outcome': {},
                'sensors': {}
            }), 200
        
        data = []
        with open(DATA_FILE, 'r') as f:
            reader = csv.DictReader(f)
            data = list(reader)
        
        # Statistics
        by_crop = {}
        by_outcome = {}
        sensor_stats = {s: [] for s in ['suhu', 'kelembapan', 'ec', 'tds', 'suhuAir']}
        
        for row in data:
            # Count by crop
            crop = row.get('crop', 'unknown')
            by_crop[crop] = by_crop.get(crop, 0) + 1
            
            # Count by outcome
            outcome = row.get('outcome', 'unknown')
            by_outcome[outcome] = by_outcome.get(outcome, 0) + 1
            
            # Collect sensor values
            for sensor in sensor_stats:
                try:
                    val = float(row.get(sensor, 0))
                    sensor_stats[sensor].append(val)
                except:
                    pass
        
        # Calculate sensor statistics
        sensor_summary = {}
        for sensor, values in sensor_stats.items():
            if values:
                sensor_summary[sensor] = {
                    'min': min(values),
                    'max': max(values),
                    'avg': sum(values) / len(values),
                    'count': len(values)
                }
        
        return jsonify({
            'total': len(data),
            'by_crop': by_crop,
            'by_outcome': by_outcome,
            'sensors': sensor_summary
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/export', methods=['GET'])
def export_data():
    """Export collected data as JSON"""
    try:
        if not DATA_FILE.exists():
            return jsonify({'data': []}), 200
        
        data = []
        with open(DATA_FILE, 'r') as f:
            reader = csv.DictReader(f)
            data = list(reader)
        
        # Convert numeric strings to numbers
        for row in data:
            for sensor in ['suhu', 'kelembapan', 'ec', 'tds', 'suhuAir', 'growthDays']:
                try:
                    row[sensor] = float(row[sensor])
                except:
                    pass
        
        return jsonify({'data': data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/clear', methods=['POST'])
def clear_data():
    """Clear all collected data (WARNING: irreversible)"""
    try:
        # Backup first
        if DATA_FILE.exists():
            backup = DATA_DIR / f"training_data_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            DATA_FILE.rename(backup)
            return jsonify({
                'status': 'ok',
                'message': f'Data cleared. Backup: {backup.name}'
            }), 200
        
        return jsonify({'message': 'No data to clear'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _get_data_count():
    """Get count of collected data samples"""
    if not DATA_FILE.exists():
        return 0
    with open(DATA_FILE, 'r') as f:
        return sum(1 for _ in f) - 1  # -1 for header

# Simple dashboard
@app.route('/', methods=['GET'])
def index():
    """Simple web dashboard"""
    count = _get_data_count()
    return f'''
    <html>
        <head>
            <title>AgriSense Data Collector</title>
            <style>
                body {{ font-family: Arial; margin: 20px; }}
                .stats {{ background: #f0f0f0; padding: 10px; border-radius: 5px; }}
                .endpoint {{ margin: 10px 0; }}
            </style>
        </head>
        <body>
            <h1>AgriSense Data Collector</h1>
            <div class="stats">
                <h2>Status: ✓ Running</h2>
                <p>Collected samples: <strong>{count}</strong></p>
            </div>
            
            <h3>API Endpoints</h3>
            <div class="endpoint">
                <strong>GET /health</strong> - Check server status
            </div>
            <div class="endpoint">
                <strong>POST /api/data/collect</strong> - Collect sensor data
            </div>
            <div class="endpoint">
                <strong>GET /api/data/list</strong> - List all data
            </div>
            <div class="endpoint">
                <strong>GET /api/data/stats</strong> - Data statistics
            </div>
            <div class="endpoint">
                <strong>GET /api/data/export</strong> - Export as JSON
            </div>
            
            <h3>Data File</h3>
            <p>Location: <code>{DATA_FILE}</code></p>
            <p>Format: CSV with columns: {', '.join(CSV_COLUMNS)}</p>
        </body>
    </html>
    '''

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    
    print("=" * 60)
    print("AgriSense Data Collector Server")
    print("=" * 60)
    print(f"Starting on http://{host}:{port}")
    print(f"Data file: {DATA_FILE}")
    print("\nEndpoints:")
    print("  GET  /health")
    print("  POST /api/data/collect")
    print("  GET  /api/data/list")
    print("  GET  /api/data/stats")
    print("  GET  /api/data/export")
    print("\n(Press Ctrl+C to stop)")
    
    app.run(host=host, port=port, debug=True)

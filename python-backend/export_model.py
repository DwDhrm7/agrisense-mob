"""
Export TensorFlow Model to TensorFlow.js Format
===============================================
Converts SavedModel to web-compatible format untuk React Native app.
"""

import os
import json
import subprocess
import sys
from pathlib import Path
import shutil

MODEL_DIR = Path(__file__).parent / "model"
OUTPUT_DIR = MODEL_DIR / "tfjs"

def check_tensorflowjs():
    """Check if tensorflowjs is installed"""
    try:
        import tensorflowjs as tfjs
        print("✓ tensorflowjs found")
        return True
    except ImportError:
        print("✗ tensorflowjs not installed")
        print("  Run: pip install tensorflowjs")
        return False

def export_model():
    """Export SavedModel to TensorFlow.js format"""
    model_path = MODEL_DIR / "agrisense_model"
    
    if not model_path.exists():
        print(f"✗ Model not found: {model_path}")
        print("  Run train.py first")
        return False
    
    print(f"\n✓ Found model: {model_path}")
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"✓ Exporting to TensorFlow.js format...")
    print(f"  Output: {OUTPUT_DIR}")
    
    try:
        # Use tensorflowjs converter
        cmd = [
            sys.executable, "-m", "tensorflowjs.converters.converter",
            "--input_format", "tf_saved_model",
            "--output_format", "tfjs_graph_model",
            "--output_node_names", "serving_default",
            str(model_path),
            str(OUTPUT_DIR)
        ]
        
        print(f"  Command: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            print(f"✗ Export failed:\n{result.stderr}")
            return False
        
        print("✓ Export successful!")
        
        # Copy supporting files
        scaler_src = MODEL_DIR / "scaler.json"
        crops_src = MODEL_DIR / "crops.json"
        
        if scaler_src.exists():
            shutil.copy(scaler_src, OUTPUT_DIR / "scaler.json")
            print(f"  Copied scaler.json")
        
        if crops_src.exists():
            shutil.copy(crops_src, OUTPUT_DIR / "crops.json")
            print(f"  Copied crops.json")
        
        # List output files
        print("\n✓ Output files:")
        for f in sorted(OUTPUT_DIR.glob("*")):
            size = f.stat().st_size
            size_str = f"{size/1024:.1f}KB" if size > 1024 else f"{size}B"
            print(f"  {f.name} ({size_str})")
        
        return True
        
    except subprocess.TimeoutExpired:
        print("✗ Export timeout (>5 min)")
        return False
    except Exception as e:
        print(f"✗ Export error: {e}")
        return False

def create_loader_script():
    """Create JavaScript loader script"""
    loader_code = '''/**
 * ML Model Loader
 * For use in React Native app
 */

export async function loadModel() {
  const tf = await import('@tensorflow/tfjs');
  
  // Load model from bundled assets or URL
  const modelUrl = 'file:///model/agrisense_model.json';
  const model = await tf.loadGraphModel(modelUrl);
  
  // Load crops mapping
  const cropsResponse = await fetch('file:///model/crops.json');
  const crops = Object.values(await cropsResponse.json());
  
  return { model, crops };
}

export function predict(model, sensorData, crops) {
  const input = tf.tensor2d([[
    sensorData.suhu,
    sensorData.kelembapan,
    sensorData.ec,
    sensorData.tds,
    sensorData.suhuAir
  ]]);
  
  const predictions = model.predict(input);
  const confidence = predictions.dataSync();
  
  // Get top 3
  const results = [];
  for (let i = 0; i < 3; i++) {
    const maxIdx = confidence.indexOf(Math.max(...confidence));
    results.push({
      crop: crops[maxIdx],
      confidence: (confidence[maxIdx] * 100).toFixed(1)
    });
    confidence[maxIdx] = -1;
  }
  
  input.dispose();
  predictions.dispose();
  
  return results;
}
'''
    
    loader_path = OUTPUT_DIR / "model_loader.js"
    with open(loader_path, 'w') as f:
        f.write(loader_code)
    print(f"\n✓ Created loader script: {loader_path}")

def main():
    print("=" * 60)
    print("Export Model to TensorFlow.js")
    print("=" * 60)
    
    if not check_tensorflowjs():
        sys.exit(1)
    
    if export_model():
        create_loader_script()
        
        print("\n" + "=" * 60)
        print("✓ Export Complete!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Copy model files to mobile app:")
        print(f"   cp -r {OUTPUT_DIR}/*.json ../src/assets/model/")
        print(f"   cp -r {OUTPUT_DIR}/*.bin ../src/assets/model/")
        print("\n2. Update MLService.ts modelUrl in React Native app")
        print("\n3. Test inference in DashboardScreen")
    else:
        sys.exit(1)

if __name__ == '__main__':
    main()

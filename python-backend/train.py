"""
AgriSense ML Training Script
============================
Train TensorFlow model untuk prediksi commodity berdasarkan sensor data.
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import json
import os
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
import argparse
from datetime import datetime

# Config
MODEL_DIR = Path(__file__).parent / "model"
DATA_FILE = Path(__file__).parent / "data" / "training_data.csv"
CROPS = [
    'selada', 'bayam', 'kangkung', 'sawi', 'pakcoy',
    'cabai', 'tomat', 'terong', 'kemangi', 'mentimun',
    'seledri', 'melon', 'stroberi'
]

class CropPredictionModel:
    def __init__(self, crops=CROPS):
        self.crops = crops
        self.num_classes = len(crops)
        self.model = None
        self.scaler = MinMaxScaler()
        self.history = None
        
    def build_model(self):
        """Build neural network model"""
        model = keras.Sequential([
            layers.Input(shape=(5,)),  # 5 sensors
            
            layers.Dense(64, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.2),
            
            layers.Dense(32, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.2),
            
            layers.Dense(16, activation='relu'),
            layers.Dropout(0.1),
            
            layers.Dense(self.num_classes, activation='softmax')
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy', keras.metrics.AUC()]
        )
        
        self.model = model
        print("\n✓ Model architecture built")
        print(f"  Classes: {self.num_classes} crops")
        model.summary()
        
    def load_data(self, csv_path=DATA_FILE):
        """Load training data from CSV"""
        if not csv_path.exists():
            print(f"\n✗ Data file not found: {csv_path}")
            print("  Create training_data.csv in data/ folder first")
            print("  Format: suhu, kelembapan, ec, tds, suhuAir, crop")
            return None
        
        df = pd.read_csv(csv_path)
        print(f"\n✓ Loaded {len(df)} training samples")
        print(f"  Columns: {list(df.columns)}")
        
        # Check required columns
        required = ['suhu', 'kelembapan', 'ec', 'tds', 'suhuAir', 'crop']
        if not all(col in df.columns for col in required):
            print(f"✗ Missing columns. Required: {required}")
            return None
        
        # Separate features and labels
        X = df[['suhu', 'kelembapan', 'ec', 'tds', 'suhuAir']].values
        y = df['crop'].values
        
        # Normalize features
        X_scaled = self.scaler.fit_transform(X)
        
        # One-hot encode labels
        y_encoded = keras.utils.to_categorical(
            [self.crops.index(crop) for crop in y],
            num_classes=self.num_classes
        )
        
        print(f"  Features shape: {X_scaled.shape}")
        print(f"  Labels shape: {y_encoded.shape}")
        print(f"  Crops distribution:")
        for crop, count in zip(*np.unique(y, return_counts=True)):
            print(f"    - {crop}: {count} samples")
        
        return X_scaled, y_encoded
    
    def train(self, X_train, y_train, epochs=50, batch_size=16, validation_split=0.2):
        """Train the model"""
        if self.model is None:
            self.build_model()
        
        print(f"\n✓ Training model...")
        print(f"  Epochs: {epochs}")
        print(f"  Batch size: {batch_size}")
        print(f"  Validation split: {validation_split*100}%")
        
        self.history = self.model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            callbacks=[
                keras.callbacks.EarlyStopping(
                    monitor='val_loss',
                    patience=10,
                    restore_best_weights=True
                ),
                keras.callbacks.ReduceLROnPlateau(
                    monitor='val_loss',
                    factor=0.5,
                    patience=5,
                    min_lr=0.00001
                )
            ],
            verbose=1
        )
    
    def evaluate(self, X_test, y_test):
        """Evaluate model on test set"""
        loss, accuracy, auc = self.model.evaluate(X_test, y_test, verbose=0)
        print(f"\n✓ Model Evaluation:")
        print(f"  Loss: {loss:.4f}")
        print(f"  Accuracy: {accuracy*100:.2f}%")
        print(f"  AUC: {auc:.4f}")
        
    def predict(self, sensor_data):
        """
        Predict crop from sensor data
        
        Args:
            sensor_data: dict with {suhu, kelembapan, ec, tds, suhuAir}
        
        Returns:
            list of (crop, confidence) tuples
        """
        data = np.array([
            sensor_data['suhu'],
            sensor_data['kelembapan'],
            sensor_data['ec'],
            sensor_data['tds'],
            sensor_data['suhuAir']
        ]).reshape(1, -1)
        
        data_scaled = self.scaler.transform(data)
        predictions = self.model.predict(data_scaled, verbose=0)[0]
        
        # Get top 3 predictions
        top_indices = np.argsort(predictions)[-3:][::-1]
        results = [(self.crops[i], float(predictions[i]*100)) for i in top_indices]
        
        return results
    
    def save(self, output_dir=MODEL_DIR):
        """Save model"""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save model
        model_path = output_dir / "agrisense_model"
        self.model.save(model_path)
        print(f"✓ Model saved: {model_path}")
        
        # Save scaler
        scaler_path = output_dir / "scaler.json"
        scaler_data = {
            'scale_': self.scaler.scale_.tolist(),
            'min_': self.scaler.min_.tolist(),
        }
        with open(scaler_path, 'w') as f:
            json.dump(scaler_data, f)
        print(f"✓ Scaler saved: {scaler_path}")
        
        # Save crops mapping
        crops_path = output_dir / "crops.json"
        with open(crops_path, 'w') as f:
            json.dump({i: crop for i, crop in enumerate(self.crops)}, f)
        print(f"✓ Crops mapping saved: {crops_path}")
        
    def load(self, model_dir=MODEL_DIR):
        """Load saved model"""
        model_dir = Path(model_dir)
        
        # Load model
        model_path = model_dir / "agrisense_model"
        self.model = keras.models.load_model(model_path)
        print(f"✓ Model loaded: {model_path}")
        
        # Load scaler
        scaler_path = model_dir / "scaler.json"
        with open(scaler_path, 'r') as f:
            scaler_data = json.load(f)
        self.scaler.scale_ = np.array(scaler_data['scale_'])
        self.scaler.min_ = np.array(scaler_data['min_'])
        print(f"✓ Scaler loaded: {scaler_path}")


def main():
    parser = argparse.ArgumentParser(description='Train AgriSense crop prediction model')
    parser.add_argument('--epochs', type=int, default=50, help='Number of epochs')
    parser.add_argument('--batch-size', type=int, default=16, help='Batch size')
    parser.add_argument('--data', type=str, default=str(DATA_FILE), help='Path to training data CSV')
    parser.add_argument('--no-train', action='store_true', help='Skip training (evaluate existing model)')
    args = parser.parse_args()
    
    print("=" * 60)
    print("AgriSense ML Model Training")
    print("=" * 60)
    
    # Create model
    model = CropPredictionModel()
    
    # Load data
    data = model.load_data(Path(args.data))
    if data is None:
        return
    
    X, y = data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=np.argmax(y, axis=1)
    )
    
    # Train
    if not args.no_train:
        model.build_model()
        model.train(X_train, y_train, epochs=args.epochs, batch_size=args.batch_size)
        model.save()
    else:
        model.load()
    
    # Evaluate
    model.evaluate(X_test, y_test)
    
    # Test prediction
    test_sample = {
        'suhu': 25,
        'kelembapan': 70,
        'ec': 1200,
        'tds': 600,
        'suhuAir': 22
    }
    print(f"\n✓ Test prediction for: {test_sample}")
    predictions = model.predict(test_sample)
    for crop, conf in predictions:
        print(f"  {crop}: {conf:.1f}%")
    
    print("\n✓ Done!")
    print(f"  Next step: python export_model.py")


if __name__ == '__main__':
    main()

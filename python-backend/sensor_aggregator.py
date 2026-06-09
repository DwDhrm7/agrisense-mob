"""
Sensor Data Aggregator & Forwarder
===================================
Aggregates data dari main.py (Modbus sensors) dan forwards ke:
1. Data Collector API (untuk training)
2. InfluxDB (untuk storage)
3. Logs (untuk monitoring)
"""

import requests
import json
import logging
import time
from datetime import datetime
from typing import Optional, Dict, Any

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SensorDataAggregator:
    """Aggregate sensor data dan forward ke training backend"""
    
    def __init__(self, 
                 collector_url: str = "http://localhost:5000",
                 influx_enabled: bool = True):
        self.collector_url = collector_url
        self.influx_enabled = influx_enabled
        self.session = requests.Session()
        
        # Manual label (untuk training - di-input user)
        self.current_crop = None
        self.collection_start_time = None
        self.sample_count = 0
        
    def set_crop(self, crop_name: str):
        """Set tanaman yang sedang ditanam (untuk labeling data training)"""
        self.current_crop = crop_name
        self.collection_start_time = time.time()
        self.sample_count = 0
        logger.info(f"Setting crop target: {crop_name}")
        
    def log_outcome(self, crop: str, outcome: str, notes: str = ""):
        """Log hasil panen untuk training data
        
        Args:
            crop: Nama tanaman
            outcome: 'success', 'partial', atau 'fail'
            notes: Catatan tambahan
        """
        logger.info(f"Crop outcome: {crop} → {outcome} ({notes})")
        
    def aggregate_and_send(self, 
                          xy_data: Dict[str, float],
                          bsk_data: Dict[str, float],
                          crop_label: Optional[str] = None,
                          outcome: Optional[str] = None) -> bool:
        """
        Aggregate XY-MD02 + BSK-EC-100 data dan kirim ke collector API
        
        Args:
            xy_data: {"suhu": 25.5, "kelembapan": 70}
            bsk_data: {"ec": 1200, "tds": 600, "temperature": 22.5}
            crop_label: Optional - tanaman yang sedang ditanam
            outcome: Optional - hasil panen (success/partial/fail)
        
        Returns:
            bool: True jika berhasil
        """
        try:
            # Merge data
            sensors = {**xy_data, **bsk_data}
            
            # Gunakan suhuAir dari BSK temperature
            if 'temperature' in sensors:
                sensors['suhuAir'] = sensors.pop('temperature')
            
            # Siapkan payload
            payload = {
                "sensors": {
                    "suhu": sensors.get('suhu'),
                    "kelembapan": sensors.get('kelembapan'),
                    "ec": sensors.get('ec'),
                    "tds": sensors.get('tds'),
                    "suhuAir": sensors.get('suhuAir')
                }
            }
            
            # Tambah metadata jika ada
            if crop_label or self.current_crop:
                payload["crop"] = crop_label or self.current_crop
                self.sample_count += 1
                
            if outcome:
                payload["outcome"] = outcome
                
            if self.collection_start_time:
                growth_days = int((time.time() - self.collection_start_time) / 86400)
                payload["growthDays"] = max(0, growth_days)
            
            # Send ke API
            response = self.session.post(
                f"{self.collector_url}/api/data/collect",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 201:
                logger.info(f"✓ Data sent: {payload['crop'] if 'crop' in payload else 'unknown'}")
                return True
            else:
                logger.warning(f"✗ API error {response.status_code}: {response.text[:100]}")
                return False
                
        except Exception as e:
            logger.error(f"✗ Send error: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get collection statistics dari backend"""
        try:
            response = self.session.get(
                f"{self.collector_url}/api/data/stats",
                timeout=5
            )
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.error(f"Stats error: {e}")
        return {}


# Example usage untuk di-integrate ke main.py
def integrate_with_main():
    """
    Contoh integrasi ke main.py yang sudah ada.
    
    Di main.py, replace bagian read_sensors() dengan ini:
    """
    example_code = '''
# Di main.py, import aggregator
from sensor_aggregator import SensorDataAggregator

# Initialize aggregator
aggregator = SensorDataAggregator(collector_url="http://localhost:5000")

# Saat mulai tanam, set crop
aggregator.set_crop("selada")

# Di dalam loop read_sensors, tambahkan:
if res_xy and res_bsk:
    # Existing code...
    xy_data = {"suhu": regs[0]/10.0, "kelembapan": regs[1]/10.0}
    bsk_data = {"ec": regs_bsk[0]/10.0, "tds": regs_bsk[0]/2.0, "temperature": regs_bsk[1]/10.0}
    
    # NEW: Send ke data collector
    aggregator.aggregate_and_send(xy_data, bsk_data)
    
# Saat panen, log outcome
aggregator.log_outcome("selada", "success", "Hasil panen baik")
    '''
    
    return example_code


if __name__ == "__main__":
    # Test aggregator
    agg = SensorDataAggregator()
    
    # Simulate sensor data
    xy_test = {"suhu": 25.5, "kelembapan": 70.0}
    bsk_test = {"ec": 1200.0, "tds": 600.0, "temperature": 22.5}
    
    agg.set_crop("selada")
    result = agg.aggregate_and_send(xy_test, bsk_test)
    
    print(f"\nTest result: {'✓ Success' if result else '✗ Failed'}")
    print("Stats:", agg.get_stats())

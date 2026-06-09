#!/usr/bin/env python3
"""
Quick patch untuk main.py yang sudah ada
Tambahkan data collection capability tanpa rewrite lengkap

Usage:
    1. Backup original: cp main.py main.py.backup
    2. Run patch: python3 patch_main.py
    3. Edit main.py dan uncomment bagian DATA_COLLECTOR
"""

PATCH_CODE = """
# ┌─────────────────────────────────────────────────────────────┐
# │ ADD THIS SECTION SETELAH IMPORTS GroßmodBusSerialClient      │
# └─────────────────────────────────────────────────────────────┘

import logging

# Setup logging (tambah logging ke monitoring)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ┌─────────────────────────────────────────────────────────────┐
# │ ADD AFTER INFLUX CONFIG                                     │
# └─────────────────────────────────────────────────────────────┘

# ──── DATA COLLECTOR CONFIG (untuk ML training) ────
# Uncomment untuk enable data collection ke backend
try:
    import requests
    DATA_COLLECTOR_URL = "http://192.168.0.135:5000"  # Backend PC IP
    DATA_COLLECTION_ENABLED = True
    CURRENT_CROP = None  # Set ini untuk mulai collection
except ImportError:
    DATA_COLLECTION_ENABLED = False
    logger.warning("requests library not found - data collection disabled")


# ┌─────────────────────────────────────────────────────────────┐
# │ ADD THIS FUNCTION SEBELUM read_sensors()                    │
# └─────────────────────────────────────────────────────────────┘

def send_to_data_collector(xy_data, bsk_data):
    '''Kirim sensor data ke ML training collector'''
    if not DATA_COLLECTION_ENABLED or not CURRENT_CROP:
        return False
    
    try:
        payload = {
            "sensors": {
                "suhu": xy_data.get('suhu'),
                "kelembapan": xy_data.get('kelembapan'),
                "ec": bsk_data.get('ec'),
                "tds": bsk_data.get('tds'),
                "suhuAir": bsk_data.get('temperature')
            },
            "crop": CURRENT_CROP
        }
        
        response = requests.post(
            f"{DATA_COLLECTOR_URL}/api/data/collect",
            json=payload,
            timeout=5
        )
        
        if response.status_code == 201:
            logger.info(f"✓ Data collected: {CURRENT_CROP}")
            return True
        else:
            logger.warning(f"✗ API error: {response.status_code}")
            return False
    except Exception as e:
        logger.warning(f"✗ Collection error: {e}")
        return False


# ┌─────────────────────────────────────────────────────────────┐
# │ MODIFY read_sensors() LOOP - REPLACE EXISTING read_sensors   │
# └─────────────────────────────────────────────────────────────┘

def read_sensors(mqtt_c):
    global CURRENT_CROP  # Allow external control
    
    try:
        while True:
            # BACA XY-MD02 (device_id: 2)
            res_xy = modbus_node.read_input_registers(address=1, count=2, device_id=2)
            if not res_xy.isError():
                regs = res_xy.registers
                data_xy = {
                    "suhu": regs[0] / 10.0,
                    "kelembapan": regs[1] / 10.0
                }
                mqtt_c.publish("sensor/xy_md02", json.dumps(data_xy), qos=1)
                influx_node.write_points([{"measurement": "sensor_suhu", "fields": data_xy}])
                logger.info(f"[XY-MD02] → {data_xy}")
            else:
                logger.warning("[XY-MD02] Gagal baca.")
                
            time.sleep(5)
            
            # BACA BSK-EC-100 (device_id: 1)
            res_bsk = modbus_node.read_holding_registers(address=0, count=2, device_id=1)
            if not res_bsk.isError():
                regs_bsk = res_bsk.registers
                ec_val = regs_bsk[0] / 10.0
                data_bsk = {
                    "ec": ec_val,
                    "tds": ec_val / 2.0,
                    "temperature": regs_bsk[1] / 10.0
                }
                mqtt_c.publish("sensor/bsk_ec100", json.dumps(data_bsk), qos=1)
                influx_node.write_points([{"measurement": "sensor_bskec100", "fields": data_bsk}])
                logger.info(f"[BSK-EC] → {data_bsk}")
                
                # ← NEW: Send to data collector
                if data_xy:  # Use cached xy_data
                    send_to_data_collector(data_xy, data_bsk)
            else:
                logger.warning("[BSK-EC] Gagal baca.")
                
            logger.info("-" * 40)
            time.sleep(5)
            
    except Exception as e:
        logger.error(f"Error pada Loop: {e}")


# ┌─────────────────────────────────────────────────────────────┐
# │ USAGE EXAMPLE - untuk start/stop collection                 │
# │ Uncomment ini untuk test                                    │
# └─────────────────────────────────────────────────────────────┘

# UNCOMMENT DI MAIN UNTUK TEST:
# 
# if __name__ == "__main__":
#     print("Memulai Service IoT...")
#     print("\\n=== Data Collection Mode ===")
#     print("Set CURRENT_CROP untuk mulai collecting:")
#     print("  CURRENT_CROP = 'selada'")
#     print("  CURRENT_CROP = 'bayam'")
#     print("  etc...")
#     print("\\nOr di interactive Python:")
#     print("  >>> from main import *")
#     print("  >>> CURRENT_CROP = 'selada'")
#     print("\\n" + "="*40)
#     
#     if not modbus_node.connect():
#         print("Gagal akses /dev/ttyUSB0.")
#         sys.exit(1)
#         
#     mqtt_c = connect_mqtt()
#     mqtt_c.loop_start()
#     
#     try:
#         read_sensors(mqtt_c)
#     except KeyboardInterrupt:
#         print("\\n Berhenti.")
#     finally:
#         mqtt_c.loop_stop()
#         modbus_node.close()
"""

INTERACTIVE_EXAMPLE = """
#!/usr/bin/env python3
'''
Interactive wrapper untuk main.py dengan data collection control
'''

import sys
import time
from main import (
    connect_mqtt, modbus_node, read_sensors, 
    CURRENT_CROP, DATA_COLLECTION_ENABLED
)

def interactive_control():
    global CURRENT_CROP
    
    print("\\n" + "="*50)
    print("AgriSense IoT - Interactive Data Collection")
    print("="*50)
    
    if not modbus_node.connect():
        print("❌ Gagal connect Modbus")
        return
    
    mqtt_c = connect_mqtt()
    mqtt_c.loop_start()
    
    print("\\nCommands:")
    print("  start <crop>  - Start collecting for crop")
    print("  stop          - Stop collection")
    print("  status        - Show current status")
    print("  quit          - Exit")
    print()
    
    import threading
    sensor_thread = threading.Thread(target=read_sensors, args=(mqtt_c,), daemon=True)
    sensor_thread.start()
    
    try:
        while True:
            cmd = input(">>> ").strip().split()
            
            if not cmd:
                continue
            
            if cmd[0] == "start" and len(cmd) > 1:
                crop = cmd[1]
                CURRENT_CROP = crop
                print(f"✓ Started collection for: {crop}")
            
            elif cmd[0] == "stop":
                CURRENT_CROP = None
                print("✓ Collection stopped")
            
            elif cmd[0] == "status":
                print(f"  Crop: {CURRENT_CROP or 'None'}")
                print(f"  Collection: {'Enabled' if DATA_COLLECTION_ENABLED else 'Disabled'}")
            
            elif cmd[0] == "quit":
                break
            
            else:
                print("Unknown command")
    
    except KeyboardInterrupt:
        print("\\n Berhenti.")
    finally:
        mqtt_c.loop_stop()
        modbus_node.close()


if __name__ == "__main__":
    interactive_control()
"""

def create_patch_guide():
    """Generate patch guide"""
    guide = """
# Patch Guide untuk main.py Anda

## Option 1: Manual Patching (RECOMMENDED)

1. Backup original:
   ```bash
   cp main.py main.py.backup
   ```

2. Add imports after existing imports:
   ```python
   import logging
   import requests
   ```

3. Add configuration after INFLUX_CONFIG:
   ```python
   # Data collection config
   DATA_COLLECTOR_URL = "http://192.168.0.135:5000"
   DATA_COLLECTION_ENABLED = True
   CURRENT_CROP = None
   ```

4. Add send_to_data_collector() function sebelum read_sensors()

5. In read_sensors() loop, add setelah publish BSK-EC100:
   ```python
   send_to_data_collector(data_xy, data_bsk)
   ```

## Option 2: Use Improved Version (CLEANEST)

Just use `iot_service_improved.py` instead:
```bash
python3 iot_service_improved.py
```

## Testing Patch

```bash
# Terminal 1: Start backend
cd python-backend/
python3 data_collector.py

# Terminal 2: Start patched main.py
python3 main_patched.py

# Terminal 3 (optional): Interactive control
python3 interactive_main.py
```

## Interactive Usage

```python
# Start collection
>>> start selada

# Let it run while crop grows
# After 35+ days...

# Stop collection
>>> stop

# Check stats
>>> status

# Exit
>>> quit
```
"""
    return guide

if __name__ == "__main__":
    print(PATCH_CODE)
    print("\\n\\n")
    print(INTERACTIVE_EXAMPLE)
    print("\\n\\n")
    print(create_patch_guide())

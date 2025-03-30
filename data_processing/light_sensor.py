import serial
import json
import time
import statistics
import threading
import logging
from typing import Dict, List, Optional

class LightSensorAnalyzer:
    """
    Advanced Light Intensity Sensor Analyzer
    """
    def __init__(self, 
                 serial_port: str = '/dev/ttyUSB0', 
                 baud_rate: int = 115200,
                 log_file: str = 'light_sensor.log'):
        """
        Initialize Light Sensor Analyzer
        
        :param serial_port: Serial port for light sensor
        :param baud_rate: Communication baud rate
        :param log_file: Path for logging light sensor data
        """
        # Serial communication setup
        self.serial_port = serial_port
        self.baud_rate = baud_rate
        self.connection = None
        
        # Data storage
        self.light_readings: List[float] = []
        
        # Sensor configuration
        self.sensor_config: Dict[str, any] = {
            'min_light_level': 0,    # Minimum detectable light level
            'max_light_level': 1024, # Maximum detectable light level
            'light_thresholds': {
                'dark': 10,           # Very low light
                'low_light': 50,      # Dim environment
                'normal': 200,        # Typical indoor lighting
                'bright': 500,        # Well-lit area
                'very_bright': 800    # Intense lighting
            }
        }
        
        # Sampling and analysis parameters
        self.sampling_interval: float = 1.0  # seconds
        self.max_historical_readings: int = 1440  # 24 hours of 1-second readings
        
        # Logging setup
        logging.basicConfig(
            filename=log_file, 
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s: %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
        # Threading control
        self._is_monitoring = False
        self._monitoring_thread = None

    def connect(self) -> bool:
        """
        Establish connection with light sensor device
        
        :return: Connection status
        """
        try:
            self.connection = serial.Serial(
                self.serial_port, 
                self.baud_rate, 
                timeout=1
            )
            self.logger.info(f"Connected to light sensor on {self.serial_port}")
            return True
        except serial.SerialException as e:
            self.logger.error(f"Connection Error: {e}")
            return False

    def _read_light_data(self) -> Optional[Dict[str, float]]:
        """
        Read and parse light intensity data
        
        :return: Parsed light sensor data
        """
        try:
            if not self.connection or not self.connection.is_open:
                if not self.connect():
                    return None
            
            # Send data request
            self.connection.write(b'GET_LIGHT_DATA\n')
            
            # Read response
            raw_data = self.connection.readline().decode().strip()
            return self._parse_light_data(raw_data)
        
        except Exception as e:
            self.logger.error(f"Light Sensor Data Reading Error: {e}")
            return None

    def _parse_light_data(self, raw_data: str) -> Optional[Dict[str, float]]:
        """
        Parse raw light sensor data
        
        :param raw_data: Raw data string from light sensor
        :return: Parsed light sensor dictionary
        """
        try:
            # Expected JSON format
            data = json.loads(raw_data)
            
            # Extract light intensity
            light_intensity = data.get('light_intensity', 0)
            
            # Validate data range
            if (self.sensor_config['min_light_level'] <= light_intensity <= 
                self.sensor_config['max_light_level']):
                
                # Store reading
                self.light_readings.append(light_intensity)
                
                # Limit historical readings
                self._trim_historical_data()
                
                return {
                    'light_intensity': light_intensity,
                    'light_category': self._categorize_light_level(light_intensity)
                }
            
            self.logger.warning(f"Light data out of expected range: {data}")
            return None
        
        except json.JSONDecodeError:
            self.logger.error(f"Invalid light sensor data format: {raw_data}")
            return None

    def _trim_historical_data(self):
        """
        Trim historical readings to prevent memory overflow
        """
        self.light_readings = self.light_readings[-self.max_historical_readings:]

    def _categorize_light_level(self, light_intensity: float) -> str:
        """
        Categorize light intensity levels
        
        :param light_intensity: Current light intensity
        :return: Light intensity category
        """
        thresholds = self.sensor_config['light_thresholds']
        
        if light_intensity < thresholds['dark']:
            return 'VERY_DARK'
        elif thresholds['dark'] <= light_intensity < thresholds['low_light']:
            return 'DARK'
        elif thresholds['low_light'] <= light_intensity < thresholds['normal']:
            return 'DIM'
        elif thresholds['normal'] <= light_intensity < thresholds['bright']:
            return 'NORMAL'
        elif thresholds['bright'] <= light_intensity < thresholds['very_bright']:
            return 'BRIGHT'
        else:
            return 'VERY_BRIGHT'

    def analyze_light_data(self) -> Dict[str, float]:
        """
        Analyze light intensity statistics
        
        :return: Dictionary of light intensity statistics
        """
        if not self.light_readings:
            return {
                'average_light': 0,
                'max_light': 0,
                'min_light': 0,
                'light_std_dev': 0
            }
        
        return {
            'average_light': statistics.mean(self.light_readings),
            'max_light': max(self.light_readings),
            'min_light': min(self.light_readings),
            'light_std_dev': statistics.stdev(self.light_readings) if len(self.light_readings) > 1 else 0
        }

    def detect_light_anomalies(self) -> List[Dict[str, any]]:
        """
        Detect light intensity anomalies
        
        :return: List of detected anomalies
        """
        anomalies = []
        
        if not self.light_readings:
            return anomalies
        
        # Sudden light changes detection
        if len(self.light_readings) > 2:
            light_diff = [
                abs(self.light_readings[i] - self.light_readings[i-1]) 
                for i in range(1, len(self.light_readings))
            ]
            max_diff = max(light_diff)
            
            # Detect significant light level changes
            if max_diff > (statistics.mean(self.light_readings) * 0.5):
                anomalies.append({
                    'type': 'LIGHT_LEVEL_CHANGE',
                    'max_change': max_diff
                })
        
        return anomalies

    def start_continuous_monitoring(self):
        """
        Start continuous light sensor monitoring in a separate thread
        """
        if self._is_monitoring:
            return
        
        self._is_monitoring = True
        self._monitoring_thread = threading.Thread(
            target=self._monitoring_loop, 
            daemon=True
        )
        self._monitoring_thread.start()

    def _monitoring_loop(self):
        """
        Continuous monitoring loop
        """
        while self._is_monitoring:
            try:
                light_data = self._read_light_data()
                
                if light_data:
                    # Log light data
                    self.logger.info(f"Light Sensor Data: {light_data}")
                    
                    # Detect and log anomalies
                    anomalies = self.detect_light_anomalies()
                    for anomaly in anomalies:
                        self.logger.warning(f"Light Anomaly Detected: {anomaly}")
                
                time.sleep(self.sampling_interval)
            
            except Exception as e:
                self.logger.error(f"Monitoring Loop Error: {e}")
                time.sleep(5)  # Prevent rapid error logging

    def stop_monitoring(self):
        """
        Stop continuous light sensor monitoring
        """
        self._is_monitoring = False
        if self._monitoring_thread:
            self._monitoring_thread.join()
        
        if self.connection:
            self.connection.close()

    def generate_light_report(self) -> Dict[str, any]:
        """
        Generate comprehensive light sensor report
        
        :return: Detailed light sensor report
        """
        return {
            'light_stats': self.analyze_light_data(),
            'anomalies': self.detect_light_anomalies(),
            'sensor_config': self.sensor_config
        }

def main():
    """
    Example usage of LightSensorAnalyzer
    """
    # Initialize light sensor analyzer
    light_analyzer = LightSensorAnalyzer(serial_port='COM3')  # Adjust port as needed
    
    try:
        # Start continuous monitoring
        light_analyzer.start_continuous_monitoring()
        
        # Run for a specific duration or until interrupted
        while True:
            time.sleep(60)  # Check every minute
            
            # Generate and print report
            report = light_analyzer.generate_light_report()
            print("Light Sensor Report:")
            print(json.dumps(report, indent=2))
    
    except KeyboardInterrupt:
        print("\nStopping Light Sensor Analysis")
    finally:
        # Ensure proper cleanup
        light_analyzer.stop_monitoring()

if __name__ == "__main__":
    main()
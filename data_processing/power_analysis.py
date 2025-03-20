import serial
import json
import time
import statistics
import threading
import logging
from typing import Dict, List, Optional

class PowerAnalyzer:
    """
    Advanced Power Consumption Analysis Module for IoT Power Measurement Device
    """
    def __init__(self, 
                 serial_port: str = '/dev/ttyUSB0', 
                 baud_rate: int = 115200,
                 log_file: str = 'power_analysis.log'):
        """
        Initialize Power Analyzer
        
        :param serial_port: Serial port for power measurement device
        :param baud_rate: Communication baud rate
        :param log_file: Path for logging power consumption data
        """
        # Serial communication setup
        self.serial_port = serial_port
        self.baud_rate = baud_rate
        self.connection = None
        
        # Data storage
        self.voltage_readings: List[float] = []
        self.current_readings: List[float] = []
        self.power_readings: List[float] = []
        self.energy_consumption: List[float] = []
        
        # Analysis parameters
        self.sampling_interval: float = 1.0  # seconds
        self.max_historical_readings: int = 1440  # 24 hours of 1-second readings
        
        # Device configuration
        self.device_config: Dict[str, any] = {
            'voltage_range': (0, 250),  # Typical household voltage range
            'current_range': (0, 30),   # Typical household current range
            'power_threshold': 50,      # Watts threshold for high power consumption
        }
        
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
        Establish connection with power measurement device
        
        :return: Connection status
        """
        try:
            self.connection = serial.Serial(
                self.serial_port, 
                self.baud_rate, 
                timeout=1
            )
            self.logger.info(f"Connected to power measurement device on {self.serial_port}")
            return True
        except serial.SerialException as e:
            self.logger.error(f"Connection Error: {e}")
            return False

    def _read_power_data(self) -> Optional[Dict[str, float]]:
        """
        Read and parse power measurement data
        
        :return: Parsed power measurement data
        """
        try:
            if not self.connection or not self.connection.is_open:
                if not self.connect():
                    return None
            
            # Send data request
            self.connection.write(b'GET_POWER_DATA\n')
            
            # Read response
            raw_data = self.connection.readline().decode().strip()
            return self._parse_power_data(raw_data)
        
        except Exception as e:
            self.logger.error(f"Power Data Reading Error: {e}")
            return None

    def _parse_power_data(self, raw_data: str) -> Optional[Dict[str, float]]:
        """
        Parse raw power measurement data
        
        :param raw_data: Raw data string from power measurement device
        :return: Parsed power measurement dictionary
        """
        try:
            # Expected JSON format
            data = json.loads(raw_data)
            
            # Validate data against device configuration
            voltage = data.get('voltage', 0)
            current = data.get('current', 0)
            power = data.get('power', 0)
            
            # Perform range checks
            if (self.device_config['voltage_range'][0] <= voltage <= self.device_config['voltage_range'][1] and
                self.device_config['current_range'][0] <= current <= self.device_config['current_range'][1]):
                
                # Store readings
                self.voltage_readings.append(voltage)
                self.current_readings.append(current)
                self.power_readings.append(power)
                
                # Calculate cumulative energy consumption
                energy = power * (self.sampling_interval / 3600)  # kWh
                self.energy_consumption.append(energy)
                
                # Limit historical readings
                self._trim_historical_data()
                
                return {
                    'voltage': voltage,
                    'current': current,
                    'power': power,
                    'energy': sum(self.energy_consumption)
                }
            
            self.logger.warning(f"Power data out of expected range: {data}")
            return None
        
        except json.JSONDecodeError:
            self.logger.error(f"Invalid power data format: {raw_data}")
            return None

    def _trim_historical_data(self):
        """
        Trim historical readings to prevent memory overflow
        """
        self.voltage_readings = self.voltage_readings[-self.max_historical_readings:]
        self.current_readings = self.current_readings[-self.max_historical_readings:]
        self.power_readings = self.power_readings[-self.max_historical_readings:]
        self.energy_consumption = self.energy_consumption[-self.max_historical_readings:]

    def analyze_power_consumption(self) -> Dict[str, float]:
        """
        Analyze power consumption statistics
        
        :return: Dictionary of power consumption statistics
        """
        if not self.power_readings:
            return {
                'average_power': 0,
                'max_power': 0,
                'min_power': 0,
                'total_energy': 0
            }
        
        return {
            'average_power': statistics.mean(self.power_readings),
            'max_power': max(self.power_readings),
            'min_power': min(self.power_readings),
            'total_energy': sum(self.energy_consumption),
            'power_std_dev': statistics.stdev(self.power_readings) if len(self.power_readings) > 1 else 0
        }

    def detect_power_anomalies(self) -> List[Dict[str, any]]:
        """
        Detect power consumption anomalies
        
        :return: List of detected anomalies
        """
        anomalies = []
        
        if not self.power_readings:
            return anomalies
        
        # High power consumption detection
        high_power_events = [
            reading for reading in self.power_readings 
            if reading > self.device_config['power_threshold']
        ]
        
        if high_power_events:
            anomalies.append({
                'type': 'HIGH_POWER_CONSUMPTION',
                'count': len(high_power_events),
                'max_power': max(high_power_events)
            })
        
        # Sudden power spikes detection
        if len(self.power_readings) > 2:
            power_diff = [
                abs(self.power_readings[i] - self.power_readings[i-1]) 
                for i in range(1, len(self.power_readings))
            ]
            max_diff = max(power_diff)
            
            if max_diff > (statistics.mean(self.power_readings) * 0.5):
                anomalies.append({
                    'type': 'POWER_SPIKE',
                    'max_spike': max_diff
                })
        
        return anomalies

    def start_continuous_monitoring(self):
        """
        Start continuous power monitoring in a separate thread
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
                power_data = self._read_power_data()
                
                if power_data:
                    # Log power data
                    self.logger.info(f"Power Data: {power_data}")
                    
                    # Detect and log anomalies
                    anomalies = self.detect_power_anomalies()
                    for anomaly in anomalies:
                        self.logger.warning(f"Anomaly Detected: {anomaly}")
                
                time.sleep(self.sampling_interval)
            
            except Exception as e:
                self.logger.error(f"Monitoring Loop Error: {e}")
                time.sleep(5)  # Prevent rapid error logging

    def stop_monitoring(self):
        """
        Stop continuous power monitoring
        """
        self._is_monitoring = False
        if self._monitoring_thread:
            self._monitoring_thread.join()
        
        if self.connection:
            self.connection.close()

    def generate_power_report(self) -> Dict[str, any]:
        """
        Generate comprehensive power consumption report
        
        :return: Detailed power consumption report
        """
        return {
            'consumption_stats': self.analyze_power_consumption(),
            'anomalies': self.detect_power_anomalies(),
            'device_config': self.device_config
        }

def main():
    """
    Example usage of PowerAnalyzer
    """
    # Initialize power analyzer
    power_analyzer = PowerAnalyzer(serial_port='COM3')  # Adjust port as needed
    
    try:
        # Start continuous monitoring
        power_analyzer.start_continuous_monitoring()
        
        # Run for a specific duration or until interrupted
        while True:
            time.sleep(60)  # Check every minute
            
            # Generate and print report
            report = power_analyzer.generate_power_report()
            print("Power Consumption Report:")
            print(json.dumps(report, indent=2))
    
    except KeyboardInterrupt:
        print("\nStopping Power Analysis")
    finally:
        # Ensure proper cleanup
        power_analyzer.stop_monitoring()

if __name__ == "__main__":
    main()
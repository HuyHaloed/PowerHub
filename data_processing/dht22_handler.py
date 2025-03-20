import time
import serial
import json
import statistics

class DHT22Handler:
    def __init__(self, port='/dev/ttyUSB0', baud_rate=115200):
        """
        Initialize DHT22 temperature and humidity sensor handler
        
        :param port: Serial port for communication
        :param baud_rate: Communication speed
        """
        self.port = port
        self.baud_rate = baud_rate
        self.connection = None
        
        # Data storage
        self.temperature_readings = []
        self.humidity_readings = []
        
        # Sensor calibration parameters
        self.temperature_offset = 0
        self.humidity_offset = 0

    def connect(self):
        """Establish serial connection with DHT22 sensor"""
        try:
            self.connection = serial.Serial(self.port, self.baud_rate, timeout=1)
            print(f"Connected to DHT22 on {self.port}")
            return True
        except serial.SerialException as e:
            print(f"DHT22 Connection Error: {e}")
            return False

    def read_sensor_data(self):
        """
        Read temperature and humidity data from sensor
        
        :return: Dictionary with temperature and humidity, or None
        """
        if not self.connection:
            if not self.connect():
                return None
        
        try:
            # Request sensor data
            self.connection.write(b'GET_DATA\n')
            
            # Read response
            raw_data = self.connection.readline().decode().strip()
            sensor_data = self._parse_sensor_data(raw_data)
            
            return sensor_data
        except Exception as e:
            print(f"DHT22 Reading Error: {e}")
            return None

    def _parse_sensor_data(self, raw_data):
        """
        Parse raw sensor data
        
        :param raw_data: Raw data string from sensor
        :return: Processed sensor data
        """
        try:
            # Assume JSON format: {"temperature": 25.5, "humidity": 60.2}
            data = json.loads(raw_data)
            
            # Apply calibration offsets
            temperature = data.get('temperature', 0) + self.temperature_offset
            humidity = data.get('humidity', 0) + self.humidity_offset
            
            # Store readings for statistical analysis
            self.temperature_readings.append(temperature)
            self.humidity_readings.append(humidity)
            
            # Limit historical readings to last 100
            self.temperature_readings = self.temperature_readings[-100:]
            self.humidity_readings = self.humidity_readings[-100:]
            
            return {
                'temperature': temperature,
                'humidity': humidity
            }
        except json.JSONDecodeError:
            print(f"Invalid DHT22 data format: {raw_data}")
            return None

    def get_temperature_stats(self):
        """
        Calculate temperature statistical data
        
        :return: Dictionary of temperature statistics
        """
        if not self.temperature_readings:
            return None
        
        return {
            'current': self.temperature_readings[-1],
            'average': statistics.mean(self.temperature_readings),
            'min': min(self.temperature_readings),
            'max': max(self.temperature_readings),
            'std_dev': statistics.stdev(self.temperature_readings) if len(self.temperature_readings) > 1 else 0
        }

    def get_humidity_stats(self):
        """
        Calculate humidity statistical data
        
        :return: Dictionary of humidity statistics
        """
        if not self.humidity_readings:
            return None
        
        return {
            'current': self.humidity_readings[-1],
            'average': statistics.mean(self.humidity_readings),
            'min': min(self.humidity_readings),
            'max': max(self.humidity_readings),
            'std_dev': statistics.stdev(self.humidity_readings) if len(self.humidity_readings) > 1 else 0
        }

    def calibrate(self, temperature_offset=0, humidity_offset=0):
        """
        Calibrate sensor by applying offsets
        
        :param temperature_offset: Temperature correction value
        :param humidity_offset: Humidity correction value
        """
        self.temperature_offset = temperature_offset
        self.humidity_offset = humidity_offset
        print(f"DHT22 Calibrated: Temp Offset = {temperature_offset}, Humidity Offset = {humidity_offset}")

    def monitor_continuously(self, interval=5):
        """
        Continuously monitor sensor data
        
        :param interval: Monitoring interval in seconds
        """
        try:
            while True:
                data = self.read_sensor_data()
                if data:
                    print("DHT22 Data:", data)
                    print("Temperature Stats:", self.get_temperature_stats())
                    print("Humidity Stats:", self.get_humidity_stats())
                time.sleep(interval)
        except KeyboardInterrupt:
            print("\nDHT22 Monitoring Stopped")
        finally:
            if self.connection:
                self.connection.close()

def main():
    # Example usage
    dht_handler = DHT22Handler(port='COM3')  # Adjust port as needed
    
    # Optional: Calibration
    dht_handler.calibrate(temperature_offset=-0.5, humidity_offset=3)
    
    # Start continuous monitoring
    dht_handler.monitor_continuously()

if __name__ == "__main__":
    main()
# PowerHub/run.py
import sys
import time
from data_processing import DataProcessingManager # Import the main class

# --- Determine Serial Port ---
default_port = "COM12" if sys.platform == "win32" else "/dev/ttyACM0" # Example common ports
print(f"Attempting to use default serial port: {default_port}")

# --- Get Access Token ---
# !! IMPORTANT: Read token securely (environment var, config file) !!
access_token = "rsoMvGsRuM9iNbDZBZd3" # Replace with your method
print(f"Using Access Token: ...{access_token[-4:]}")
# ---

# --- Library Check ---
# Optional, but helpful check before starting
try:
    import paho.mqtt.client
    import serial
    import speech_recognition
    print("Core libraries seem available.")
except ImportError as e:
    print(f"\nERROR: Missing required library: {e}")
    print("Please ensure all dependencies are installed:")
    print("pip install -r requirements.txt  (or install individually)")
    print("Required: paho-mqtt, pyserial, SpeechRecognition, PyAudio")
    exit(1)
# ---

if __name__ == "__main__":
    print("Initializing Data Processing Manager from run_gateway.py...")
    # Pass the determined port and token
    data_manager = DataProcessingManager(serial_port=default_port, access_token=access_token)
    print("Starting Data Processing Manager...")
    data_manager.start() # This call blocks until stopped (Ctrl+C or 'stop' command)
    print("run.py: Data Processing Manager has finished.")
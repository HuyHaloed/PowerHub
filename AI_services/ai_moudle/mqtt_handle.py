# ai_module/mqtt_handle.py
import json
import logging
import paho.mqtt.client as mqtt
import os
import time
from typing import Dict, Any, Optional, Callable

logger = logging.getLogger(__name__)


class MQTTHandler:
    """MQTT client handler for IoT device communications."""
    
    def __init__(self, broker: str, port: int, client_id: str, token: str = None):
        """Initialize MQTT handler with connection parameters.
        
        Args:
            broker: MQTT broker address (e.g., 'app.coreiot.io')
            port: MQTT broker port (typically 1883)
            client_id: Unique client identifier
            token: Authentication token if required
        """
        self.broker = broker
        self.port = port
        self.client_id = client_id
        self.token = token
        self.client = None
        self.connected = False
        self.callbacks = {}
        self.request_counter = 0
        self.subscribed_topics = set()
        
    def connect(self) -> bool:
        """Connect to the MQTT broker.
        
        Returns:
            bool: True if connection successful or already connected
        """
        if self.connected:
            return True
            
        try:
            self.client = mqtt.Client(client_id=self.client_id, protocol=mqtt.MQTTv311)
            
            # Set up callbacks
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect
            self.client.on_message = self._on_message
            self.client.on_publish = self._on_publish
            
            # Set up authentication if token provided
            if self.token:
                self.client.username_pw_set(self.token)
            
            # Connect to broker
            logger.info(f"Connecting to MQTT broker {self.broker}:{self.port}")
            self.client.connect(self.broker, self.port, 60)
            self.client.loop_start()
            
            # Wait briefly for connection to establish
            timeout = 0
            while not self.connected and timeout < 10:
                time.sleep(0.5)
                timeout += 0.5
                
            return self.connected
            
        except Exception as e:
            logger.error(f"MQTT connection error: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from MQTT broker and stop loop."""
        if self.client and self.connected:
            self.client.loop_stop()
            self.client.disconnect()
            self.connected = False
            logger.info("Disconnected from MQTT broker")
    
    def subscribe(self, topic: str, callback: Callable = None) -> bool:
        """Subscribe to an MQTT topic.
        
        Args:
            topic: The topic to subscribe to
            callback: Optional callback function to handle messages for this topic
            
        Returns:
            bool: True if subscription successful
        """
        if not self.connected:
            logger.error("Cannot subscribe: Not connected to MQTT broker")
            return False
            
        try:
            result, _ = self.client.subscribe(topic)
            if result == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"Subscribed to topic: {topic}")
                self.subscribed_topics.add(topic)
                
                # Register topic-specific callback if provided
                if callback:
                    self.callbacks[topic] = callback
                return True
            else:
                logger.error(f"Failed to subscribe to {topic}, result code: {result}")
                return False
                
        except Exception as e:
            logger.error(f"Error subscribing to {topic}: {e}")
            return False
    
    def publish(self, topic: str, payload: Dict[str, Any], qos: int = 1) -> int:
        """Publish a message to an MQTT topic.
        
        Args:
            topic: The topic to publish to
            payload: Dictionary to be converted to JSON and published
            qos: Quality of Service level (0, 1, or 2)
            
        Returns:
            int: Message ID if successful, -1 otherwise
        """
        if not self.connected:
            logger.error("Cannot publish: Not connected to MQTT broker")
            return -1
            
        try:
            # Convert dict to JSON string
            message = json.dumps(payload)
            
            # Publish message and get message ID
            msg_info = self.client.publish(topic, message, qos=qos)
            if msg_info.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.debug(f"Published to {topic}: {message[:100]}{'...' if len(message) > 100 else ''}")
                return msg_info.mid
            else:
                logger.error(f"Failed to publish to {topic}, result code: {msg_info.rc}")
                return -1
                
        except Exception as e:
            logger.error(f"Error publishing to {topic}: {e}")
            return -1
    
    def publish_rpc(self, method: str, params: Any) -> int:
        """Publish an RPC request to ThingsBoard/CoreIOT.
        
        Args:
            method: RPC method name
            params: Parameters for the RPC call
            
        Returns:
            int: Request ID if successful, -1 otherwise
        """
        self.request_counter += 1
        rpc_topic = f"v1/devices/me/rpc/request/{self.request_counter}"
        
        payload = {
            "method": method,
            "params": params
        }
        
        return self.publish(rpc_topic, payload)
    
    def _on_connect(self, client, userdata, flags, rc):
        """Handle connection callback."""
        if rc == 0:
            self.connected = True
            logger.info(f"Connected successfully to MQTT broker: {self.broker}")
            
            # Resubscribe to topics if reconnecting
            for topic in self.subscribed_topics:
                self.client.subscribe(topic)
        else:
            self.connected = False
            logger.error(f"Failed to connect to MQTT broker: {mqtt.connack_string(rc)}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Handle disconnection callback."""
        self.connected = False
        if rc != 0:
            logger.warning(f"Unexpected MQTT disconnection (code {rc}), will try to reconnect")
        else:
            logger.info("Disconnected from MQTT broker")
    
    def _on_message(self, client, userdata, msg):
        """Handle incoming messages."""
        try:
            topic = msg.topic
            payload = msg.payload.decode('utf-8')
            
            logger.debug(f"Received message on topic {topic}: {payload[:100]}{'...' if len(payload) > 100 else ''}")
            
            # If topic has a specific callback, use it
            if topic in self.callbacks:
                self.callbacks[topic](topic, payload)
            
            # Otherwise try to find a wildcard match
            else:
                for registered_topic, callback in self.callbacks.items():
                    if '+' in registered_topic or '#' in registered_topic:
                        # Simple pattern matching
                        pattern = registered_topic.replace('+', '[^/]+').replace('#', '.*')
                        import re
                        if re.match(f"^{pattern}$", topic):
                            callback(topic, payload)
                            break
                            
        except Exception as e:
            logger.error(f"Error processing message from {msg.topic}: {e}")
    
    def _on_publish(self, client, userdata, mid):
        """Handle publish callback."""
        logger.debug(f"Message published: {mid}")

if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # Connection details (same as in ai_manager.py)
    MQTT_BROKER = "app.coreiot.io"
    MQTT_PORT = 1883
    MQTT_TOKEN = "ZS9KjbmsPcXtniB8q9yP"
    
    # Create and connect handler
    handler = MQTTHandler(
        broker=MQTT_BROKER,
        port=MQTT_PORT,
        client_id=f"mqtt-handler-test-{os.getpid()}",
        token=MQTT_TOKEN
    )
    
    if handler.connect():
        try:
            # Define a callback for messages
            def message_callback(topic, payload):
                print(f"Callback received: {topic} -> {payload}")
            
            # Subscribe to a topic
            handler.subscribe("v1/devices/me/attributes", message_callback)
            
            # Publish a test message
            handler.publish_rpc("setValueLight", True)
            
            # Keep alive for a while
            print("Running MQTT handler for 30 seconds...")
            time.sleep(30)
            
        finally:
            # Disconnect when done
            handler.disconnect()
    else:
        print("Failed to connect to MQTT broker")
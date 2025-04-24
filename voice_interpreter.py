import re
from thefuzz import process, fuzz
import logging
import json
import os
from typing import Dict, Tuple, Optional

logger = logging.getLogger(__name__)

STATUS_OK = "OK"
STATUS_STOP = "STOP"
STATUS_UNRECOGNIZED = "UNRECOGNIZED"
COMMAND_PAYLOAD = Optional[Dict]
INTERPRETATION_RESULT = Tuple[str, COMMAND_PAYLOAD]

COMMAND_CONFIG: Dict[str, Dict] = {}
ALL_TEMPLATES_MAP: Dict[str, str] = {}
ALIASES = {
    "lamp": "light",
    "bulb": "light",
    "ac": "fan",
    "air conditioner": "fan",
    "fan": "fan",
    "light": "light"
}

# load_command_config function remains the same...
def load_command_config(config_path: str) -> bool:
    global COMMAND_CONFIG, ALL_TEMPLATES_MAP
    logger.info(f"Loading voice command configuration from: {config_path}")
    try:
        if not os.path.exists(config_path):
            logger.error(f"Voice configuration file not found: {config_path}")
            return False

        with open(config_path, 'r', encoding='utf-8') as f:
            raw_config = json.load(f)

        processed_config = {}
        all_templates_temp = {}

        for key, config_item in raw_config.items():
            # Keep validation for templates and regex, payload structure from config is now ignored for output generation
            if not all(k in config_item for k in ["templates", "regex"]): # Removed "payload" check here
                logger.warning(f"Skipping voice config item '{key}': Missing required keys 'templates' or 'regex'.")
                continue

            try:
                config_item["regex_compiled"] = re.compile(config_item["regex"], re.IGNORECASE)
            except re.error as e:
                logger.error(f"Skipping invalid regex for '{key}': {e}")
                continue

            processed_config[key] = config_item

            for phrase in config_item["templates"]:
                all_templates_temp[phrase.lower()] = key

        COMMAND_CONFIG = processed_config
        ALL_TEMPLATES_MAP = all_templates_temp
        logger.info(f"Successfully loaded and processed {len(COMMAND_CONFIG)} voice commands.")
        logger.debug(f"Voice template map loaded with {len(ALL_TEMPLATES_MAP)} entries.")
        return True

    except json.JSONDecodeError as e:
        logger.exception(f"Error decoding JSON from {config_path}: {e}")
        return False
    except Exception as e:
        logger.exception(f"Unexpected error loading voice command config from {config_path}: {e}")
        return False

# --- MODIFIED FUNCTION ---
def interpret_command(text: str, fuzzy_threshold: int = 75) -> INTERPRETATION_RESULT:
    global COMMAND_CONFIG, ALL_TEMPLATES_MAP, ALIASES

    if not COMMAND_CONFIG or not ALL_TEMPLATES_MAP:
        logger.error("Voice command configuration not loaded. Cannot interpret command.")
        return STATUS_UNRECOGNIZED, None

    text = text.strip().lower()
    logger.debug(f"Interpreting text: '{text}'")
    command_payload: COMMAND_PAYLOAD = None
    status = STATUS_UNRECOGNIZED

    if not text:
        return status, command_payload

    try:
        # --- Step 1: Find the best matching command template ---
        best_template, score = process.extractOne(
            text,
            ALL_TEMPLATES_MAP.keys(),
            scorer=fuzz.WRatio
        )
        logger.info(f"Fuzzy Match: Template='{best_template}', Score={score}")

        if score >= fuzzy_threshold:
            command_key = ALL_TEMPLATES_MAP[best_template]
            logger.info(f"Matched Command Key: {command_key}")

            # --- Handle STOP command separately ---
            if command_key == "STOP":
                 logger.info("Stop command detected.")
                 return STATUS_STOP, None # Return STOP status

            config = COMMAND_CONFIG.get(command_key, {})
            regex_compiled = config.get("regex_compiled")

            if regex_compiled:
                match = regex_compiled.search(text)
                if match:
                    logger.debug(f"Regex validation successful for {command_key}")

                    # --- Step 2: Extract device and determine state (True/False) ---
                    try:
                        # Extract device name if present in regex
                        raw_device = match.group("device").lower() if "device" in match.groupdict() else None
                        normalized_device = ALIASES.get(raw_device, raw_device)

                        # Determine boolean state based on command key name convention
                        target_state = None
                        if "ON" in command_key.upper():
                            target_state = True
                        elif "OFF" in command_key.upper():
                             # Special check for "TURN_OFF_ALL" which might not have a device
                            if command_key == "TURN_OFF_ALL":
                                # Handle TURN_OFF_ALL - maybe you want a specific payload or none?
                                # For now, let's skip creating a specific payload for it,
                                # as the request was device-specific (sharevalueFan/Light)
                                logger.info("Interpreted as TURN_OFF_ALL command.")
                                # You might want a different status or payload here.
                                # Example: return STATUS_OK, {"command": "shutdown_all"}
                                # Returning unrecognized for now as it doesn't fit the sharevalue pattern.
                                return STATUS_UNRECOGNIZED, None
                            target_state = False


                        # --- Step 3: Construct the desired payload ---
                        if normalized_device and target_state is not None:
                            # Construct the key like "sharevalueFan" or "sharevalueLight"
                            payload_key = f"sharevalue{normalized_device.capitalize()}"
                            # Create the final payload dictionary
                            command_payload = {payload_key: target_state}
                            status = STATUS_OK
                            logger.info(f"Command '{command_key}' interpreted. Payload: {command_payload}")
                        # Handle commands that matched regex but didn't yield a device/state for the new format
                        # (e.g., if regex doesn't have a 'device' group or command key isn't ON/OFF)
                        elif command_key == "TURN_OFF_ALL":
                            # Already handled above, but being explicit
                            logger.warning(f"Command '{command_key}' matched but doesn't fit target payload format.")
                            status = STATUS_UNRECOGNIZED # Or handle differently
                        elif not normalized_device:
                             logger.warning(f"Regex for {command_key} matched, but 'device' group missing or not recognized in ALIASES.")
                             status = STATUS_UNRECOGNIZED
                        elif target_state is None:
                             logger.warning(f"Could not determine target state (True/False) for command key {command_key}.")
                             status = STATUS_UNRECOGNIZED
                        else:
                             logger.warning(f"Unexpected scenario interpreting command {command_key}.")
                             status = STATUS_UNRECOGNIZED


                    except AttributeError:
                        logger.warning(f"Error accessing regex match groups for {command_key}.")
                        status = STATUS_UNRECOGNIZED
                    except Exception as e:
                         logger.exception(f"Error during payload construction for {command_key}: {e}")
                         status = STATUS_UNRECOGNIZED

                else: # Regex validation failed despite high fuzzy score
                    logger.warning(f"High fuzzy score ({score}) but Regex for {command_key} failed validation on: '{text}'")
                    status = STATUS_UNRECOGNIZED
            else: # No compiled regex found (should not happen with load_command_config checks)
                 logger.warning(f"No compiled Regex found for command key {command_key}")
                 status = STATUS_UNRECOGNIZED
        else: # Fuzzy score too low
            logger.info(f"Command not recognized (Fuzzy score {score} < {fuzzy_threshold}).")
            status = STATUS_UNRECOGNIZED

    except Exception as e:
        logger.exception(f"Error during command interpretation: {e}")
        status = STATUS_UNRECOGNIZED

    return status, command_payload
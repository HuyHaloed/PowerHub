#voice_interpreter.py
import re
from thefuzz import process, fuzz
import logging
import json
import os
from typing import Dict, Tuple, Optional

logger = logging.getLogger(__name__)

# --- Constants for return status ---
STATUS_OK = "OK"
STATUS_STOP = "STOP"
STATUS_UNRECOGNIZED = "UNRECOGNIZED"
COMMAND_PAYLOAD = Optional[Dict]
INTERPRETATION_RESULT = Tuple[str, COMMAND_PAYLOAD]

# Global variables to store loaded config
COMMAND_CONFIG: Dict[str, Dict] = {}
ALL_TEMPLATES_MAP: Dict[str, str] = {}

def load_command_config(config_path: str) -> bool:
    """
    Loads command configuration from a JSON file and compiles regex patterns.

    Args:
        config_path: The full path to the voice_config.json file.

    Returns:
        True if loading was successful, False otherwise.
    """
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
            # Validate basic structure
            if not all(k in config_item for k in ["templates", "regex", "payload"]):
                 logger.warning(f"Skipping invalid voice config item '{key}': Missing required keys.")
                 continue

            # Compile the regex pattern
            try:
                config_item["regex_compiled"] = re.compile(config_item["regex"], re.IGNORECASE)
            except re.error as e:
                logger.error(f"Skipping invalid regex for '{key}': {e}")
                continue # Skip if regex is invalid

            processed_config[key] = config_item

            for phrase in config_item["templates"]:
                all_templates_temp[phrase.lower()] = key # Store the template in lowercase

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

def interpret_command(text: str, fuzzy_threshold: int = 75) -> INTERPRETATION_RESULT:
    """
    Interprets recognized speech text using loaded configuration.

    Args:
        text: The recognized speech text (lowercase).
        fuzzy_threshold: The minimum score for a fuzzy match (0-100).

    Returns:
        A tuple containing the status (STATUS_OK, STATUS_STOP, STATUS_UNRECOGNIZED)
        and the command payload dictionary (or None).
    """
    global COMMAND_CONFIG, ALL_TEMPLATES_MAP # Ensure using the loaded config

    # Check if config loaded
    if not COMMAND_CONFIG or not ALL_TEMPLATES_MAP:
        logger.error("Voice command configuration not loaded. Cannot interpret command.")
        return STATUS_UNRECOGNIZED, None

    logger.debug(f"Interpreting text: '{text}'")
    command_payload: COMMAND_PAYLOAD = None
    status = STATUS_UNRECOGNIZED

    if not text:
        logger.debug("Received empty text for interpretation.")
        return status, command_payload

    # 1. Fuzzy Match
    try:
        # Ensure the fuzz library is installed
        best_template, score = process.extractOne(
            text,
            ALL_TEMPLATES_MAP.keys(),
            scorer=fuzz.WRatio
        )
        logger.info(f"Fuzzy Match: Template='{best_template}', Score={score}")

        if score >= fuzzy_threshold:
            command_key = ALL_TEMPLATES_MAP[best_template]
            logger.info(f"Matched Command Key: {command_key}")

            # 2. Regex Validation using compiled regex
            config = COMMAND_CONFIG.get(command_key, {})
            regex_compiled = config.get("regex_compiled")

            if regex_compiled:
                match = regex_compiled.search(text)
                if match:
                    logger.debug(f"Regex validation successful for {command_key}")
                    if command_key == "STOP":
                        status = STATUS_STOP
                        command_payload = None # No payload for stop
                        logger.info("Stop command confirmed.")
                    else:
                        # Process payload and potential entities like 'device'
                        try:
                            expected_payload = config.get("payload") # Get the template payload
                            # Check if regex captured a 'device' group
                            raw_entity = match.group("device").lower() if "device" in match.groupdict() else None
                            entity = None
                            if raw_entity:
                                # Simple aliasing example (lamp -> light)
                                entity = "light" if raw_entity == "lamp" else raw_entity
                                logger.debug(f"Extracted entity: '{entity}' (raw: '{raw_entity}')")

                            # Basic validation: Check if the extracted entity is valid for the command
                            # (Assumes payload params keys are the valid entities)
                            if expected_payload and 'params' in expected_payload:
                                if entity and entity in expected_payload['params']:
                                     status = STATUS_OK
                                     # Return the payload structure defined in the config
                                     command_payload = expected_payload
                                     logger.info(f"Command '{command_key}' validated for entity '{entity}'. Payload: {command_payload}")
                                elif not entity and len(expected_payload['params']) > 0:
                                     # Regex matched but didn't capture required entity
                                     logger.warning(f"Regex for {command_key} matched, but required 'device' group missing or empty.")
                                     status = STATUS_UNRECOGNIZED
                                else: # Command doesn't require specific entity matching (e.g. general on/off)
                                     # Or entity was found but not listed in params
                                     if entity:
                                        logger.warning(f"Regex matched entity '{entity}' but not valid for {command_key}'s payload params.")
                                        status = STATUS_UNRECOGNIZED
                                     else: # No entity needed/found, command is valid
                                         status = STATUS_OK
                                         command_payload = expected_payload
                                         logger.info(f"Command '{command_key}' validated. Payload: {command_payload}")

                            elif expected_payload is None and command_key == "STOP": # STOP has null payload
                                pass # Already handled above
                            elif expected_payload is None:
                                 logger.warning(f"Payload is null for non-STOP command '{command_key}'.")
                                 status = STATUS_UNRECOGNIZED # Or OK if null payload is valid
                            else:
                                # Payload exists but no 'params' key?
                                logger.warning(f"Payload structure for {command_key} might be unexpected (no 'params' key).")
                                status = STATUS_OK # Assume ok if payload exists
                                command_payload = expected_payload


                        except IndexError:
                            # This might happen if regex has 'device' group but it wasn't matched
                            logger.warning(f"Regex for {command_key} matched, but 'device' group missing.")
                            status = STATUS_UNRECOGNIZED
                        except AttributeError:
                            # This might happen if payload is not a dict or params is not dict
                            logger.warning(f"Error accessing payload structure for {command_key}.")
                            status = STATUS_UNRECOGNIZED
                else:
                    # High fuzzy score but regex failed
                    logger.warning(f"High fuzzy score ({score}) but Regex for {command_key} failed validation on: '{text}'")
                    status = STATUS_UNRECOGNIZED
            else:
                 # Should not happen if load_command_config worked
                 logger.warning(f"No compiled Regex found for command key {command_key}")
                 # Still treat STOP as valid even without regex match if fuzzy score is high
                 if command_key == "STOP":
                     status = STATUS_STOP
                     command_payload = None

        else: # Fuzzy score below threshold
            logger.info(f"Command not recognized (Fuzzy score {score} < {fuzzy_threshold}).")
            status = STATUS_UNRECOGNIZED

    except Exception as e:
        logger.exception(f"Error during command interpretation: {e}")
        status = STATUS_UNRECOGNIZED

    return status, command_payload
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
            if not all(k in config_item for k in ["templates", "regex", "payload"]):
                logger.warning(f"Skipping invalid voice config item '{key}': Missing required keys.")
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

def interpret_command(text: str, fuzzy_threshold: int = 75) -> INTERPRETATION_RESULT:
    global COMMAND_CONFIG, ALL_TEMPLATES_MAP

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
        best_template, score = process.extractOne(
            text,
            ALL_TEMPLATES_MAP.keys(),
            scorer=fuzz.WRatio
        )
        logger.info(f"Fuzzy Match: Template='{best_template}', Score={score}")

        if score >= fuzzy_threshold:
            command_key = ALL_TEMPLATES_MAP[best_template]
            logger.info(f"Matched Command Key: {command_key}")

            config = COMMAND_CONFIG.get(command_key, {})
            regex_compiled = config.get("regex_compiled")

            if regex_compiled:
                match = regex_compiled.search(text)
                if match:
                    logger.debug(f"Regex validation successful for {command_key}")
                    if command_key == "STOP":
                        status = STATUS_STOP
                        command_payload = None
                    else:
                        try:
                            expected_payload = config.get("payload")
                            raw_entity = match.group("device").lower() if "device" in match.groupdict() else None
                            entity = ALIASES.get(raw_entity, raw_entity)

                            if expected_payload and 'params' in expected_payload:
                                if entity and entity in expected_payload['params']:
                                    status = STATUS_OK
                                    command_payload = expected_payload
                                    logger.info(f"Command '{command_key}' validated for entity '{entity}'. Payload: {command_payload}")
                                elif not entity and len(expected_payload['params']) > 0:
                                    logger.warning(f"Regex for {command_key} matched, but required 'device' group missing or empty.")
                                    status = STATUS_UNRECOGNIZED
                                else:
                                    if entity:
                                        logger.warning(f"Regex matched entity '{entity}' but not valid for {command_key}'s payload params.")
                                        status = STATUS_UNRECOGNIZED
                                    else:
                                        status = STATUS_OK
                                        command_payload = expected_payload
                                        logger.info(f"Command '{command_key}' validated. Payload: {command_payload}")

                            elif expected_payload is None and command_key == "STOP":
                                pass
                            elif expected_payload is None:
                                logger.warning(f"Payload is null for non-STOP command '{command_key}'.")
                                status = STATUS_UNRECOGNIZED
                            else:
                                logger.warning(f"Payload structure for {command_key} might be unexpected (no 'params' key).")
                                status = STATUS_OK
                                command_payload = expected_payload

                        except IndexError:
                            logger.warning(f"Regex for {command_key} matched, but 'device' group missing.")
                            status = STATUS_UNRECOGNIZED
                        except AttributeError:
                            logger.warning(f"Error accessing payload structure for {command_key}.")
                            status = STATUS_UNRECOGNIZED
                else:
                    logger.warning(f"High fuzzy score ({score}) but Regex for {command_key} failed validation on: '{text}'")
                    status = STATUS_UNRECOGNIZED
            else:
                logger.warning(f"No compiled Regex found for command key {command_key}")
                if command_key == "STOP":
                    status = STATUS_STOP
                    command_payload = None
        else:
            logger.info(f"Command not recognized (Fuzzy score {score} < {fuzzy_threshold}).")
            status = STATUS_UNRECOGNIZED

    except Exception as e:
        logger.exception(f"Error during command interpretation: {e}")
        status = STATUS_UNRECOGNIZED

    return status, command_payload

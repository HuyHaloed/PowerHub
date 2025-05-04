import speech_recognition as sr
from enum import Enum
import json, re
import os

intent_path = os.path.join(os.path.abspath(__file__), '../../speech/intents.json')
with open(intent_path, "r") as f:
    intent_config = json.load(f)

class Language(Enum):
    ENGLISH = 'en-US'
    SPANISH = 'es-ES'
    FRENCH = 'fr-FR'
    GERMAN = 'de-DE'
    ITALIAN = 'it-IT'
    PORTUGUESE = 'pt-PT'
    JAPANESE = 'ja-JP'
    CHINESE = 'zh-CN'
    KOREAN = 'ko-KR'
    RUSSIAN = 'ru-RU'
    VIETNAMESE = 'vi-VN'
    
class SpeechToText:
    def print_mic_device_index():
        for index, name in enumerate(sr.Microphone.list_microphone_names()):
            print("{1}, device index: {0}".format(index, name))
    
    @staticmethod
    def speech_to_text(device_index, language: Language = Language.ENGLISH):
        r = sr.Recognizer() 
        with sr.Microphone(device_index=device_index) as source:
            print("Start speaking...")
            audio = r.listen(source)
            print("Processing...")
            try:
                text = r.recognize_google(audio, language=language.value)
                print("You said: {}".format(text))
                return text
            except:
                print("Sorry, I could not understand the audio.")
                return None
    
    @staticmethod
    def classify_by_template(transcript: str, intent_config: dict):
        transcript = transcript.lower()
        for action, config in intent_config.items():
            for template in config["templates"]:
                if template.lower() in transcript:
                    return action
        return None



def check_mic_device_index():
    SpeechToText.print_mic_device_index()
    
def run_speech_to_text_english(device_index, language: Language = Language.ENGLISH):
    return SpeechToText.speech_to_text(device_index, language)

def run_speech_to_text_chinese(device_index, language: Language = Language.CHINESE):
    return SpeechToText.speech_to_text(device_index, language)
    
def run_speech_to_text_vietnamese(device_index, language: Language = Language.VIETNAMESE):
    return SpeechToText.speech_to_text(device_index, language)
    
if __name__ == "__main__":
    check_mic_device_index()
    device_index = int(input("Enter the device index: "))
    result = run_speech_to_text_english(device_index)
    # run_speech_to_text_chinese(device_index)
    # result = run_speech_to_text_vietnamese(device_index)
    print("Transcript result:", result)
    # matched_action, matched_template = SpeechToText.classify_by_template(result, intent_config)
    # if matched_action:
    #     print("Matched action:", matched_action)
    #     print("Matched template:", matched_template)
    # else:
    #     print("No matching template found.")

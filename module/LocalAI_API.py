import requests
import json
import os

OLLAMA_API = "http://localhost:11434"

def call_ollama_chat(messages, schema=None, stream=False):
    """
    Gọi Ollama API với messages và optional schema.
    """
    payload = {
        "model": "llama3.2",
        "messages": messages,
        "stream": stream
    }
    if schema:
        payload["format"] = schema
    resp = requests.post(f"{OLLAMA_API}/api/chat", json=payload)
    resp.raise_for_status()
    data = resp.json()
    return data["message"]["content"]

def ask_ollama_with_guide(user_text, guide_content):
    """
    Gửi prompt tới Ollama dựa trên guide_content và user_text.
    """
    prompt = (
        "Based on the following information about the system and user guide:\n"
        f"{guide_content}\n"
        f"Please provide a concise and accurate answer to the user's question: \"{user_text}\""
    )
    messages = [
        {"role": "system", "content": "You are an assistant supporting users based on the system guide."},
        {"role": "user", "content": prompt}
    ]
    return call_ollama_chat(messages)

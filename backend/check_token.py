"""Find which chat models are actually available on HF Inference API."""
import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()
token = os.getenv("HF_API_TOKEN")
client = InferenceClient(token=token)

candidates = [
    "HuggingFaceH4/zephyr-7b-beta",
    "mistralai/Mistral-7B-Instruct-v0.2",
    "microsoft/Phi-3-mini-4k-instruct",
    "Qwen/Qwen3.5-7B-Instruct",
    "google/gemma-2-2b-it",
    "tiiuae/falcon-7b-instruct",
]

for model in candidates:
    try:
        resp = client.chat_completion(
            model=model,
            messages=[{"role": "user", "content": "Say hi"}],
            max_tokens=5,
        )
        text = resp.choices[0].message.content
        print(f"OK  {model}  ->  {text!r}")
    except Exception as e:
        short = str(e).split("\n")[0][:120]
        print(f"ERR {model}  ->  {short}")

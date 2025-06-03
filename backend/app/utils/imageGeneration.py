import requests
from PIL import Image
from io import BytesIO
import base64
from app.config import IMAGEROUTER_API_KEY

API_URL = "https://ir-api.myqa.cc/v1/openai/images/generations"
API_KEY = IMAGEROUTER_API_KEY


def generate_image(user_prompt):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "prompt": user_prompt,
        "model": "stabilityai/sdxl-turbo:free",
        "quality": "auto"
    }

    response = requests.post(API_URL, headers=headers, json=payload)
    response.raise_for_status()
    data = response.json()

    result = data.get("data", [])[0]
    image = None

    if "b64_json" in result:
        image_data = base64.b64decode(result["b64_json"])
        image = Image.open(BytesIO(image_data))
    elif "url" in result:
        image_response = requests.get(result["url"])
        image_response.raise_for_status()
        image = Image.open(BytesIO(image_response.content))
    else:
        raise ValueError("No image data found in response.")

    # Always return base64-encoded PNG
    output_buffer = BytesIO()
    image.convert("RGB").save(output_buffer, format="PNG")
    base64_str = base64.b64encode(output_buffer.getvalue()).decode("utf-8")
    
    return {
        "image_base64": base64_str,
        "mime_type": "image/png"
    }

import requests
from PIL import Image
from io import BytesIO
import base64
from app.config import IMAGEROUTER_API_KEY

API_URL = "https://ir-api.myqa.cc/v1/openai/images/generations"
API_KEY = IMAGEROUTER_API_KEY


def generate_image(user_prompt):
    # Build the full prompt
    full_prompt = f"{user_prompt}"

    # Prepare headers and body
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "prompt": full_prompt,
        "model": "stabilityai/sdxl-turbo:free",
        "quality": "auto"
    }

    # Send the request
    response = requests.post(API_URL, headers=headers, json=payload)
    response.raise_for_status()
    data = response.json()

    # Handle possible result types
    result = data.get("data", [])[0]

    if "b64_json" in result:
        # Decode base64 string to image
        image_data = base64.b64decode(result["b64_json"])
        image = Image.open(BytesIO(image_data))
    elif "url" in result:
        # Download image from URL
        image_response = requests.get(result["url"])
        image = Image.open(BytesIO(image_response.content))
    else:
        raise ValueError("No image data found in response.")

    return image


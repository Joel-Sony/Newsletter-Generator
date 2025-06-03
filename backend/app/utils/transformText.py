from openai import OpenAI
from app.config import OPENROUTER_API_KEY

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

def transformText(text, tone, custom_prompt=None):
    if tone == 'Custom' and custom_prompt:
        prompt = f"""{custom_prompt}\n\nText:\n{text}\n\nRespond only with the rewritten version."""
    else:
        prompt = f"""Convert the following text to a {tone} tone:\n\n"{text}"\n\nRespond only with the rewritten version."""

    response = client.chat.completions.create(
        model="meta-llama/llama-3.3-8b-instruct:free",
        messages=[{"role": "user", "content": prompt}]
    )

    transformed = response.choices[0].message.content.strip()

    # Remove surrounding quotes if present
    if transformed.startswith(("'", '"')) and transformed.endswith(("'", '"')):
        transformed = transformed[1:-1]

    return transformed
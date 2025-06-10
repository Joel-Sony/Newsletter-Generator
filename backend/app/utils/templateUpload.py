from bs4 import BeautifulSoup
import time
import base64
from openai import OpenAI
import os
import requests
import json
from app.config import (
    OPENROUTER_API_KEY,
    CONVERT_API_SECRET,
    OUTPUT_PATH,
    INPUT_PATH,
)
import asyncio
import re

async def convert_pdf_to_html(fileBytes, filename):
    payload = {
        "Parameters": [
            {"Name": "File", "FileValue": {"Name": filename, "Data": base64.b64encode(fileBytes).decode("utf-8")}},
            {"Name": "StoreFile", "Value": True}
        ]
    }
    
    response = requests.post(
        "https://v2.convertapi.com/convert/pdf/to/html", 
        json=payload, 
        headers={"Authorization": f"Bearer {CONVERT_API_SECRET}", "Content-type": "application/json"}
    )
    
    if response.status_code == 200:
        download_url = response.json()["Files"][0]["Url"]
        html_response = requests.get(download_url)
        with open(f"{INPUT_PATH}/converted_output.html", "wb") as f:
            f.write(html_response.content)
        return True
    return False    

def process_html_to_template(filename):
    # Read converted HTML
    try:
        with open(f"{INPUT_PATH}/converted_output.html", "r", encoding="utf-8") as f:
            html = f.read()
    except UnicodeDecodeError:
        with open(f"{INPUT_PATH}/converted_output.html", "r", encoding="cp1252") as f:
            html = f.read()
    
    soup = BeautifulSoup(html, "html.parser")
    original_lengths = {}
    placeholder_counter = {}

    # Known static mappings
    class_map = {
        'table-paragraph': 'body',
        'heading-1': 'heading',
        'heading-2': 'heading',
        'heading-3': 'heading',
        'body-text': 'body',
        'title': 'title',
        'list-paragraph': 'body',
        'paragraph': 'body'
    }

    # Helper function to determine placeholder type
    def get_placeholder_type(class_name):
        if class_name in class_map:
            return class_map[class_name]
        elif re.match(r'heading-\d+', class_name):
            return 'heading'
        elif 'body' in class_name:
            return 'body'
        return None

    # Process all <p> tags
    for p in soup.find_all('p'):
        if p.get('class'):
            class_name = p.get('class')[1] if len(p.get('class')) > 1 else p.get('class')[0]
            placeholder_type = get_placeholder_type(class_name)

            if placeholder_type:
                original_text = p.get_text(strip=True)

                # Create unique placeholder
                if placeholder_type not in placeholder_counter:
                    placeholder_counter[placeholder_type] = 0
                placeholder_counter[placeholder_type] += 1
                unique_id = f"{placeholder_type}{placeholder_counter[placeholder_type]}"

                # Store length
                original_lengths[unique_id] = len(original_text)

                # Remove nested <span> tags and set placeholder
                for span in p.find_all('span'):
                    span.unwrap()
                p.string = f"{{{{ {unique_id} }}}}"

    return soup, original_lengths

def generate_content(placeholders, original_lengths, topic, content, tone):
    # Calculate character limits
    limits = {}
    for placeholder in placeholders:
        if placeholder in original_lengths:
            limits[placeholder] = max(50, int(original_lengths[placeholder] * 1.2))
        else:
            # Default limits
            if placeholder.startswith('title'):
                limits[placeholder] = 60
            elif placeholder.startswith('heading'):
                limits[placeholder] = 80
            else:
                limits[placeholder] = 200
    
    prompt = f"""Generate unique newsletter content for each placeholder. Each should be distinct and cover different aspects of "{topic}" with tone "{tone}".

Character limits: {json.dumps(limits)}
Source content: {content}

Return ONLY JSON format:
{{
  "placeholder1": "content here",
  "placeholder2": "different content here"
}}

Make each section unique - no repetition."""

    client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=OPENROUTER_API_KEY, timeout=60)
    
    try:
        response = client.chat.completions.create(
            extra_headers={"HTTP-Referer": "http://localhost:5173/generator"},
            model="deepseek/deepseek-chat-v3-0324:free",
            messages=[{"role": "user", "content": prompt}]
        )
        
        text = response.choices[0].message.content
        json_start, json_end = text.find('{'), text.rfind('}') + 1
        
        if json_start != -1 and json_end != -1:
            generated = json.loads(text[json_start:json_end])
            
            # Validate length limits
            for key, val in generated.items():
                if key in limits and len(val) > limits[key]:
                    generated[key] = val[:limits[key]-3] + "..."
            
            return generated
    except Exception as e:
        print(f"Content generation error: {e}")
    
    return None

async def generate(topic, content, pdf_template, tone):
    print(OPENROUTER_API_KEY)
    print(f"Processing: {pdf_template.filename}")
    start_time = time.time()
    
    # Step 1: Convert PDF to HTML
    print("✓ PDF converted to HTML")
    
    # Step 2: Process HTML to template with placeholders
    template, original_lengths = process_html_to_template(pdf_template.filename[:-4])
    print("✓ HTML processed to template")
    
    # Step 3: Extract placeholders
    placeholders = re.findall(r'\{\{\s*(\w+\d+)\s*\}\}', str(template))
    print(f"✓ Found {len(placeholders)} placeholders")
    
    # Step 4: Generate content
    content_dict = generate_content(placeholders, original_lengths, topic, content, tone)
    if not content_dict:
        print("Content generation failed")
        return
    print("✓ Content generated")
    
    # Step 5: Replace placeholders
    html_str = str(template)
    for placeholder in placeholders:
        if placeholder in content_dict:
            html_str = html_str.replace(f"{{{{ {placeholder} }}}}", content_dict[placeholder])
    
    # Step 6: Save output
    os.makedirs(OUTPUT_PATH, exist_ok=True)
    with open(f"{OUTPUT_PATH}/generated_output.html", "w", encoding="utf-8") as f:
        f.write(BeautifulSoup(html_str, "html.parser").prettify())
    
    print(f"✓ Complete! Time: {time.time() - start_time:.2f}s")
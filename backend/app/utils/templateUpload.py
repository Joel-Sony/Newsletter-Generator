from bs4 import BeautifulSoup
import httpx
import time
import base64
from openai import OpenAI
import os
import requests
import json
from flask import current_app
from app.config import (
    OPENROUTER_API_KEY,
    CONVERT_API_SECRET,
    OUTPUT_PATH,
    INPUT_PATH,
)
import asyncio
import re

async def convert_pdf_to_html(fileBytes, filename):
    file_content = base64.b64encode(fileBytes).decode("utf-8")

    payload = {
        "Parameters": [
            {
                "Name": "File",
                "FileValue": {
                    "Name": filename,
                    "Data": file_content
                }
            },
            {
                "Name": "StoreFile",
                "Value": True
            }
        ]
    }

    headers = {
        "Authorization": f"Bearer {CONVERT_API_SECRET}",
        "Content-type": "application/json"
    }

    response = requests.post("https://v2.convertapi.com/convert/pdf/to/html", json=payload, headers=headers)

    if response.status_code == 200:
        download_url = response.json()["Files"][0]["Url"]
        html_response = requests.get(download_url)
        with open(f"{INPUT_PATH}/{filename[:-4]}.html", "wb") as f:
            f.write(html_response.content)

        return True, None
    else:
        return False, response

def combine_text(html_block, original_content_lengths):
    """
    Combine text and store original content lengths for character limits
    """
    class_to_placeholder = {
        'table-paragraph': 'body',
        'heading-1': 'heading',
        'heading-2': 'heading',
        'body-text': 'body',
        'title': 'title',
        'list-paragraph': 'body',
        'paragraph': 'body',
        'heading-3': 'heading',
    }
    
    if html_block.name == 'p':
        # Get original text content length before replacement
        original_text = html_block.get_text(strip=True)
        original_length = len(original_text)
        
        # Unwrap span tags
        for span in html_block.find_all('span'):
            span.unwrap()
        
        block_class = html_block.get('class')
        if not block_class:
            return 1
            
        # Determine which class to use
        class_index = 1 if len(block_class) > 1 else 0
        if class_index >= len(block_class):
            class_index = 0
            
        class_name = block_class[class_index]
        
        if class_name in class_to_placeholder:
            placeholder_type = class_to_placeholder[class_name]
            
            # Store original content length
            if placeholder_type not in original_content_lengths:
                original_content_lengths[placeholder_type] = []
            original_content_lengths[placeholder_type].append(original_length)
            
            # Replace with placeholder
            html_block.string = f"{{{{ {placeholder_type} }}}}"

        return 1
    else:
        for block in html_block.find_all(recursive=False):
            combine_text(block, original_content_lengths)
    return -1

def clean_raw_html(html: str):
    """
    Clean raw HTML and return both cleaned HTML and original content lengths
    """
    extracted_html = BeautifulSoup(html, "html.parser")
    original_content_lengths = {}

    # Prepare the cleaned HTML structure
    clean_html = BeautifulSoup("<html><head></head><body></body></html>", "html.parser")
    body = clean_html.body
    body.attrs = extracted_html.body.attrs

    # Find all <style> tags from the original
    style_tags = extracted_html.find_all('style')

    # Append them into the <head> of the new HTML
    new_head = clean_html.head
    for style_tag in style_tags:
        new_head.append(style_tag)

    # Loop through all page containers
    for outer in extracted_html.body.find_all("div", recursive=False):
        outer_div = clean_html.new_tag("div", **outer.attrs)

        for page in extracted_html.find_all("div", class_='page'):
            page_div = clean_html.new_tag("div", **page.attrs)

            for block in page.find_all(recursive=False):
                combine_text(block, original_content_lengths)
                page_div.append(block)

            outer_div.append(page_div)

        body.append(outer_div)

    return clean_html.prettify(), original_content_lengths

def clean_html(filename):
    html_path = os.path.join(INPUT_PATH, "converted_output.html")
    try:
        with open(html_path, "r", encoding="utf-8") as f:
            raw_html = f.read()
    except UnicodeDecodeError:
        with open(html_path, "r", encoding="cp1252") as f:
            raw_html = f.read()

    cleaned_html, original_content_lengths = clean_raw_html(raw_html)
    cleaned_file = "cleaned_output"
    cleaned_path = os.path.join(INPUT_PATH, "cleaned_output.html")

    with open(cleaned_path, "w", encoding="utf-8") as f:
        f.write(cleaned_html)

    return cleaned_file, original_content_lengths

def remove_images_and_styles(filename):
    path = os.path.join(INPUT_PATH, f"{filename}.html")   
    try:
        with open(path, "r", encoding="utf-8") as f:
            raw_html = f.read()
    except UnicodeDecodeError:
        with open(path, "r", encoding="cp1252") as f:
            raw_html = f.read()

    template = BeautifulSoup(raw_html, "html.parser")
    img_srcs = []
    for image in template.body.find_all("img"):
        img_srcs.append(image.get('src'))
        image['src'] = ''

    all_styles = []

    for tag in template.body.find_all():
        all_styles.append(tag.get("style"))
    
    return template, img_srcs, all_styles

def extract_placeholders_with_limits(template, original_content_lengths):
    """Extract all unique placeholders from the HTML template with character limits"""
    html_string = str(template)
    
    # Find all placeholders in the format {{ placeholder_type }}
    placeholder_pattern = r'\{\{\s*(\w+)\s*\}\}'
    placeholders = re.findall(placeholder_pattern, html_string)
    
    # Create a dictionary with indexed placeholders and their character limits
    placeholder_dict = {}
    placeholder_limits = {}
    placeholder_counts = {}
    
    for placeholder in placeholders:
        if placeholder not in placeholder_counts:
            placeholder_counts[placeholder] = 0
        else:
            placeholder_counts[placeholder] += 1
        
        # Create unique key for each placeholder instance
        key = f"{placeholder}{placeholder_counts[placeholder] + 1}"
        placeholder_dict[key] = f"{{{{ {placeholder} }}}}"
        
        # Calculate character limit based on original content
        if placeholder in original_content_lengths:
            content_lengths = original_content_lengths[placeholder]
            index = placeholder_counts[placeholder]
            
            if index < len(content_lengths):
                # Use original length, with some buffer (add 20% or minimum 50 chars)
                original_length = content_lengths[index]
                char_limit = max(50, int(original_length * 1.2))
            else:
                # Default limit if no original content found
                char_limit = 150 if placeholder == 'body' else (80 if placeholder == 'heading' else 100)
        else:
            # Default limits based on placeholder type
            if placeholder == 'title':
                char_limit = 60
            elif placeholder == 'heading':
                char_limit = 80
            elif placeholder == 'body':
                char_limit = 200
            else:
                char_limit = 100
                
        placeholder_limits[key] = char_limit
    
    return placeholder_dict, placeholder_limits

def build_prompt(topic: str, content: str = "", tone: str = "informative") -> str:
    prompt = f"""You are a professional newsletter writer. Write a compelling, well-structured internal company newsletter article based on the following input.
Tone: {tone}
Topic: {topic}
Source Material:
{content if content else "(No source material provided. Write based solely on the topic.)"}
Ensure the content is original, factually accurate, and engaging. Add examples or anecdotes if relevant. Avoid fluff. Focus on delivering value to employees reading the newsletter."""
    
    return prompt

def get_content_for_placeholders(placeholders_dict, placeholder_limits, topic, content, tone):
    """Generate content for each placeholder using LLM with character limits"""
    
    base_prompt = build_prompt(topic, content, tone)
    
    prompt = f"""
{base_prompt}

You are generating placeholder content for an HTML template. Each placeholder key must be filled with concise, meaningful content that fits within the specified character limit.

The following JSON shows the character limits for each placeholder:
{json.dumps(placeholder_limits, indent=2)}

IMPORTANT: Do not exceed the character limits. The content should be relevant to the topic "{topic}" and follow the tone "{tone}".

Please return ONLY a JSON dictionary with the same keys, where each value is the generated content:

Example format:
{{
  "heading1": "Your title here under the limit",
  "body1": "Longer paragraph content that fits within the character limit...",
  "body2": "Another body paragraph, concise and relevant..."
}}
"""

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
        timeout=60
    )

    try:
        llm_output = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "http://localhost:5173/generator"
            },
            model="deepseek/deepseek-chat-v3-0324:free",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        response_text = llm_output.choices[0].message.content
        print("LLM Response:", response_text)
        
        # Extract JSON from the response
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        
        if json_start != -1 and json_end != -1:
            json_content = response_text[json_start:json_end]
            return json.loads(json_content)
        else:
            print("Error: Could not find valid JSON in LLM response")
            return None

    except httpx.HTTPStatusError as e:
        print("HTTP error:", e.response.status_code)
        print(e.response.text)
        return None
    except json.JSONDecodeError as e:
        print("JSON decode error:", str(e))
        print("LLM Response:", response_text)
        return None
    except Exception as e:
        print("Other error:", str(e))
        return None

def replace_placeholders_in_template(template, placeholders_dict, content_dict):
    """Replace placeholders in the template with generated content"""
    html_string = str(template)
    
    # Replace each placeholder with its corresponding content
    for key, placeholder in placeholders_dict.items():
        if key in content_dict:
            html_string = html_string.replace(placeholder, content_dict[key])
        else:
            print(f"Warning: No content found for placeholder key: {key}")
    
    return BeautifulSoup(html_string, "html.parser")

def add_images_and_styles_back(template, img_srcs, all_styles):
    """Add back the images and styles that were removed earlier"""
    count = 0
    for image in template.body.find_all("img"):
        if count < len(img_srcs):
            image['src'] = img_srcs[count]
            count += 1

    count = 0
    for tag in template.body.find_all():
        if count < len(all_styles) and all_styles[count]:
            tag['style'] = all_styles[count]
        count += 1
    
    return template

def write_output(template):
    """Save the final HTML to output file"""
    os.makedirs(OUTPUT_PATH, exist_ok=True)
    with open(os.path.join(OUTPUT_PATH, "generated_output.html"), "w", encoding="utf-8") as f:
        print("Writing file")
        f.write(template.prettify())

async def generate(topic, content, pdf_template, tone):
    print("Inside generate")
    await asyncio.sleep(1)
    print("Received topic:", topic)
    print("Received content:", content)
    print("Received tone:", tone if tone else "None")
    
    pdf_bytes = pdf_template.read()
    file_name = f"{pdf_template.filename[:-4]}"

    print("STARTING WITH", pdf_template.filename)
    
    await asyncio.sleep(1)
    beg = time.time()
    
    # Step 1: Convert PDF to HTML
    data = await convert_pdf_to_html(pdf_bytes, pdf_template.filename)
    if not data: return
    
    print("Step One: Converted pdf to html")
    await asyncio.sleep(1)

    # Step 2: Clean HTML and create template (now returns original content lengths)
    cleaned_file, original_content_lengths = clean_html(file_name)
    print("Step Two: Converted html to template")
    print("Original content lengths:", original_content_lengths)
    await asyncio.sleep(1)
    
    # Step 3: Remove images and styles for processing
    template, img_srcs, all_styles = remove_images_and_styles(cleaned_file)
    print("Step Three: Preprocessed template for prompting")
    await asyncio.sleep(1)

    # Step 4: Extract placeholders from template with character limits
    placeholders_dict, placeholder_limits = extract_placeholders_with_limits(template, original_content_lengths)
    print(f"Step Four: Extracted {len(placeholders_dict)} placeholders")
    print("Placeholders found:", list(placeholders_dict.keys()))
    print("Character limits:", placeholder_limits)
    await asyncio.sleep(1)
    
    # Step 5: Generate content for placeholders with limits
    content_dict = get_content_for_placeholders(placeholders_dict, placeholder_limits, topic, content, tone)
    print("Generated content:", content_dict)
    if not content_dict:
        print("Error: Failed to generate content")
        return
    
    print("Step Five: Generated content for placeholders")
    await asyncio.sleep(1)
    
    # Step 6: Replace placeholders with generated content
    filled_template = replace_placeholders_in_template(template, placeholders_dict, content_dict)
    print("Step Six: Replaced placeholders with content")
    await asyncio.sleep(1)

    # Step 7: Add back images and styles
    final_template = add_images_and_styles_back(filled_template, img_srcs, all_styles)
    print("Step Seven: Re-added removed images and styles")
    await asyncio.sleep(1)

    # Step 8: Write output
    write_output(final_template)
    print("Step Eight: Created Output File")
    
    end = time.time()
    print(f"Total processing time: {end - beg:.2f} seconds")
    return
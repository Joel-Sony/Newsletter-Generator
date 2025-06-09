from bs4 import BeautifulSoup
import httpx
import time
import base64
from openai import OpenAI
import os
import requests
from flask import current_app
from app.config import (
    OPENROUTER_API_KEY,
    CONVERT_API_SECRET,
    OUTPUT_PATH,
    INPUT_PATH,
)
import asyncio

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
    

def combine_text(html_block):
    class_to_placeholder = {
        'table-paragraph': '{{ body }}',
        'heading-1': '{{ heading }}',
        'heading-2': '{{ heading }}',
        'body-text': '{{ body }}',
        'title': '{{ title }}',
        'heading-3': '{{ heading }}',
        'list-paragraph': '{{ body }}',
        'paragraph': '{{ body }}'
        }
    if html_block.name == 'p':
        for span in html_block.find_all('span'):
            span.unwrap()
        
        block_class = html_block.get('class')
        ind = 1
        if len(block_class) == 1:
            ind = 0

        html_block.string = class_to_placeholder[html_block.get('class')[ind]]

        return 1
    else:
        for block in html_block.find_all(recursive = False):
            combine_text(block)
    return -1

def clean_raw_html(html: str) -> str:
    extracted_html = BeautifulSoup(html, "html.parser")

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

              combine_text(block)
              page_div.append(block)

          outer_div.append(page_div)

      body.append(outer_div)

    return clean_html.prettify()


def clean_html(filename):
    html_path = os.path.join(INPUT_PATH, "converted_output.html")
    try:
        with open(html_path, "r", encoding="utf-8") as f:
            raw_html = f.read()
    except UnicodeDecodeError:
        with open(html_path, "r", encoding="cp1252") as f:
            raw_html = f.read()

    cleaned_html = clean_raw_html(raw_html)
    cleaned_file = "cleaned_output"
    cleaned_path = os.path.join(INPUT_PATH, "cleaned_output.html")

    with open(cleaned_path, "w", encoding="utf-8") as f:
        f.write(cleaned_html)

    return cleaned_file


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

def build_prompt(
    topic: str,
    content: str = "",
    tone: str = "informative",
    ) -> str:
    prompt = f"""You are a professional newsletter writer. Write a compelling, well-structured internal company newsletter article based on the following input.
Tone: {tone}
Topic: {topic}
Source Material:
{content if content else "(No source material provided. Write based solely on the topic.)"}
Ensure the content is original, factually accurate, and engaging. Add examples or anecdotes if relevant. Avoid fluff. Focus on delivering value to employees reading the newsletter."""
    
    return prompt


def get_content(template, formalised_content):
    
    prompt = f"""
You are a professional HTML editor and newsletter copywriter. Your task is to replace placeholder tokens in an HTML template with relevant newsletter content.

The placeholders in the HTML template are:
- {{title}} → for the newsletter's main title
- {{heading}} → for section headings
- {{body}} → for paragraph content

Your job:
1. Replace only the placeholder text (e.g., {{ title }}, {{ heading }}, {{ body }}) with well-written, contextually appropriate content based on the newsletter provided.
2. DO NOT change, remove, or add any HTML tags, inline styles, or structural attributes.
3. DO NOT add extra paragraphs, headings, or sections.
4. DO NOT reformat or beautify the HTML — preserve its structure as-is.
5, FILL the placeholder parts with content related to {formalised_content}
HTML Template with Placeholders:
{str(template.body)}
"""
    client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
    timeout = 60
    )

    try:
        llm_output = client.chat.completions.create(
           extra_headers = {
                "HTTP-Referer": "http://localhost:5173/generator"
            },
            model="deepseek/deepseek-chat-v3-0324:free",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

    except httpx.HTTPStatusError as e:
        print("HTTP error:", e.response.status_code)
        print(e.response.text)  # See the raw response
    except Exception as e:
        print("Other error:", str(e))
    return llm_output.choices[0].message.content


def check_output(llm_output, num_tags):
    start = llm_output.find("<body")
    end = llm_output.find("</body>")

    if not (start > -1 and end > -1):
        print("Error: Body tag not found")
        return False

    output_template = BeautifulSoup(llm_output[start:end+7], "html.parser").body

    count = 0
    for tag in output_template.find_all():
        count += 1
    if num_tags != count:
        print(f"Error: Number of tags mismatch (actual = {num_tags}, llm-output = {count})")
        return False
    
    return True
    

def add_images_and_styles_with_content(template, llm_output, img_srcs, all_styles):
   
    start = llm_output.find('<body')
    end = llm_output.find('</body>') + len('</body>')

    new_body = BeautifulSoup(llm_output[start:end], "html.parser").body

    template.body.replace_with(new_body)

    count = 0
    for image in template.body.find_all("img"):
        image['src'] = img_srcs[count]
        count+=1

    count = 0
    for tag in template.body.find_all():
        tag['style'] = all_styles[count]
        count+=1

    
    return template

# Save modified HTML to a new file
def write_output(template):
    os.makedirs(OUTPUT_PATH, exist_ok=True)
    with open(os.path.join(OUTPUT_PATH, "generated_output.html"), "w", encoding="utf-8") as f:
        print("Writing file")
        f.write(template.prettify())


async def generate(topic,content,pdf_template,tone):
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
        data = await convert_pdf_to_html(pdf_bytes, pdf_template.filename)
        if not data:
    
            return

        
        print("Step One: Converted pdf to html")
        await asyncio.sleep(1)

         
        cleaned_file = clean_html(file_name)
        print("Step Two: Converted html to template")
        
        await asyncio.sleep(1)
        
         
        template, img_srcs, all_styles = remove_images_and_styles(cleaned_file)
        print("Step Three: Preprocessed template for prompting")
       
        await asyncio.sleep(1)

         
        final_prompt = build_prompt(topic, content, tone)
        print("Step Four: Built prompt from from inputs")
        
        await asyncio.sleep(1)
        # attempts = 0
        # llm_output = None
        # while attempts < 3:
        #     llm_output = get_content(template, final_prompt)

        #     if check_output(llm_output, len(all_styles)):
        #         print("Step Five: Recieved content from llm")
                
        #         await asyncio.sleep(1)
        #         break
        #     else:
        #         attempts += 1
        #         if attempts < 3:
        #             print("Step Five: Improper Output, Trying Again...")
                    
        #             await asyncio.sleep(1)

        # if attempts == 3:
            
        #     await asyncio.sleep(1)
        
        #     await asyncio.sleep(1)
        #     return

        # else:
        #     template = add_images_and_styles_with_content(
        #         template, llm_output, img_srcs, all_styles
        #     )
        #     print("Step Six: Readded removed images and styles")
            
        #     await asyncio.sleep(1)

        #     write_output(template)

        #     print("Step Seven: Created Output File")
        
        #     await asyncio.sleep(1)
            
        #     await asyncio.sleep(1)
        #     return

         
        llm_output = get_content(template, final_prompt)
        
        
         
        template = add_images_and_styles_with_content(
                template, llm_output, img_srcs, all_styles
        )
        
        print("Step Six: Re-added removed images and styles")
        await asyncio.sleep(1)

        write_output(template)

        print("Step Seven: Created Output File")
        return


        
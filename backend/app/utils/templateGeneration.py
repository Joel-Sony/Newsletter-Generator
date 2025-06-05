from openai import OpenAI
import os
import re
from app.config import OPENROUTER_API_KEY
import time
from bs4 import BeautifulSoup

def clean_html_string(html_string):
    if html_string.startswith("```html"):
        html_string = html_string[7:]  # Remove ```html
    elif html_string.startswith("```"):
        html_string = html_string[3:]  # Remove ```

    if html_string.endswith("```"):
        html_string = html_string[:-3]  # Remove trailing ```
    
    return html_string.strip()

def isHTML(text):
    lower = text.lower()
    return "<style>" in lower and "</style>" in lower


def no_template_generation(user_prompt, pathToSaveHtml,tone, topic):
  pro_prompt = f"""You are an expert copywriter and HTML email designer. First, take the user's raw prompt that contains newsletter content (such as company information, announcements, goals, etc.) and rewrite it in a more professional, polished, and newsletter-appropriate tone. Maintain the original intent, meaning, and key points, but enhance clarity, tone, and grammar to match corporate or marketing communication standards. Do not remove any meaningful user-provided information—only reword it to sound better.
User prompt is: {user_prompt}. Topic is {topic} RETURN ONLY THE UPDATED PROMPT. DO NOT SAY ANYTHING ELSE. """

  client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
  )

  polish_response = client.chat.completions.create(
    model="meta-llama/llama-3.3-8b-instruct:free",
    messages=[
      {
        "role": "user",
        "content": pro_prompt
      }
    ]
  )

  polished_prompt = polish_response.choices[0].message.content 
  print("Polished prompt: ",polished_prompt)
  html_string = ""
  while(not isHTML(html_string)):
    print(tone)
    generate_template=f"""Create a Professional HTML Newsletter Template
Design a responsive newsletter layout (790px x 1250px) with embedded CSS styling. Requirements:
Select one random layout: hero-first, card-style, stacked-content, column-grid, sidebar-left, or sidebar-right
Company branding: logo and name (top-left or centered)
Navigation with 3-5 menu items
Hero section: headline, subtitle, call-to-action button
Alternating image-text content blocks
Inspirational quote or announcement section
Optional sidebar (if layout requires)
Footer with social icons and legal text
Generate cohesive color scheme and font pairing (serif/sans-serif mix)
Clean, professional appearance with consistent spacing
Mobile-responsive design
GrapesJS editor compatibility (no floating/overlapping elements)
Div-based layout structure (no tables)
Placeholder images from via.placeholder.com
Single <style> tag with embedded CSS
No <html>, <head>, or <body> wrapper tags
No placeholder text (Lorem Ipsum) - use meaningful content or leave empty
Include user-provided content: {polished_prompt} in specified tone: {tone}
Output: Clean HTML code only, no explanations or comments.
"""
    
    html_response = client.chat.completions.create(
      model="deepseek/deepseek-chat-v3-0324:free",
      # model="tngtech/deepseek-r1t-chimera:free",
      # model="deepseek/deepseek-r1:free",
      messages=[
        {
          "role": "user",
          "content": generate_template
        }
      ]
    )

    if not os.path.exists(pathToSaveHtml): os.mkdir(pathToSaveHtml)
    html_string = html_response.choices[0].message.content
    html_string = clean_html_string(html_string)
  
  
  with open(f"{pathToSaveHtml}/generated_output.html", "w") as f:
    f.write(html_string)


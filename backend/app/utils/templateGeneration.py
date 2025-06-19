from openai import OpenAI
import os
import re
from app.config import GOOGLE_STUDIO_API_KEY
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
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    api_key=GOOGLE_STUDIO_API_KEY,
  )

  polish_response = client.chat.completions.create(
     extra_headers={
        "HTTP-Referer": "http://localhost:5173/generator", # Optional. Site URL for rankings on openrouter.ai.
    },
    model="gemini-2.5-flash",
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
    generate_template=f""""Generate a complete HTML code snippet for a professional newsletter template, rigidly fixed at 790px width and 1250px height. All elements must be absolutely positioned using CSS position: absolute; and top, left, width, height properties for GrapesJS compatibility, ensuring no floating or overlapping. Randomly select one layout from hero-first, card-style, stacked-content, column-grid, sidebar-left, or sidebar-right. Include absolutely positioned company branding (logo from https://via.placeholder.com/100x50?text=Logo and name), 3-5 navigation items, a hero section (headline, subtitle, CTA button), alternating image-text content blocks (images from https://via.placeholder.com/200x150?text=Image), an inspirational quote/announcement section, an optional sidebar (if the layout requires), and a footer with social icons and legal text, all with consistent padding and spacing. Generate a cohesive color scheme and a serif/sans-serif font pairing. Implement mobile responsiveness by adjusting the absolute positioning and dimensions of internal elements via @media queries for smaller viewports, while the main container remains fixed. Do not use Lorem Ipsum, but use meaningful content or leave empty, incorporating {polished_prompt} in a {tone}. Embed all CSS within a single <style> tag, and output only the clean HTML code."""
    
    html_response = client.chat.completions.create(
      extra_headers={
        "HTTP-Referer": "http://localhost:5173/generator", # Optional. Site URL for rankings on openrouter.ai.
      },
      model="gemini-2.5-flash",
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


from openai import OpenAI
import os
import re
from app.config import OPENROUTER_API_KEY


def no_template_generation(user_prompt, pathToSaveHtml):
  pro_prompt = f"""You are an expert copywriter and HTML email designer. First, take the user's raw prompt that contains newsletter content (such as company information, announcements, goals, etc.) and rewrite it in a more professional, polished, and newsletter-appropriate tone. Maintain the original intent, meaning, and key points, but enhance clarity, tone, and grammar to match corporate or marketing communication standards. Do not remove any meaningful user-provided information—only reword it to sound better.
User prompt is: {user_prompt} RETURN ONLY THE UPDATED PROMPT. DO NOT SAY ANYTHING ELSE. """

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
  generate_template=f"""Generate a visually appealing, responsive HTML newsletter layout approximately 790px wide and 1250px tall, using a professional design 
  with clear structure and consistent spacing. Randomly choose one layout style from: hero-first, card-style, stacked-content, column-grid, sidebar-left, or 
  sidebar-right. Include the following: a company logo and name (top-left or centered), a navigation bar with 3-5 links, a hero section with heading, subtitle, 
  and CTA button, alternating image-text blocks, a motivational quote or announcement, an optional sidebar (left, right, or omitted), and a footer with social 
  media icons and legal text. Use a randomized but cohesive color scheme and font pairing (serif/sans-serif). Apply a single <style> tag at the top, no <html>, 
  <head>, or <body> tags. Ensure layout is clean, well-aligned, and compatible with GrapesJS editor — avoid floating or overlapping elements. Use div-based 
  layout (not table-based) and insert placeholder images from https://via.placeholder.com/ and dummy text where content is missing. Incorporate and display 
  his user-provided content where appropriate: {polished_prompt}. Output only the clean HTML, with embedded CSS in a single <style> tag, no explanations or c
  omments."""
  
  html_response = client.chat.completions.create(
    model="deepseek/deepseek-chat-v3-0324:free",
    messages=[
      {
        "role": "user",
        "content": generate_template
      }
    ]
  )

  if not os.path.exists(pathToSaveHtml): os.mkdir(pathToSaveHtml)
  with open(f"{pathToSaveHtml}/generated_output.html", "w") as f:
    f.write(html_response.choices[0].message.content)



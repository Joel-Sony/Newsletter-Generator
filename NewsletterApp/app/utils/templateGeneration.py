from openai import OpenAI
import os
import re
from app.config import OPENROUTER_API_KEY


def no_template_generation(user_prompt):
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
  generate_template=f"""Generate a fully responsive and visually appealing HTML newsletter template approximately 790px wide and 1250px tall, using a balanced, professional layout with clear visual hierarchy and consistent spacing. Randomly choose one layout archetype from: hero-first, column-grid, card-style, sidebar-left, sidebar-right, or stacked-content. The layout must include a company logo and name (top-left or centered), a navigation bar with 3 to 5 links, a hero section with a large heading, subtitle, and call-to-action button, alternating image and text blocks, a motivational quote or announcement section, an optional sidebar (left, right, or omitted), and a footer with social media icons and legal/disclaimer text. Use a randomized yet cohesive color palette and a consistent font style (modern serif or sans-serif). Ensure all design elements follow strict rules: use table-based layout for email client compatibility, maintain uniform padding, margin, and alignment, use appropriate text/background contrast, and avoid floating, overlapping, or misaligned elements. Include all CSS within a single <style> tag in the <head>, and use placeholder images from https://via.placeholder.com/ along with filler text where needed. Insert and integrate the following user-provided content naturally into the appropriate sections of the layout: 
  {polished_prompt}. Output only the complete, production-ready HTML file with no explanations, comments, or markdown."""

  html_response = client.chat.completions.create(
    model="deepseek/deepseek-chat-v3-0324:free",
    messages=[
      {
        "role": "user",
        "content": generate_template
      }
    ]
  )

  if not os.path.exists("./generatedHTMLs"): os.mkdir("./generatedHTMLs")
  with open("./generatedHTMLs/generated_output.html","w") as f:
    f.write(html_response.choices[0].message.content)


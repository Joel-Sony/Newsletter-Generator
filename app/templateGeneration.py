from openai import OpenAI
from dotenv import load_dotenv
import os
import re

load_dotenv()

def no_template_generation(user_prompt):
  pro_prompt = f"""You are an expert copywriter and HTML email designer. First, take the user's raw prompt that contains newsletter content (such as company information, announcements, goals, etc.) and rewrite it in a more professional, polished, and newsletter-appropriate tone. Maintain the original intent, meaning, and key points, but enhance clarity, tone, and grammar to match corporate or marketing communication standards. Do not remove any meaningful user-provided information—only reword it to sound better.
  User prompt is: {user_prompt}"""

  client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY_2"),
  )

  polish_response = client.chat.completions.create(
    model="deepseek/deepseek-chat-v3-0324:free",
    messages=[
      {
        "role": "user",
        "content": pro_prompt
      }
    ]
  )
  polished_prompt = polish_response.choices[0].message.content 

  generate_template=f"""Generate a fully responsive and visually appealing HTML newsletter template that is approximately 790px wide and 1250px tall. Follow structured and balanced layout principles, using a clear visual hierarchy and consistent spacing. Randomize the design by selecting from several layout archetypes (e.g., hero-first, column-grid, card-style, sidebar-left, sidebar-right, stacked-content), but always preserve alignment, symmetry, and clarity to ensure the design is professional and clean.
The layout should include the following common newsletter elements:
- Company logo and name (top-left or center)
- Navigation bar with 3-5 links
- Hero section with a large heading, subtitle, and CTA button
- Image and text blocks (e.g., alternating left/right)
- A motivational quote block or announcement
- Optional sidebar (placed left, right, or omitted)
- Footer with social media icons and legal/disclaimer text
Design Rules:
- Use randomized but cohesive color schemes and font styles (serif/sans-serif, modern/minimal)
- Avoid overlapping or floating elements unless clearly structured
- Ensure section padding/margin and text alignment are uniform and readable
- Backgrounds should contrast with text appropriately
- Never generate floating boxes or misaligned sections
- Keep layout email-client compatible (use tables where needed)
Use only a single `<style>` tag for CSS (no inline styles or external stylesheets). Use placeholder images from https://via.placeholder.com/ and dummy text where content is missing.
Maximize your output tokens to generate only the full, production-ready HTML content — do not include any commentary or explanation. Each generated template should look visually distinct while maintaining layout consistency, readability, and professional design.
Users prompt is: {polished_prompt}
ONLY OUTPUT THE RAW HTML CODE. NO EXPLANATION. NO MARKDOWN. NO HEADERS. JUST HTML.
"""


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


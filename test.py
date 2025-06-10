# import asyncio
# from playwright.async_api import async_playwright
# import os

# HTML_PATH = "/home/joel/Documents/Newsletter-Generator/htmls"
# THUMBNAIL_PATH = "/home/joel/Documents/Newsletter-Generator/thumbnails"

# async def generate_single_thumbnail(page, html_path, image_path):
#     file_url = f"file://{os.path.abspath(html_path)}"
#     await page.goto(file_url)
#     await page.screenshot(path=image_path)

# async def generate_all_thumbnails(width=800, height=600):
#     async with async_playwright() as p:
#         browser = await p.chromium.launch()
#         page = await browser.new_page(viewport={"width": width, "height": height})

#         for filename in os.listdir(HTML_PATH):
#             if filename.endswith(".html"):
#                 html_path = os.path.join(HTML_PATH, filename)
#                 image_path = os.path.join(THUMBNAIL_PATH, filename.replace(".html", ".png"))

#                 print(f"Generating thumbnail for: {filename}")
#                 await generate_single_thumbnail(page, html_path, image_path)

#         await browser.close()

# # Run the async function
# asyncio.run(generate_all_thumbnails())

import os
print(os.getenv("OPENROUTER_API_KEY"))

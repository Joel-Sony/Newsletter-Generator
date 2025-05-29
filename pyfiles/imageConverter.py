from bs4 import BeautifulSoup
import base64

with open("/home/joel/Documents/Newsletter-Generator/pdfs/html/Christmas.html", "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f, "html.parser")

base64_images = [
    img['src'] for img in soup.find_all('img')
    if img.get('src', '').startswith('data:image/')
]

print(base64_images)
# Python

for i, data_url in enumerate(base64_images):
    # Split metadata and content
    header, base64_data = data_url.split(',', 1)
    
    # Get file extension from the MIME type
    mime_type = header.split(';')[0].split(':')[1]  # e.g., image/png
    ext = mime_type.split('/')[1]  # 'png', 'jpeg', etc.

    # Decode and write to file
    with open(f"/home/joel/Documents/Newsletter-Generator/extractedImages/image_{i}.{ext}", "wb") as f:
        f.write(base64.b64decode(base64_data))

print(f"Extracted {len(base64_images)} images.")
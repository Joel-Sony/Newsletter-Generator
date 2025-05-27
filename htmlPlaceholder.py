from bs4 import BeautifulSoup

# Load the HTML file
with open("./pdfs/html/College.html", "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "lxml")

# Example: Replace <span class="ocr_text">...</span> with placeholders
counter = 1
for span in soup.find_all("span"):
    if span.text.strip():  # If it has actual text
        placeholder = f"{{{{ field_{counter} }}}}"
        span.string = placeholder
        counter += 1

# Write modified HTML to a new file
with open("template.html", "w", encoding="utf-8") as f:
    f.write(str(soup))

from bs4 import BeautifulSoup
import json
import re

# Load your HTML file
with open("./pdfs/html/school.html", "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")

# Counter for unique Jinja variable names
placeholder_index = 0
placeholder_map = {}

# Find all divs with class 'c' (which represent blocks of text)
for div in soup.find_all("div", class_="c"):
    text_block = ""
    font_families = set()
    
    # Get all the nested divs with class 't' inside this block
    for text_div in div.find_all("div", class_="t"):
        text_block += text_div.get_text(strip=True) + " "
        
        # Extract font-family class (e.g., ff0, ff1, etc.)
        for cls in text_div.get("class", []):
            if re.match(r"ff\d+", cls):
                font_families.add(cls)
    
    if text_block.strip():
        # Generate a Jinja2 placeholder
        var_name = f"placeholder_{placeholder_index}"
        placeholder = f"{{{{ {var_name} }}}}"
        
        # Replace the entire block with the placeholder
        div.string = placeholder
        
        # Store original text, length, and font families
        placeholder_map[var_name] = {
            "text": text_block.strip(),
            "length": len(text_block.strip()),
            "font_families": list(font_families)
        }
        
        placeholder_index += 1

# Save the updated HTML with placeholders
with open("templated.html", "w", encoding="utf-8") as f:
    f.write(str(soup))

# Save the placeholder map (text, length, font families)
with open("placeholder_map.json", "w", encoding="utf-8") as f:
    json.dump(placeholder_map, f, indent=2)

print("Text blocks replaced with Jinja placeholders and saved.")

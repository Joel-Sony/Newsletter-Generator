from bs4 import BeautifulSoup
import json

# Load your HTML file
with open("./pdfs/html/school.html", "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")

# Counter for unique Jinja variable names
placeholder_index = 0
placeholder_map = {}

# Find all divs with class 'c' (which re present blocks of text)
for div in soup.find_all("div", class_="c"):
    text_block = ""
    
    # Get all the nested divs with class 't' inside this block
    for text_div in div.find_all("div", class_="t"):
        text_block += text_div.get_text(strip=True) + " "
    
    # If there is any text in the block (not empty)
    if text_block.strip():
        # Generate a Jinja2 placeholder
        var_name = f"placeholder_{placeholder_index}"
        placeholder = f"{{{{ {var_name} }}}}"
        
        # Replace the entire block with the placeholder
        div.string = placeholder
        
        # Store the original text and the length of the text block
        placeholder_map[var_name] = {
            "text": text_block.strip(),
            "length": len(text_block.strip())
        }
        
        placeholder_index += 1
    else:
        # If the block has no text, continue (skip it)
        continue

# Save the updated HTML with placeholders
with open("templated.html", "w", encoding="utf-8") as f:
    f.write(str(soup))
    # print(soup)

# Save the placeholder map (text and length) for reference or debugging
with open("placeholder_map.json", "w", encoding="utf-8") as f:
    json.dump(placeholder_map, f, indent=2)

print("Text blocks replaced with Jinja placeholders and saved.")

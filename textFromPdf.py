import fitz  

# Load the PDF
doc = fitz.open("./pdfs/Architecture newsletter.pdf")

# Iterate over pages
for page_num, page in enumerate(doc):
    text = page.get_text()
    print(f"--- Page {page_num + 1} ---")
    print(text)

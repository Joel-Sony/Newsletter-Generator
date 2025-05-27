import subprocess
import os
from time import perf_counter

start = perf_counter()

def convert_pdf_to_html(pdf_path, output_path=None):
    if output_path is None:
        output_path = os.path.splitext(pdf_path)[0] + ".html"

    try:
        subprocess.run(
            ["pdf2htmlEX", pdf_path, output_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print(f"[+] Converted: {pdf_path} → {output_path}")
        return output_path
    except subprocess.CalledProcessError as e:
        print("[!] Conversion failed.")
        print(e.stderr.decode())
        return None

html_file = convert_pdf_to_html("./pdfs/Christmas.pdf")

end = perf_counter()
print(f"Time: {end - start:.4f} seconds")

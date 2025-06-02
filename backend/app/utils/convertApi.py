import base64
import requests
import os
from app.config import CONVERT_API_SECRET



def convert_pdf_to_html(file):
    file_content = base64.b64encode(file.read()).decode("utf-8")
    
    payload = {
        "Parameters": [
            {
                "Name": "File",
                "FileValue": {
                    "Name": file.filename,
                    "Data": file_content
                }
            },
            {
                "Name": "StoreFile",
                "Value": True
            }
        ]
    }

    headers = {
        "Authorization": f"Bearer {CONVERT_API_SECRET}",
        "Content-type": "application/json"
    }

    response = requests.post("https://v2.convertapi.com/convert/pdf/to/html", json=payload, headers=headers)

    if response.status_code == 200:
        download_url = response.json()["Files"][0]["Url"]
        html_response = requests.get(download_url)

        os.makedirs("convertedHTMLs", exist_ok=True)
        with open("convertedHTMLs/converted_output.html", "wb") as f:
            f.write(html_response.content)

        return True, None
    else:
        return False, f"{response.status_code}\n{response.text}"

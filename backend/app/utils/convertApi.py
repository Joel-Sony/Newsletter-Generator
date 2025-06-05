import base64
import requests
import os
from app.config import CONVERT_API_SECRET,INPUT_PATH



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

        with open(f"{INPUT_PATH}/converted_output.html", "wb") as f:
            f.write(html_response.content)

        return True, None
    else:
        return False, f"{response.status_code}\n{response.text}"


def convert_html_to_pdf(file_path, output_dir='uploads/converted_pdfs'):
    # Read the HTML file and encode it in base64
    with open(file_path, 'rb') as f:
        file_data = f.read()
        base64_file = base64.b64encode(file_data).decode('utf-8')

    # Set up the API request
    url = "https://v2.convertapi.com/convert/htm/to/pdf"
    headers = {
        "Authorization": f"Bearer {CONVERT_API_SECRET}",  # Replace with your actual token
        "Content-Type": "application/json"
    }

    # Prepare the parameters for the ConvertAPI request
    payload = {
        "Parameters": [
            {
                "Name": "File",
                "FileValue": {
                    "Name": os.path.basename(file_path),
                    "Data": base64_file
                }
            },
            {
                "Name": "StoreFile",
                "Value": True
            },
            {
                "Name":"PageSize",
                "Value":"A4"
            }
        ]
    }

    # Send the request to ConvertAPI
    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 200:
        data = response.json()
        # Extract the URL of the generated PDF
        pdf_url = data["Files"][0]["Url"]
        pdf_data = requests.get(pdf_url).content

        # Create the output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Save the PDF to a file locally
        output_file_path = os.path.join(output_dir, f"{os.path.splitext(os.path.basename(file_path))[0]}.pdf")
        with open(output_file_path, 'wb') as pdf_file:
            pdf_file.write(pdf_data)

        return output_file_path
    else:
        raise Exception(f"Failed to convert HTML to PDF: {response.text}")
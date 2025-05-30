from flask import Flask,render_template,request
import requests
import base64
import os
from templateGeneration import no_template_generation

CONVERT_API_SECRET = "secret_aa7w0PjBx034zQ9h"

app = Flask(__name__, template_folder = "templates" )

@app.route('/',methods = ["GET", "POST"])
def index():
    if(request.method == "POST" and request.files.get("pdf_file")):
        file = request.files.get("pdf_file")
        file_content = base64.b64encode(file.read()).decode("utf-8")
        
        payload={
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
            "Authorization":f"Bearer {CONVERT_API_SECRET}",
            "Content-type":"application/json"
        }

        response = requests.post("https://v2.convertapi.com/convert/pdf/to/html", json = payload, headers = headers)
        print("IM HERE")
        if response.status_code == 200:
            download_url = response.json()["Files"][0]["Url"]
            html_response = requests.get(download_url)

            if not os.path.exists("convertedHTMLs"):
                os.mkdir("convertedHTMLs")
            with open("./convertedHTMLs/converted_output.html","wb") as f:
                f.write(html_response.content)
        else:
            return f"Error: {response.status_code}\n{response.text}"
    elif(request.method == "POST" and not request.files.get("pdf_file") ):
        user_prompt = request.form.get("user_prompt")
        no_template_generation(user_prompt)
        return "<h1>HTML created and saved in generatedHTMLS!</h1>"
    elif(request.method == "GET"):
        return render_template("./index.html")
        

if __name__ == "__main__":  
    app.run(debug = True)
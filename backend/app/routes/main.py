from flask import (
    Blueprint,
    request,
    render_template,
    send_from_directory,
    redirect,
    jsonify,
    current_app
)
import os
import traceback
import time
from werkzeug.utils import secure_filename
from PIL import Image
import base64
from io import BytesIO
from app.utils.convertApi import convert_pdf_to_html, convert_html_to_pdf
from app.utils.templateGeneration import (
    no_template_generation,
)
from app.utils.transformText import transformText
from app.utils.imageGeneration import generate_image
from app.utils.templateUpload import (
    generate,
)
from app.config import OUTPUT_PATH


main_bp = Blueprint(
    "main",
    __name__,
    template_folder="/home/joel/Documents/Newsletter-Generator/backend/app/templates",
)


@main_bp.route("/", methods=["GET", "POST"])
async def index():
    if request.method == "POST" and request.files.get("pdf_file"):
        tone = request.form.get("tone", "Professional")
        tone = "Professional"
        topic = request.form.get("topic")
        file = request.files.get("pdf_file")
        success, error_msg = convert_pdf_to_html(file)
        user_prompt = request.form.get("user_prompt")
        if success:
            await generate(tone=tone,
                     topic=topic,
                     pdf_template=file,
                     content=user_prompt)   
            return redirect("/editor")
    elif request.method == "POST" and not request.files.get("pdf_file"):
        
        if request.form.get("tone"): tone = request.form.get("tone")
        else: tone = "Professional"
        topic = request.form.get("topic")
        user_prompt = request.form.get("user_prompt")
        no_template_generation(
            user_prompt,
            OUTPUT_PATH,
            tone,
            topic
        )
        return redirect("/editor")  # Go to editor after AI template is ready
    return render_template("index.html")


# serving the generated template for react app to retrieve it
GENERATED_DIR = (
  OUTPUT_PATH
)


@main_bp.route("/generated_output.html")
def serve_generated():
    return send_from_directory(GENERATED_DIR, "generated_output.html")


# dist is folder thats created after running npm run build when using vite, if using create-react-app then it wont work
BUILD_DIR = os.path.abspath(
    "/home/joel/Documents/Newsletter-Generator/frontend/newsletter-frontend/dist/"
)  # adjust as needed


@main_bp.route("/editor", defaults={"path": ""})
@main_bp.route("/editor/<path:path>")
def serve_editor(path):
    file_path = os.path.join(BUILD_DIR, path)
    if path != "" and os.path.exists(file_path):
        return send_from_directory(BUILD_DIR, path)
    # Fallback to index.html for React Router
    return send_from_directory(BUILD_DIR, "index.html")


@main_bp.route("/transformText", methods=["POST"])
def transform_text():
    data = request.json or {}
    print("Received data:", data)
    text = data.get("text", "").strip()
    tone = data.get("tone", "Formal").strip()
    prompt = data.get("prompt", "").strip()
    if not text:
        return jsonify({"error": "No input text provided"}), 400
    try:
        transformed = transformText(text, tone, prompt)
        print(transformed)
        return jsonify({"transformed": transformed})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@main_bp.route("/generateImage", methods=["POST"])
def generateImage():
    user_prompt = request.json.get("prompt")
    try:
        result = generate_image(user_prompt)
        image_base64 = result["image_base64"]
        mime_type = result["mime_type"]
        return jsonify({"image_base64": image_base64, "mime_type": mime_type})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@main_bp.route("/convertToPdf", methods=["POST"])
def convert_to_pdf():
    # Check if the post request has the file part
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    # If no file is selected or file is empty
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
        # Secure the filename and save the file locally
    filename = secure_filename(file.filename)
    file_path = os.path.join("UPLOAD_FOLDER", filename)
    # Create the upload folder if it doesn't exist
    os.makedirs("UPLOAD_FOLDER", exist_ok=True)
    # Save the uploaded file
    file.save(file_path)
    try:
        # Convert HTML to PDF
        pdf_path = convert_html_to_pdf(file_path, output_dir="CONVERTED_PDFS_FOLDER")
        return (
            jsonify({"message": "File converted successfully", "pdf_path": pdf_path}),
            200,
        )
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


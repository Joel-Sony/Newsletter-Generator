from flask import (
    Blueprint,
    request,
    send_from_directory,
    jsonify,
    current_app
)
import os
import traceback
from werkzeug.utils import secure_filename
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
)

# Build directory for React app
BUILD_DIR = os.path.abspath(
    "/home/joel/Documents/Newsletter-Generator/frontend/newsletter-frontend/dist/"
)

# Generated output directory
GENERATED_DIR = OUTPUT_PATH


# =============================================================================
# API ROUTES (All prefixed with /api to avoid conflicts with React Router)
# =============================================================================

@main_bp.route("/api/generate", methods=["POST"])
async def generate_newsletter():
    """
    STEP 1: Convert the mixed GET/POST index route into a pure API endpoint
    
    What changed:
    - Removed GET handling (React will handle page rendering)
    - Removed redirects (React will handle navigation)
    - Return JSON responses instead of redirects
    - Added /api prefix to avoid conflicts with React Router
    """
    try:
        # Handle PDF template upload case
        if request.files.get("pdf_file"):
            tone = request.form.get("tone", "Professional")
            topic = request.form.get("topic")
            file = request.files.get("pdf_file")
            user_prompt = request.form.get("user_prompt")
            
            success, error_msg = convert_pdf_to_html(file)
            if success:
                await generate(
                    tone=tone,
                    topic=topic,
                    pdf_template=file,
                    content=user_prompt
                )
            
                return jsonify({
                    "success": True,
                    "message": "Newsletter generated successfully with PDF template",
                    "redirect_to": "/editor"  # React can use this for navigation
                })
            else:
                return jsonify({
                    "success": False,
                    "error": error_msg
                }), 400
        
        # Handle no template case
        else:
            tone = request.form.get("tone", "Professional")
            topic = request.form.get("topic")
            user_prompt = request.form.get("user_prompt")
            
            no_template_generation(
                user_prompt,
                OUTPUT_PATH,
                tone,
                topic
            )
     
            return jsonify({
                "success": True,
                "message": "Newsletter generated successfully without template",
                "redirect_to": "/editor"  # React can use this for navigation
            })
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@main_bp.route("/api/generated_output.html")
def serve_generated():
    return send_from_directory(GENERATED_DIR, "generated_output.html")


@main_bp.route("/api/transformText", methods=["POST"])
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


@main_bp.route("/api/generateImage", methods=["POST"])
def generate_image_api():
    user_prompt = request.json.get("prompt")
    try:
        result = generate_image(user_prompt)
        image_base64 = result["image_base64"]
        mime_type = result["mime_type"]
        return jsonify({"image_base64": image_base64, "mime_type": mime_type})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@main_bp.route("/api/convertToPdf", methods=["POST"])
def convert_to_pdf():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    
    filename = secure_filename(file.filename)
    file_path = os.path.join("UPLOAD_FOLDER", filename)
    os.makedirs("UPLOAD_FOLDER", exist_ok=True)
    file.save(file_path)
    
    try:
        pdf_path = convert_html_to_pdf(file_path, output_dir="CONVERTED_PDFS_FOLDER")
        return jsonify({
            "message": "File converted successfully",
            "pdf_path": pdf_path
        }), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# =============================================================================
# REACT APP SERVING (Single catch-all route for all non-API requests)
# =============================================================================

@main_bp.route("/", defaults={"path": ""})
@main_bp.route("/<path:path>")
def serve_react_app(path):
    """
    How it works:
    - If path has extension (.css, .js, .png, etc.) → serve static file
    - If path is just a route (/editor, /login, etc.) → serve index.html
    - React Router will then handle the routing on the client side
    """
    # Check if it's a static file (has file extension)
    if path and "." in path:
        file_path = os.path.join(BUILD_DIR, path)
        if os.path.exists(file_path):
            return send_from_directory(BUILD_DIR, path)
    
    # For all other routes (including /editor, /login, etc.), 
    # serve index.html and let React Router handle it
    return send_from_directory(BUILD_DIR, "index.html")
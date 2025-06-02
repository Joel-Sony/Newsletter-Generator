from flask import Blueprint, request, render_template, send_from_directory, redirect, url_for
from app.utils.convertApi import convert_pdf_to_html
from app.utils.templateGeneration import no_template_generation
import os

main_bp = Blueprint('main', __name__,template_folder="/home/joel/Documents/Newsletter-Generator/backend/app/templates")

@main_bp.route('/', methods=["GET", "POST"])
def index():
    if request.method == "POST" and request.files.get("pdf_file"):
        file = request.files.get("pdf_file")
        success, error_msg = convert_pdf_to_html(file)

        if success: 
            return "<h1>PDF converted to HTML successfully!</h1>"
        else:
            return f"<h1>Error:</h1><pre>{error_msg}</pre>"

    elif request.method == "POST" and not request.files.get("pdf_file"):
        user_prompt = request.form.get("user_prompt")
        no_template_generation(user_prompt, GENERATED_DIR)
        
        # Redirect to the editor page where React app will load
        return redirect('/editor')

    return render_template("index.html")


#serving the generated template for react app to retrieve it 
GENERATED_DIR = "/home/joel/Documents/Newsletter-Generator/backend/app/utils/generatedHTMLs"

@main_bp.route('/generated_output.html')
def serve_generated():
    return send_from_directory(GENERATED_DIR, 'generated_output.html')


#dist is folder thats created after running npm run build when using vite, if using create-react-app then it wont work
BUILD_DIR = os.path.abspath('/home/joel/Documents/Newsletter-Generator/frontend/newsletter-frontend/dist/') # adjust as needed

@main_bp.route('/editor', defaults={'path': ""})
@main_bp.route('/editor/<path:path>')
def serve_editor(path):
    file_path = os.path.join(BUILD_DIR, path)
    if path != "" and os.path.exists(file_path):
        return send_from_directory(BUILD_DIR, path)
    # Fallback to index.html for React Router
    return send_from_directory(BUILD_DIR, 'index.html')


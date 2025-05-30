from flask import Blueprint, request, render_template, send_from_directory, redirect, url_for

main_bp = Blueprint('main', __name__)

REACT_BUILD_DIR = '/home/joel/Documents/Newsletter-Generator/NewsletterApp/grapesjs-editor/build'
GENERATED_HTML_DIR = '/home/joel/Documents/Newsletter-Generator/NewsletterApp/app/utils/generatedHTMLs'

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
        no_template_generation(user_prompt)
        return redirect(url_for('main.editor'))

    return render_template("index.html")

@main_bp.route('/editor', defaults={'path': ''})
@main_bp.route('/editor/<path:path>')
def editor(path):
    if path != "" and (path.startswith('static') or '.' in path):
        return send_from_directory(REACT_BUILD_DIR, path)
    return send_from_directory(REACT_BUILD_DIR, 'index.html')

@main_bp.route('/generated')
def serve_generated_html():
    return send_from_directory(GENERATED_HTML_DIR, 'generated_output.html')
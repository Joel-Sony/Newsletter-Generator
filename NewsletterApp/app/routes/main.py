from flask import Blueprint, request, render_template
from app.utils.convertApi import convert_pdf_to_html
from app.utils.templateGeneration import no_template_generation

main_bp = Blueprint('main', __name__)

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
        return "<h1>HTML created and saved in generatedHTMLS!</h1>"

    return render_template("index.html")

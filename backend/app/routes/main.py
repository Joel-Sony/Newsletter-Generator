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
        no_template_generation(user_prompt,"/home/joel/Documents/Newsletter-Generator/backend/app/utils/generatedHTMLs")
        return redirect(url_for('main.editor'))


    return render_template("index.html")


@main_bp.route('/generated')
def serve_generated_html():
    return send_from_directory('/home/joel/Documents/Newsletter-Generator/NewsletterApp/app/utils/generatedHTMLs', 'generated_output.html')


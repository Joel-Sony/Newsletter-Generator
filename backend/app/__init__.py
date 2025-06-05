from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)

    # Enable CORS
    CORS(app)

    # Your other config & blueprint registrations here
    from .routes.main import main_bp
    app.register_blueprint(main_bp)
    app.config['UPLOAD_FOLDER'] = 'uploads/htm_files'
    app.config['CONVERTED_PDFS_FOLDER'] = 'uploads/converted_pdfs'
    app.config['ALLOWED_EXTENSIONS'] = {'htm', 'html'}
    return app

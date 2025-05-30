from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)

    # Enable CORS
    CORS(app)

    # Your other config & blueprint registrations here
    from .routes.main import main_bp
    app.register_blueprint(main_bp)

    return app

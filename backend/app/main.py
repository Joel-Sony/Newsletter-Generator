from flask import (
    Blueprint,
    request,
    send_from_directory,
    jsonify,
    current_app
    
)
import os
import traceback
import requests
from werkzeug.utils import secure_filename
from app.utils.convertApi import convert_pdf_to_html, convert_html_to_pdf
from app.utils.templateGeneration import no_template_generation
from app.utils.transformText import transformText
from app.utils.imageGeneration import generate_image
from app.utils.templateUpload import generate
from app.utils.htmlPreview import html_to_png_bytes
from app.config import (
    OUTPUT_PATH,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL,
    SECRET_KEY,
    JWT_SECRET_KEY
)
from functools import wraps
from supabase import create_client, Client
import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import re
import json
import uuid

main_bp = Blueprint(
    "main",
    __name__,
)

# Build directory for React app
BUILD_DIR = os.path.abspath(
    "/home/joel/Documents/Newsletter-Generator/frontend/newsletter-frontend/dist"
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
    # print("Received data:", data)
    text = data.get("text", "").strip()
    tone = data.get("tone", "Formal").strip()
    prompt = data.get("prompt", "").strip()
    
    if not text:
        return jsonify({"error": "No input text provided"}), 400
    
    try:
        transformed = transformText(text, tone, prompt)
        # print(transformed)
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
# SAVING PROJECT SECTION
# =============================================================================

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

PROJECTS_TABLE = 'projects'

def get_user_id_from_supabase_token(token):
    """Extract user_id from Supabase JWT token"""
    try:
        # print(f"DEBUG: JWT_SECRET_KEY exists: {JWT_SECRET_KEY is not None}")
        # print(f"DEBUG: JWT_SECRET_KEY length: {len(JWT_SECRET_KEY) if JWT_SECRET_KEY else 0}")
        # print(f"DEBUG: Token length: {len(token)}")
        # print(f"DEBUG: Token starts with: {token[:20]}...")
        
        # Try to decode without verification first to see the payload structure
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        # print(f"DEBUG: Unverified payload: {unverified_payload}")
        
        # Now try with verification
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=['HS256'],
            audience="authenticated"
        )
        # print(f"DEBUG: Verified payload: {payload}")
        
        user_id = payload.get('sub')
        # print(f"DEBUG: Extracted user_id: {user_id}")
        return user_id
        
    except jwt.ExpiredSignatureError:
        # print("DEBUG: Token expired")
        return None
    except jwt.InvalidSignatureError:
        # print("DEBUG: Invalid signature - JWT_SECRET_KEY might be wrong")
        return None
    except jwt.InvalidTokenError as e:
        # print(f"DEBUG: Invalid token error: {str(e)}")
        return None
    except Exception as e:
        # print(f"DEBUG: Unexpected error: {str(e)}")
        return None


@main_bp.route("/api/upload-project", methods=["POST"])
async def upload_project():
    try:
        # Get authorization token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid authorization token"}), 401
        
        auth_token = auth_header.split(' ')[1]
        
        # Extract user_id from authToken
        user_id = get_user_id_from_supabase_token(auth_token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        project_name = data.get("project_name")
        project_data = data.get("project_data")
        status = data.get("status", "DRAFT")
        incoming_project_id = data.get("project_id")
        fullHtml = data.get("project_fullHtml")
        
        
        # Validate required fields
        if not project_name:
            return jsonify({"error": "project_name is required"}), 400
        if not project_data:
            return jsonify({"error": "project_data is required"}), 400

        timestamp = datetime.utcnow().isoformat()

        # Determine if this is a new project or update
        if not incoming_project_id:
            project_id = str(uuid.uuid4())
            version = 1
        else:
            project_id = incoming_project_id
            
            try:
                query = supabase.table("projects")\
                    .select("version")\
                    .eq("project_id", project_id)\
                    .eq("user_id", user_id)\
                    .order("version", desc=True)\
                    .limit(1)\
                    .execute()
                
                if hasattr(query, 'error') and query.error:
                    return jsonify({"error": "Failed to fetch project version"}), 500
                
                if not query.data:
                    return jsonify({"error": "Project not found or access denied"}), 404
                
                latest_version = query.data[0]["version"]
                version = latest_version + 1
                
            except Exception as e:
                return jsonify({"error": f"Database query failed: {str(e)}"}), 500
            
        # Create filename for storage
        filename = f"{project_id}_v{version}_{int(datetime.utcnow().timestamp())}.json"
        filename_img = f"{project_id}_v{version}_{int(datetime.utcnow().timestamp())}.png"

        try:
            # Convert project data to appropriate datatype
            json_bytes = json.dumps(project_data, indent=2).encode("utf-8")
            image_bytes = await html_to_png_bytes(fullHtml, width = 600, height = 400)
            
            # Upload JSON file to Supabase Storage
            upload_response = supabase.storage.from_("templates").upload(
                f"projects/{filename}",
                json_bytes,
                {"content-type": "application/json"},
            )

            
            img_upload = supabase.storage.from_("templates").upload(
                f"projects/{filename_img}",
                image_bytes,
                {"content-type": "image/png"}
            )

            if hasattr(img_upload, 'error') and img_upload.error:
                return jsonify({"error": f"Image upload failed: {img_upload.error}"}), 500
    
        except Exception as e:
            return jsonify({"error": f"File upload failed: {str(e)}"}), 500

        try:

            # Get public URL for the uploaded file
            public_url_response = supabase.storage.from_("templates").get_public_url(f"projects/{filename}")
            img_publicUrl = supabase.storage.from_("templates").get_public_url(f"projects/{filename_img}")
            
            # Handle different response formats for public URL
            public_url = None
            if hasattr(public_url_response, 'publicUrl'):
                public_url = public_url_response.publicUrl
            elif hasattr(public_url_response, 'public_url'):
                public_url = public_url_response.public_url
            elif isinstance(public_url_response, dict):
                public_url = public_url_response.get('publicUrl') or public_url_response.get('public_url')
            elif isinstance(public_url_response, str):
                public_url = public_url_response
            
            if not public_url:
                # print("DEBUG: Could not extract public URL from response")
                return jsonify({"error": "Failed to generate public URL"}), 500
            

            
        except Exception as e:
            # print(f"DEBUG: Get public URL exception: {str(e)}")
            return jsonify({"error": f"Failed to get public URL: {str(e)}"}), 500

        try:
            # Insert new row in database
            insert_data = {
            "user_id": user_id,
            "project_name": project_name,
            "project_id": project_id,
            "json_path": public_url,
            "image_path": img_publicUrl,  # Store URL not bytes
            "status": status,
            "version": version,
            "created_at": timestamp,
            "updated_at": timestamp
            }
            
            # print(f"DEBUG: About to insert: {insert_data}")
            
            insert_response = supabase.table("projects").insert(insert_data).execute()
            
            # print(f"DEBUG: Insert response type: {type(insert_response)}")
            # print(f"DEBUG: Insert response: {insert_response}")
            
            # Check for database insert errors
            if hasattr(insert_response, 'error') and insert_response.error:
                error_msg = str(insert_response.error)
                # print(f"DEBUG: Database insert failed: {error_msg}")
                return jsonify({"error": f"Failed to save project: {error_msg}"}), 500
            
            # print("DEBUG: Database insert successful")
            
        except Exception as e:
            # print(f"DEBUG: Database insert exception: {str(e)}")
            return jsonify({"error": f"Database insert failed: {str(e)}"}), 500

        # Return success response
        response_data = {
            "success": True,
            "message": "Project saved successfully",
            "project_id": project_id,
            "version": version,
            "status": status,
            "json_path": public_url
        }
        
        # print(f"DEBUG: Returning success response: {response_data}")
        return jsonify(response_data), 200

    except Exception as e:
        # print(f"DEBUG: Top-level exception: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500
    


@main_bp.route('/api/newsletters', methods=['GET'])
def get_user_newsletters():
    """Fetch all newsletters for the logged-in user based on user_id"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid authorization token"}), 401
        
        auth_token = auth_header.split(' ')[1]
        user_id = get_user_id_from_supabase_token(auth_token)
        
        if not user_id:
            return jsonify({"error": "Invalid user ID"}), 401

        # print(f"Fetching newsletters for user: {user_id}")  # Debug log
        
        result = supabase.table(PROJECTS_TABLE).select("*").eq('user_id', user_id).execute()
        
        if hasattr(result, 'error') and result.error:
            print(f"Supabase error: {result.error}")  # Debug log
            return jsonify({'error': 'Database query failed'}), 500

        newsletters = result.data
        print(f"Retrieved newsletters: {newsletters}")  # Debug log 
        
        grouped = {
            'DRAFT': [],
            'PUBLISHED': [],
            'ARCHIVED': []
        }

        for newsletter in newsletters:
            status = newsletter.get('status', 'DRAFT').upper()
            if status not in grouped:
                status = 'DRAFT'
            grouped[status].append(newsletter)

        # print(f"Grouped newsletters: {grouped}")  # Debug log
        return jsonify({'success': True, 'data': grouped}), 200

    except Exception as e:
        print(f"Error in get_user_newsletters: {str(e)}")  # Debug log
        return jsonify({'error': str(e)}), 500


@main_bp.route('/api/newsletters/<string:id>')
def get_newsletter_using_id(id):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid authorization token"}), 401
        
        auth_token = auth_header.split(' ')[1]
        user_id = get_user_id_from_supabase_token(auth_token)

        if not user_id:
            return jsonify({"error": "Invalid user ID"}), 401

        # print(f"Fetching newsletters for user: {user_id}")  # Debug log
        
        result = supabase.table(PROJECTS_TABLE).select('project_id','project_name','status','version','json_path').eq('id', id).eq('user_id',user_id).execute()
        if result.data:
            row = result.data[0]
            json_path = row.get("json_path")
            response = requests.get(json_path)
            if response.status_code != 200:
                return jsonify({"error": "Failed to fetch JSON from Supabase storage"}), 500

            row["json_path"] = response.json()
            return jsonify(row)
        else:
            return jsonify({"error":"Could not find file"})
    except Exception as e:
            return jsonify({"Error":"Could not fetch single newsletter"})
                



# =============================================================================
# LOGIN SECTION
# =============================================================================
def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, "Password is valid"

def generate_token(user_id, email):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=7),  # Token expires in 7 days
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to require valid token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'message': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        payload = verify_token(token)
        if payload is None:
            return jsonify({'message': 'Token is invalid or expired'}), 401
        
        request.current_user = payload
        return f(*args, **kwargs)
    
    return decorated


@main_bp.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user using Supabase Auth (let DB trigger create public.users row)"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Call Supabase Auth to sign up
        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password
        })


        if auth_response.user is None:
            print("Signup error response:", auth_response)
            return jsonify({'message': 'User creation failed'}), 500

        # Get the created user
        user = auth_response.user
        if not user:
            return jsonify({'message': 'User creation failed'}), 500

        # Let the Supabase trigger handle inserting into public.users
        return jsonify({
            'message': 'Account created! Check your email to verify.',
            'requiresVerification': True,
            'user': {
                'id': user.id,
                'email': user.email
            }
        }), 201

    except Exception as e:
        # print(f"Registration error: {str(e)}")
        return jsonify({'message': 'Internal server error'}), 500

@main_bp.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'message': 'No data provided'}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400

        # Authenticate via Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        if getattr(auth_response, 'error', None):
            return jsonify({'message': auth_response.error.message}), 401

        session = auth_response.session
        user = auth_response.user

        return jsonify({
            'message': 'Login successful',
            'token': session.access_token,
            'user': {
                'id': user.id,
                'email': user.email
            }
        }), 200

    except Exception as e:
        # print(f"Login error: {str(e)}")
        return jsonify({'message': 'Internal server error'}), 500

@main_bp.route('/api/auth/verify', methods=['GET'])
@token_required
def verify():
    """Verify token and return user data"""
    try:
        user_id = request.current_user['user_id']
        
        # Get fresh user data from database
        result = supabase.table('users').select('*').eq('id', user_id).execute()
        
        if not result.data:
            return jsonify({'message': 'User not found'}), 404
        
        user = result.data[0]
        
        # Prepare user data for response
        user_response = {
            'id': user['id'],
            'email': user['email'],
            'created_at': user['created_at'],
            'last_login': user['last_login']
        }
        
        return jsonify({
            'message': 'Token is valid',
            'user': user_response
        }), 200
        
    except Exception as e:
        # print(f"Verify error: {str(e)}")
        return jsonify({'message': 'Internal server error'}), 500

@main_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200




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
from flask import (
    Blueprint,
    request,
    send_from_directory,
    jsonify,
    current_app 
)
import asyncio
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
from app.utils.JWTexpired import require_active_session # This remains crucial!
from app.config import (
    OUTPUT_PATH,
    SUPABASE_SERVICE_ROLE_KEY, 
    SUPABASE_URL,                         
)

from supabase import create_client, Client
from datetime import datetime 
import re # This import seems unused in the provided code, but keeping it.
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

# Initialize Supabase client for backend/admin operations
# This client uses the SERVICE_ROLE_KEY and is distinct from the client-side JS library.
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


@main_bp.route("/api/generate", methods=["POST"])
@require_active_session
def generate_newsletter():
    """
    Handles newsletter generation, either with a PDF template or without.
    Requires an active user session.
    """
    try:
        # Access user_id from the request context set by require_active_session
        user_id = request.current_user_id

        # Handle PDF template upload case
        if request.files.get("pdf_file"):
            tone = request.form.get("tone", "Professional")
            topic = request.form.get("topic")
            file = request.files.get("pdf_file")
            user_prompt = request.form.get("user_prompt")
            
            success, error_msg = convert_pdf_to_html(file)
            if success:
                asyncio.run(generate(
                    tone=tone,
                    topic=topic,
                    pdf_template=file,
                    content=user_prompt
                ))
            
                return jsonify({
                    "success": True,
                    "message": "Newsletter generated successfully with PDF template",
                    "redirect_to": "/editor"
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
                "redirect_to": "/editor"
            })
            
    except Exception as e:
        current_app.logger.error(f"Error in generate_newsletter: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "Internal server error during generation"
        }), 500


@main_bp.route("/api/generated_output.html")
def serve_generated():
    """Serves the latest generated HTML output file."""
    return send_from_directory(GENERATED_DIR, "generated_output.html")


@main_bp.route("/api/transformText", methods=["POST"])
@require_active_session
def transform_text():
    """
    Transforms text based on provided tone and prompt.
    Requires an active user session.
    """
    data = request.json or {}
    text = data.get("text", "").strip()
    tone = data.get("tone", "Formal").strip()
    prompt = data.get("prompt", "").strip()
    
    if not text:
        return jsonify({"error": "No input text provided"}), 400
    
    try:
        transformed = transformText(text, tone, prompt)
        return jsonify({"transformed": transformed})
    except Exception as e:
        current_app.logger.error(f"Error in transform_text: {e}", exc_info=True)
        return jsonify({"error": "Internal server error during text transformation"}), 500


@main_bp.route("/api/generateImage", methods=["POST"])
def generate_image_api():
    """Generates an image based on a user prompt."""
    user_prompt = request.json.get("prompt")
    if not user_prompt:
        return jsonify({"error": "No prompt provided for image generation"}), 400
    try:
        result = generate_image(user_prompt)
        image_base64 = result["image_base64"]
        mime_type = result["mime_type"]
        return jsonify({"image_base64": image_base64, "mime_type": mime_type})
    except Exception as e:
        current_app.logger.error(f"Error in generate_image_api: {e}", exc_info=True)
        return jsonify({"error": "Internal server error during image generation"}), 500


# =============================================================================
# SAVING and DELETION SECTION
# =============================================================================

PROJECTS_TABLE = 'projects'


@main_bp.route("/api/upload-project", methods=["POST"])
@require_active_session
def upload_project():
        """
        Uploads or updates a project (newsletter) to Supabase Storage and Database.
        Requires an active user session.
        """
        try:
            user_id = request.current_user_id 
            
            data = request.get_json()
            if not data:
                return jsonify({"error": "No JSON data provided"}), 400

            project_name = data.get("project_name")
            project_data = data.get("project_data")
            status = data.get("status", "DRAFT")
            incoming_project_id = data.get("project_id")
            fullHtml = data.get("project_fullHtml")
            
            if not project_name:
                return jsonify({"error": "project_name is required"}), 400
            if not project_data:
                return jsonify({"error": "project_data is required"}), 400

            timestamp = datetime.utcnow().isoformat()

            if not incoming_project_id:
                project_id = str(uuid.uuid4())
                version = 1
            else:
                project_id = incoming_project_id
                
                try:
                    query = supabase.table(PROJECTS_TABLE)\
                        .select("version")\
                        .eq("project_id", project_id)\
                        .eq("user_id", user_id)\
                        .order("version", desc=True)\
                        .limit(1)\
                        .execute()
                    
                    if hasattr(query, 'error') and query.error:
                        current_app.logger.error(f"Supabase query error (upload-project version fetch): {query.error}", exc_info=True)
                        return jsonify({"error": "Failed to fetch project version from database"}), 500
                    
                    if not query.data:
                        # This means incoming_project_id was provided but no existing project found for this user
                        return jsonify({"error": "Project not found or access denied for update"}), 404
                    
                    latest_version = query.data[0]["version"]
                    version = latest_version + 1
                    
                except Exception as e:
                    current_app.logger.error(f"Error fetching project version: {e}", exc_info=True)
                    return jsonify({"error": f"Database query failed: {str(e)}"}), 500
                
            # Create filename for storage
            filename = f"{project_id}_v{version}_{int(datetime.utcnow().timestamp())}.json"
            filename_img = f"{project_id}_v{version}_{int(datetime.utcnow().timestamp())}.png"

            try:
                # Convert project data to appropriate datatype
                json_bytes = json.dumps(project_data, indent=2).encode("utf-8")
                image_bytes = asyncio.run(html_to_png_bytes(fullHtml, width = 600, height = 400))
                
                # Upload JSON file to Supabase Storage
                upload_response = supabase.storage.from_("templates").upload(
                    f"projects/{filename}",
                    json_bytes,
                    {"content-type": "application/json"},
                )

                # Check if upload_response has an error (Supabase-py client returns an object with 'error' attr)
                if hasattr(upload_response, 'error') and upload_response.error:
                    current_app.logger.error(f"JSON upload failed: {upload_response.error}", exc_info=True)
                    return jsonify({"error": f"JSON upload failed: {upload_response.error.get('message', 'Unknown upload error')}"}), 500
                
                img_upload = supabase.storage.from_("templates").upload(
                    f"projects/{filename_img}",
                    image_bytes,
                    {"content-type": "image/png"}
                )

                if hasattr(img_upload, 'error') and img_upload.error:
                    current_app.logger.error(f"Image upload failed: {img_upload.error}", exc_info=True)
                    return jsonify({"error": f"Image upload failed: {img_upload.error.get('message', 'Unknown image upload error')}"}), 500
        
            except Exception as e:
                current_app.logger.error(f"File preparation/upload failed: {e}", exc_info=True)
                return jsonify({"error": f"File upload failed: {str(e)}"}), 500

            try:
                # Get public URL for the uploaded file
                public_url_response = supabase.storage.from_("templates").get_public_url(f"projects/{filename}")
                img_publicUrl_response = supabase.storage.from_("templates").get_public_url(f"projects/{filename_img}")
                
                # Handle different response formats for public URL
                public_url = None
                if hasattr(public_url_response, 'publicUrl'):
                    public_url = public_url_response.publicUrl
                elif hasattr(public_url_response, 'public_url'):
                    public_url = public_url_response.public_url
                elif isinstance(public_url_response, dict):
                    public_url = public_url_response.get('publicUrl') or public_url_response.get('public_url')
                elif isinstance(public_url_response, str): # Direct string might be returned in some versions
                    public_url = public_url_response
                
                img_publicUrl = None
                if hasattr(img_publicUrl_response, 'publicUrl'):
                    img_publicUrl = img_publicUrl_response.publicUrl
                elif hasattr(img_publicUrl_response, 'public_url'):
                    img_publicUrl = img_publicUrl_response.public_url
                elif isinstance(img_publicUrl_response, dict):
                    img_publicUrl = img_publicUrl_response.get('publicUrl') or img_publicUrl_response.get('public_url')
                elif isinstance(img_publicUrl_response, str):
                    img_publicUrl = img_publicUrl_response
                
                if not public_url or not img_publicUrl:
                    current_app.logger.error("Failed to extract public URL for JSON or Image.")
                    return jsonify({"error": "Failed to generate public URLs for files"}), 500
                
            except Exception as e:
                current_app.logger.error(f"Error getting public URLs: {e}", exc_info=True)
                return jsonify({"error": f"Failed to get public URLs: {str(e)}"}), 500

            try:
                # Insert new row in database
                insert_data = {
                    "user_id": user_id,
                    "project_name": project_name,
                    "project_id": project_id,
                    "json_path": public_url,
                    "image_path": img_publicUrl,
                    "status": status,
                    "version": version,
                    "created_at": timestamp,
                    "updated_at": timestamp
                }
                
                insert_response = supabase.table(PROJECTS_TABLE).insert(insert_data).execute()

                if hasattr(insert_response, 'error') and insert_response.error:
                    current_app.logger.error(f"Database insert failed: {insert_response.error}", exc_info=True)
                    return jsonify({"error": f"Database insert failed: {insert_response.error.get('message', 'Unknown database error')}"}), 500
                
            except Exception as e:
                current_app.logger.error(f"Database insert operation failed: {e}", exc_info=True)
                return jsonify({"error": f"Database insert failed: {str(e)}"}), 500

            # Return success response
            response_data = {
                "success": True,
                "id":insert_response.data[0]['id'],                  #contains primary key column, id of new row
                "message": "Project saved successfully",
                "project_id": project_id,
                "version": version,
                "status": status,
                "json_path": public_url,
                "project_name":project_name
            }
            
            return jsonify(response_data), 200

        except Exception as e:
            current_app.logger.error(f"Internal server error in upload_project: {e}", exc_info=True)
            return jsonify({"error": f"Internal server error: {str(e)}"}), 500
        

@main_bp.route('/api/newsletters', methods=['GET'])
@require_active_session
def get_user_newsletters():
    """
    Fetches all newsletters for the logged-in user based on user_id.
    Requires an active user session.
    """
    try:
        user_id = request.current_user_id # Get user ID from decorator
        
        result = supabase.table(PROJECTS_TABLE).select("*").eq('user_id', user_id).execute()
        
        if hasattr(result, 'error') and result.error:
            current_app.logger.error(f"Supabase error fetching user newsletters: {result.error}", exc_info=True)
            return jsonify({'error': 'Database query failed'}), 500

        newsletters = result.data
    
        grouped = {
            'DRAFT': [],
            'PUBLISHED': [],
            'ARCHIVED': []
        }

        for newsletter in newsletters:
            status = newsletter.get('status', 'DRAFT').upper()
            if status not in grouped:
                status = 'DRAFT' # Default to DRAFT if status is unrecognized
            grouped[status].append(newsletter)

        return jsonify({'success': True, 'data': grouped}), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_user_newsletters: {e}", exc_info=True)
        return jsonify({'error': "Internal server error fetching newsletters"}), 500
    
@main_bp.route("/api/newsletters-current")
@require_active_session
def get_latest_project_versions_rpc():
    """
    Calls the 'get_latest_project_versions' PostgreSQL function
    to retrieve entries with the highest version for each project_id.
    Requires an active user session.
    """
    try:
    
        user_id = request.current_user_id 
        response = supabase.rpc('get_latest_project_versions', {'p_user_id': user_id}).execute()
        data = response.data

        if hasattr(response, 'error') and response.error:
            current_app.logger.error(f"Supabase RPC error: {response.error}", exc_info=True)
            return jsonify({'error': 'RPC call failed'}), 500


        grouped = {
            'DRAFT': [],
            'PUBLISHED': [],
            'ARCHIVED': []
        }

        if data:
            for project in data:
                status = project.get('status', 'DRAFT').upper() # Default to DRAFT
                if status not in grouped:
                    status = 'DRAFT' # Fallback
                grouped[status].append(project)
            return jsonify({'success': True, 'data': grouped}), 200
        else:
            current_app.logger.info("No data found or RPC function returned an empty set for latest versions.")
            return jsonify({'success': True, 'data': grouped}), 200 # Return empty grouped object

    except Exception as e:
        current_app.logger.error(f"An error occurred during the RPC call: {e}", exc_info=True)
        return jsonify({'error': "Internal server error during RPC call"}), 500


@main_bp.route('/api/newsletters/<string:id>')
@require_active_session
def get_newsletter_using_id(id):
    """
    Fetches a specific newsletter by its primary key 'id'.
    Requires an active user session and validates user ownership.
    """
    try:
        user_id = request.current_user_id # Get user ID from decorator
        
        result = supabase.table(PROJECTS_TABLE).select('project_id','project_name','status','version','json_path').eq('id', id).eq('user_id',user_id).execute()
        if hasattr(result, 'error') and result.error:
            current_app.logger.error(f"Supabase query error (get_newsletter_using_id): {result.error}", exc_info=True)
            return jsonify({"error": "Database query failed"}), 500

        if result.data:
            row = result.data[0]
            json_path = row.get("json_path")
            
            # Fetch JSON content from the public URL
            response = requests.get(json_path)
            if response.status_code != 200:
                current_app.logger.error(f"Failed to fetch JSON from Supabase storage for ID {id}: Status {response.status_code}", exc_info=True)
                return jsonify({"error": "Failed to fetch JSON from Supabase storage"}), 500

            try:
                row["json_path"] = response.json() # Replace path with actual JSON content
            except json.JSONDecodeError:
                current_app.logger.error(f"Failed to decode JSON from {json_path}", exc_info=True)
                return jsonify({"error": "Failed to decode project data"}), 500

            return jsonify(row), 200
        else:
             return jsonify({"error":"Could not find file or access denied"}), 404 # Return 404 if not found
    except Exception as e:
        current_app.logger.error(f"Error in get_newsletter_using_id: {e}", exc_info=True)
        return jsonify({"error":"Internal server error when fetching newsletter"}), 500
                
@main_bp.route("/api/restore/<uuid:newsletter_id>", methods=["POST"])
@require_active_session # This remains crucial for authentication
def restore_newsletter(newsletter_id):
    """
    Restores an archived newsletter to draft status.
    Requires an active user session and ownership of the newsletter.
    """
    # Access user_id from the request context set by require_active_session
    # Based on your upload_project and get_user_newsletters, it's `request.current_user_id`
    current_user_id = request.current_user_id
    current_app.logger.info(f"Restore request for newsletter ID: {newsletter_id} by user ID: {current_user_id}")

    try:
        # Use the Supabase client to perform the update
        # We need to filter by id, user_id, AND current status to ensure secure and correct operation.
        update_response = supabase.table(PROJECTS_TABLE) \
            .update({"status": "DRAFT", "updated_at": datetime.utcnow().isoformat()}) \
            .eq("id", str(newsletter_id)) \
            .eq("user_id", str(current_user_id)) \
            .eq("status", "ARCHIVED") \
            .execute()

        # Check for errors from the Supabase client
        if hasattr(update_response, 'error') and update_response.error:
            current_app.logger.error(f"Supabase update error during restore: {update_response.error}", exc_info=True)
            return jsonify({
                "success": False,
                "error": f"Database error during restore operation: {update_response.error.get('message', 'Unknown Supabase error')}"
            }), 500

        # The Supabase client's `execute()` method returns a response object.
        # The updated data is in `update_response.data`.
        # If `data` is an empty list, it means no rows were updated.
        if update_response.data:
            restored_data = update_response.data[0] # Get the first (and only) updated row
            current_app.logger.info(f"Newsletter '{restored_data.get('project_name')}' (ID: {restored_data.get('id')}) restored by user {current_user_id}.")
            return jsonify({
                "success": True,
                "message": f"Newsletter '{restored_data.get('project_name', 'Unnamed Newsletter')}' restored successfully.",
                "name": restored_data.get('project_name'),
                "id": str(restored_data.get('id'))
            }), 200
        else:
            # This means no row matched the WHERE clauses (id, user_id, and status=ARCHIVED)
            current_app.logger.warning(f"Restore failed for newsletter ID: {newsletter_id} (user: {current_user_id}). Not found, unauthorized, or not archived.")
            return jsonify({
                "success": False,
                "error": "Failed to restore: Newsletter not found, unauthorized, or not in archived status."
            }), 404

    except Exception as e:
        current_app.logger.error(f"An unexpected error occurred during restore for user {current_user_id}: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "An internal server error occurred during newsletter restore."
        }), 500

            
# =============================================================================
# DELETION SECTION
# =============================================================================

@main_bp.route("/api/delete/<string:id>", methods=["DELETE"])
@require_active_session
def delete(id):
    """
    Deletes a specific newsletter entry by its primary key 'id'.
    Requires an active user session and validates user ownership.
    """
    try:
        user_id = request.current_user_id # Get user ID from decorator

        # Check if the project exists and belongs to the user before attempting deletion
        # This prevents a user from deleting another user's project if they somehow guess the ID
        check_ownership_result = supabase.table(PROJECTS_TABLE).select('id').eq('id', id).eq('user_id', user_id).execute()

        if hasattr(check_ownership_result, 'error') and check_ownership_result.error:
            current_app.logger.error(f"Supabase ownership check error (delete): {check_ownership_result.error}", exc_info=True)
            return jsonify({"error": "Database error during ownership check"}), 500
            
        if not check_ownership_result.data:
            return jsonify({"error": "File not found or access denied"}), 404

        # If ownership confirmed, proceed with deletion
        result = supabase.table(PROJECTS_TABLE).delete().eq('id', id).execute()
        
        if hasattr(result, 'error') and result.error:
            current_app.logger.error(f"Supabase deletion error: {result.error}", exc_info=True)
            return jsonify({"error": "File deletion failed"}), 500

        # Supabase delete returns data if successful, empty list if no rows matched
        if result.data:
            return jsonify({"success": True, "message":"File deletion successful!"}), 200
        else:
            return jsonify({"success": False, "message":"File not found or already deleted"}), 404 # Should be caught by ownership check, but as a fallback
    except Exception as e:
        current_app.logger.error(f"Error in delete route: {e}", exc_info=True)
        return jsonify({"error": "Internal server error during deletion"}), 500
                

# =============================================================================
# DUPLICATION SECTION
# =============================================================================

@main_bp.route("/api/<string:id>/duplicate", methods=["POST"])
@require_active_session
async def duplicate(id):
    """
    Duplicates an existing newsletter project for the logged-in user.
    Requires an active user session and validates user ownership.
    """
    try:
        user_id = request.current_user_id # Get user ID from decorator
        
        # Fetch the original project data
        result = supabase.table(PROJECTS_TABLE).select('project_id','project_name','status','json_path','image_path').eq('id', id).eq('user_id',user_id).execute()
        if hasattr(result, 'error') and result.error:
            current_app.logger.error(f"Supabase query error (duplicate): {result.error}", exc_info=True)
            return jsonify({"error": "Database query failed"}), 500

        if result.data:
            row = result.data[0]
        else:
            return jsonify({"error":"Original project not found or access denied"}), 404
        
        # Generate a new unique project_id for the duplicate
        new_project_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        # Helper function (assuming it's defined elsewhere or will be defined)
        # Placeholder for get_unique_project_name, if it's not defined in the code you provided
        # You'll need to ensure this function exists and works correctly.
        # Example (define if it doesn't exist):
        # def get_unique_project_name(base_name, user_id_param, current_project_id=None):
        #     # Simple example: adds " (copy)" and a number if needed
        #     # In a real app, you might query Supabase to ensure uniqueness for the user
        #     unique_name = f"{base_name} (copy)"
        #     # Add logic here to ensure true uniqueness for the user if necessary
        #     return unique_name
        
        new_project_name = get_unique_project_name(row["project_name"], user_id, current_project_id=None)
        
        insert_data = {
            "user_id": user_id,
            "project_name": new_project_name,
            "project_id": new_project_id, # Use new project_id
            "json_path": row["json_path"], # Reuse same JSON/image paths (assuming content is static or duplicated on storage if needed)
            "image_path": row["image_path"],
            "status": "DRAFT", # New duplicate starts as DRAFT
            "version": 1, # New duplicate starts at version 1
            "created_at": timestamp,
            "updated_at": timestamp
        }
        
        insert_response = supabase.table(PROJECTS_TABLE).insert(insert_data).execute()
        
        if hasattr(insert_response, 'error') and insert_response.error:
            current_app.logger.error(f"Database insert for duplicate failed: {insert_response.error}", exc_info=True)
            return jsonify({"error": f"Failed to create duplicate project: {insert_response.error.get('message', 'Unknown database error')}"}), 500

        response_data = {
            "success": True,
            "message": "Project duplicated successfully",
            "name": new_project_name,
            "new_project_id": new_project_id # Return new ID for frontend use
        }
        
        return jsonify(response_data), 201

    except Exception as e:
        current_app.logger.error(f"Internal server error in duplicate route: {e}", exc_info=True)
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@main_bp.route("/api/preview/<string:id>")
@require_active_session
def preview(id):
    """
    Fetches a specific newsletter by its primary key 'id' for preview.
    Requires an active user session and validates user ownership.
    """
    try:
        user_id = request.current_user_id # Get user ID from decorator

        result = supabase.table(PROJECTS_TABLE).select('project_id','project_name','status','version','json_path').eq('id', id).eq('user_id',user_id).execute()
        if hasattr(result, 'error') and result.error:
            current_app.logger.error(f"Supabase query error (preview): {result.error}", exc_info=True)
            return jsonify({"error": "Database query failed"}), 500

        if result.data:
            row = result.data[0]
            json_path = row.get("json_path")
            
            # Fetch JSON content from the public URL
            response = requests.get(json_path)
            if response.status_code != 200:
                current_app.logger.error(f"Failed to fetch JSON from Supabase storage for ID {id}: Status {response.status_code}", exc_info=True)
                return jsonify({"error": "Failed to fetch JSON from Supabase storage"}), 500
            
            try:
                row["json_path"] = response.json() # Replace path with actual JSON content
            except json.JSONDecodeError:
                current_app.logger.error(f"Failed to decode JSON from {json_path}", exc_info=True)
                return jsonify({"error": "Failed to decode project data"}), 500
            
            return jsonify(row), 200
        else:
             return jsonify({"error":"Could not find file or access denied"}), 404
    except Exception as e:
        current_app.logger.error(f"Error in preview route: {e}", exc_info=True)
        return jsonify({"error":"Internal server error when fetching newsletter for preview"}), 500


@main_bp.route("/api/newsletters/<string:project_id>/versions", methods=["GET"])
@require_active_session
def get_newsletter_versions(project_id):
    """
    Fetches all versions of a specific newsletter identified by its project_id.
    Versions are ordered from newest to oldest. Requires an active user session.
    """
    try:
        user_id = request.current_user_id # Get user ID from decorator
        
        result = supabase.table(PROJECTS_TABLE) \
            .select('id, project_id, project_name, status, version, created_at, updated_at, image_path, json_path') \
            .eq('project_id', project_id) \
            .eq('user_id', user_id) \
            .order('version', desc=True) \
            .execute()
        
        if hasattr(result, 'error') and result.error:
            current_app.logger.error(f"Supabase query error for project_id {project_id}: {result.error}", exc_info=True)
            return jsonify({"error": f"Failed to fetch versions from database: {result.error.get('message', 'Unknown Supabase error')}"}), 500

        versions_data = result.data if result.data else []

        if not versions_data:
            return jsonify({"success": True, "message": "No versions found for this project ID.", "versions": []}), 200
        
        return jsonify({"success": True, "message": "Newsletter versions fetched successfully.", "versions": versions_data}), 200

    except Exception as e:
        current_app.logger.error(f"Internal server error while fetching newsletter versions for project_id {project_id}: {e}", exc_info=True)
        return jsonify({"error": f"Internal server error: {str(e)}. Check server logs for details."}), 500



# =============================================================================
# REACT APP SERVING (Single catch-all route for all non-API requests)
# =============================================================================

@main_bp.route("/", defaults={"path": ""})
@main_bp.route("/<path:path>")
def serve_react_app(path):
    """
    Serves static files for the React app or index.html for client-side routing.
    """
    # Check if it's a static file (has file extension)
    if path and "." in path:
        file_path = os.path.join(BUILD_DIR, path)
        if os.path.exists(file_path):
            return send_from_directory(BUILD_DIR, path)
    
    # For all other routes (including /editor, /login, etc.), 
    # serve index.html and let React Router handle it
    return send_from_directory(BUILD_DIR, "index.html")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
def get_unique_project_name(desired_project_name: str, user_id: str, current_project_id: str = None) -> str:
    """
    Suggests a unique project name by appending (Duplicate N) if a conflict exists.
    
    Args:
        desired_project_name: The initial name proposed by the user.
        user_id: The ID of the user creating/updating the project.
        current_project_id: Optional. The project_id if updating an existing project.
                            This allows the current project's name to be ignored as a conflict.
    Returns:
        A unique project name.
    """
    # Step 1: Determine the base name without any existing (Duplicate X) suffix
    base_name_match = re.match(r"^(.*?)(?: \(Duplicate(?: (\d+))?\))?$", desired_project_name)
    if base_name_match:
        base_name = base_name_match.group(1).strip()
    else:
        base_name = desired_project_name

    # Step 2: Query for existing projects by this user that might conflict
    # Using 'ilike' for case-insensitive matching if your DB supports it,
    # otherwise use 'like' or adjust as needed.
    existing_projects_query = supabase.table(PROJECTS_TABLE)\
        .select('project_name', 'project_id')\
        .ilike('project_name', f"{base_name}%")\
        .eq('user_id', user_id)\
        .execute()
    
    existing_names_by_user = []
    if existing_projects_query.data:
        for p in existing_projects_query.data:
            # Exclude the current project_id's name if we are updating it.
            # This prevents a project from conflicting with its own existing name.
            if current_project_id and p.get('project_id') == current_project_id:
                continue
            existing_names_by_user.append(p['project_name'])

    suggested_name = desired_project_name # Start with the desired name
    
    # Check if the desired_project_name itself already exists exactly among *other* projects
    if desired_project_name in existing_names_by_user:
        is_conflict_found = True
    else:
        is_conflict_found = False

    if is_conflict_found:
        highest_num = 0
        duplicate_pattern_with_num = re.compile(r" \(Duplicate (\d+)\)$")
        # Ensure the pattern for " (Duplicate)" without a number is also handled
        duplicate_pattern_no_num = re.compile(r" \(Duplicate\)$") 

        # Iterate through existing names to find the highest duplicate number
        for name in existing_names_by_user:
            match_with_num = duplicate_pattern_with_num.search(name)
            match_no_num = duplicate_pattern_no_num.search(name)

            if match_with_num:
                try:
                    num = int(match_with_num.group(1))
                    if num > highest_num:
                        highest_num = num
                except ValueError:
                    continue # Skip if number part is not an int
            elif match_no_num:
                # If " (Duplicate)" exists without a number, treat it as highest_num = 1
                # unless a higher numbered duplicate is found.
                if highest_num == 0:
                    highest_num = 1
        
        # Suggest the next available duplicate number
        new_duplicate_num = highest_num + 1
        suggested_name = f"{base_name} (Duplicate {new_duplicate_num})"
        
        # Recursively check if the newly suggested name also conflicts
        # This handles cases where "My Project (Duplicate 1)" and "My Project (Duplicate 2)" exist,
        # and we need to suggest "My Project (Duplicate 3)".
        return get_unique_project_name(suggested_name, user_id, current_project_id)
    
    return suggested_name
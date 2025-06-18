import time
from functools import wraps
from flask import jsonify, request, current_app
from supabase import create_client, Client
from gotrue.errors import AuthApiError # Make sure this is imported if you're using it to catch specific errors
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# Initialize a *separate* Supabase client for admin operations in this module.
# This client uses the SERVICE_ROLE_KEY and is able to verify tokens.
try:
    supabase_admin_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
except Exception as e:
    current_app.logger.error(f"Failed to initialize Supabase admin client in JWTexpired.py: {e}")
    # In a real app, you might want to raise an exception or exit if the client cannot be initialized
    # For now, logging the error is sufficient.

# Wrapper for checking if user is logged in and token is valid
def require_active_session(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return jsonify({"error": "Authorization token is missing"}), 401

        try:
            token_type, access_token = auth_header.split(None, 1)
            if token_type.lower() != 'bearer':
                return jsonify({"error": "Unsupported authorization type"}), 401
        except ValueError:
            return jsonify({"error": "Invalid Authorization header format"}), 401

        if not access_token:
            return jsonify({"error": "Access token is missing"}), 401

        try:
            # CORRECTED LOGIC HERE:
            # Use supabase_admin_client.auth.get_user(jwt=access_token)
            # This method directly verifies the JWT using the service role key.
            user_response = supabase_admin_client.auth.get_user(jwt=access_token)

            # The get_user(jwt=...) method returns a GoTrueUserResponse.
            # It will either raise AuthApiError for truly invalid/expired tokens,
            # or return a UserResponse object. We check for user_response.user
            # to see if a valid user was found.

            # We DO NOT check `user_response.error` directly as UserResponse objects
            # do not have this attribute. AuthApiError is raised for explicit errors.

            if user_response and user_response.user:
                # If a valid user object is found, proceed
                request.current_user_id = user_response.user.id
                return func(*args, **kwargs)
            else:
                # This means the token was processed by get_user, but no valid user was linked.
                # This could happen if the user was deleted after the token was issued, etc.
                current_app.logger.warning(f"No user object found in response for token: {access_token[:20]}...")
                return jsonify({"error": "No user found for the provided token. Please log in again."}), 401
            
        except AuthApiError as e:
            # This block catches errors specifically raised by GoTrue (like token expired, invalid signature).
            current_app.logger.warning(f"AuthApiError during token verification: {e.message}")
            return jsonify({"error": e.message or "Invalid or expired token. Please log in again."}), 401
        except Exception as e:
            # Catch broader unexpected exceptions during the process.
            current_app.logger.error(f"Unexpected error during token verification: {e}", exc_info=True)
            return jsonify({"error": "Internal server error during authentication"}), 500

    return wrapper
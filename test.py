# test_api.py - Run this separately to test your API key
import os
try:
    print("Step 1: Importing modules...")
    import os
    print("✓ os imported")
    
    from dotenv import load_dotenv
    print("✓ dotenv imported")
    
    from openai import OpenAI
    print("✓ openai imported")
    
    print("Step 2: Loading environment...")
    load_dotenv()
    print("✓ Environment loaded")
    
    print("Step 3: Getting API key...")
    api_key = os.getenv('OPENROUTER_API_KEY')
    print(f"✓ API Key retrieved")
    print(os.getenv("OPENROUTER_API_KEY"))
    print(f"API Key loaded: {'Yes' if api_key else 'No'}")
    print(f"API Key length: {len(api_key) if api_key else 0}")
    
    # Check if .env file exists
    env_exists = os.path.exists('.env')
    print(f".env file exists: {env_exists}")
    
    # List all environment variables that start with OPENROUTER

    print("Environment variables starting with OPENROUTER:")
    for key, value in os.environ.items():
        if key.startswith('OPENROUTER'):
            print(f"  {key}: {'SET' if value else 'EMPTY'}")
    print(api_key)
    if api_key:
        print("Step 4: Testing API connection...")
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
            timeout=60
        )
        
        try:
            response = client.chat.completions.create(  
                extra_headers ={
                    "HTTP-Referer": "http://localhost:5000/"
                },
                model="deepseek/deepseek-chat-v3-0324:free",
                messages=[
                    {"role": "user", "content": "Hello, just testing the API connection."}
                ]
            )
            print("✓ API Test SUCCESS!")
            print("Response:", response.choices[0].message.content)
            
        except Exception as e:
            print("✗ API Test FAILED!")
            print("Error:", str(e))
            print("Error type:", type(e).__name__)
    else:
        print("✗ No API key found!")
        
        # Check if we're in the right directory
        print(f"Current working directory: {os.getcwd()}")
        print(f"Files in current directory: {os.listdir('.')}")

except ImportError as e:
    print(f"✗ Import error: {e}")
    print("Make sure you have installed: pip install openai python-dotenv")
except Exception as e:
    print(f"✗ Unexpected error: {e}")
    print(f"Error type: {type(e).__name__}")

print("=== API TEST COMPLETE ===")
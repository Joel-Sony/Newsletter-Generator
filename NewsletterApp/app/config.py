import os
from dotenv import load_dotenv
load_dotenv()
OPENROUTER_API_KEY=os.getenv("OPENROUTER_API_KEY")
CONVERT_API_SECRET=os.getenv("CONVERT_API_SECRET")
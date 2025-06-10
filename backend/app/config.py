import os
from dotenv import load_dotenv
load_dotenv(override=True)
OPENROUTER_API_KEY=os.getenv("OPENROUTER_API_KEY")
CONVERT_API_SECRET=os.getenv("CONVERT_API_SECRET")
IMAGEROUTER_API_KEY=os.getenv("IMAGEROUTER_API_KEY")
OUTPUT_PATH="/home/joel/Documents/Newsletter-Generator/backend/app/utils/generatedHTMLs"
INPUT_PATH="/home/joel/Documents/Newsletter-Generator/backend/pdfs"
SUPABASE_URL=os.getenv("SUPABASE_URL")
SUPABASE_KEY=os.getenv("SUPABASE_KEY")
SECRET_KEY=os.getenv("SECRET_KEY")
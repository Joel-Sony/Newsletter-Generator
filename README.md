# Newsletter Generator Web Application
This document provides a comprehensive overview of the Newsletter Generator web application, detailing its architecture, setup instructions, AI capabilities, database schema, and API endpoints.


## Project Overview

App Name: Newsletter Generator  
Purpose: This application empowers users to effortlessly create professional newsletters. It leverages AI to generate engaging content, which can either be inserted into a dynamically created HTML template or integrated into a user-provided PDF template. The app also includes a robust versioning system to track changes and manage newsletter iterations.  

### Tech Stack:

- Frontend: React
- Backend: Flask (Python)
- Database: Supabase (PostgreSQL)
- AI Services: OpenAI SDK, Gemini 2.5 Flash (via Google Studio API)
- PDF Parsing/Templating: ConvertAPI (for PDF to HTML conversion)
- BeautifulSoup (for HTML parsing)



# Screenshots
#### Homepage:
![Homepage Screenshot](https://i.ibb.co/Fqyfhdss/Screenshot-from-2025-06-21-18-57-11.png)
---
#### Generator:
![Homepage Screenshot](https://i.ibb.co/s9P0qC3c/Screenshot-from-2025-06-21-18-57-20.png)
---
#### Editor:
![Editor Screenshot](https://i.ibb.co/8nsgcXQ6/Screenshot-from-2025-06-21-18-58-59.png)
---
#### Version Page:
![Versions Screenshot](https://i.ibb.co/S7NnjzfK/Screenshot-from-2025-06-21-18-59-56.png)



## Key Features
AI-generated Newsletter Content: Generate full newsletter content based on a topic and user prompt, adhering to a specified tone.


PDF Template-based Content Insertion: Upload a PDF template, and the LLM will generate content tailored to the template's structure and insert it into corresponding placeholders.


Versioning System: Automatically saves new versions of newsletters, allowing users to view and restore previous iterations.


Drag-and-Drop Editable Interface: The generated HTML can be edited in a drag and drop interface.

## Getting Started
### Backend Setup
- Python 3.9+
- Node.js 18+ (Recommended: LTS version)
- npm or yarn
- ConvertAPI key
- API keys for OpenRouter or Gemini via Google Studio
- Backend Setup (Flask)

Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
Set environment variables
```

Create a .env file in the backend root:

```env
SUPABASE_URL="your_supabase_project_url"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
OPENROUTER_API_KEY="..."
GOOGLE_STUDIO_API_KEY="..."
CONVERT_API_SECRET="...   
IMAGEROUTER_API_KEY="..." #generate from https://ir.myqa.cc/
JWT_SECRET_KEY="..."      #from supabase
```
Run the backend

```bash
flask run  # or python app.py
```

### Frontend Setup (React + Vite)
Install dependencies

```bash
cd newsletter-frontend
npm install
```
Environment setup

Create a .env file inside newsletter-frontend/:

```env
VITE_FLASK_API_BASE_URL="http://localhost:5000/api"
VITE_SUPABASE_URL="your_supabase_project_url"
VITE_SUPABASE_ANON_KEY="your_anon_key"
```
Run the frontend

```bash
npm run dev
```

This starts the app at http://localhost:5173


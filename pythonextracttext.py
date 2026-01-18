from google import genai
from google.genai import types
import psycopg2
from psycopg2.extras import Json
import json
import datetime
import os
import time
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
DB_CONFIG = {
    "dbname": "suraj_website",
    "user": "surajpostgresdb",
    "password": "suraj2308@postgres",
    "host": "100.124.35.7",
    "port": "5432"
}

PDF_PATH = "/Users/sudarshanrajagopalan/Developer/Sudarshan-SelfHosted-Portfolio/data/SUDARSHAN-RAJAGOPALAN-Resume.pdf"
MODEL_ID = "gemini-3-flash-preview" 

# --- 1. Database Fetching ---
def get_current_db_state(cursor):
    """
    Fetches the current data to provide context to the LLM.
    """
    tables = ['profile', 'experience', 'projects', 'skills', 'certifications']
    current_state = {}
    
    for table in tables:
        try:
            cursor.execute(f"SELECT * FROM {table}")
            columns = [desc[0] for desc in cursor.description]
            results = []
            for row in cursor.fetchall():
                row_dict = dict(zip(columns, row))
                # Handle dates for JSON serialization
                for k, v in row_dict.items():
                    if isinstance(v, (datetime.date, datetime.datetime)):
                        row_dict[k] = str(v)
                results.append(row_dict)
            current_state[table] = results
        except psycopg2.Error as e:
            print(f"Warning: Could not fetch table {table}: {e}")
            current_state[table] = []
        
    return current_state

# --- 2. GenAI Processing ---
def analyze_with_gemini(pdf_path, current_db_state):
    """
    Uploads PDF to Gemini and asks for a JSON object matching the DB schema.
    """
    
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    print(f"Uploading file: {pdf_path}...")
    try:
        # Upload the file
        file_ref = client.files.upload(file=pdf_path)
        print(f"File uploaded successfully: {file_ref.name}")
        
        # Wait for processing (usually fast for small PDFs, but good practice)
        # Note: GenAI SDK usually handles readiness check or we can just proceed.
        # If needed: while file_ref.state.name == "PROCESSING": ...
        
    except Exception as e:
        print(f"Error uploading file: {e}")
        # If upload fails, we might still want to try text (if we had it) but here we rely on file
        raise e

    schema_desc = """
    1. profile (name, title, subtitle, about_me, social_links dict)
    2. experience (company, role, start_date YYYY-MM-DD, end_date YYYY-MM-DD or null, location, achievements list)
    3. projects (title, description, tech_stack list, repo_link, live_link, featured bool)
    4. skills (category, items list)
    5. certifications (name, issuer, issue_date YYYY-MM-DD, credential_url)
    """

    prompt = f"""
    You are a Data Extraction Assistant. I have provided a Resume PDF and the current state of a PostgreSQL Database.
    
    YOUR GOAL: Extract data from the resume to populate/update the database tables.
    
    --- CURRENT DATABASE STATE ---
    {json.dumps(current_db_state)}
    
    INSTRUCTIONS:
    1. Parse the Resume PDF (text and links).
    2. Map the data to the 5 tables defined below.
    3. Compare with 'CURRENT DATABASE STATE'. 
       - If a record exists (matching Company/Role or Project Title), use the EXISTING ID.
       - If it is new, do not include an ID.
       - **CRITICAL**: Do NOT include 'resume_url' in the profile.
    4. Return ONLY a valid JSON object.
    
    TARGET JSON STRUCTURE:
    {{
        "profile": {{ ... }},
        "experience": [ {{ ... }}, ... ],
        "projects": [ {{ ... }}, ... ],
        "skills": [ {{ ... }}, ... ],
        "certifications": [ {{ ... }}, ... ]
    }}
    
    Schema Guide:
    {schema_desc}
    """

    print(f"Generating content using {MODEL_ID}...")
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[
                file_ref,
                "\n\n",
                prompt,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        # Clean up text just in case, though response_mime_type should enforce JSON
        raw_response = response.text
        clean_json = raw_response.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)

    except Exception as e:
        print(f"GenAI Error: {e}")
        raise e

# --- 3. Database Updates ---
def update_database(cursor, data):
    """
    Takes the JSON data and performs UPSERTS.
    """
    
    # 1. Profile
    p = data.get('profile')
    if isinstance(p, list): p = p[0] if p else None # Handle list return
    
    if p:
        print(f"Updating Profile: {p.get('name')}")
        cursor.execute("""
            INSERT INTO profile (id, name, title, subtitle, about_me, social_links)
            VALUES (COALESCE(%s, 1), %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
            name=EXCLUDED.name, title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, 
            about_me=EXCLUDED.about_me, social_links=EXCLUDED.social_links;
        """, (
            p.get('id', 1), p.get('name'), p.get('title'), p.get('subtitle'), 
            p.get('about_me'), Json(p.get('social_links', {}))
        ))

    # 2. Experience
    for exp in data.get('experience', []):
        print(f"Processing Experience: {exp.get('company')}")
        
        # Sanitize dates
        start_date = exp.get('start_date')
        end_date = exp.get('end_date')
        if end_date and isinstance(end_date, str) and end_date.lower() == 'present':
            end_date = None
            
        if 'id' in exp and exp['id']:
            cursor.execute("""
                UPDATE experience SET company=%s, role=%s, start_date=%s, end_date=%s, location=%s, achievements=%s
                WHERE id=%s
            """, (exp['company'], exp['role'], start_date, end_date, exp.get('location'), Json(exp.get('achievements', [])), exp['id']))
        else:
            cursor.execute("""
                INSERT INTO experience (company, role, start_date, end_date, location, achievements)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (exp['company'], exp['role'], start_date, end_date, exp.get('location'), Json(exp.get('achievements', []))))

    # 3. Projects
    for proj in data.get('projects', []):
        print(f"Processing Project: {proj.get('title')}")
        if 'id' in proj and proj['id']:
            cursor.execute("""
                UPDATE projects SET title=%s, description=%s, tech_stack=%s, repo_link=%s, live_link=%s
                WHERE id=%s
            """, (proj['title'], proj['description'], Json(proj.get('tech_stack', [])), proj.get('repo_link'), proj.get('live_link'), proj['id']))
        else:
            cursor.execute("""
                INSERT INTO projects (title, description, tech_stack, repo_link, live_link)
                VALUES (%s, %s, %s, %s, %s)
            """, (proj['title'], proj['description'], Json(proj.get('tech_stack', [])), proj.get('repo_link'), proj.get('live_link')))

    # 4. Skills
    for skill in data.get('skills', []):
        print(f"Processing Skill Category: {skill.get('category')}")
        if 'id' in skill and skill['id']:
             cursor.execute("UPDATE skills SET items=%s WHERE id=%s", (Json(skill['items']), skill['id']))
        else:
            cursor.execute("SELECT id FROM skills WHERE category = %s", (skill['category'],))
            exists = cursor.fetchone()
            if exists:
                cursor.execute("UPDATE skills SET items=%s WHERE id=%s", (Json(skill['items']), exists[0]))
            else:
                cursor.execute("INSERT INTO skills (category, items) VALUES (%s, %s)", (skill['category'], Json(skill['items'])))

    # 5. Certifications
    for cert in data.get('certifications', []):
        print(f"Processing Cert: {cert.get('name')}")
        if 'id' in cert and cert['id']:
            cursor.execute("""
                UPDATE certifications SET name=%s, issuer=%s, issue_date=%s, credential_url=%s
                WHERE id=%s
            """, (cert['name'], cert['issuer'], cert.get('issue_date'), cert.get('credential_url'), cert['id']))
        else:
            cursor.execute("""
                INSERT INTO certifications (name, issuer, issue_date, credential_url)
                VALUES (%s, %s, %s, %s)
            """, (cert['name'], cert['issuer'], cert.get('issue_date'), cert.get('credential_url')))

# --- Main Execution ---
if __name__ == "__main__":
    conn = None
    try:
        if not os.environ.get("GEMINI_API_KEY"):
             print("Error: GEMINI_API_KEY environment variable not set.")
             exit(1)

        # Connect to DB
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False 
        cur = conn.cursor()

        # 1. Get Current State
        print("Fetching current database state...")
        current_state = get_current_db_state(cur)
        print(current_state)
        # 2. Analyze with Gemini (Upload + Generate)
        print("Analyzing data with Gemini...")
        structured_data = analyze_with_gemini(PDF_PATH, current_state)
        print(structured_data)
        # 3. Update Database
        print("Updating database...")
        update_database(cur, structured_data)

        conn.commit()
        print("Success! Database updated.")

    except Exception as e:
        print(f"An error occurred: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            cur.close()
            conn.close()
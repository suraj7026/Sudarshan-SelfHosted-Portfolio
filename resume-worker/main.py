"""
Resume Worker - MinIO Webhook Handler

FastAPI application that receives MinIO webhook events for PDF uploads,
extracts text from the PDF, and triggers the ResumeAgent to update the portfolio database.
"""

import os
import logging
from urllib.parse import unquote
from typing import Any

import fitz  # PyMuPDF
import boto3
from botocore.config import Config
from fastapi import FastAPI, BackgroundTasks, Request
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://172.17.0.1:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "admin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "YourStrongPassword")
BUCKET_NAME = os.getenv("BUCKET_NAME", "surajwebsite")

# ============================================================================
# MINIO CLIENT
# ============================================================================

s3_client = boto3.client(
    "s3",
    endpoint_url=MINIO_ENDPOINT,
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    verify=False  # For self-hosted SSL
)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    logger.info(f"📄 Extracting text from: {file_path}")
    
    doc = fitz.open(file_path)
    text_content = []
    
    for page_num, page in enumerate(doc, 1):
        text = page.get_text()
        text_content.append(f"--- Page {page_num} ---\n{text}")
    
    doc.close()
    
    full_text = "\n\n".join(text_content)
    logger.info(f"✅ Extracted {len(full_text)} characters from {len(text_content)} pages")
    return full_text


def process_resume_job(file_key: str) -> None:
    """
    Background task to process a resume PDF.
    
    1. Downloads the file from MinIO
    2. Extracts text using PyMuPDF
    3. Runs the ResumeAgent to update the portfolio database
    4. Cleans up the temp file
    """
    temp_path = f"/tmp/{os.path.basename(file_key)}"
    
    try:
        logger.info(f"🚀 Starting resume processing for: {file_key}")
        
        # Step 1: Download file from MinIO
        logger.info(f"⬇️ Downloading from MinIO: {BUCKET_NAME}/{file_key}")
        s3_client.download_file(BUCKET_NAME, file_key, temp_path)
        logger.info(f"✅ Downloaded to: {temp_path}")
        
        # Step 2: Extract text from PDF
        resume_text = extract_text_from_pdf(temp_path)
        
        if not resume_text.strip():
            logger.warning("⚠️ No text extracted from PDF")
            return
        
        # Step 3: Run the ResumeAgent
        logger.info("🤖 Running ResumeAgent...")
        from ResumeAgent import update_portfolio_from_resume
        
        result = update_portfolio_from_resume(resume_text)
        
        # Log results
        logger.info("=" * 60)
        logger.info("🎯 RESUME PROCESSING COMPLETE")
        logger.info("=" * 60)
        logger.info(f"   Summary: {result.get('summary', 'N/A')}")
        logger.info(f"   Changes Detected: {result.get('changes_detected', False)}")
        logger.info(f"   SQL Queries Executed: {result.get('queries_executed', 0)}")
        
        if result.get('sql_queries'):
            logger.info(f"   Updates Applied: {len(result['sql_queries'])}")
            for i, query in enumerate(result['sql_queries'][:5], 1):
                logger.info(f"      {i}. {query[:80]}...")
        
    except Exception as e:
        logger.error(f"❌ Error processing resume: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Step 4: Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            logger.info(f"🗑️ Cleaned up temp file: {temp_path}")


# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="Resume Worker",
    description="MinIO Webhook Handler for Resume PDF Processing",
    version="1.0.0"
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "resume-worker",
        "status": "healthy",
        "minio_endpoint": MINIO_ENDPOINT,
        "bucket": BUCKET_NAME
    }


@app.get("/health")
async def health():
    """Health check for container orchestration."""
    return {"status": "ok"}


@app.post("/webhook")
async def minio_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Handle MinIO webhook events.
    
    Only processes ObjectCreated:Put events for files matching:
    - Prefix: resume/
    - Suffix: .pdf
    """
    try:
        payload: dict[str, Any] = await request.json()
    except Exception as e:
        logger.error(f"❌ Failed to parse JSON payload: {e}")
        return {"status": "error", "message": "Invalid JSON payload"}
    
    # Log incoming event
    event_name = payload.get("EventName", "unknown")
    logger.info(f"📨 Received webhook event: {event_name}")
    
    # Validate event type - must be ObjectCreated:Put
    if "ObjectCreated:Put" not in event_name and "s3:ObjectCreated:Put" not in event_name:
        logger.info(f"⏭️ Ignoring non-put event: {event_name}")
        return {"status": "ignored", "reason": f"Event type not supported: {event_name}"}
    
    # Extract object key from payload
    # MinIO sends different payload formats, handle both
    file_key = None
    
    # Format 1: Direct "Key" field
    if "Key" in payload:
        file_key = unquote(payload["Key"])
    
    # Format 2: Nested in Records array (S3-compatible format)
    elif "Records" in payload and len(payload["Records"]) > 0:
        record = payload["Records"][0]
        if "s3" in record and "object" in record["s3"]:
            file_key = unquote(record["s3"]["object"].get("key", ""))
    
    if not file_key:
        logger.warning("⚠️ Could not extract file key from payload")
        logger.debug(f"Payload: {payload}")
        return {"status": "error", "message": "Could not extract file key"}
    
    logger.info(f"📁 Raw file key: {file_key}")
    
    # Fix: MinIO sends "bucketname/resume/file.pdf", but we only want "resume/file.pdf"
    if file_key.startswith(f"{BUCKET_NAME}/"):
        file_key = file_key.replace(f"{BUCKET_NAME}/", "", 1)
        logger.info(f"📁 Stripped bucket prefix, file key: {file_key}")
    
    # Filter: Only process resume/*.pdf files
    # Check for "/resume/" anywhere in the path (handles full bucket paths like surajwebsite/resume/file.pdf)
    if "/resume/" not in file_key and not file_key.startswith("resume/"):
        logger.info(f"⏭️ Ignoring file outside resume/ folder: {file_key}")
        return {"status": "ignored", "reason": "File not in resume/ folder"}
    
    if not file_key.lower().endswith(".pdf"):
        logger.info(f"⏭️ Ignoring non-PDF file: {file_key}")
        return {"status": "ignored", "reason": "File is not a PDF"}
    
    # Log the trigger
    logger.info(f"🔔 Triggered: {file_key}")
    
    # Add processing job to background tasks
    logger.info(f"✅ Queuing resume processing job for: {file_key}")
    background_tasks.add_task(process_resume_job, file_key)
    
    return {
        "status": "accepted",
        "message": f"Processing queued for: {file_key}"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)

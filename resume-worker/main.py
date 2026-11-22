"""Receive MinIO resume notifications and process them through a durable queue."""
import logging
import os
import sqlite3
import tempfile
import threading
import time
from contextlib import closing
from urllib.parse import unquote_plus

import boto3
import fitz
from botocore.config import Config
from fastapi import FastAPI, HTTPException, Request
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)
BUCKET = os.getenv('BUCKET_NAME', 'surajwebsite')
QUEUE_PATH = os.getenv('QUEUE_PATH', '/data/resume-jobs.sqlite3')
s3 = boto3.client('s3', endpoint_url=os.getenv('MINIO_ENDPOINT', 'http://127.0.0.1:9000'),
                  aws_access_key_id=os.environ['MINIO_ACCESS_KEY'], aws_secret_access_key=os.environ['MINIO_SECRET_KEY'],
                  config=Config(signature_version='s3v4', connect_timeout=5, read_timeout=30, retries={'max_attempts': 2}))
app = FastAPI(title='Resume Worker')
stop_event = threading.Event()


def connect_queue():
    conn = sqlite3.connect(QUEUE_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_queue():
    os.makedirs(os.path.dirname(os.path.abspath(QUEUE_PATH)), exist_ok=True)
    with closing(connect_queue()) as conn, conn:
        conn.execute('CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY, object_key TEXT NOT NULL, status TEXT NOT NULL DEFAULT "pending", attempts INTEGER NOT NULL DEFAULT 0, next_attempt REAL NOT NULL DEFAULT 0, error TEXT)')
        conn.execute('UPDATE jobs SET status = "pending" WHERE status = "running"')


def extract_text_from_pdf(path):
    with fitz.open(path) as doc:
        text = '\n\n'.join(page.get_text() for page in doc)
    if not text.strip():
        raise ValueError('PDF contains no extractable text')
    return text


def process_resume_job(key):
    from ResumeAgent import update_portfolio_from_resume
    with tempfile.TemporaryDirectory(prefix='resume-worker-') as directory:
        path = os.path.join(directory, 'resume.pdf')
        s3.download_file(BUCKET, key, path)
        result = update_portfolio_from_resume(extract_text_from_pdf(path))
        logger.info('Resume processing complete for %s: %s', key, result['summary'])


def worker_loop():
    while not stop_event.is_set():
        job = None
        try:
            with closing(connect_queue()) as conn, conn:
                job = conn.execute('SELECT * FROM jobs WHERE status = "pending" AND next_attempt <= ? ORDER BY id LIMIT 1', (time.time(),)).fetchone()
                if job:
                    conn.execute('UPDATE jobs SET status = "running", attempts = attempts + 1 WHERE id = ?', (job['id'],))
            if not job:
                stop_event.wait(2)
                continue
            logger.info('Processing job %s for %s', job['id'], job['object_key'])
            process_resume_job(job['object_key'])
            with closing(connect_queue()) as conn, conn:
                conn.execute('UPDATE jobs SET status = "done", error = NULL WHERE id = ?', (job['id'],))
        except Exception as exc:
            logger.exception('Resume processing failed')
            if job:
                with closing(connect_queue()) as conn, conn:
                    attempts = job['attempts'] + 1
                    conn.execute('UPDATE jobs SET status = ?, next_attempt = ?, error = ? WHERE id = ?',
                                 ('failed' if attempts >= 3 else 'pending', time.time() + 30 * attempts, str(exc)[:500], job['id']))
            stop_event.wait(2)


@app.on_event('startup')
def startup():
    initialize_queue()
    stop_event.clear()
    threading.Thread(target=worker_loop, name='resume-worker', daemon=True).start()


@app.on_event('shutdown')
def shutdown():
    stop_event.set()


@app.get('/health')
def health():
    try:
        s3.head_bucket(Bucket=BUCKET)
        import psycopg2
        with psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=5) as conn:
            with conn.cursor() as cursor:
                cursor.execute('SELECT 1')
        with closing(connect_queue()) as conn:
            failed = conn.execute('SELECT count(*) FROM jobs WHERE status = "failed"').fetchone()[0]
    except Exception as exc:
        logger.warning('Readiness check failed: %s', exc)
        raise HTTPException(status_code=503, detail='Dependency unavailable') from exc
    return {'status': 'ok' if not failed else 'degraded', 'failed_jobs': failed}


@app.get('/')
def root():
    return {'service': 'resume-worker'}


@app.post('/webhook')
async def minio_webhook(request: Request):
    try:
        payload = await request.json()
        if not isinstance(payload, dict):
            raise ValueError('Expected object')
    except Exception as exc:
        raise HTTPException(status_code=400, detail='Invalid JSON payload') from exc
    records = payload.get('Records')
    events = records if isinstance(records, list) and records else [payload]
    keys = []
    for event in events:
        if not isinstance(event, dict):
            continue
        name = event.get('eventName') or payload.get('EventName', '')
        if not isinstance(name, str) or 'ObjectCreated' not in name:
            continue
        s3_event = event.get('s3') or {}
        bucket = (s3_event.get('bucket') or {}).get('name', BUCKET)
        key = (s3_event.get('object') or {}).get('key') or payload.get('Key', '')
        if not isinstance(key, str) or bucket != BUCKET:
            continue
        key = unquote_plus(key)
        if key.startswith(BUCKET + '/'):
            key = key[len(BUCKET) + 1:]
        if key.startswith('resume/') and key.lower().endswith('.pdf'):
            keys.append(key)
    if not keys:
        return {'status': 'ignored'}
    try:
        with closing(connect_queue()) as conn, conn:
            conn.executemany('INSERT INTO jobs (object_key) VALUES (?)', [(key,) for key in keys])
    except sqlite3.Error as exc:
        logger.exception('Failed to persist webhook')
        raise HTTPException(status_code=503, detail='Queue unavailable') from exc
    return {'status': 'accepted', 'queued': len(keys)}

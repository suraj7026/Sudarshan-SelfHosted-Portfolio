FROM python:3.12-slim@sha256:aa943ce411423c7582288f18707ff66eddcbaeb510502d747a72aeb34f30d159
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY resume-worker/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && pip check \
    && groupadd --gid 10001 app && useradd --uid 10001 --gid 10001 --no-create-home app
COPY resume-worker/main.py resume-worker/ResumeAgent.py ./
USER 10001:10001
EXPOSE 5000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]

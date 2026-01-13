FROM mcr.microsoft.com/playwright/python:v1.48.0-jammy

WORKDIR /srv

# Install deps
COPY requirements.txt /srv/requirements.txt
RUN pip install --no-cache-dir -r /srv/requirements.txt

# Copy backend code (includes app/)
COPY . /srv

# Ensure "app" package is importable
ENV PYTHONPATH=/srv

ENV PORT=8000
EXPOSE 8000

# Sanity checks (prints in Render logs) + start server
CMD ["sh", "-c", "ls -la /srv && ls -la /srv/app && python -c \"import app.main\" && uvicorn app.main:app --host 0.0.0.0 --port $PORT"]

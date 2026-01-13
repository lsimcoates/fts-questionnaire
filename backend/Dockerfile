FROM mcr.microsoft.com/playwright/python:v1.48.0-jammy

# Put the repo in /app
WORKDIR /app

# Install deps from backend requirements
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend source
COPY backend /app/backend

# Run from backend folder (so `main.py` is importable as `main`)
WORKDIR /app/backend

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "ls -la && python -c \"import main\" && uvicorn main:app --host 0.0.0.0 --port $PORT"]

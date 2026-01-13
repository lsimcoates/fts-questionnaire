FROM mcr.microsoft.com/playwright/python:v1.48.0-jammy

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# DEBUG: prove main.py exists and show python import path
RUN echo "PWD:" && pwd && echo "FILES:" && ls -la
RUN python -c "import sys; print('PYTHONPATH:', sys.path)"

ENV PORT=8000
EXPOSE 8000

# DEBUG: print real traceback if import fails
CMD ["sh", "-c", "python -c \"import main\" && uvicorn main:app --host 0.0.0.0 --port $PORT"]

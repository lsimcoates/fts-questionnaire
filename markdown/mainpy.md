# FastAPI App Entry Point (main.py) – Simple Guide

This file creates and configures the **FastAPI backend** for the FTS Questionnaire project.

It does 4 main things:
1. Creates the FastAPI app
2. Enables CORS so the React frontend can call the API
3. Adds a health check endpoint
4. Registers the questionnaire API routes and serves static files

---

## 1) Create the FastAPI app

```py
app = FastAPI(title="FTS Questionnaire API")
app is the main FastAPI application object
The title shows up in the automatic docs (Swagger UI)

2) Enable CORS (frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://lsimcoates.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Why this exists
Browsers block requests between different domains unless CORS allows it.
This setup allows:
Local React dev site: http://localhost:3000
GitHub Pages frontend: https://lsimcoates.github.io
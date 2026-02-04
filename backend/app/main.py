from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.questionnaires import router as questionnaires_router
from app.api.admin import router as admin_router
from app.auth.router import router as auth_router

app = FastAPI(title="FTS Questionnaire API")

# ✅ CORS (cookies require allow_credentials + explicit origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://lsimcoates.github.io",
        # Optional: if you ever host the frontend somewhere else, add it here.
        # "https://your-frontend-domain.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

# ✅ Routers
app.include_router(auth_router, prefix="/api")
app.include_router(questionnaires_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

# ✅ Static assets (if used for PDF templates etc.)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

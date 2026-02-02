from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.questionnaires import router as questionnaires_router


app = FastAPI(title="FTS Questionnaire API")

from app.auth.router import router as auth_router
app.include_router(auth_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://lsimcoates.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

app.include_router(questionnaires_router, prefix="/api")

from fastapi.staticfiles import StaticFiles

app.mount("/static", StaticFiles(directory="app/static"), name="static")



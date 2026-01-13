from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.questionnaires import router as questionnaires_router

app = FastAPI(title="FTS Questionnaire API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

app.include_router(questionnaires_router, prefix="/api")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import lessons, tutor, assessment

app = FastAPI(
    title=settings.APP_NAME,
    description="Autonomous STEM Video & SymPy Verification Engine using LangGraph, Manim CE, and Qdrant RAG.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register sub-routers
app.include_router(lessons.router)
app.include_router(tutor.router)
app.include_router(assessment.router)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "engine": {
            "langgraph": "active",
            "manim_ce": "ready",
            "sympy": "ready",
            "qdrant_rag": "ready"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

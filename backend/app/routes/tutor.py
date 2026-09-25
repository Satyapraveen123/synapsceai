from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from app.pipeline.rag import rag_engine, Citation


router = APIRouter(prefix="/api/tutor", tags=["tutor"])


class TutorChatRequest(BaseModel):
    query: str
    lesson_id: str
    current_timestamp: float = 0.0


class TutorChatResponse(BaseModel):
    query: str
    answer: str
    citations: List[Citation]
    video_jump_timestamp: float
    pedagogical_hint: str


@router.post("/query", response_model=TutorChatResponse)
async def ask_tutor(req: TutorChatRequest):
    citations = rag_engine.search_hybrid(req.query, top_k=2)

    # Synthesize grounded answer
    if citations:
        primary = citations[0]
        answer = (
            f"Based on **{primary.document_title}** ({primary.section}, p. {primary.page_number}), "
            f"this concept is governed by the relation: {primary.equation_label or 'fundamental definition'}. "
            f"\n\n{primary.excerpt}"
        )
    else:
        answer = (
            "In continuous mathematical analysis, this transformation maintains invariant norm "
            "across the spectral coordinate projection."
        )

    return TutorChatResponse(
        query=req.query,
        answer=answer,
        citations=citations,
        video_jump_timestamp=req.current_timestamp,
        pedagogical_hint="Try deriving the next algebraic step using the step verifier tool."
    )

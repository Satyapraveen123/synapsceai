from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.pipeline.verification import SymPyStepVerifier, StepVerificationResult
from app.pipeline.mastery import curriculum_dag, TopicNode


router = APIRouter(prefix="/api/assessment", tags=["assessment"])


class VerifyStepRequest(BaseModel):
    step_number: int
    current_latex: str
    previous_latex: Optional[str] = None


class MasteryUpdateRequest(BaseModel):
    node_id: str
    quiz_score: int


@router.post("/verify-step", response_model=StepVerificationResult)
async def verify_step(req: VerifyStepRequest):
    result = SymPyStepVerifier.verify_single_step(
        step_number=req.step_number,
        current_latex=req.current_latex,
        previous_latex=req.previous_latex
    )
    return result


@router.get("/curriculum", response_model=List[TopicNode])
async def get_curriculum():
    return curriculum_dag.get_all_nodes()


@router.post("/curriculum/update", response_model=TopicNode)
async def update_mastery(req: MasteryUpdateRequest):
    try:
        updated = curriculum_dag.update_node_mastery(req.node_id, req.quiz_score)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

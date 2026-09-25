import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.pipeline.graph import build_synapse_pipeline, PipelineWorkflowState


router = APIRouter(prefix="/api/lessons", tags=["lessons"])

# In-memory storage for generated lessons and jobs
lesson_jobs: Dict[str, Dict[str, Any]] = {}


class CreateLessonRequest(BaseModel):
    title: str
    topic: str
    content: str
    target_bloom_level: Optional[str] = "Apply"


class LessonResponse(BaseModel):
    job_id: str
    title: str
    topic: str
    status: str
    logs: List[str]
    manim_code: Optional[str] = None
    canonical_equations: List[str] = Field(default_factory=list)
    video_url: Optional[str] = None
    audio_cues: List[Dict[str, Any]] = Field(default_factory=list)
    proof_soundness: Optional[bool] = None


async def run_pipeline_task(job_id: str, title: str, topic: str, content: str):
    graph = build_synapse_pipeline()
    initial_state: PipelineWorkflowState = {
        "job_id": job_id,
        "document_title": title,
        "raw_input_text": content,
        "topic": topic,
        "ingestion": None,
        "proof_result": None,
        "manim_code": "",
        "compilation": None,
        "audio_sync": None,
        "rag_indexed": False,
        "curriculum_node_id": None,
        "current_node": "ingest",
        "logs": [f"Pipeline initialized for job {job_id}"],
        "error": None
    }

    try:
        final_state = graph.invoke(initial_state)
        lesson_jobs[job_id] = {
            "status": "COMPLETED",
            "state": final_state
        }
    except Exception as e:
        lesson_jobs[job_id] = {
            "status": "FAILED",
            "error": str(e),
            "state": initial_state
        }


@router.post("/create", response_model=Dict[str, Any])
async def create_lesson(req: CreateLessonRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())[:8]
    lesson_jobs[job_id] = {
        "status": "PROCESSING",
        "state": {
            "job_id": job_id,
            "document_title": req.title,
            "topic": req.topic,
            "logs": ["Job queued in worker pool..."]
        }
    }

    # Execute asynchronously in background
    background_tasks.add_task(run_pipeline_task, job_id, req.title, req.topic, req.content)

    return {
        "job_id": job_id,
        "status": "PROCESSING",
        "message": f"Pipeline started for {req.title}."
    }


@router.get("/{job_id}")
async def get_lesson(job_id: str):
    if job_id not in lesson_jobs:
        raise HTTPException(status_code=404, detail="Lesson job not found")
    return lesson_jobs[job_id]

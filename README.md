# SynapseAI: Autonomous STEM Video & Verification Engine

SynapseAI transforms complex STEM textbooks, lecture notes, handwritten formulas, and research papers into synchronized **Manim Community Edition animations**, deterministic **SymPy mathematical proof verification**, grounded **RAG conversational tutoring with exact page citations**, and an **interactive Bloom's taxonomy prerequisite DAG**.

---

## 🏛️ System Architecture

```
                    ┌─────────────────────────┐
                    │ Multi-Format Ingestion  │
                    │  (PDF, OCR, LaTeX, Text)│
                    └────────────┬────────────┘
                                 │
                                 ▼
                     ┌──────────────────────┐
                     │ Canonical LaTeX AST  │
                     │  & Equation Parser   │
                     └───────────┬──────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
        ┌─────────────────────┐     ┌─────────────────────┐
        │  SymPy Mathematical │     │  Hybrid Qdrant RAG  │
        │   Proof Verifier    │     │  (Dense + BM25 RRF) │
        └──────────┬──────────┘     └──────────┬──────────┘
                   │                           │
                   ▼                           │
        ┌─────────────────────┐                │
        │ Manim CE Generator  │                │
        │  & Sandbox Compiler │                │
        └──────────┬──────────┘                │
                   │                           │
          [Traceback Fail?]───► Self-Healing   │
                   │            Patch Loop     │
                   ▼                           │
        ┌─────────────────────┐                │
        │  Edge-TTS Narration │                │
        │   & Timestamp Sync  │                │
        └──────────┬──────────┘                │
                   │                           │
                   └─────────────┬─────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │ Synchronized Player    │
                    │ + Grounded RAG Tutor   │
                    │ + SymPy Step Grader    │
                    │ + Bloom's Mastery DAG  │
                    └────────────────────────┘
```

---

## 🚀 Key Modules

1. **LangGraph Pipeline Orchestrator (`backend/app/pipeline/graph.py`)**:
   State machine managing document ingestion, semantic equation chunking, Manim script generation, self-healing compiler loops, audio alignment, vector indexing, and mastery tracking.

2. **Self-Healing Manim Sandbox (`backend/app/pipeline/manim_sandbox.py`)**:
   Runs Manim CE 0.18+ in a restricted sandbox. If compilation or LaTeX rendering fails, extracts stderr tracebacks, invokes the self-healing repair model, and re-compiles until valid video artifacts are produced.

3. **SymPy Step Verifier (`backend/app/pipeline/verification.py`)**:
   Deterministic mathematical equivalence checking. Validates each derivation step without LLM hallucination by computing symbolic difference `simplify(step_a - step_b) == 0`.

4. **Edge-TTS Audio Synchronization (`backend/app/pipeline/audio_sync.py`)**:
   Generates natural voiceover with word-level phonetic boundary timestamps to synchronize video timeline markers with equation highlights.

5. **Hybrid Qdrant Retrieval (`backend/app/pipeline/rag.py`)**:
   Dense vector embeddings + BM25 keyword search combined via Reciprocal Rank Fusion (RRF). Provides strict textbook page and equation citations.

6. **Bloom's Taxonomy Mastery DAG (`backend/app/pipeline/mastery.py`)**:
   Curriculum graph modeling topic dependencies (e.g. Calculus -> Optimization -> Gradient Descent -> Backprop) with cognitive depth scoring across Bloom's levels (Remember to Create).

---

## 🛠️ Quickstart

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.11+ (if running bare-metal)
- ffmpeg, cairo, texlive-full

### Running with Docker Compose
```bash
docker-compose up --build
```
This spins up:
- **Redis**: Port 6379 (message broker & state cache)
- **Qdrant Vector DB**: Port 6333 (hybrid search engine)
- **FastAPI / Celery Worker**: Port 8000 (LangGraph execution & Manim sandbox)
- **Next.js / Vite Frontend**: Port 3000 (interactive STEM dashboard)

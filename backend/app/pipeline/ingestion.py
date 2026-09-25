import re
from typing import List, Dict, Any
from pydantic import BaseModel, Field


class MathChunk(BaseModel):
    chunk_id: str
    chunk_type: str = Field(description="definition | derivation_step | theorem | visual_prompt")
    canonical_latex: str
    plain_text: str
    source_reference: str
    variables: List[str] = Field(default_factory=list)
    sympy_representable: bool = True


class IngestionResult(BaseModel):
    document_title: str
    topic: str
    raw_content: str
    canonical_equations: List[str]
    chunks: List[MathChunk]
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DocumentIngestionPipeline:
    """
    Normalizes multi-format inputs (handwritten OCR, PDF text, raw LaTeX)
    into standardized canonical LaTeX AST nodes with clean variables.
    """

    LATEX_MACRO_REPLACEMENTS = [
        (r"\\dfrac", r"\\frac"),
        (r"\\tfrac", r"\\frac"),
        (r"\\cdot", r"*"),
        (r"\\left\(", "("),
        (r"\\right\)", ")"),
        (r"\\left\[", "["),
        (r"\\right\]", "]"),
        (r"\\left\\{", "{"),
        (r"\\right\\}", "}"),
        (r"\\nabla\^2", r"\\Delta"),
    ]

    @classmethod
    def clean_latex(cls, expression: str) -> str:
        cleaned = expression.strip()
        # Remove markdown math wraps
        cleaned = re.sub(r"^\${1,2}|\${1,2}$", "", cleaned)
        for pattern, replacement in cls.LATEX_MACRO_REPLACEMENTS:
            cleaned = re.sub(pattern, replacement, cleaned)
        return cleaned.strip()

    @classmethod
    def extract_equations_from_text(cls, text: str) -> List[str]:
        # Matches display math and inline math
        display_math = re.findall(r"\$\$(.*?)\$\$", text, flags=re.DOTALL)
        inline_math = re.findall(r"\$(.*?)\$", text)
        equations = display_math + inline_math
        return [cls.clean_latex(eq) for eq in equations if eq.strip()]

    @classmethod
    def process_raw_document(cls, title: str, text: str, topic: str = "") -> IngestionResult:
        equations = cls.extract_equations_from_text(text)
        chunks: List[MathChunk] = []

        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        for idx, para in enumerate(paragraphs):
            para_equations = cls.extract_equations_from_text(para)
            primary_eq = para_equations[0] if para_equations else ""

            # Extract variable symbols using regex
            var_candidates = re.findall(r"\b([a-zA-Z]_\w|[a-zA-Z])\b", primary_eq)
            unique_vars = sorted(list(set(var_candidates)))[:6]

            chunks.append(
                MathChunk(
                    chunk_id=f"chunk_{idx+1:03d}",
                    chunk_type="derivation_step" if para_equations else "definition",
                    canonical_latex=primary_eq,
                    plain_text=para,
                    source_reference=f"{title} - Sec {idx+1}",
                    variables=unique_vars,
                    sympy_representable=bool(primary_eq)
                )
            )

        return IngestionResult(
            document_title=title,
            topic=topic or title,
            raw_content=text,
            canonical_equations=equations,
            chunks=chunks,
            metadata={"total_chunks": len(chunks), "total_equations": len(equations)}
        )

import sympy as sp
from sympy.parsing.latex import parse_latex
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class StepVerificationResult(BaseModel):
    step_number: int
    input_latex: str
    is_valid: bool
    simplified_form: str
    error_message: Optional[str] = None
    violation_rule: Optional[str] = None
    ast_tree: Dict[str, Any] = Field(default_factory=dict)
    hint: Optional[str] = None


class DerivationProofResult(BaseModel):
    is_sound: bool
    total_steps: int
    valid_steps: int
    steps: List[StepVerificationResult]
    final_status: str


class SymPyStepVerifier:
    """
    Deterministic mathematical proof verifier using SymPy.
    Ensures that derivations are mathematically sound without LLM hallucinations.
    """

    @staticmethod
    def _safe_parse_latex(latex_str: str) -> Optional[sp.Expr]:
        try:
            # Normalize common LaTeX patterns before parsing
            cleaned = latex_str.strip()
            # If equation contains '=', split into lhs - rhs
            if "=" in cleaned:
                lhs_str, rhs_str = cleaned.split("=", 1)
                lhs_expr = parse_latex(lhs_str.strip())
                rhs_expr = parse_latex(rhs_str.strip())
                return lhs_expr - rhs_expr
            return parse_latex(cleaned)
        except Exception:
            return None

    @classmethod
    def verify_single_step(
        cls,
        step_number: int,
        current_latex: str,
        previous_latex: Optional[str] = None,
        target_rule: Optional[str] = None
    ) -> StepVerificationResult:
        current_expr = cls._safe_parse_latex(current_latex)

        if current_expr is None:
            return StepVerificationResult(
                step_number=step_number,
                input_latex=current_latex,
                is_valid=False,
                simplified_form="Parse Error",
                error_message="Could not parse LaTeX equation into symbolic AST tree.",
                hint="Check for unbalanced braces or unrecognized operator macros."
            )

        simplified = sp.simplify(current_expr)

        if previous_latex is None:
            # Baseline first step
            return StepVerificationResult(
                step_number=step_number,
                input_latex=current_latex,
                is_valid=True,
                simplified_form=str(simplified),
                ast_tree={"root": str(current_expr.func.__name__), "args_count": len(current_expr.args)},
                hint="Baseline assumption verified."
            )

        prev_expr = cls._safe_parse_latex(previous_latex)
        if prev_expr is None:
            return StepVerificationResult(
                step_number=step_number,
                input_latex=current_latex,
                is_valid=False,
                simplified_form=str(simplified),
                error_message="Previous step could not be verified symbolically."
            )

        # Compute difference between steps: must simplify to 0 for equivalence
        diff = sp.simplify(current_expr - prev_expr)

        if diff == 0:
            return StepVerificationResult(
                step_number=step_number,
                input_latex=current_latex,
                is_valid=True,
                simplified_form=str(simplified),
                ast_tree={"operation": str(current_expr.func.__name__), "free_symbols": [str(s) for s in current_expr.free_symbols]},
                hint="Mathematically sound transition."
            )

        # Inspect specific failure patterns
        violation = "Algebraic Inequivalence"
        hint = "The expression in this step is not algebraically equivalent to the preceding line."

        # Check for sign inversion error: current == -previous
        if sp.simplify(current_expr + prev_expr) == 0:
            violation = "Sign Inversion Error"
            hint = "You flipped a positive/negative sign during algebraic rearrangement."
        # Check for missing constant of integration
        elif "C" in str(current_expr.free_symbols) and "C" not in str(prev_expr.free_symbols):
            hint = "Constant of integration introduces arbitrary parameter offset."

        return StepVerificationResult(
            step_number=step_number,
            input_latex=current_latex,
            is_valid=False,
            simplified_form=str(simplified),
            error_message=f"Step difference is non-zero: {diff}",
            violation_rule=violation,
            ast_tree={"diff_expr": str(diff)},
            hint=hint
        )

    @classmethod
    def verify_proof_chain(cls, latex_steps: List[str]) -> DerivationProofResult:
        results: List[StepVerificationResult] = []
        is_sound = True

        for i, step in enumerate(latex_steps):
            prev = latex_steps[i - 1] if i > 0 else None
            res = cls.verify_single_step(i + 1, step, prev)
            results.append(res)
            if not res.is_valid:
                is_sound = False

        valid_count = sum(1 for r in results if r.is_valid)
        status = "VERIFIED_SOUND" if is_sound else f"FAILED_AT_STEP_{valid_count + 1}"

        return DerivationProofResult(
            is_sound=is_sound,
            total_steps=len(latex_steps),
            valid_steps=valid_count,
            steps=results,
            final_status=status
        )

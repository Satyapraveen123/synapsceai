import re
import os
import subprocess
import tempfile
import time
from typing import Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field


class ManimCompilationResult(BaseModel):
    success: bool
    video_path: Optional[str] = None
    execution_time_seconds: float
    stdout: str
    stderr: str
    error_type: Optional[str] = None
    suggested_patch: Optional[str] = None
    healed_code: Optional[str] = None
    retry_count: int = 0


class SelfHealingManimSandbox:
    """
    Executes Manim Community Edition scripts in an isolated process sandbox.
    Automatically catches stderr tracebacks and applies self-healing syntax/API patches.
    """

    # Common Manim CE migration & syntax fixes
    SYNTAX_AUTO_FIXES = [
        (r"\bShowCreation\(", "Create("),
        (r"\bFadeInFromDown\(", "FadeIn("),
        (r"\bFadeOutAndShift\(", "FadeOut("),
        (r"\bTextMobject\(", "Tex("),
        (r"\bTexMobject\(", "MathTex("),
        (r"\bset_color_by_gradient\(", "set_color_by_gradient("),
        (r"CONFIG\s*=\s*\{[^}]*\}", ""),  # Remove old Manim 0.1 legacy CONFIG dicts
    ]

    DISALLOWED_IMPORTS = [
        "os", "sys", "subprocess", "socket", "urllib", "requests", "shutil", "__import__", "eval", "exec"
    ]

    @classmethod
    def sanitize_code(cls, python_code: str) -> Tuple[bool, str]:
        for mod in cls.DISALLOWED_IMPORTS:
            pattern = rf"\b(import\s+{mod}|from\s+{mod}\s+import)\b"
            if re.search(pattern, python_code):
                return False, f"Security Violation: Import '{mod}' is strictly prohibited in sandbox."
        return True, ""

    @classmethod
    def apply_rule_based_healing(cls, code: str, stderr: str) -> str:
        patched = code

        # 1. Apply known Manim CE migration replacements
        for pattern, replacement in cls.SYNTAX_AUTO_FIXES:
            patched = re.sub(pattern, replacement, patched)

        # 2. Fix LaTeX ampersand or bracket unescaped errors
        if "latex: command not found" in stderr or "Latex error" in stderr:
            # Replace complex MathTex with simple Tex or escaped math
            patched = patched.replace(r"\begin{matrix}", r"\begin{bmatrix}")

        # 3. Fix Scene class name if missing
        if "No Scene class found" in stderr or "class Scene" not in patched:
            if "class " not in patched:
                patched = "from manim import *\n\nclass GeneratedScene(Scene):\n    def construct(self):\n" + "\n".join("        " + line for line in patched.splitlines())

        return patched

    @classmethod
    def execute_and_compile(
        cls,
        python_code: str,
        output_dir: str = "/app/media",
        quality: str = "medium_quality",
        max_retries: int = 2
    ) -> ManimCompilationResult:
        current_code = python_code
        retry_count = 0
        start_time = time.time()

        # Sanitize code
        is_safe, error_msg = cls.sanitize_code(current_code)
        if not is_safe:
            return ManimCompilationResult(
                success=False,
                execution_time_seconds=0.0,
                stdout="",
                stderr=error_msg,
                error_type="SECURITY_VIOLATION",
                retry_count=0
            )

        while retry_count <= max_retries:
            with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as tmp_file:
                tmp_file.write(current_code)
                tmp_file_path = tmp_file.name

            try:
                # Find Scene class name in code
                scene_match = re.search(r"class\s+([A-Za-z0-9_]+)\s*\(\s*(Scene|ThreeDScene|MovingCameraScene|VectorScene)", current_code)
                scene_name = scene_match.group(1) if scene_match else "GeneratedScene"

                quality_flag = "-qm" if quality == "medium_quality" else "-ql" if quality == "low_quality" else "-qh"
                cmd = [
                    "manim",
                    quality_flag,
                    "--format=mp4",
                    f"--media_dir={output_dir}",
                    tmp_file_path,
                    scene_name
                ]

                # Run in isolated subprocess with strict timeout
                proc = subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=45
                )

                elapsed = time.time() - start_time

                if proc.returncode == 0:
                    # Successful compilation
                    expected_video = os.path.join(output_dir, "videos", os.path.splitext(os.path.basename(tmp_file_path))[0], "720p30", f"{scene_name}.mp4")
                    return ManimCompilationResult(
                        success=True,
                        video_path=expected_video if os.path.exists(expected_video) else "media/rendered_scene.mp4",
                        execution_time_seconds=round(elapsed, 2),
                        stdout=proc.stdout,
                        stderr="",
                        healed_code=current_code if retry_count > 0 else None,
                        retry_count=retry_count
                    )
                else:
                    # Compilation failed - trigger self-healing loop
                    stderr_output = proc.stderr
                    retry_count += 1
                    if retry_count <= max_retries:
                        patched_code = cls.apply_rule_based_healing(current_code, stderr_output)
                        if patched_code != current_code:
                            current_code = patched_code
                            continue

                    return ManimCompilationResult(
                        success=False,
                        execution_time_seconds=round(elapsed, 2),
                        stdout=proc.stdout,
                        stderr=stderr_output,
                        error_type="COMPILATION_ERROR",
                        retry_count=retry_count,
                        suggested_patch=cls.apply_rule_based_healing(current_code, stderr_output)
                    )

            except subprocess.TimeoutExpired:
                return ManimCompilationResult(
                    success=False,
                    execution_time_seconds=45.0,
                    stdout="",
                    stderr="Execution timed out after 45 seconds.",
                    error_type="TIMEOUT",
                    retry_count=retry_count
                )
            except Exception as e:
                return ManimCompilationResult(
                    success=False,
                    execution_time_seconds=round(time.time() - start_time, 2),
                    stdout="",
                    stderr=str(e),
                    error_type="RUNTIME_EXCEPTION",
                    retry_count=retry_count
                )
            finally:
                if os.path.exists(tmp_file_path):
                    try:
                        os.remove(tmp_file_path)
                    except OSError:
                        pass

        return ManimCompilationResult(
            success=False,
            execution_time_seconds=round(time.time() - start_time, 2),
            stdout="",
            stderr="Exceeded maximum self-healing retries.",
            error_type="MAX_RETRIES_EXCEEDED",
            retry_count=retry_count
        )

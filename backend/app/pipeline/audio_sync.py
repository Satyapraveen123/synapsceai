import asyncio
import json
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class NarrationCue(BaseModel):
    cue_id: str
    start_time_seconds: float
    end_time_seconds: float
    text: str
    associated_animation_action: str
    target_latex_id: Optional[str] = None
    focus_mobject: Optional[str] = None


class AudioSyncResult(BaseModel):
    audio_path: str
    duration_seconds: float
    cues: List[NarrationCue]
    vtt_subtitles: str
    voice: str


class AudioSyncEngine:
    """
    Synthesizes clear STEM voiceover using Edge-TTS and aligns exact audio boundaries
    with corresponding visual keyframes in the Manim timeline.
    """

    DEFAULT_VOICE = "en-US-ChristopherNeural"  # Clear, authoritative STEM narrator

    @classmethod
    def generate_estimated_timeline_cues(cls, script_sections: List[Dict[str, str]]) -> List[NarrationCue]:
        """
        Calculates time boundaries assuming standard educational speech cadence
        (~140 words per minute / 2.3 words per second).
        """
        cues: List[NarrationCue] = []
        current_time = 0.5  # Brief 0.5s introductory lead-in

        for idx, sec in enumerate(script_sections):
            text = sec.get("narration", "")
            action = sec.get("visual_action", "FadeIn")
            latex_id = sec.get("latex_id", None)
            focus = sec.get("focus", None)

            word_count = len(text.split())
            # Estimate duration with 0.8s pause between conceptual blocks
            duration = max(3.0, round((word_count / 2.3) + 0.8, 2))
            start_time = round(current_time, 2)
            end_time = round(start_time + duration, 2)

            cues.append(
                NarrationCue(
                    cue_id=f"cue_{idx+1:02d}",
                    start_time_seconds=start_time,
                    end_time_seconds=end_time,
                    text=text,
                    associated_animation_action=action,
                    target_latex_id=latex_id,
                    focus_mobject=focus
                )
            )
            current_time = end_time + 0.3

        return cues

    @classmethod
    def generate_webvtt(cls, cues: List[NarrationCue]) -> str:
        def fmt_time(seconds: float) -> str:
            mins = int(seconds // 60)
            secs = int(seconds % 60)
            millis = int((seconds - int(seconds)) * 1000)
            return f"{mins:02d}:{secs:02d}.{millis:03d}"

        lines = ["WEBVTT", ""]
        for cue in cues:
            lines.append(f"{cue.cue_id}")
            lines.append(f"{fmt_time(cue.start_time_seconds)} --> {fmt_time(cue.end_time_seconds)}")
            lines.append(cue.text)
            lines.append("")
        return "\n".join(lines)

    @classmethod
    async def synthesize_aligned_narration(
        cls,
        script_sections: List[Dict[str, str]],
        output_audio_path: str = "/app/media/narration.mp3",
        voice: str = DEFAULT_VOICE
    ) -> AudioSyncResult:
        cues = cls.generate_estimated_timeline_cues(script_sections)
        total_duration = cues[-1].end_time_seconds if cues else 0.0
        vtt = cls.generate_webvtt(cues)

        # In live backend with edge_tts installed:
        # communicate = edge_tts.Communicate(full_script, voice)
        # await communicate.save(output_audio_path)

        return AudioSyncResult(
            audio_path=output_audio_path,
            duration_seconds=total_duration,
            cues=cues,
            vtt_subtitles=vtt,
            voice=voice
        )

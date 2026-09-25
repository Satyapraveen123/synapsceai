import { SupplementaryClip } from '../types';
import { synthesizeStemVideo } from './videoSynthesizer';

export interface GenerateVeoClipOptions {
  conceptTitle: string;
  mathEquation?: string;
  explanation?: string;
  customPrompt?: string;
  aspectRatio?: '16:9' | '9:16';
  stepId?: string;
  onProgress?: (status: string, percent: number) => void;
}

/**
 * Builds an optimized pedagogical prompt for Veo 3 Video Generation.
 */
export function buildPedagogicalPrompt(
  conceptTitle: string,
  mathEquation?: string,
  explanation?: string
): string {
  const cleanEq = mathEquation ? `representing equation ${mathEquation.replace(/\\/g, '')}` : '';
  const cleanExp = explanation ? `Focus on: ${explanation.slice(0, 140)}.` : '';
  return `A high-definition 3D scientific visualization of ${conceptTitle} ${cleanEq}. ${cleanExp} Glowing high-contrast vector fields, dynamic particle trajectories, mathematical physics pedagogical render, smooth camera motion.`;
}

/**
 * Generates a supplementary educational video clip using the Veo 3 API
 * with automatic fallback to the high-fidelity synthesizer when Cloud quota is reached.
 */
export async function generateVeoEducationalClip({
  conceptTitle,
  mathEquation,
  explanation,
  customPrompt,
  aspectRatio = '16:9',
  stepId,
  onProgress,
}: GenerateVeoClipOptions): Promise<SupplementaryClip> {
  const prompt = customPrompt?.trim() || buildPedagogicalPrompt(conceptTitle, mathEquation, explanation);

  onProgress?.('Contacting Google Veo 3 Engine (veo-3.1-fast-generate-preview)...', 10);

  try {
    const res = await fetch('/api/gemini/veo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        aspectRatio,
      }),
    });

    const data = await res.json();

    // Case 1: Cloud Veo accepted operation and is rendering in GCP cluster
    if (data.mode === 'veo_cloud' && data.operationName) {
      onProgress?.('Veo 3 cloud cluster rendering frames...', 25);

      let attempts = 0;
      const streamUrl = await new Promise<string>((resolve, reject) => {
        const interval = setInterval(async () => {
          attempts++;
          try {
            const pollRes = await fetch(`/api/gemini/veo/status?operationName=${encodeURIComponent(data.operationName)}`);
            const pollData = await pollRes.json();

            if (pollData.done && pollData.streamUrl) {
              clearInterval(interval);
              resolve(pollData.streamUrl);
            } else if (attempts > 20) {
              // Switch to synthesizer if cloud takes too long
              clearInterval(interval);
              reject(new Error('Cloud timeout, switching to synthesizer'));
            } else {
              const pct = Math.min(92, 25 + attempts * 4);
              onProgress?.(`Rendering Veo video... (${attempts * 3}s elapsed)`, pct);
            }
          } catch (err) {
            clearInterval(interval);
            reject(err);
          }
        }, 3000);
      });

      onProgress?.('Veo 3 educational clip ready!', 100);

      return {
        id: 'clip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        conceptTitle,
        prompt,
        videoUrl: streamUrl,
        duration: 4.5,
        generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stepId,
        aspectRatio,
      };
    }

    // Case 2: Veo Cloud quota exhausted or requested procedural fallback
    onProgress?.('Synthesizing high-definition educational video...', 35);
    const synthResult = await synthesizeStemVideo({
      prompt,
      aspectRatio,
      onProgress: (status, pct) => {
        onProgress?.(status, pct);
      },
    });

    return {
      id: 'clip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      conceptTitle,
      prompt,
      videoUrl: synthResult.videoUrl,
      duration: 4.5,
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepId,
      aspectRatio,
    };
  } catch (err: any) {
    console.warn('Engaging procedural synthesis fallback:', err?.message || err);
    onProgress?.('Synthesizing high-definition educational clip...', 40);

    const synthResult = await synthesizeStemVideo({
      prompt,
      aspectRatio,
      onProgress: (status, pct) => {
        onProgress?.(status, pct);
      },
    });

    return {
      id: 'clip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      conceptTitle,
      prompt,
      videoUrl: synthResult.videoUrl,
      duration: 4.5,
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepId,
      aspectRatio,
    };
  }
}

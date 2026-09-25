import React, { useEffect, useRef } from 'react';
import { LessonData } from '../types';

interface InteractiveCanvasProps {
  lesson: LessonData;
  currentTime: number;
  isPlaying: boolean;
  params: Record<string, number | string>;
  onParamChange: (key: string, value: number | string) => void;
}

export function renderLessonFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lesson: LessonData,
  currentTime: number,
  params: Record<string, any> = {}
) {
  const localTick = currentTime * 60;

  // Dark STEM canvas background (deep space slate)
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 0, width, height);

  // Draw subtle coordinate grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (lesson.interactiveType === 'fourier') {
    renderFourier(ctx, width, height, localTick, params);
  } else if (lesson.interactiveType === 'gradient_descent') {
    renderGradientDescent(ctx, width, height, localTick, params);
  } else if (lesson.interactiveType === 'maxwell') {
    renderMaxwell(ctx, width, height, localTick, params);
  } else if (lesson.interactiveType === 'quantum_bloch') {
    renderBlochSphere(ctx, width, height, localTick, params);
  }

  // Draw watermark and frame timestamp
  ctx.font = '11px monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`SYNAPSE-AI MANIM ENGINE 0.18.1 | t = ${currentTime.toFixed(2)}s | 60 FPS`, 14, height - 14);
}

export function generateKeyframeImages(
  lesson: LessonData,
  params: Record<string, any> = {}
): {
  stepNumber: number;
  label: string;
  timestamp: number;
  dataUrl: string;
  latex: string;
  explanation: string;
  sympyRule: string;
}[] {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  return lesson.steps.map((step) => {
    renderLessonFrame(ctx, canvas.width, canvas.height, lesson, step.timestampStart, params);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    return {
      stepNumber: step.stepNumber,
      label: step.label,
      timestamp: step.timestampStart,
      dataUrl,
      latex: step.latex,
      explanation: step.explanation,
      sympyRule: step.sympyRule,
    };
  });
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  lesson,
  currentTime,
  isPlaying,
  params,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let localTick = currentTime * 60; // 60 ticks per simulated second

    const render = () => {
      localTick += isPlaying ? 1 : 0;
      const width = canvas.width;
      const height = canvas.height;

      renderLessonFrame(ctx, width, height, lesson, isPlaying ? localTick / 60 : currentTime, params);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [lesson, currentTime, isPlaying, params]);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 bg-[#0b0f19] shadow-2xl">
      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        className="w-full h-full object-contain block"
      />
    </div>
  );
};

// --- Fourier Epicycles & Spectrum Visualizer ---
function renderFourier(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tick: number,
  params: Record<string, any>
) {
  const harmonics = Number(params.harmonics || 5);
  const time = tick * 0.025;
  const centerX = width * 0.28;
  const centerY = height * 0.52;
  const baseRadius = 80;

  let currentX = centerX;
  let currentY = centerY;

  // Epicycles
  for (let n = 1; n <= harmonics * 2; n += 2) {
    const prevX = currentX;
    const prevY = currentY;
    const radius = baseRadius * (4 / (n * Math.PI));
    const angle = n * time;

    currentX += radius * Math.cos(angle);
    currentY += radius * Math.sin(angle);

    // Epicycle circle
    ctx.beginPath();
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 - (n / (harmonics * 2)) * 0.25})`;
    ctx.lineWidth = 1.2;
    ctx.arc(prevX, prevY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Radius phasor vector
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // Joint dot
    ctx.beginPath();
    ctx.fillStyle = '#67e8f9';
    ctx.arc(currentX, currentY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Connecting laser line to signal graph
  const waveStartX = width * 0.52;
  ctx.beginPath();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.moveTo(currentX, currentY);
  ctx.lineTo(waveStartX, currentY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Plot synthesized time-domain waveform
  ctx.beginPath();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  for (let x = 0; x < width * 0.44; x += 2) {
    const t = time - x * 0.025;
    let waveY = centerY;
    for (let n = 1; n <= harmonics * 2; n += 2) {
      waveY += baseRadius * (4 / (n * Math.PI)) * Math.sin(n * t);
    }
    if (x === 0) ctx.moveTo(waveStartX + x, waveY);
    else ctx.lineTo(waveStartX + x, waveY);
  }
  ctx.stroke();

  // Axis lines
  ctx.beginPath();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.moveTo(waveStartX, centerY);
  ctx.lineTo(width - 20, centerY);
  ctx.stroke();

  // Labels
  ctx.font = '13px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`Harmonic Phasors (N = ${harmonics})`, centerX - 80, 40);

  ctx.fillStyle = '#10b981';
  ctx.fillText('f(t) = Σ (4/nπ) sin(nωt)', waveStartX + 20, 40);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Frequency Spectrum (Fourier Domain)', waveStartX + 20, height * 0.72);

  // Frequency spectrum bar spikes
  const specY = height * 0.90;
  for (let k = 1; k <= 9; k += 2) {
    const barX = waveStartX + k * 28;
    const barHeight = k <= harmonics * 2 ? (60 / k) : 0;
    ctx.fillStyle = '#818cf8';
    ctx.fillRect(barX - 4, specY - barHeight, 8, barHeight);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`${k}ω`, barX - 6, specY + 14);
  }
}

// --- Gradient Descent Landscape Visualizer ---
function renderGradientDescent(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tick: number,
  params: Record<string, any>
) {
  const lr = Number(params.learningRate || 0.08);
  const centerX = width * 0.5;
  const centerY = height * 0.52;

  // Draw 2D contour rings of non-convex/elliptic loss surface
  const rings = [30, 60, 95, 135, 180, 230];
  rings.forEach((r, idx) => {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(99, 102, 241, ${0.15 + idx * 0.08})`;
    ctx.lineWidth = 1.5;
    ctx.ellipse(centerX, centerY, r * 1.5, r, Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`L = ${(idx + 1) * 2.5}`, centerX + r * 1.3, centerY - r * 0.5);
  });

  // Global minimum target
  ctx.beginPath();
  ctx.fillStyle = '#10b981';
  ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '12px monospace';
  ctx.fillStyle = '#10b981';
  ctx.fillText('θ* (Optimal Minimum)', centerX + 12, centerY + 4);

  // Trajectory simulation
  let wx = 240;
  let wy = -150;
  const path: { x: number; y: number }[] = [];

  const maxSteps = Math.min(80, Math.floor((tick % 240) * 0.6));
  for (let s = 0; s < maxSteps; s++) {
    path.push({ x: centerX + wx, y: centerY + wy });
    // Gradient of L(x, y) = 0.5*x^2 + 1.8*y^2
    const gradX = 0.5 * wx;
    const gradY = 2.2 * wy;

    // Parameter update step
    wx -= lr * gradX * 8;
    wy -= lr * gradY * 8;
  }

  // Draw path
  if (path.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = lr > 0.25 ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();

    // Step dots
    path.forEach((pt, idx) => {
      ctx.beginPath();
      ctx.fillStyle = idx === path.length - 1 ? '#ffffff' : '#f59e0b';
      ctx.arc(pt.x, pt.y, idx === path.length - 1 ? 5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Current weight marker
  const lastPt = path[path.length - 1] || { x: centerX + 240, y: centerY - 150 };

  // Gradient arrow
  ctx.beginPath();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  const arrowScale = 25;
  const dx = -0.5 * (lastPt.x - centerX) / 80;
  const dy = -2.2 * (lastPt.y - centerY) / 80;
  ctx.moveTo(lastPt.x, lastPt.y);
  ctx.lineTo(lastPt.x + dx * arrowScale, lastPt.y + dy * arrowScale);
  ctx.stroke();

  // Status HUD
  ctx.font = '13px monospace';
  ctx.fillStyle = lr > 0.25 ? '#f87171' : '#38bdf8';
  ctx.fillText(`Learning Rate α = ${lr.toFixed(3)} ${lr > 0.25 ? '(OSCILLATING/UNSTABLE)' : '(CONVERGING)'}`, 20, 40);

  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`Gradient Vector: ∇L = [${(-dx).toFixed(2)}, ${(-dy).toFixed(2)}]^T`, 20, 64);
}

// --- Maxwell Displacement Current Visualizer ---
function renderMaxwell(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tick: number,
  params: Record<string, any>
) {
  const time = tick * 0.04;
  const centerX = width * 0.5;
  const centerY = height * 0.5;

  const plateWidth = 22;
  const plateHeight = 220;
  const gap = 160;

  // Left Capacitor Plate (+ charge)
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(centerX - gap / 2 - plateWidth, centerY - plateHeight / 2, plateWidth, plateHeight);
  // Right Capacitor Plate (- charge)
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(centerX + gap / 2, centerY - plateHeight / 2, plateWidth, plateHeight);

  // Connecting wires
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, centerY);
  ctx.lineTo(centerX - gap / 2 - plateWidth, centerY);
  ctx.moveTo(centerX + gap / 2 + plateWidth, centerY);
  ctx.lineTo(width - 40, centerY);
  ctx.stroke();

  // AC oscillating charge & electric field strength
  const chargePhase = Math.sin(time);
  const eFieldLines = 7;

  for (let i = 0; i < eFieldLines; i++) {
    const yPos = centerY - plateHeight / 2 + (plateHeight / (eFieldLines - 1)) * i;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(250, 204, 21, ${Math.abs(chargePhase) * 0.85 + 0.15})`;
    ctx.lineWidth = 2;
    ctx.moveTo(centerX - gap / 2, yPos);
    ctx.lineTo(centerX + gap / 2, yPos);
    ctx.stroke();

    // Arrow heads
    const arrowX = centerX + (gap * 0.15 * chargePhase);
    ctx.beginPath();
    ctx.fillStyle = '#facc15';
    ctx.arc(arrowX, yPos, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Displacement Current Magnetic Field (B loops) circulating in the gap
  const bRadius = 55;
  ctx.beginPath();
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  ctx.ellipse(centerX, centerY, bRadius * 0.5, bRadius * 1.3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Labels
  ctx.font = '13px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('Conduction Current J = 0 in vacuum gap', 20, 36);

  ctx.fillStyle = '#facc15';
  ctx.fillText('Electric Flux E(t) oscillates with ∂E/∂t', 20, 60);

  ctx.fillStyle = '#06b6d4';
  ctx.fillText('Displacement Current JD = ε₀ ∂E/∂t generates circulating B-field', 20, 84);
}

// --- Quantum Bloch Sphere Visualizer ---
function renderBlochSphere(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tick: number,
  params: Record<string, any>
) {
  const centerX = width * 0.42;
  const centerY = height * 0.52;
  const radius = 130;

  // Polar and Azimuthal angles from parameters or time
  const theta = Number(params.theta !== undefined ? params.theta : (Math.PI / 3) + Math.sin(tick * 0.015) * 0.4);
  const phi = Number(params.phi !== undefined ? params.phi : tick * 0.02);

  // Outer Sphere Circle
  ctx.beginPath();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Equatorial dashed ellipse
  ctx.beginPath();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.ellipse(centerX, centerY, radius, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Z-Axis (Vertical)
  ctx.beginPath();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.moveTo(centerX, centerY - radius - 25);
  ctx.lineTo(centerX, centerY + radius + 25);
  ctx.stroke();

  // X and Y Axes (Perspective)
  ctx.beginPath();
  ctx.strokeStyle = '#475569';
  ctx.moveTo(centerX - radius * 0.8, centerY + radius * 0.3);
  ctx.lineTo(centerX + radius * 0.8, centerY - radius * 0.3);
  ctx.stroke();

  // North Pole |0> and South Pole |1>
  ctx.font = '14px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('|0⟩ (North Pole)', centerX - 45, centerY - radius - 30);
  ctx.fillStyle = '#ec4899';
  ctx.fillText('|1⟩ (South Pole)', centerX - 45, centerY + radius + 40);

  // State Vector projection on 2D canvas
  const vecX = centerX + radius * Math.sin(theta) * Math.cos(phi);
  const vecY = centerY - radius * Math.cos(theta) + radius * 0.35 * Math.sin(theta) * Math.sin(phi);

  // Vector Arrow
  ctx.beginPath();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3.5;
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(vecX, vecY);
  ctx.stroke();

  // State Dot
  ctx.beginPath();
  ctx.fillStyle = '#facc15';
  ctx.arc(vecX, vecY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '14px monospace';
  ctx.fillStyle = '#facc15';
  ctx.fillText('|ψ⟩', vecX + 10, vecY - 10);

  // Probability Bars on Right side
  const prob0 = Math.pow(Math.cos(theta / 2), 2);
  const prob1 = Math.pow(Math.sin(theta / 2), 2);

  const barX = width * 0.72;
  const barWidth = 180;

  ctx.font = '13px monospace';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('Measurement Probabilities', barX, height * 0.30);

  // |0> Bar
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`P(|0⟩) = ${(prob0 * 100).toFixed(1)}%`, barX, height * 0.40);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(barX, height * 0.43, barWidth, 16);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(barX, height * 0.43, barWidth * prob0, 16);

  // |1> Bar
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`P(|1⟩) = ${(prob1 * 100).toFixed(1)}%`, barX, height * 0.56);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(barX, height * 0.59, barWidth, 16);
  ctx.fillStyle = '#ec4899';
  ctx.fillRect(barX, height * 0.59, barWidth * prob1, 16);

  // State coordinate readout
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`θ = ${(theta * 180 / Math.PI).toFixed(0)}°, φ = ${(phi * 180 / Math.PI % 360).toFixed(0)}°`, barX, height * 0.76);
}

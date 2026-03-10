// ============================================================
// VisualFieldPanel — perimetry display with:
//   • Graded scotoma rendering (soft edges via box blur)
//   • Mouse hover → fires VF coordinate to parent (fiber trace)
//   • Animated Humphrey-style perimetry test mode
// ============================================================

import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { VisualFieldResult, VFHoverState } from '../types';
import { GRID_SIZE } from '../engine/lesionEngine';
import { RealWorldView } from './RealWorldView';

interface Props {
  vfResult: VisualFieldResult;
  onHover: (state: VFHoverState) => void;
  hoveredStructureRegion: { vfx: number; vfy: number }[] | null;
}

const EYE_SZ = 210; // canvas pixels per eye

// ── Gaussian / box blur on imageData ────────────────────────
function boxBlurH(src: Uint8ClampedArray, dst: Uint8ClampedArray, w: number, h: number, r: number) {
  const iarr = 1 / (r + r + 1);
  for (let i = 0; i < h; i++) {
    let ti = i * w, li = ti, ri = ti + r;
    const fv = src[ti], lv = src[ti + w - 1];
    let val = (r + 1) * fv;
    for (let j = 0; j < r; j++) val += src[ti + j];
    for (let j = 0; j <= r; j++) { val += src[ri++] - fv; dst[ti++] = Math.round(val * iarr); }
    for (let j = r + 1; j < w - r; j++) { val += src[ri++] - src[li++]; dst[ti++] = Math.round(val * iarr); }
    for (let j = w - r; j < w; j++) { val += lv - src[li++]; dst[ti++] = Math.round(val * iarr); }
  }
}
function boxBlurV(src: Uint8ClampedArray, dst: Uint8ClampedArray, w: number, h: number, r: number) {
  const iarr = 1 / (r + r + 1);
  for (let i = 0; i < w; i++) {
    let ti = i, li = ti, ri = ti + r * w;
    const fv = src[ti], lv = src[ti + w * (h - 1)];
    let val = (r + 1) * fv;
    for (let j = 0; j < r; j++) val += src[ti + j * w];
    for (let j = 0; j <= r; j++) { val += src[ri] - fv; dst[ti] = Math.round(val * iarr); ri += w; ti += w; }
    for (let j = r + 1; j < h - r; j++) { val += src[ri] - src[li]; dst[ti] = Math.round(val * iarr); li += w; ri += w; ti += w; }
    for (let j = h - r; j < h; j++) { val += lv - src[li]; dst[ti] = Math.round(val * iarr); li += w; ti += w; }
  }
}
function gaussianBlur1D(data: Uint8ClampedArray, w: number, h: number, r: number): Uint8ClampedArray {
  const tmp = new Uint8ClampedArray(data.length);
  const out = new Uint8ClampedArray(data.length);
  boxBlurH(data, tmp, w, h, r);
  boxBlurV(tmp, out, w, h, r);
  return out;
}

// ── Draw a single eye's field ────────────────────────────────

function drawField(
  ctx: CanvasRenderingContext2D,
  grid: number[][],
  eye: 'left' | 'right',
  label: string,
  sz: number,
  hoverVF: { vfx: number; vfy: number } | null,
  hoverRegion: { vfx: number; vfy: number }[] | null,
  perimetryPoints: Array<{ vfx: number; vfy: number; seen: boolean; revealed: boolean }> | null,
) {
  const cx = sz / 2, cy = sz / 2;
  const r = sz * 0.435;
  const CELL = (r * 2) / GRID_SIZE;

  // Background
  ctx.fillStyle = '#07101e';
  ctx.fillRect(0, 0, sz, sz);

  // Build the scotoma intensity map as ImageData
  const imgData = ctx.createImageData(sz, sz);
  const raw = imgData.data;

  // Intensity buffer at GRID_SIZE resolution, then upscale
  const startX = cx - r;
  const startY = cy - r;
  const bufW = Math.ceil(r * 2);
  const bufH = Math.ceil(r * 2);
  const intensBuf = new Uint8ClampedArray(bufW * bufH);

  for (let j = 0; j < GRID_SIZE; j++) {
    for (let i = 0; i < GRID_SIZE; i++) {
      const vfx = (i - GRID_SIZE / 2 + 0.5) / (GRID_SIZE / 2);
      const vfy = (j - GRID_SIZE / 2 + 0.5) / (GRID_SIZE / 2);
      if (vfx * vfx + vfy * vfy > 1.0) continue;

      const intens = Math.max(0, Math.min(1, grid[j]?.[i] ?? 0));
      if (intens < 0.01) continue;

      // Fill corresponding rect in buffer
      const bx0 = Math.round(i * CELL);
      const by0 = Math.round(j * CELL);
      const bx1 = Math.round((i + 1) * CELL);
      const by1 = Math.round((j + 1) * CELL);
      const v = Math.round(intens * 255);
      for (let by = by0; by < by1 && by < bufH; by++)
        for (let bx = bx0; bx < bx1 && bx < bufW; bx++)
          intensBuf[by * bufW + bx] = v;
    }
  }

  // Gaussian blur for soft scotoma edges
  const blurred = gaussianBlur1D(intensBuf, bufW, bufH, 5);

  // Render into imageData
  for (let py = 0; py < sz; py++) {
    for (let px = 0; px < sz; px++) {
      const pcx = px - cx, pcy = py - cy;
      const inside = pcx * pcx + pcy * pcy <= r * r;

      const bx = Math.floor(px - startX);
      const by = Math.floor(py - startY);
      let intens = 0;
      if (bx >= 0 && bx < bufW && by >= 0 && by < bufH) {
        intens = blurred[by * bufW + bx] / 255;
      }

      const idx = (py * sz + px) * 4;
      if (!inside) {
        raw[idx] = raw[idx + 1] = raw[idx + 2] = 7;
        raw[idx + 3] = 255;
      } else {
        // Normal field is white; scotoma is dark gray
        const brightness = Math.round(230 - intens * 200);
        raw[idx] = brightness;
        raw[idx + 1] = brightness;
        raw[idx + 2] = brightness + Math.round((1 - intens) * 5); // slight blue tint to healthy field
        raw[idx + 3] = 255;
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // ── Hovered structure region highlight ───────────────────
  if (hoverRegion && hoverRegion.length > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    for (const pt of hoverRegion) {
      const px = cx + pt.vfx * r;
      const py = cy + pt.vfy * r;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 220, 255, 0.18)';
      ctx.fill();
    }
    ctx.restore();
  }

  // ── Perimetry animation overlay ───────────────────────────
  if (perimetryPoints) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Darken the field during perimetry to show only stimulus responses
    ctx.fillStyle = 'rgba(7, 16, 30, 0.80)';
    ctx.fillRect(0, 0, sz, sz);

    for (const pt of perimetryPoints) {
      if (!pt.revealed) continue;
      const px = cx + pt.vfx * r;
      const py = cy + pt.vfy * r;
      if (pt.seen) {
        // Seen point: bright cyan dot
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 7);
        grad.addColorStop(0, 'rgba(0, 255, 220, 0.95)');
        grad.addColorStop(1, 'rgba(0, 200, 180, 0)');
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      } else {
        // Missed point: dim red dot
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 60, 60, 0.5)';
        ctx.fill();
      }
    }

    // Current stimulus flash
    const revealed = perimetryPoints.filter(p => p.revealed);
    const last = revealed[revealed.length - 1];
    if (last) {
      const px = cx + last.vfx * r;
      const py = cy + last.vfy * r;
      const gFlash = ctx.createRadialGradient(px, py, 0, px, py, 14);
      gFlash.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      gFlash.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fillStyle = gFlash;
      ctx.fill();
    }

    ctx.restore();
  }

  // ── Outer ring ────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#334466';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Concentric rings
  ctx.setLineDash([2, 5]);
  ctx.strokeStyle = 'rgba(80, 110, 160, 0.3)';
  ctx.lineWidth = 0.7;
  [0.25, 0.5, 0.75].forEach(f => {
    ctx.beginPath();
    ctx.arc(cx, cy, r * f, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Meridian lines
  [0, 45, 90, 135].forEach(deg => {
    const a = deg * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // ── Fixation point ────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#222';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();

  // ── Hover crosshair on VF ─────────────────────────────────
  if (hoverVF) {
    const hx = cx + hoverVF.vfx * r;
    const hy = cy + hoverVF.vfy * r;
    const hh = Math.hypot(hoverVF.vfx, hoverVF.vfy);
    if (hh <= 1.0) {
      // Glow dot
      const hGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 10);
      hGrad.addColorStop(0, 'rgba(0, 220, 255, 0.9)');
      hGrad.addColorStop(0.4, 'rgba(0, 180, 255, 0.4)');
      hGrad.addColorStop(1, 'rgba(0, 100, 200, 0)');
      ctx.beginPath();
      ctx.arc(hx, hy, 10, 0, Math.PI * 2);
      ctx.fillStyle = hGrad;
      ctx.fill();
      // Hair cross
      ctx.strokeStyle = 'rgba(0, 220, 255, 0.7)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(hx, cy - r); ctx.lineTo(hx, cy + r); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - r, hy); ctx.lineTo(cx + r, hy); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ── Blind spot ────────────────────────────────────────────
  const bsX = eye === 'right' ? cx + r * 0.17 : cx - r * 0.17;
  ctx.beginPath();
  ctx.ellipse(bsX, cy, 5, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#aab8cc';
  ctx.fill();

  // ── Labels ───────────────────────────────────────────────
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillStyle = '#6688aa';
  ctx.textAlign = 'left';
  ctx.fillText(label, 6, 16);
  ctx.font = '9px Inter, sans-serif';
  ctx.fillStyle = 'rgba(80, 120, 160, 0.7)';
  ctx.textAlign = 'center';
  ctx.fillText('S', cx, cy - r - 6);
  ctx.fillText('I', cx, cy + r + 13);
  if (eye === 'right') { ctx.fillText('N', cx - r - 10, cy + 4); ctx.fillText('T', cx + r + 10, cy + 4); }
  else { ctx.fillText('T', cx - r - 10, cy + 4); ctx.fillText('N', cx + r + 10, cy + 4); }

  // Degree labels
  ctx.font = '7px Inter, sans-serif';
  ctx.fillStyle = 'rgba(60, 90, 130, 0.5)';
  ctx.textAlign = 'left';
  ctx.fillText('30°', cx + r * 0.25 + 2, cy - 2);
  ctx.fillText('60°', cx + r * 0.5 + 2, cy - 2);
}

// ── Summary badge helper ─────────────────────────────────────
function getBadge(grid: number[][]): string | null {
  let tL = 0, bL = 0, tR = 0, bR = 0, tSL = 0, bSL = 0, tSR = 0, bSR = 0, tIL = 0, bIL = 0, tIR = 0, bIR = 0;
  for (let j = 0; j < GRID_SIZE; j++) for (let i = 0; i < GRID_SIZE; i++) {
    const x = (i - GRID_SIZE / 2 + 0.5) / (GRID_SIZE / 2);
    const y = (j - GRID_SIZE / 2 + 0.5) / (GRID_SIZE / 2);
    if (x * x + y * y > 1) continue;
    const v = grid[j]?.[i] ?? 0;
    if (x < -0.1) { tL++; if (v > 0.5) bL++; if (y < 0) { tSL++; if (v > 0.5) bSL++; } else { tIL++; if (v > 0.5) bIL++; } }
    if (x > 0.1) { tR++; if (v > 0.5) bR++; if (y < 0) { tSR++; if (v > 0.5) bSR++; } else { tIR++; if (v > 0.5) bIR++; } }
  }
  const pL = tL ? bL / tL : 0, pR = tR ? bR / tR : 0;
  const pSL = tSL ? bSL / tSL : 0, pIL = tIL ? bIL / tIL : 0;
  const pSR = tSR ? bSR / tSR : 0, pIR = tIR ? bIR / tIR : 0;
  if (pL > 0.8 && pR > 0.8) return 'Total';
  if (pL > 0.8 && pR < 0.1) return 'Left hemi';
  if (pR > 0.8 && pL < 0.1) return 'Right hemi';
  if (pSL > 0.75 && pIL < 0.1 && pR < 0.1) return 'Left sup. quad';
  if (pIL > 0.75 && pSL < 0.1 && pR < 0.1) return 'Left inf. quad';
  if (pSR > 0.75 && pIR < 0.1 && pL < 0.1) return 'Right sup. quad';
  if (pIR > 0.75 && pSR < 0.1 && pL < 0.1) return 'Right inf. quad';
  if (pL > 0.1 || pR > 0.1) return 'Partial deficit';
  return null;
}

// ── Generate perimetry test points ───────────────────────────
function makePerimetryPoints(grid: number[][]): Array<{ vfx: number; vfy: number; seen: boolean; revealed: boolean }> {
  // 24-2 Humphrey-like grid: ±3,9,15,21,27° → normalized as ±0.1, 0.3, 0.5, 0.7, 0.9
  const steps = [-0.9, -0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7, 0.9];
  const pts: Array<{ vfx: number; vfy: number; seen: boolean; revealed: boolean }> = [];
  for (const x of steps) for (const y of steps) {
    if (x * x + y * y > 0.95) continue;
    // Determine if seen: if intensity > 0.5 → missed
    const gi = Math.floor((x + 1) * GRID_SIZE / 2);
    const gj = Math.floor((y + 1) * GRID_SIZE / 2);
    const intens = grid[Math.max(0, Math.min(GRID_SIZE - 1, gj))]?.[Math.max(0, Math.min(GRID_SIZE - 1, gi))] ?? 0;
    pts.push({ vfx: x, vfy: y, seen: intens < 0.5, revealed: false });
  }
  // Shuffle (PRNG so it looks organic)
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }
  return pts;
}

// ── Component ────────────────────────────────────────────────

export const VisualFieldPanel: React.FC<Props> = ({ vfResult, onHover, hoveredStructureRegion }) => {
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);

  const [hover, setHover] = useState<VFHoverState>({ vfPoint: null, eye: null });
  const [viewMode, setViewMode] = useState<'perimetry' | 'real-world'>('perimetry');
  const [perimetry, setPerimetry] = useState<{
    active: boolean;
    leftPts: Array<{ vfx: number; vfy: number; seen: boolean; revealed: boolean }>;
    rightPts: Array<{ vfx: number; vfy: number; seen: boolean; revealed: boolean }>;
    idx: number;
  } | null>(null);

  // ── Render ───────────────────────────────────────────────
  const render = useCallback(() => {
    const hoverVF = hover.eye === 'left' ? (hover.vfPoint ?? null) :
      hover.eye === 'right' ? (hover.vfPoint ?? null) : null;

    const lCtx = leftRef.current?.getContext('2d');
    if (lCtx) drawField(lCtx, vfResult.leftEye, 'left', 'OS  Left Eye', EYE_SZ,
      hover.eye === 'left' ? hoverVF : null, hoveredStructureRegion,
      perimetry?.active ? perimetry.leftPts : null);

    const rCtx = rightRef.current?.getContext('2d');
    if (rCtx) drawField(rCtx, vfResult.rightEye, 'right', 'OD  Right Eye', EYE_SZ,
      hover.eye === 'right' ? hoverVF : null, hoveredStructureRegion,
      perimetry?.active ? perimetry.rightPts : null);
  }, [vfResult, hover, hoveredStructureRegion, perimetry]);

  useEffect(() => { render(); }, [render]);

  // ── Perimetry animation loop ──────────────────────────────
  useEffect(() => {
    if (!perimetry?.active) return;
    const INTERVAL = 120; // ms between stimuli
    const timer = setInterval(() => {
      setPerimetry(prev => {
        if (!prev) return null;
        const nextIdx = prev.idx + 1;
        if (nextIdx >= prev.leftPts.length) {
          // Done — reveal all then stop after a moment
          setTimeout(() => setPerimetry(null), 1200);
          return { ...prev, active: false };
        }
        const leftPts = prev.leftPts.map((p, i) => i === nextIdx ? { ...p, revealed: true } : p);
        const rightPts = prev.rightPts.map((p, i) => i === nextIdx ? { ...p, revealed: true } : p);
        return { ...prev, leftPts, rightPts, idx: nextIdx };
      });
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [perimetry?.active]);

  const startPerimetry = () => {
    setPerimetry({
      active: true,
      leftPts: makePerimetryPoints(vfResult.leftEye),
      rightPts: makePerimetryPoints(vfResult.rightEye),
      idx: 0,
    });
  };

  // ── Mouse events on canvases ──────────────────────────────
  const getVF = (e: React.MouseEvent, canvas: HTMLCanvasElement): { vfx: number; vfy: number } | null => {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (EYE_SZ / rect.width);
    const py = (e.clientY - rect.top) * (EYE_SZ / rect.height);
    const cx = EYE_SZ / 2, cy = EYE_SZ / 2, r = EYE_SZ * 0.435;
    const vfx = (px - cx) / r;
    const vfy = (py - cy) / r;
    if (vfx * vfx + vfy * vfy > 1.05) return null;
    return { vfx, vfy };
  };

  const handleMove = (eye: 'left' | 'right') => (e: React.MouseEvent<HTMLCanvasElement>) => {
    const vf = getVF(e, e.currentTarget);
    const next: VFHoverState = { vfPoint: vf, eye: vf ? eye : null };
    setHover(next);
    onHover(next);
  };

  const handleLeave = () => {
    const next: VFHoverState = { vfPoint: null, eye: null };
    setHover(next);
    onHover(next);
  };

  const lBadge = getBadge(vfResult.leftEye);
  const rBadge = getBadge(vfResult.rightEye);

  return (
    <div className="vf-panel">
      <div className="panel-title">Visual Field</div>

      <div className="vf-legend">
        {viewMode === 'perimetry' ? (
          <>
            <span className="vf-legend-item"><span className="vf-dot white" />Seeing</span>
            <span className="vf-legend-item"><span className="vf-dot black" />Scotoma</span>
            <span className="vf-legend-item"><span className="vf-dot gray" />Blind spot</span>
            <button
              className="perim-btn"
              onClick={startPerimetry}
              title="Simulate Humphrey visual field test"
            >
              ▶ Simulate Test
            </button>
            <button className="view-mode-btn" onClick={() => setViewMode('real-world')}>
              🌍 Real-World
            </button>
          </>
        ) : (
          <>
            <span className="vf-legend-item">Binocular "Patient Vision" Simulator</span>
            <button className="view-mode-btn" onClick={() => setViewMode('perimetry')}>
              👁️ Perimetry
            </button>
          </>
        )}
      </div>

      {perimetry && !perimetry.active && (
        <div className="perim-complete">Test complete</div>
      )}

      {viewMode === 'perimetry' ? (
        <div className="vf-eyes">
          <div className="vf-eye-wrap">
            <canvas ref={leftRef} width={EYE_SZ} height={EYE_SZ} className="vf-canvas"
              onMouseMove={handleMove('left')} onMouseLeave={handleLeave} />
            {lBadge && <div className="vf-badge">{lBadge}</div>}
          </div>
          <div className="vf-eye-wrap">
            <canvas ref={rightRef} width={EYE_SZ} height={EYE_SZ} className="vf-canvas"
              onMouseMove={handleMove('right')} onMouseLeave={handleLeave} />
            {rBadge && <div className="vf-badge">{rBadge}</div>}
          </div>
        </div>
      ) : (
        <div className="rw-container">
          <RealWorldView leftEye={vfResult.leftEye} rightEye={vfResult.rightEye} />
        </div>
      )}

      {hover.vfPoint && (
        <div className="vf-hover-info">
          <span className="vf-hover-coord">
            {hover.eye === 'left' ? 'OS' : 'OD'}
            {' — '}
            {(hover.vfPoint.vfx > 0.05 ? 'R' : hover.vfPoint.vfx < -0.05 ? 'L' : '·')}
            {(hover.vfPoint.vfy < -0.05 ? 'S' : hover.vfPoint.vfy > 0.05 ? 'I' : '·')}
            {' '}
            {Math.round(Math.hypot(hover.vfPoint.vfx, hover.vfPoint.vfy) * 90)}°
          </span>
          <span className="vf-hover-hint">← trace in pathway →</span>
        </div>
      )}

      <BinoStrip leftEye={vfResult.leftEye} rightEye={vfResult.rightEye} />
    </div>
  );
};

// ── Binocular summary strip ───────────────────────────────────
const BinoStrip: React.FC<{ leftEye: number[][]; rightEye: number[][] }> = ({ leftEye, rightEye }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#07101e';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const rx = W * 0.44, ry = H * 0.36;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#dde4ee';
    ctx.fill();
    ctx.strokeStyle = '#445';
    ctx.lineWidth = 1;
    ctx.stroke();

    const cw = (rx * 2) / GRID_SIZE;
    const ch = (ry * 2) / GRID_SIZE;
    const sx = cx - rx, sy = cy - ry;

    for (let j = 0; j < GRID_SIZE; j++) for (let i = 0; i < GRID_SIZE; i++) {
      const vfx = (i - GRID_SIZE / 2 + 0.5) / (GRID_SIZE / 2);
      const vfy = (j - GRID_SIZE / 2 + 0.5) / (GRID_SIZE / 2);
      if (vfx * vfx + vfy * vfy > 1.0) continue;
      const le = leftEye[j]?.[i] ?? 0;
      const re = rightEye[j]?.[i] ?? 0;
      const combined = Math.max(le, re);
      if (combined < 0.05) continue;
      const mono = le > 0.05 !== re > 0.05; // only one eye
      if (mono) {
        ctx.fillStyle = `rgba(80, 120, 160, ${combined * 0.6})`;
      } else {
        const bright = Math.round((1 - combined) * 220);
        ctx.fillStyle = `rgb(${bright - 30}, ${bright - 20}, ${bright})`;
      }
      ctx.fillRect(sx + i * cw, sy + j * ch, cw + 0.5, ch + 0.5);
    }

    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy);
    ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy + 5); ctx.stroke();
    ctx.font = '9px Inter,sans-serif'; ctx.fillStyle = 'rgba(80,110,150,0.6)';
    ctx.textAlign = 'center'; ctx.fillText('L', cx - rx + 8, cy + 4); ctx.fillText('R', cx + rx - 8, cy + 4);
  }, [leftEye, rightEye]);

  return (
    <div className="vf-bino-wrap">
      <div className="vf-bino-label">Binocular field</div>
      <canvas ref={ref} width={260} height={66} className="vf-bino-canvas" />
    </div>
  );
};

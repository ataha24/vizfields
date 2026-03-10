import React, { useEffect, useRef } from 'react';
import { GRID_SIZE } from '../engine/lesionEngine';

interface Props {
  leftEye: number[][];
  rightEye: number[][];
}

// ── Gaussian / box blur ────────────────────────
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

export const RealWorldView: React.FC<Props> = ({ leftEye, rightEye }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // 1. Draw the background image
    const img = new Image();
    img.src = '/src/assets/real-world-scene.jpg';

    img.onload = () => {
      // Draw image to fill canvas (cover)
      const scale = Math.max(W / img.width, H / img.height);
      const x = (W / 2) - (img.width / 2) * scale;
      const y = (H / 2) - (img.height / 2) * scale;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // 2. Compute the binocular field intensity map
      // We map the GRID_SIZE x GRID_SIZE visual field to the canvas size
      const bufW = GRID_SIZE;
      const bufH = GRID_SIZE;
      const intensBuf = new Uint8ClampedArray(bufW * bufH);

      for (let j = 0; j < GRID_SIZE; j++) {
        for (let i = 0; i < GRID_SIZE; i++) {
          // Visual field is roughly a circle inscribed in the grid.
          // To cover the rectangular image, we stretch a bit, but we'll map the circle to the center
          const vfx = (i - GRID_SIZE / 2 + 0.5) / (GRID_SIZE / 2);
          const vfy = (j - GRID_SIZE / 2 + 0.5) / (GRID_SIZE / 2);

          let intens = 0.0; // Default to healthy (0)

          if (vfx * vfx + vfy * vfy <= 1.0) {
            const le = leftEye[j]?.[i] ?? 0;
            const re = rightEye[j]?.[i] ?? 0;

            // True binocular vision uses Math.min(le, re).
            // But educationally, a monocular scotoma (1 eye sees, 1 eye blind) 
            // still creates a subjective dimness/interference in that field.
            // A pure min() hides monocular lesions entirely.
            // Let's blend: if one eye is blind, the field is 40% dimmed.
            // If both are blind, it's 100% dimmed.

            const min = Math.min(le, re); // Absolute blackout if both eyes lose it
            const max = Math.max(le, re); // Interference if one eye loses it

            // If the good eye sees perfectly (min=0) but the bad eye is blind (max=1),
            // we want some intensity, e.g. 0.4.
            intens = min + (max - min) * 0.45;
          }

          intensBuf[j * bufW + i] = Math.round(intens * 255);
        }
      }

      // Blur the low-res grid
      const blurred = gaussianBlur1D(intensBuf, bufW, bufH, 3); // Light blur on the 48x48 grid

      // 3. Apply the scotoma mask to the canvas
      const imgData = ctx.getImageData(0, 0, W, H);
      const raw = imgData.data;

      // We need to map canvas pixels (x, y) to grid coordinates (bx, by)
      // The visual field circular grid should be centered and scaled appropriately.
      // Let's say the visual field circle diameter covers about 85% of the canvas height.
      const vfDiameterPixels = H * 0.95;
      const startX = (W - vfDiameterPixels) / 2;
      const startY = (H - vfDiameterPixels) / 2;
      const pixelsPerGridCell = vfDiameterPixels / GRID_SIZE;

      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          let maskAlpha = 0; // 0 = clear, 1 = total black

          // Find corresponding grid cell
          const gX = (px - startX) / pixelsPerGridCell;
          const gY = (py - startY) / pixelsPerGridCell;

          if (gX >= 0 && gX < GRID_SIZE - 1 && gY >= 0 && gY < GRID_SIZE - 1) {
            // Bilinear interpolation for smooth scotoma
            const bx = Math.floor(gX);
            const by = Math.floor(gY);
            const tx = gX - bx;
            const ty = gY - by;

            const v00 = blurred[by * bufW + bx];
            const v10 = blurred[by * bufW + bx + 1];
            const v01 = blurred[(by + 1) * bufW + bx];
            const v11 = blurred[(by + 1) * bufW + bx + 1];

            const intTop = v00 * (1 - tx) + v10 * tx;
            const intBot = v01 * (1 - tx) + v11 * tx;
            const val = intTop * (1 - ty) + intBot * ty;

            maskAlpha = val / 255;
          } else {
            // Outside the mapped VF circle (peripheral vision beyond our 60-degree sim)
            const cx = W / 2;
            const cy = H / 2;
            const dx = px - cx;
            const dy = py - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxR = vfDiameterPixels / 2;

            if (dist > maxR) {
              // Create a soft vignette/blur dropping off vision at the edges
              // to frame the 60-degree perimetry data.
              const falloff = (dist - maxR) / (H * 0.15); // fade over 15% of height
              maskAlpha = Math.min(0.65, falloff * 0.65); // Max 65% darkness at edges
            }
          }

          const idx = (py * W + px) * 4;
          if (maskAlpha > 0.05) {
            // Darken and blur
            // We can't easily blur per pixel here without a shader, so we just darken/desaturate
            const r = raw[idx];
            const g = raw[idx + 1];
            const b = raw[idx + 2];

            // Mix with black based on maskAlpha
            // To make it look more like a scotoma (which is often described as a dark or gray smudge, or "nothingness")
            // A pure black overlay is standard.
            const mix = Math.min(1, maskAlpha * 1.5); // Push to black faster

            raw[idx] = r * (1 - mix);
            raw[idx + 1] = g * (1 - mix);
            raw[idx + 2] = b * (1 - mix);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Draw a subtle crosshair in the center for fixation
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 5, H / 2);
      ctx.lineTo(W / 2 + 5, H / 2);
      ctx.moveTo(W / 2, H / 2 - 5);
      ctx.lineTo(W / 2, H / 2 + 5);
      ctx.stroke();

    };
  }, [leftEye, rightEye]);

  return (
    <div className="rw-view-wrap">
      <canvas ref={canvasRef} width={600} height={400} className="rw-canvas" />
    </div>
  );
};

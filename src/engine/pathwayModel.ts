// ============================================================
// Pathway Model — defines anatomical structures, their SVG
// geometry, and which structures a lesion at a given point
// might overlap with.
// ============================================================

import type { StructureId, Point } from '../types';

/** Visual bounding shape for hit testing */
export type StructureShape =
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'capsule'; x1: number; y1: number; x2: number; y2: number; r: number };

export interface PathwayStructure {
  id: StructureId;
  label: string;
  shape: StructureShape;
  /** Which hemisphere this belongs to */
  side: 'left' | 'right' | 'bilateral';
  /** Color used when not highlighted */
  baseColor: string;
  /** Color used when lesion is placed here */
  activeColor: string;
  /** Short tooltip */
  tooltip: string;
}

// ============================================================
// SVG Layout Constants  (viewport: 380 × 720)
// ============================================================

export const SVG_WIDTH = 380;
export const SVG_HEIGHT = 720;

// Vertical positions of each pathway level
const Y_EYES         = 52;
const Y_NERVE_MID    = 165;  // midpoint of optic nerve
const Y_CHIASM       = 250;
const Y_TRACT_MID    = 310;
const Y_LGN          = 365;
const Y_RAD_MID      = 455;  // midpoint of radiations
const Y_CORTEX       = 565;

// Horizontal centers for left / right
const X_LEFT  = 90;
const X_RIGHT = 290;

// ============================================================
// Structure definitions
// ============================================================

export const STRUCTURES: PathwayStructure[] = [
  // ── Eyes ──────────────────────────────────────────────────
  {
    id: 'left_eye',
    label: 'Left Eye (Retina)',
    side: 'left',
    shape: { kind: 'circle', cx: X_LEFT, cy: Y_EYES, r: 28 },
    baseColor: '#1a3a5c',
    activeColor: '#2a5a8c',
    tooltip: 'Left retina — nasal fibers cross, temporal stay ipsilateral',
  },
  {
    id: 'right_eye',
    label: 'Right Eye (Retina)',
    side: 'right',
    shape: { kind: 'circle', cx: X_RIGHT, cy: Y_EYES, r: 28 },
    baseColor: '#1a3a5c',
    activeColor: '#2a5a8c',
    tooltip: 'Right retina — nasal fibers cross, temporal stay ipsilateral',
  },

  // ── Optic Nerves ──────────────────────────────────────────
  {
    id: 'left_optic_nerve',
    label: 'Left Optic Nerve',
    side: 'left',
    shape: { kind: 'capsule', x1: X_LEFT, y1: Y_EYES + 28, x2: X_LEFT + 60, y2: Y_CHIASM - 28, r: 12 },
    baseColor: '#1e4a72',
    activeColor: '#3070a8',
    tooltip: 'Left optic nerve — carries all left retinal fibers',
  },
  {
    id: 'right_optic_nerve',
    label: 'Right Optic Nerve',
    side: 'right',
    shape: { kind: 'capsule', x1: X_RIGHT, y1: Y_EYES + 28, x2: X_RIGHT - 60, y2: Y_CHIASM - 28, r: 12 },
    baseColor: '#1e4a72',
    activeColor: '#3070a8',
    tooltip: 'Right optic nerve — carries all right retinal fibers',
  },

  // ── Chiasm ─────────────────────────────────────────────────
  {
    id: 'chiasm',
    label: 'Optic Chiasm',
    side: 'bilateral',
    shape: { kind: 'ellipse', cx: 190, cy: Y_CHIASM, rx: 78, ry: 28 },
    baseColor: '#1e5a4a',
    activeColor: '#2d8a70',
    tooltip: 'Nasal fibers from each eye cross here — lesion causes bitemporal hemianopia',
  },

  // ── Optic Tracts ───────────────────────────────────────────
  {
    id: 'left_optic_tract',
    label: 'Left Optic Tract',
    side: 'left',
    shape: { kind: 'capsule', x1: X_LEFT + 50, y1: Y_CHIASM + 28, x2: X_LEFT, y2: Y_LGN - 18, r: 11 },
    baseColor: '#1e4a72',
    activeColor: '#3070a8',
    tooltip: 'Left optic tract — carries right visual field to left hemisphere',
  },
  {
    id: 'right_optic_tract',
    label: 'Right Optic Tract',
    side: 'right',
    shape: { kind: 'capsule', x1: X_RIGHT - 50, y1: Y_CHIASM + 28, x2: X_RIGHT, y2: Y_LGN - 18, r: 11 },
    baseColor: '#1e4a72',
    activeColor: '#3070a8',
    tooltip: 'Right optic tract — carries left visual field to right hemisphere',
  },

  // ── Lateral Geniculate Nuclei ──────────────────────────────
  {
    id: 'left_lgn',
    label: 'Left LGN',
    side: 'left',
    shape: { kind: 'circle', cx: X_LEFT, cy: Y_LGN, r: 18 },
    baseColor: '#3a1e6a',
    activeColor: '#5a2ea8',
    tooltip: 'Left lateral geniculate nucleus — relay for right visual field',
  },
  {
    id: 'right_lgn',
    label: 'Right LGN',
    side: 'right',
    shape: { kind: 'circle', cx: X_RIGHT, cy: Y_LGN, r: 18 },
    baseColor: '#3a1e6a',
    activeColor: '#5a2ea8',
    tooltip: 'Right lateral geniculate nucleus — relay for left visual field',
  },

  // ── Optic Radiations — Meyer's Loop ────────────────────────
  // Meyer's loop sweeps anteriorly through temporal lobe (shown going laterally outward)
  // carrying INFERIOR retinal fibers = SUPERIOR visual field
  {
    id: 'left_meyers_loop',
    label: "Left Meyer's Loop",
    side: 'left',
    shape: { kind: 'capsule', x1: X_LEFT - 4, y1: Y_LGN + 18, x2: X_LEFT - 44, y2: Y_RAD_MID, r: 14 },
    baseColor: '#1a3a6a',
    activeColor: '#2860aa',
    tooltip: "Left Meyer's loop — superior visual field of right hemifield; temporal lobe",
  },
  {
    id: 'right_meyers_loop',
    label: "Right Meyer's Loop",
    side: 'right',
    shape: { kind: 'capsule', x1: X_RIGHT + 4, y1: Y_LGN + 18, x2: X_RIGHT + 44, y2: Y_RAD_MID, r: 14 },
    baseColor: '#1a3a6a',
    activeColor: '#2860aa',
    tooltip: "Right Meyer's loop — superior visual field of left hemifield; temporal lobe",
  },

  // ── Optic Radiations — Parietal ────────────────────────────
  // Parietal radiations take a shorter, more direct course
  // carrying SUPERIOR retinal fibers = INFERIOR visual field
  {
    id: 'left_parietal_radiation',
    label: 'Left Parietal Radiation',
    side: 'left',
    shape: { kind: 'capsule', x1: X_LEFT + 4, y1: Y_LGN + 18, x2: X_LEFT + 44, y2: Y_RAD_MID, r: 14 },
    baseColor: '#1a3a6a',
    activeColor: '#2860aa',
    tooltip: 'Left parietal radiation — inferior visual field of right hemifield',
  },
  {
    id: 'right_parietal_radiation',
    label: 'Right Parietal Radiation',
    side: 'right',
    shape: { kind: 'capsule', x1: X_RIGHT - 4, y1: Y_LGN + 18, x2: X_RIGHT - 44, y2: Y_RAD_MID, r: 14 },
    baseColor: '#1a3a6a',
    activeColor: '#2860aa',
    tooltip: 'Right parietal radiation — inferior visual field of left hemifield',
  },

  // ── Occipital / Calcarine Cortex ───────────────────────────
  {
    id: 'left_occipital',
    label: 'Left Calcarine Cortex',
    side: 'left',
    shape: { kind: 'rect', x: 42, y: Y_CORTEX, w: 110, h: 70 },
    baseColor: '#1e3a1e',
    activeColor: '#2e5a2e',
    tooltip: 'Left V1 — right visual hemifield; macular representation is posterior',
  },
  {
    id: 'right_occipital',
    label: 'Right Calcarine Cortex',
    side: 'right',
    shape: { kind: 'rect', x: 228, y: Y_CORTEX, w: 110, h: 70 },
    baseColor: '#1e3a1e',
    activeColor: '#2e5a2e',
    tooltip: 'Right V1 — left visual hemifield; macular representation is posterior',
  },
];

export const STRUCTURE_MAP = new Map<StructureId, PathwayStructure>(
  STRUCTURES.map(s => [s.id, s])
);

// ============================================================
// Hit testing: given a point in SVG space, which structure
// is closest and overlapping?
// ============================================================

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function distToShape(p: Point, shape: StructureShape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.hypot(p.x - shape.cx, p.y - shape.cy) - shape.r;
    case 'ellipse': {
      const nx = (p.x - shape.cx) / shape.rx;
      const ny = (p.y - shape.cy) / shape.ry;
      return Math.hypot(nx, ny) - 1;
    }
    case 'rect': {
      const dx = Math.max(shape.x - p.x, 0, p.x - (shape.x + shape.w));
      const dy = Math.max(shape.y - p.y, 0, p.y - (shape.y + shape.h));
      return Math.hypot(dx, dy);
    }
    case 'capsule':
      return distToSegment(p.x, p.y, shape.x1, shape.y1, shape.x2, shape.y2) - shape.r;
  }
}

/**
 * Returns the structure closest to point p that the lesion (radius r) overlaps.
 * Priority order matches clinical importance.
 */
export function hitTestStructure(p: Point, lesionR: number): StructureId | null {
  let best: StructureId | null = null;
  let bestDist = Infinity;

  for (const s of STRUCTURES) {
    const d = distToShape(p, s.shape);
    // lesion overlaps structure if distance < lesion radius
    if (d < lesionR + 4 && d < bestDist) {
      bestDist = d;
      best = s.id;
    }
  }
  return best;
}

/**
 * Returns the normalized vertical position (0=top, 1=bottom) within
 * the occipital cortex shapes — used for macular-sparing logic.
 * For the cortex: posterior (top of rect) = macula, anterior (bottom) = periphery.
 */
export function getOccipitalPartialY(p: Point, side: 'left' | 'right'): number {
  const s = STRUCTURE_MAP.get(side === 'left' ? 'left_occipital' : 'right_occipital')!;
  if (s.shape.kind !== 'rect') return 0.5;
  return Math.max(0, Math.min(1, (p.y - s.shape.y) / s.shape.h));
}

/**
 * Returns the normalized lateral position within the radiation capsules.
 * 0 = inner (parietal) side, 1 = outer (Meyer's loop) side.
 */
export function getRadiationPartialY(p: Point, side: 'left' | 'right'): number {
  const ml = STRUCTURE_MAP.get(side === 'left' ? 'left_meyers_loop' : 'right_meyers_loop')!;
  const pr = STRUCTURE_MAP.get(side === 'left' ? 'left_parietal_radiation' : 'right_parietal_radiation')!;
  if (ml.shape.kind !== 'capsule' || pr.shape.kind !== 'capsule') return 0.5;

  const dML = distToShape(p, ml.shape);
  const dPR = distToShape(p, pr.shape);
  if (dML + dPR === 0) return 0.5;
  return dML / (dML + dPR);
}

// Re-export useful constants
export { Y_EYES, Y_NERVE_MID, Y_CHIASM, Y_TRACT_MID, Y_LGN, Y_RAD_MID, Y_CORTEX, X_LEFT, X_RIGHT };

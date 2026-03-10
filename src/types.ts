// ============================================================
// Core type definitions for the visual field simulator
// ============================================================

/** All anatomical structures in the visual pathway */
export type StructureId =
  | 'left_eye'
  | 'right_eye'
  | 'left_optic_nerve'
  | 'right_optic_nerve'
  | 'chiasm'
  | 'left_optic_tract'
  | 'right_optic_tract'
  | 'left_lgn'
  | 'right_lgn'
  | 'left_meyers_loop'
  | 'right_meyers_loop'
  | 'left_parietal_radiation'
  | 'right_parietal_radiation'
  | 'left_occipital'
  | 'right_occipital';

/** A 2D point */
export interface Point {
  x: number;
  y: number;
}

/** A placed lesion on the pathway diagram */
export interface Lesion {
  position: Point;               // SVG coordinates
  radius: number;                // in SVG units
  structure: StructureId | null; // which structure it hit (computed)
  partialY?: number;             // 0..1 fractional position within tall structures
}

/** Visual field as a 2D intensity grid.
 *  Grid is GRID_SIZE × GRID_SIZE.
 *  grid[j][i] = 0.0 (fully seeing) … 1.0 (fully scotomatous)
 *  Coordinate convention (Goldmann perimetry, patient's POV):
 *    i=0 → left edge, i=GRID_SIZE-1 → right edge
 *    j=0 → top (superior), j=GRID_SIZE-1 → bottom (inferior)
 */
export type VFGrid = number[][];

/** Per-eye visual field results */
export interface VisualFieldResult {
  leftEye: VFGrid;
  rightEye: VFGrid;
  binocular: VFGrid;
}

/** Hover interaction state — which VF point the cursor is over */
export interface VFHoverState {
  /** Normalized VF coords of the hovered point, or null */
  vfPoint: { vfx: number; vfy: number } | null;
  /** Which eye's canvas is being hovered */
  eye: 'left' | 'right' | null;
}

/** Deficit description used for clinical reasoning */
export interface DeficitSummary {
  pattern: string;           // e.g. "Left homonymous hemianopia"
  eye: 'right' | 'left' | 'both' | 'none';
  hemifield: 'left' | 'right' | 'temporal' | 'both-temporal' | 'superior' | 'inferior' | 'none' | 'full';
  quadrant: 'superior-left' | 'inferior-left' | 'superior-right' | 'inferior-right' | 'none';
  macula: 'spared' | 'involved' | 'n/a';
  clinicalNote: string;
  anatomicalExplanation: string;
  structure: StructureId | null;
}

/** A clinical preset case */
export interface ClinicalCase {
  id: string;
  title: string;
  etiology: string;
  lesionPosition: Point;
  lesionRadius: number;
  description: string;
  teachingPoint: string;
}

/** App mode */
export type AppMode = 'explore' | 'diagnostic';

/** Diagnostic challenge state */
export interface DiagnosticChallenge {
  targetCase: ClinicalCase;
  userLesion: Lesion | null;
  userStructure: StructureId | null;
  result: 'correct' | 'incorrect' | 'pending';
  feedback: string;
}

/** Perimetry animation state */
export interface PerimetryState {
  active: boolean;
  points: Array<{ vfx: number; vfy: number; seen: boolean; revealed: boolean }>;
  currentIndex: number;
}

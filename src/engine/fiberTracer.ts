// ============================================================
// Fiber Tracer — the crown jewel feature.
//
// Maps any visual field coordinate (vfx, vfy) to the exact
// SVG positions of the fiber bundle carrying that point,
// through every structure from retina to cortex.
//
// This enables the bidirectional hover interaction:
//   VF point hovered → pathway glows at those positions
//   Pathway point hovered → VF region illuminates
//
// ANATOMICAL ACCURACY:
//   - Nasal retinal fibers (temporal VF) cross at the chiasm
//   - Superior VF → inferior retina → Meyer's loop
//   - Inferior VF → superior retina → parietal radiation
//   - Peripheral VF → anterior cortex, macular → posterior
//   - Left VF → right hemisphere structures, and vice versa
// ============================================================

import type { StructureId, Point } from '../types';
import {
  X_LEFT, X_RIGHT,
  Y_EYES, Y_NERVE_MID, Y_CHIASM, Y_TRACT_MID, Y_LGN, Y_RAD_MID, Y_CORTEX,
} from './pathwayModel';

export interface FiberTrace {
  /** SVG position of the fiber in each structure it passes through */
  positions: Partial<Record<StructureId, Point>>;
  /** The hemisphere this fiber arrives at post-chiasm */
  hemisphere: 'left' | 'right' | 'central';
  /** Whether it runs through Meyer's loop or parietal radiation */
  radiationType: 'meyers' | 'parietal' | 'both';
  /** Ordered SVG points for drawing the trace polyline */
  polyline: Point[];
}

/**
 * Given a normalized VF coordinate, returns the SVG position of the
 * fiber bundle carrying that point through each pathway structure.
 *
 * vfx: -1 = far left, +1 = far right (patient's visual field)
 * vfy: -1 = far superior, +1 = far inferior
 */
export function traceFiber(vfx: number, vfy: number): FiberTrace {
  const isLeftVF  = vfx < -0.06;  // left VF → right hemisphere post-chiasm
  const isRightVF = vfx >  0.06;  // right VF → left hemisphere post-chiasm
  const isSup = vfy < -0.06;      // superior VF → Meyer's loop
  const isInf = vfy >  0.06;      // inferior VF → parietal radiation
  const ecc = Math.min(1, Math.hypot(vfx, vfy));  // eccentricity 0–1

  const positions: Partial<Record<StructureId, Point>> = {};

  // ── RETINA (both eyes) ────────────────────────────────────
  // The lens inverts the image: VF left → right side of retina (for each eye)
  // Temporal = outer retina; sees contralateral visual field half
  // Nasal = inner retina; sees ipsilateral field half (and will cross)
  const EYE_R = 12;
  positions['left_eye'] = {
    x: X_LEFT  - vfx * EYE_R,   // inverted x
    y: Y_EYES  - vfy * 9,        // inverted y
  };
  positions['right_eye'] = {
    x: X_RIGHT - vfx * EYE_R,
    y: Y_EYES  - vfy * 9,
  };

  // ── OPTIC NERVES ─────────────────────────────────────────
  // Left optic nerve: temporal fibers (right VF, non-crossing) sit laterally
  //                   nasal fibers (left VF, crossing) sit medially
  positions['left_optic_nerve'] = {
    x: X_LEFT + 24 + (isRightVF ? 10 : 2),
    y: Y_NERVE_MID + vfy * 10,
  };
  // Right optic nerve: symmetric — temporal = left VF = lateral
  positions['right_optic_nerve'] = {
    x: X_RIGHT - 24 - (isLeftVF ? 10 : 2),
    y: Y_NERVE_MID + vfy * 10,
  };

  // ── CHIASM ────────────────────────────────────────────────
  // Nasal fibers (temporal VF) cross through the center of the chiasm.
  // Temporal fibers (nasal VF) run along the lateral edges without crossing.
  //
  // Right VF fibers converge on the LEFT side of the chiasm (to enter left tract).
  // Left VF fibers converge on the RIGHT side.
  // vfx = 0 means the fiber is right at the crossing point (center).
  positions['chiasm'] = {
    x: 190 - vfx * 64,    // right VF → left of center; left VF → right of center
    y: Y_CHIASM + vfy * 14,
  };

  // ── POST-CHIASMAL (hemisphere-specific) ──────────────────
  //
  // Left VF → right optic tract → right LGN → right radiations → right V1
  // Right VF → left optic tract → left LGN → left radiations → left V1
  //
  // Topography within post-chiasmal structures:
  //   Superior VF fibers (inferior retina) occupy inferior/lateral positions
  //   Inferior VF fibers (superior retina) occupy superior/medial positions
  //   (This reverses again in the cortex because the cortex is inverted)

  if (isLeftVF || (!isRightVF)) {
    // ── RIGHT HEMISPHERE path (left VF or central) ──

    // Right optic tract: fiber position shifts by VF elevation
    positions['right_optic_tract'] = {
      x: X_RIGHT - 22 + vfy * 12,  // inferior VF → lateral, superior → medial
      y: Y_TRACT_MID,
    };

    // Right LGN: 6-layer structure, topographic map
    positions['right_lgn'] = {
      x: X_RIGHT + vfy * 9,
      y: Y_LGN + vfy * 6,
    };

    // Optic radiations: split by superior/inferior VF
    if (isSup || !isInf) {
      // Superior VF → inferior retinal fibers → Meyer's loop (sweeps anteriorly)
      positions['right_meyers_loop'] = {
        x: X_RIGHT + 32 + (1 - ecc) * 8,
        y: Y_RAD_MID - Math.abs(vfy) * 35,
      };
    }
    if (isInf || !isSup) {
      // Inferior VF → superior retinal fibers → parietal radiation (shorter path)
      positions['right_parietal_radiation'] = {
        x: X_RIGHT - 30 + (1 - ecc) * 5,
        y: Y_RAD_MID + Math.abs(vfy) * 22,
      };
    }

    // Right occipital / calcarine cortex (right V1 → left visual hemifield)
    // Posterior = macular (low ecc), anterior = peripheral (high ecc)
    // Lower bank (lingual gyrus) = superior VF
    // Upper bank (cuneus) = inferior VF
    const occY_r = Y_CORTEX + 8 + ecc * 52;           // eccentric → anterior
    const bankOffset_r = vfy * 22;                      // sup VF → lower y (lower bank)
    positions['right_occipital'] = {
      x: Math.max(230, Math.min(336, 283 + vfx * 30)), // slight x spread
      y: Math.max(Y_CORTEX + 5, Math.min(Y_CORTEX + 62, occY_r + bankOffset_r)),
    };
  }

  if (isRightVF || (!isLeftVF)) {
    // ── LEFT HEMISPHERE path (right VF or central) ──

    positions['left_optic_tract'] = {
      x: X_LEFT + 22 - vfy * 12,
      y: Y_TRACT_MID,
    };

    positions['left_lgn'] = {
      x: X_LEFT - vfy * 9,
      y: Y_LGN + vfy * 6,
    };

    if (isSup || !isInf) {
      positions['left_meyers_loop'] = {
        x: X_LEFT - 32 - (1 - ecc) * 8,
        y: Y_RAD_MID - Math.abs(vfy) * 35,
      };
    }
    if (isInf || !isSup) {
      positions['left_parietal_radiation'] = {
        x: X_LEFT + 30 - (1 - ecc) * 5,
        y: Y_RAD_MID + Math.abs(vfy) * 22,
      };
    }

    const occY_l = Y_CORTEX + 8 + ecc * 52;
    const bankOffset_l = vfy * 22;
    positions['left_occipital'] = {
      x: Math.max(44, Math.min(150, 97 - vfx * 30)),
      y: Math.max(Y_CORTEX + 5, Math.min(Y_CORTEX + 62, occY_l + bankOffset_l)),
    };
  }

  // ── BUILD POLYLINE for drawing the trace ─────────────────
  // Ordered list of points for the glowing trace line
  const polyline: Point[] = [];

  // Both eyes contribute fibers — connect them via their nerves to the chiasm
  const addIfExists = (id: StructureId) => {
    const p = positions[id];
    if (p) polyline.push(p);
  };

  // Retinas → nerves → chiasm
  addIfExists('left_eye');
  addIfExists('left_optic_nerve');
  addIfExists('chiasm');
  addIfExists('right_optic_nerve');
  addIfExists('right_eye');

  // The post-chiasmal path in order
  if (isLeftVF || !isRightVF) {
    // → right hemisphere
    addIfExists('right_optic_tract');
    addIfExists('right_lgn');
    if (isSup || !isInf) addIfExists('right_meyers_loop');
    if (isInf || !isSup) addIfExists('right_parietal_radiation');
    addIfExists('right_occipital');
  }
  if (isRightVF || !isLeftVF) {
    // → left hemisphere
    addIfExists('left_optic_tract');
    addIfExists('left_lgn');
    if (isSup || !isInf) addIfExists('left_meyers_loop');
    if (isInf || !isSup) addIfExists('left_parietal_radiation');
    addIfExists('left_occipital');
  }

  return {
    positions,
    hemisphere: isLeftVF ? 'right' : isRightVF ? 'left' : 'central',
    radiationType: isSup ? 'meyers' : isInf ? 'parietal' : 'both',
    polyline,
  };
}

// ── Reverse: VF region from pathway hover ────────────────────

/**
 * Given a structure, returns the VF region it subtends as a set
 * of test points in normalized coords. Used to highlight the
 * corresponding VF area when hovering a structure in the pathway.
 */
export function getStructureVFRegion(structure: StructureId): { vfx: number; vfy: number }[] {
  const pts: { vfx: number; vfy: number }[] = [];
  const N = 8; // samples per axis

  const range = (from: number, to: number, n: number) =>
    Array.from({ length: n }, (_, i) => from + (to - from) * (i / (n - 1)));

  const leftHemi  = range(-0.95, -0.05, N);
  const rightHemi = range(0.05, 0.95, N);
  const bothHemi  = range(-0.95, 0.95, N);
  const supHalf   = range(-0.95, -0.05, N);
  const infHalf   = range(0.05, 0.95, N);
  const fullV     = range(-0.95, 0.95, N);

  const addGrid = (xs: number[], ys: number[]) => {
    for (const x of xs) for (const y of ys)
      if (x * x + y * y <= 0.92) pts.push({ vfx: x, vfy: y });
  };

  switch (structure) {
    // Pre-chiasmal: monocular (whole field, one eye)
    case 'left_eye': case 'left_optic_nerve':
      addGrid(bothHemi, fullV); break;
    case 'right_eye': case 'right_optic_nerve':
      addGrid(bothHemi, fullV); break;

    // Chiasm: temporal fields of both eyes
    case 'chiasm':
      addGrid(leftHemi, fullV);    // right eye temporal
      addGrid(rightHemi, fullV);   // left eye temporal
      break;

    // Post-chiasmal hemifields
    case 'left_optic_tract': case 'left_lgn': case 'left_occipital':
      addGrid(rightHemi, fullV); break;
    case 'right_optic_tract': case 'right_lgn': case 'right_occipital':
      addGrid(leftHemi, fullV); break;

    // Quadrants via radiations
    case 'left_meyers_loop':
      addGrid(rightHemi, supHalf); break;
    case 'right_meyers_loop':
      addGrid(leftHemi, supHalf); break;
    case 'left_parietal_radiation':
      addGrid(rightHemi, infHalf); break;
    case 'right_parietal_radiation':
      addGrid(leftHemi, infHalf); break;
  }
  return pts;
}

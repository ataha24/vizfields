// ============================================================
// Lesion Engine — the core simulation.
//
// Produces an INTENSITY-based visual field grid (0.0 = normal,
// 1.0 = complete scotoma) rather than boolean. This enables:
//   • Graded scotomas with soft borders
//   • Partial deficits from partial structure overlap
//   • Smooth transitions as the lesion moves
//
// VISUAL FIELD CONVENTIONS:
//   vfx > 0 = right VF, vfx < 0 = left VF
//   vfy < 0 = superior VF, vfy > 0 = inferior VF
//
// ANATOMICAL TRUTH:
//   LEFT visual field  → RIGHT tract → RIGHT LGN → RIGHT cortex
//   RIGHT visual field → LEFT tract  → LEFT LGN  → LEFT cortex
//   Meyer's loop = inferior retinal fibers = SUPERIOR visual field
//   Parietal radiation = superior retinal fibers = INFERIOR visual field
// ============================================================

import type { Lesion, VisualFieldResult, VFGrid, DeficitSummary, StructureId } from '../types';
import { STRUCTURE_MAP } from './pathwayModel';
import type { StructureShape } from './pathwayModel';

export const GRID_SIZE = 64;

// ── Grid factories ───────────────────────────────────────────

function emptyGrid(): VFGrid {
  return Array.from({ length: GRID_SIZE }, () => new Array<number>(GRID_SIZE).fill(0));
}

function toNorm(i: number, j: number): [number, number] {
  return [
    (i - GRID_SIZE / 2 + 0.5) / (GRID_SIZE / 2),
    (j - GRID_SIZE / 2 + 0.5) / (GRID_SIZE / 2),
  ];
}

function inCircle(vfx: number, vfy: number): boolean {
  return vfx * vfx + vfy * vfy <= 1.0;
}

// ── Structure overlap computation ────────────────────────────

function distToShape(px: number, py: number, shape: StructureShape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.hypot(px - shape.cx, py - shape.cy) - shape.r;
    case 'ellipse': {
      const nx = (px - shape.cx) / shape.rx;
      const ny = (py - shape.cy) / shape.ry;
      return Math.hypot(nx, ny) - 1;
    }
    case 'rect': {
      const dx = Math.max(shape.x - px, 0, px - (shape.x + shape.w));
      const dy = Math.max(shape.y - py, 0, py - (shape.y + shape.h));
      return Math.hypot(dx, dy);
    }
    case 'capsule': {
      const ex = shape.x2 - shape.x1, ey = shape.y2 - shape.y1;
      const lenSq = ex * ex + ey * ey;
      const t = lenSq > 0
        ? Math.max(0, Math.min(1, ((px - shape.x1) * ex + (py - shape.y1) * ey) / lenSq))
        : 0;
      return Math.hypot(px - (shape.x1 + t * ex), py - (shape.y1 + t * ey)) - shape.r;
    }
  }
}

/**
 * Compute how much a lesion (position, radius) covers a structure (0–1).
 * Uses distance from lesion center to structure surface + lesion radius.
 * Result is 1 when fully inside, 0 when fully outside, smooth gradient between.
 */
function computeCoverage(lesion: Lesion, structureId: StructureId): number {
  const s = STRUCTURE_MAP.get(structureId);
  if (!s) return 0;
  const dist = distToShape(lesion.position.x, lesion.position.y, s.shape);
  // Smooth falloff: full coverage when dist < 0, zero when dist > lesion.radius
  const coverage = 1 - Math.max(0, Math.min(1, (dist + lesion.radius * 0.3) / lesion.radius));
  return coverage;
}

// ── Field predicate fill ─────────────────────────────────────

type Pred = (vfx: number, vfy: number) => boolean;

const ALL:       Pred = (x, y) => inCircle(x, y);
const LEFT_HEMI: Pred = (x, y) => inCircle(x, y) && x < 0;
const RIGHT_HEMI:Pred = (x, y) => inCircle(x, y) && x > 0;
const SUP_LEFT:  Pred = (x, y) => inCircle(x, y) && x < 0 && y < 0;
const INF_LEFT:  Pred = (x, y) => inCircle(x, y) && x < 0 && y > 0;
const SUP_RIGHT: Pred = (x, y) => inCircle(x, y) && x > 0 && y < 0;
const INF_RIGHT: Pred = (x, y) => inCircle(x, y) && x > 0 && y > 0;

// Temporal VF of each eye = the non-nasal side
// Left eye temporal = right VF; right eye temporal = left VF
const L_EYE_TEMPORAL: Pred = RIGHT_HEMI;   // left eye loses right (temporal) VF
const R_EYE_TEMPORAL: Pred = LEFT_HEMI;    // right eye loses left (temporal) VF

function macula_spared_pred(hemi: 'left' | 'right'): Pred {
  const base = hemi === 'left' ? LEFT_HEMI : RIGHT_HEMI;
  const MACULAR_R = 0.22; // ~13° spared
  return (x, y) => base(x, y) && (x * x + y * y) > MACULAR_R * MACULAR_R;
}

/** Add intensity * coverage to affected cells */
function addGrid(grid: VFGrid, pred: Pred, intensity: number): void {
  for (let j = 0; j < GRID_SIZE; j++) {
    for (let i = 0; i < GRID_SIZE; i++) {
      const [vfx, vfy] = toNorm(i, j);
      if (pred(vfx, vfy)) {
        grid[j][i] = Math.min(1, grid[j][i] + intensity);
      }
    }
  }
}

// ── Main computation ─────────────────────────────────────────

export function computeVisualField(lesion: Lesion | null): VisualFieldResult {
  const le = emptyGrid();
  const re = emptyGrid();

  if (!lesion || !lesion.structure) {
    return { leftEye: le, rightEye: re, binocular: emptyGrid() };
  }

  const struct = lesion.structure;
  const cov = computeCoverage(lesion, struct); // 0–1 how much structure is hit
  const py  = lesion.partialY ?? 0.5;

  // Each case adds deficits scaled by how much the lesion overlaps the structure
  switch (struct) {
    // ── Pre-chiasmal: monocular ───────────────────────────────
    case 'left_eye':
    case 'left_optic_nerve':
      addGrid(le, ALL, cov);
      break;

    case 'right_eye':
    case 'right_optic_nerve':
      addGrid(re, ALL, cov);
      break;

    // ── Chiasm: bitemporal hemianopia ─────────────────────────
    // Central chiasm damages crossing nasal fibers:
    //   Right nasal retina (right VF) → crosses → left hemisphere
    //   Left nasal retina (left VF)   → crosses → right hemisphere
    // Both eyes lose their TEMPORAL visual fields
    case 'chiasm':
      addGrid(re, R_EYE_TEMPORAL, cov);  // right eye loses left (temporal) VF
      addGrid(le, L_EYE_TEMPORAL, cov);  // left eye loses right (temporal) VF
      break;

    // ── Right optic tract: left homonymous hemianopia ─────────
    // Contains: right temporal + left nasal (post-cross) = LEFT visual field
    case 'right_optic_tract':
    case 'right_lgn':
      addGrid(le, LEFT_HEMI, cov);
      addGrid(re, LEFT_HEMI, cov);
      break;

    // ── Left optic tract: right homonymous hemianopia ─────────
    case 'left_optic_tract':
    case 'left_lgn':
      addGrid(le, RIGHT_HEMI, cov);
      addGrid(re, RIGHT_HEMI, cov);
      break;

    // ── Meyer's loops: superior quadrantanopias ───────────────
    // Meyer's loop = inferior retinal fibers = SUPERIOR visual field
    case 'right_meyers_loop':
      addGrid(le, SUP_LEFT, cov);
      addGrid(re, SUP_LEFT, cov);
      break;

    case 'left_meyers_loop':
      addGrid(le, SUP_RIGHT, cov);
      addGrid(re, SUP_RIGHT, cov);
      break;

    // ── Parietal radiations: inferior quadrantanopias ─────────
    // Parietal radiation = superior retinal fibers = INFERIOR visual field
    case 'right_parietal_radiation':
      addGrid(le, INF_LEFT, cov);
      addGrid(re, INF_LEFT, cov);
      break;

    case 'left_parietal_radiation':
      addGrid(le, INF_RIGHT, cov);
      addGrid(re, INF_RIGHT, cov);
      break;

    // ── Occipital cortex: hemianopia ± macular sparing ────────
    // Posterior pole (top of rect, py ≈ 0) = macular representation
    // Anterior cortex (bottom, py ≈ 1) = peripheral
    // PCA strokes: often spare macula (dual blood supply from MCA)
    case 'right_occipital': {
      // py < 0.5 = anterior (peripheral) lesion → macular sparing likely
      const pred = py < 0.5 ? macula_spared_pred('left') : LEFT_HEMI;
      addGrid(le, pred, cov);
      addGrid(re, pred, cov);
      break;
    }

    case 'left_occipital': {
      const pred = py < 0.5 ? macula_spared_pred('right') : RIGHT_HEMI;
      addGrid(le, pred, cov);
      addGrid(re, pred, cov);
      break;
    }
  }

  // Binocular: point is binocularly blind if both eyes are substantially affected
  const bino = emptyGrid();
  for (let j = 0; j < GRID_SIZE; j++)
    for (let i = 0; i < GRID_SIZE; i++)
      bino[j][i] = Math.min(le[j][i], re[j][i]);

  return { leftEye: le, rightEye: re, binocular: bino };
}

// ── Deficit summary for reasoning panel ──────────────────────

export function computeDeficitSummary(lesion: Lesion | null): DeficitSummary {
  const none: DeficitSummary = {
    pattern: 'No deficit',
    eye: 'none',
    hemifield: 'none',
    quadrant: 'none',
    macula: 'n/a',
    clinicalNote: 'No lesion placed. Click any structure on the pathway to explore deficits.',
    anatomicalExplanation: '',
    structure: null,
  };

  if (!lesion || !lesion.structure) return none;

  const py = lesion.partialY ?? 0.5;

  const SUMMARIES: Record<StructureId, DeficitSummary> = {
    left_eye: {
      pattern: 'Left monocular blindness',
      eye: 'left', hemifield: 'full', quadrant: 'none', macula: 'involved',
      structure: 'left_eye',
      clinicalNote: 'Complete vision loss in the left eye only. Right eye and binocular field intact.',
      anatomicalExplanation:
        'A retinal or proximal optic nerve lesion disrupts all ganglion cell fibers before they exit the eye. Since the chiasm has not been reached, only the ipsilateral eye is affected. The right eye sees normally. Classic causes: optic neuritis, CRAO, CRVO, orbital trauma.',
    },
    right_eye: {
      pattern: 'Right monocular blindness',
      eye: 'right', hemifield: 'full', quadrant: 'none', macula: 'involved',
      structure: 'right_eye',
      clinicalNote: 'Complete vision loss in the right eye only.',
      anatomicalExplanation:
        'Lesion anterior to the chiasm on the right side, disrupting all right retinal ganglion cell axons. Common causes: optic neuritis (MS), ischemic optic neuropathy, orbital compression.',
    },
    left_optic_nerve: {
      pattern: 'Left monocular blindness',
      eye: 'left', hemifield: 'full', quadrant: 'none', macula: 'involved',
      structure: 'left_optic_nerve',
      clinicalNote: 'Complete vision loss in the left eye. A left RAPD (relative afferent pupillary defect) will be present — the consensual response is preserved but the direct response is diminished.',
      anatomicalExplanation:
        'The left optic nerve carries all 1.2 million ganglion cell axons from the left retina. Damage here (before the chiasm) produces strictly monocular visual loss. The right eye pathway is entirely intact. The RAPD localizes the lesion to the left optic nerve or severe left retinal disease.',
    },
    right_optic_nerve: {
      pattern: 'Right monocular blindness',
      eye: 'right', hemifield: 'full', quadrant: 'none', macula: 'involved',
      structure: 'right_optic_nerve',
      clinicalNote: 'Complete vision loss in the right eye with right RAPD.',
      anatomicalExplanation:
        'The right optic nerve is the sole conduit for right retinal fibers before the chiasm. Damage produces complete right monocular blindness. Causes include optic neuritis (most common in young women with MS), NAION (non-arteritic ischemic optic neuropathy), compressive optic neuropathy from a mass.',
    },
    chiasm: {
      pattern: 'Bitemporal hemianopia',
      eye: 'both', hemifield: 'both-temporal', quadrant: 'none', macula: 'involved',
      structure: 'chiasm',
      clinicalNote:
        'Both eyes lose their temporal (outer) visual fields. The nasal (inner) fields are preserved. The field defect respects the vertical midline — pathognomonic for chiasmal disease.',
      anatomicalExplanation:
        'The optic chiasm is where NASAL retinal fibers from each eye cross to the contralateral tract. The right nasal retina (seeing the right visual field) crosses to the left tract. The left nasal retina (left VF) crosses to the right tract. A central chiasmal lesion selectively damages these crossing fibers, while temporal (non-crossing) fibers are spared — producing bitemporal hemianopia. Classic cause: pituitary adenoma compressing from below.',
    },
    left_optic_tract: {
      pattern: 'Right homonymous hemianopia',
      eye: 'both', hemifield: 'right', quadrant: 'none', macula: 'involved',
      structure: 'left_optic_tract',
      clinicalNote:
        'Both eyes lose the right visual field. The deficit may be slightly incongruent (more different between the two eyes) at the tract level — because the nasal and temporal fibers are not yet fully interleaved.',
      anatomicalExplanation:
        'The left optic tract carries fibers representing the right visual field: left eye temporal fibers (which did not cross) and right eye nasal fibers (which crossed at the chiasm). Both fiber populations serve the right hemifield, so a left tract lesion produces right homonymous hemianopia.',
    },
    right_optic_tract: {
      pattern: 'Left homonymous hemianopia',
      eye: 'both', hemifield: 'left', quadrant: 'none', macula: 'involved',
      structure: 'right_optic_tract',
      clinicalNote: 'Both eyes lose the left visual field. Often incongruent at tract level.',
      anatomicalExplanation:
        'The right optic tract carries fibers from the left visual field: right eye temporal fibers and left eye nasal fibers (post-chiasm). Damage causes left homonymous hemianopia.',
    },
    left_lgn: {
      pattern: 'Right homonymous hemianopia',
      eye: 'both', hemifield: 'right', quadrant: 'none', macula: 'involved',
      structure: 'left_lgn',
      clinicalNote: 'LGN lesions are rare. Often caused by anterior choroidal artery territory infarct, producing a distinctive wedge-shaped or sector scotoma.',
      anatomicalExplanation:
        'The left LGN receives all fibers from the left optic tract (right visual field). It has a precise 6-layer laminar organization with alternating inputs from each eye. The vascular supply (anterior choroidal artery) creates characteristic patterns. A lesion produces right homonymous hemianopia.',
    },
    right_lgn: {
      pattern: 'Left homonymous hemianopia',
      eye: 'both', hemifield: 'left', quadrant: 'none', macula: 'involved',
      structure: 'right_lgn',
      clinicalNote: 'Left homonymous hemianopia. Often caused by anterior choroidal artery or LPA territory infarct.',
      anatomicalExplanation:
        'The right LGN relays fibers from the right optic tract (left visual field). The 6-layer structure has an exquisitely precise retinotopic map. Damage produces left homonymous hemianopia.',
    },
    left_meyers_loop: {
      pattern: 'Right superior quadrantanopia',
      eye: 'both', hemifield: 'superior', quadrant: 'superior-right', macula: 'involved',
      structure: 'left_meyers_loop',
      clinicalNote:
        '"Pie in the sky" — right superior quadrant loss. Classic sign of a left temporal lobe lesion.',
      anatomicalExplanation:
        "Meyer's loop is the anterior temporal sweep of the optic radiation. It carries INFERIOR retinal ganglion cell fibers, which represent the SUPERIOR visual field. The left Meyer's loop carries inferior retinal fibers for the right visual field. A lesion here produces right superior quadrantanopia. Causes: temporal lobe tumors, epilepsy surgery (temporal lobectomy), herpes encephalitis.",
    },
    right_meyers_loop: {
      pattern: 'Left superior quadrantanopia',
      eye: 'both', hemifield: 'superior', quadrant: 'superior-left', macula: 'involved',
      structure: 'right_meyers_loop',
      clinicalNote:
        '"Pie in the sky" — left superior field loss. Suggests right temporal lobe pathology.',
      anatomicalExplanation:
        "The right Meyer's loop sweeps anteriorly through the right temporal lobe, carrying inferior retinal fibers (left superior visual field). A lesion produces left superior quadrantanopia — often the first sign of a temporal lobe tumor. This field defect is frequently asymptomatic and found only on formal testing.",
    },
    left_parietal_radiation: {
      pattern: 'Right inferior quadrantanopia',
      eye: 'both', hemifield: 'inferior', quadrant: 'inferior-right', macula: 'involved',
      structure: 'left_parietal_radiation',
      clinicalNote:
        '"Pie on the floor" — right inferior field loss. Suggests left parietal lobe pathology.',
      anatomicalExplanation:
        'The left parietal optic radiation carries SUPERIOR retinal fibers (right inferior visual field). These fibers take a shorter, more direct course through the parietal lobe white matter. Damage produces right inferior quadrantanopia. Associated features with dominant (left) parietal: Gerstmann syndrome (acalculia, agraphia, finger agnosia, left-right confusion).',
    },
    right_parietal_radiation: {
      pattern: 'Left inferior quadrantanopia',
      eye: 'both', hemifield: 'inferior', quadrant: 'inferior-left', macula: 'involved',
      structure: 'right_parietal_radiation',
      clinicalNote: 'Left inferior field loss. Suggests right parietal lobe pathology.',
      anatomicalExplanation:
        'The right parietal radiation carries superior retinal fibers representing the left inferior visual field. Right parietal lesions (often MCA territory strokes or tumors) produce left inferior quadrantanopia, frequently with left hemispatial neglect.',
    },
    left_occipital: {
      pattern: py < 0.5
        ? 'Right homonymous hemianopia with macular sparing'
        : 'Right homonymous hemianopia (macular involved)',
      eye: 'both', hemifield: 'right', quadrant: 'none',
      macula: py < 0.5 ? 'spared' : 'involved',
      structure: 'left_occipital',
      clinicalNote: py < 0.5
        ? 'Macular sparing present — suggests PCA territory infarct. The patient retains good visual acuity and reading ability.'
        : 'Macular involved — suggests posterior cortical lesion or non-vascular etiology.',
      anatomicalExplanation: py < 0.5
        ? "The left calcarine cortex processes the right visual hemifield. The posterior pole (macular cortex) has dual blood supply from both PCA and MCA. A PCA infarct spares the macula because the posterior macular cortex receives collateral MCA flow. This produces classic macular-sparing hemianopia — the patient typically notices peripheral problems but retains good central vision."
        : "A lesion involving the posterior left calcarine cortex damages the macular representation — the disproportionately large cortical area for central vision (covering ~50% of V1 despite being only ~10° of field). Non-vascular causes (tumor, MS plaque, trauma) more commonly produce macular-involved defects.",
    },
    right_occipital: {
      pattern: py < 0.5
        ? 'Left homonymous hemianopia with macular sparing'
        : 'Left homonymous hemianopia (macular involved)',
      eye: 'both', hemifield: 'left', quadrant: 'none',
      macula: py < 0.5 ? 'spared' : 'involved',
      structure: 'right_occipital',
      clinicalNote: py < 0.5
        ? 'Macular sparing — classic PCA territory infarct. Patient may not notice the field loss initially because central vision is preserved.'
        : 'Macular involved — posterior cortical lesion.',
      anatomicalExplanation: py < 0.5
        ? "The right calcarine cortex processes the left visual hemifield. PCA territory strokes produce left homonymous hemianopia with macular sparing because the posterior macular cortex has a dual blood supply (PCA + MCA). Patients often report 'bumping into things on the left' but have normal visual acuity."
        : "A posterior right calcarine lesion damages the macular representation, producing left homonymous hemianopia with central involvement.",
    },
  };

  return SUMMARIES[lesion.structure] ?? none;
}

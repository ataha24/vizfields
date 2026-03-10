// ============================================================
// Clinical Case Library
// Preset lesion scenarios with clinical context
// ============================================================

import type { ClinicalCase } from '../types';

// SVG coordinates matching the pathway layout in pathwayModel.ts
// X_LEFT=90, X_RIGHT=290, chiasm center=(190,250)

export const CLINICAL_CASES: ClinicalCase[] = [
  {
    id: 'pituitary_adenoma',
    title: 'Pituitary Adenoma',
    etiology: 'Benign pituitary tumor',
    lesionPosition: { x: 190, y: 250 },
    lesionRadius: 22,
    description:
      'A 45-year-old woman presents with 6 months of progressive bilateral peripheral vision loss and headache. She also notes amenorrhea and galactorrhea. MRI shows a suprasellar mass.',
    teachingPoint:
      "Pituitary adenomas compress the optic chiasm from below, classically damaging the crossing nasal fibers. This produces BITEMPORAL HEMIANOPIA — both temporal fields are lost while the nasal fields remain intact. The field defect respects the vertical midline.",
  },
  {
    id: 'pca_stroke',
    title: 'PCA Territory Stroke',
    etiology: 'Posterior cerebral artery infarct',
    lesionPosition: { x: 258, y: 595 },
    lesionRadius: 28,
    description:
      'A 68-year-old hypertensive man woke up with difficulty reading. He can see fine in the center but bumps into things on his left. Reading comprehension is preserved but he cannot follow text lines.',
    teachingPoint:
      'PCA strokes typically affect the calcarine cortex, producing contralateral homonymous hemianopia. MACULAR SPARING is characteristic because the posterior macular cortex receives dual blood supply from both PCA and MCA. The patient retains good visual acuity despite the field loss.',
  },
  {
    id: 'ms_optic_neuritis',
    title: 'MS — Optic Neuritis',
    etiology: 'Demyelinating optic neuritis (multiple sclerosis)',
    lesionPosition: { x: 90, y: 155 },
    lesionRadius: 16,
    description:
      'A 28-year-old woman presents with acute painful monocular vision loss in her left eye, worsening over 3 days. Pain is worse with eye movement. Visual acuity is 20/200 in the left eye. An RAPD is present.',
    teachingPoint:
      'Optic neuritis typically presents as subacute monocular visual loss with retrobulbar pain. The classic sign is a RELATIVE AFFERENT PUPILLARY DEFECT (RAPD). This is the most common presenting symptom of MS in young women. MRI may show optic nerve enhancement.',
  },
  {
    id: 'temporal_lobe_tumor',
    title: 'Temporal Lobe Tumor',
    etiology: 'Glioma compressing Meyer\'s loop',
    lesionPosition: { x: 334, y: 455 },
    lesionRadius: 20,
    description:
      'A 52-year-old man presents with new-onset seizures and a subtle visual field defect discovered incidentally on exam. He reports no visual symptoms.',
    teachingPoint:
      "A temporal lobe lesion damages Meyer's loop (the anterior temporal sweep of the optic radiations), which carries inferior retinal fibers representing the SUPERIOR visual field. The result is a contralateral SUPERIOR QUADRANTANOPIA — \"pie in the sky.\" This is frequently asymptomatic and found only on formal perimetry.",
  },
  {
    id: 'parietal_stroke',
    title: 'Parietal Lobe Stroke',
    etiology: 'MCA branch infarct (parietal lobe)',
    lesionPosition: { x: 136, y: 455 },
    lesionRadius: 18,
    description:
      'A 71-year-old woman presents with sudden onset of right-sided weakness and neglect. She also has a right inferior visual field defect. She has difficulty writing and performing calculations.',
    teachingPoint:
      "Dominant (left) parietal lobe strokes damage the parietal optic radiations carrying superior retinal fibers (inferior visual field). The result is an INFERIOR QUADRANTANOPIA — \"pie on the floor.\" Associated features include Gerstmann syndrome (acalculia, agraphia, finger agnosia, left-right confusion) with dominant hemisphere involvement.",
  },
  {
    id: 'right_optic_nerve_naion',
    title: 'NAION — Right Eye',
    etiology: 'Non-arteritic ischemic optic neuropathy',
    lesionPosition: { x: 258, y: 145 },
    lesionRadius: 16,
    description:
      'A 62-year-old diabetic man woke up with complete loss of vision in his right eye. There is no pain. Fundoscopy shows a pale, swollen optic disc. ESR is normal.',
    teachingPoint:
      'NAION (non-arteritic ischemic optic neuropathy) is the most common acute optic neuropathy in those over 50. It typically presents with painless monocular visual loss on waking, often with altitudinal field defects. It is associated with a "disc at risk" (small cup-to-disc ratio), hypertension, and diabetes.',
  },
  {
    id: 'right_homonymous',
    title: 'Left MCA Stroke (Tract)',
    etiology: 'Middle cerebral artery territory infarct',
    lesionPosition: { x: 133, y: 310 },
    lesionRadius: 18,
    description:
      'A 79-year-old man presents with aphasia and right hemiparesis. Exam reveals a dense right homonymous hemianopia.',
    teachingPoint:
      'Left optic tract lesions from MCA strokes produce right homonymous hemianopia. Post-chiasmal lesions produce homonymous deficits — the same hemifield is lost in both eyes. Tract-level lesions may be incongruent (slightly different between the two eyes) due to incomplete fiber mixing at this level.',
  },
];

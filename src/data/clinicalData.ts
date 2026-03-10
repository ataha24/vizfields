// ============================================================
// Clinical Data — sourced from authoritative neuro-ophthalmology
// literature: Walsh & Hoyt, ONTT, Zhang 2006, StatPearls,
// NANOS teaching cases, and published epidemiological studies.
// ============================================================

import type { StructureId } from '../types';

export type EtiologyFrequency = 'most common' | 'common' | 'uncommon' | 'rare';

export interface Etiology {
  name: string;
  frequency: EtiologyFrequency;
  note: string;
}

export interface AssociatedSign {
  finding: string;
  mechanism: string;
  importance: 'high' | 'medium' | 'low';
}

export interface StructureClinicalData {
  vascularSupply: string;
  vascularDetail: string;
  etiologies: Etiology[];
  associatedSigns: AssociatedSign[];
  stats: string[];
  boardPearl: string;
  specialTopic?: {
    title: string;
    body: string;
  };
  congruence: string;
}

export const CLINICAL_DATA: Partial<Record<StructureId, StructureClinicalData>> = {

  // ── Retina / Eye ────────────────────────────────────────────
  left_eye: {
    vascularSupply: 'Central retinal artery (CRA) + posterior ciliary arteries',
    vascularDetail:
      'Inner retina: Central retinal artery (branch of ophthalmic a., first branch of ICA). ' +
      'Outer retina / photoreceptors: Short posterior ciliary arteries via choriocapillaris. ' +
      'Cilioretinal artery (present in ~20% of people) supplies the papillomacular bundle — ' +
      'its preservation in CRAO can maintain 20/20 central vision in an otherwise blind eye.',
    etiologies: [
      { name: 'CRAO (Central Retinal Artery Occlusion)', frequency: 'common', note: 'Embolic most common (cardiac, carotid). "Cherry red spot." Now classified as "eye stroke." 90-min treatment window.' },
      { name: 'NAION (Non-arteritic Ischemic Optic Neuropathy)', frequency: 'most common', note: 'Most common acute optic neuropathy over age 50. Inferior altitudinal defect in ~70%. "Disc at risk" (small C:D ratio), HTN, DM, OSA.' },
      { name: 'CRVO (Central Retinal Vein Occlusion)', frequency: 'common', note: 'Disc oedema, flame haemorrhages all 4 quadrants, dilated tortuous veins. Ischemic vs. non-ischemic.' },
      { name: 'Retinal detachment', frequency: 'common', note: 'Curtain or shadow that starts peripherally and migrates centrally.' },
      { name: 'GCA (Giant Cell Arteritis)', frequency: 'uncommon', note: 'Age >50. ESR/CRP elevated. Jaw claudication, scalp tenderness. Bilateral sequential blindness risk — ophthalmic emergency.' },
    ],
    associatedSigns: [
      { finding: 'RAPD (Marcus Gunn pupil)', mechanism: 'Reduced afferent input from the damaged eye. The single most important exam finding.', importance: 'high' },
      { finding: 'Normal fellow eye', mechanism: 'Pre-chiasmal lesion — contralateral pathway intact.', importance: 'high' },
      { finding: 'Optic disc pallor / swelling', mechanism: 'Acute: swelling (papillitis, NAION). Chronic: pallor (optic atrophy).', importance: 'medium' },
    ],
    stats: [
      'NAION inferior altitudinal defect: ~60–80% of cases',
      'Cilioretinal artery sparing in CRAO: >80% retain 20/50+ acuity',
      'Bilateral NAION risk: ~15% within 5 years',
      'GCA blindness without treatment: up to 50% of fellow eyes affected within days',
    ],
    boardPearl: 'NAION: most common acute optic neuropathy over 50, inferior altitudinal VF defect, painless, "disc at risk." RAPD always present in significant unilateral retinal or optic nerve disease.',
    congruence: 'N/A (monocular — no contralateral eye involvement)',
  },

  right_eye: {
    vascularSupply: 'Central retinal artery (CRA) + posterior ciliary arteries',
    vascularDetail:
      'Identical to left eye. The ophthalmic artery is the first major branch of the ICA. ' +
      'The CRA enters the optic nerve 10–12 mm behind the globe and emerges at the disc. ' +
      'The intracanalicular portion of the optic nerve is most vulnerable to traumatic injury ' +
      'due to tight bony confines and end-arterial supply.',
    etiologies: [
      { name: 'Optic neuritis (MS)', frequency: 'most common', note: 'Young women. Pain with eye movement (~90%). Colour desaturation. 72% risk of MS at 15 years if MRI abnormal (ONTT data).' },
      { name: 'NAION', frequency: 'common', note: 'Painless. Older patients. Inferior altitudinal defect. Disc at risk.' },
      { name: 'CRAO', frequency: 'common', note: 'Sudden, painless, severe monocular loss. Treat as stroke.' },
      { name: 'Traumatic optic neuropathy', frequency: 'uncommon', note: 'Intracanalicular segment most vulnerable — tight bony canal + end-arterial supply.' },
      { name: 'LHON (Leber Hereditary Optic Neuropathy)', frequency: 'rare', note: 'Mitochondrial (mt-DNA mutations). Young males. Bilateral sequential cecocentral scotomas, no pain.' },
    ],
    associatedSigns: [
      { finding: 'RAPD', mechanism: 'Hallmark of unilateral optic nerve disease. Absent in equal bilateral disease.', importance: 'high' },
      { finding: 'Pain on eye movement', mechanism: 'Traction on inflamed optic nerve sheath via superior rectus / superior oblique. Specific for optic neuritis.', importance: 'high' },
      { finding: 'Colour desaturation (red)', mechanism: 'Papillomacular bundle fibres are disproportionately affected in demyelination.', importance: 'medium' },
      { finding: 'Uhthoff phenomenon', mechanism: 'Worsening of vision with exercise/heat — characteristic of demyelinating optic neuritis.', importance: 'medium' },
    ],
    stats: [
      'Optic neuritis: >90% recover to 20/40 or better regardless of treatment (ONTT)',
      'MS risk after optic neuritis with abnormal MRI: ~72% at 15 years (ONTT)',
      'Pain with eye movement present in ~90% of MS-related optic neuritis',
      '~15–20% of MS patients present with optic neuritis as first symptom',
    ],
    boardPearl: 'Optic neuritis triad: painful monocular visual loss + RAPD + colour desaturation. Recovery is excellent (>90%). MRI predicts MS risk. IV steroids speed recovery but do not improve final acuity.',
    congruence: 'N/A (monocular)',
  },

  // ── Optic Nerves ────────────────────────────────────────────
  left_optic_nerve: {
    vascularSupply: 'Ophthalmic artery branches + posterior ciliary arteries (pial plexus)',
    vascularDetail:
      'The retrolaminar nerve is supplied by a pial capillary plexus fed by recurrent branches of ' +
      'the ophthalmic artery and posterior ciliary arteries. The intracanalicular segment is a watershed ' +
      'zone with end-arterial supply — the most vulnerable point in traumatic optic neuropathy. ' +
      'The intracranial optic nerve receives contributions from the superior hypophyseal arteries (ICA) ' +
      'and A1 anterior cerebral artery branches.',
    etiologies: [
      { name: 'Optic neuritis (MS / CIS)', frequency: 'most common', note: 'Young adults. Retroorbital pain on movement. Central/cecocentral scotoma. MRI shows optic nerve enhancement.' },
      { name: 'NAION', frequency: 'common', note: 'Over 50. Painless. Altitudinal defect. Swollen disc acutely. No treatment of proven benefit.' },
      { name: 'Compressive (meningioma, Graves\')', frequency: 'uncommon', note: 'Optic nerve sheath meningioma: insidious loss with optociliary shunt vessels — pathognomonic triad.' },
      { name: 'NMO (Neuromyelitis Optica)', frequency: 'uncommon', note: 'AQP4-IgG. Severe, often bilateral, poor recovery. Longitudinally extensive optic nerve lesion on MRI.' },
      { name: 'Sarcoidosis', frequency: 'uncommon', note: 'Perineural granulomatous infiltration. Bilateral in 50%. Look for uveitis, hilar adenopathy.' },
      { name: 'Toxic / nutritional', frequency: 'uncommon', note: 'B12, copper, folate deficiency; ethambutol, methanol. Bilateral cecocentral scotomas.' },
    ],
    associatedSigns: [
      { finding: 'Ipsilateral RAPD', mechanism: 'Reduced afferent pupillomotor input from the affected nerve.', importance: 'high' },
      { finding: 'Colour desaturation', mechanism: 'Papillomacular fibres preferentially affected. Red test: "washed out" red on affected side.', importance: 'high' },
      { finding: 'Normal contralateral eye', mechanism: 'Pre-chiasmal: contralateral pathway intact.', importance: 'high' },
      { finding: 'Optociliary shunt vessels', mechanism: 'Chronic optic nerve sheath compression → retinochoroidal collaterals develop. Pathognomonic of nerve sheath meningioma.', importance: 'medium' },
    ],
    stats: [
      'Optic neuritis: >90% recover ≥20/40 regardless of steroids (ONTT)',
      'NMO optic neuritis: final acuity ≤20/200 in ~50% of attacks without early treatment',
      'Intracanalicular segment: most vulnerable to trauma due to rigid bony canal',
    ],
    boardPearl: 'RAPD is the cardinal sign of unilateral optic nerve disease. Any shape of monocular VF defect localises anterior to the chiasm. The most common pattern in optic neuritis is a central scotoma; in NAION it is inferior altitudinal.',
    specialTopic: {
      title: 'Junctional Scotoma of Traquair',
      body: 'A lesion at the ANTERIOR CHIASM or posterior optic nerve at the chiasmal junction damages: ' +
        '(1) all ipsilateral optic nerve fibres → ipsilateral central scotoma, AND ' +
        '(2) Wilbrand\'s knee — a small loop of inferior nasal fibres from the CONTRALATERAL optic nerve ' +
        'that briefly loop anteriorly into the ipsilateral nerve before crossing. This produces a ' +
        'CONTRALATERAL SUPERIOR TEMPORAL DEFECT. Together: ipsilateral monocular loss + contralateral ' +
        'superior temporal crescent = pathognomonic of an anterior chiasmal lesion (often craniopharyngioma ' +
        'or pituitary tumour extending laterally). Note: the anatomical reality of Wilbrand\'s knee is debated — ' +
        'it may be an artefact of enucleation studies — but the clinical pattern is real and board-tested.',
    },
    congruence: 'N/A (monocular)',
  },

  right_optic_nerve: {
    vascularSupply: 'Ophthalmic artery branches + posterior ciliary arteries (pial plexus)',
    vascularDetail:
      'Same as left optic nerve. The ophthalmic artery is the first major intracranial branch of the ICA. ' +
      'Zinn–Haller circle (anastomotic ring of paraoptic posterior ciliary arteries in the sclera) supplies ' +
      'the lamina cribrosa — the critical watershed for NAION.',
    etiologies: [
      { name: 'Optic neuritis (MS / CIS)', frequency: 'most common', note: 'Most common in women aged 20–45. Central scotoma. Pain on eye movement (90%). Responds to IV methylprednisolone.' },
      { name: 'NAION', frequency: 'common', note: 'Most common acute optic neuropathy in >50s. Inferior altitudinal > superior altitudinal > arcuate.' },
      { name: 'GCA (Arteritic AION)', frequency: 'uncommon', note: 'Age >70. Dramatic disc pallor/swelling. ESR >50. EMERGENCY — start steroids immediately.' },
      { name: 'Compressive optic neuropathy', frequency: 'uncommon', note: 'Sphenoid wing meningioma, thyroid eye disease (dysthyroid optic neuropathy), orbital apex tumour.' },
      { name: 'LHON', frequency: 'rare', note: 'Mitochondrial. Males (>85%). Age 15–35. Sequential bilateral cecocentral scotomas weeks apart.' },
    ],
    associatedSigns: [
      { finding: 'Right RAPD', mechanism: 'Hallmark of right optic nerve disease.', importance: 'high' },
      { finding: 'Pain on eye movement', mechanism: 'Optic neuritis. Absent in NAION and compressive etiologies.', importance: 'high' },
      { finding: 'Temporal disc pallor', mechanism: 'Chronic papillomacular bundle atrophy (optic neuritis sequela).', importance: 'medium' },
    ],
    stats: [
      'GCA: Without immediate steroids, fellow eye risk of blindness is 25–50% within days',
      'NAION: Spontaneous improvement in ~40% (compared to ~90% in optic neuritis)',
      'LHON: ~50% recover some vision by 1 year with idebenone treatment',
    ],
    boardPearl: 'GCA vs NAION: Both cause acute painless visual loss with disc swelling in older patients. KEY DIFFERENCE: GCA has systemic symptoms (headache, jaw claudication, scalp tenderness, malaise, elevated ESR/CRP). GCA requires SAME-DAY steroids.',
    congruence: 'N/A (monocular)',
  },

  // ── Chiasm ──────────────────────────────────────────────────
  chiasm: {
    vascularSupply: 'Superior hypophyseal arteries (ICA) + anterior communicating artery',
    vascularDetail:
      'The chiasm\'s inferior surface (where the crossing nasal fibres are most clinically vulnerable) ' +
      'is supplied by the superior hypophyseal arteries, bilateral branches of the C6 (ophthalmic) ' +
      'segment of the ICA. The superior surface receives ACA (A1) and ACoA perforators. ' +
      'The posterior chiasm receives pituitary capsular arteries. This inferior blood supply explains ' +
      'why pituitary tumours compressing from below first affect the inferiorly-located crossing fibres, ' +
      'producing superior temporal field loss before inferior temporal loss.',
    etiologies: [
      { name: 'Pituitary adenoma', frequency: 'most common', note: 'Most common chiasmal lesion (~50% of cases). Compresses from below. Bitemporal field loss begins superiorly. May cause endocrine dysfunction (prolactinoma, acromegaly, Cushing\'s, panhypopituitarism).' },
      { name: 'Craniopharyngioma', frequency: 'common', note: 'Second most common. Children > adults. Suprasellar. Calcification on CT. May compress from above → inferior temporal defects first.' },
      { name: 'Suprasellar meningioma', frequency: 'common', note: 'Tuberculum sellae or diaphragma sellae meningioma. Often parasellar. Insidious onset.' },
      { name: 'Chiasmal glioma', frequency: 'uncommon', note: 'Children. Strong association with NF-1 (neurofibromatosis type 1). Bilateral optic pathway glioma.' },
      { name: 'Aneurysm', frequency: 'uncommon', note: 'Paraclinoid ICA or ACoA aneurysm. Can compress chiasm. Consider in atypical field patterns.' },
      { name: 'Empty sella syndrome', frequency: 'uncommon', note: 'CSF fills the sella, compressing pituitary. Usually incidental but can cause visual symptoms.' },
    ],
    associatedSigns: [
      { finding: 'Bitemporal hemianopia', mechanism: 'Crossing nasal fibres (carrying temporal field signal) selectively damaged.', importance: 'high' },
      { finding: 'Endocrine dysfunction', mechanism: 'Pituitary compression/infiltration: amenorrhoea, galactorrhoea (prolactinoma), acromegaly (GH), Cushing\'s (ACTH), or hypopituitarism.', importance: 'high' },
      { finding: 'Headache', mechanism: 'Mass effect from suprasellar lesion. Dull, bitemporal or vertex. Not always present.', importance: 'medium' },
      { finding: 'No RAPD', mechanism: 'Symmetric temporal field loss; afferent input is balanced. A chiasmal lesion causing monocular optic nerve damage upstream may cause RAPD.', importance: 'medium' },
      { finding: 'See-saw nystagmus', mechanism: 'Rare; associated with large parasellar lesions damaging the interstitial nucleus of Cajal or diencephalon. Pathognomonic of chiasmal/parasellar disease.', importance: 'low' },
    ],
    stats: [
      '~70% of patients with chiasmal compression from pituitary adenoma have bitemporal hemianopia at presentation',
      'Pituitary adenomas: ~10% of all intracranial tumours; prolactinomas are most common type (40%)',
      'Field recovery after surgical decompression: ~80% of patients show improvement within 3 months',
      'Craniopharyngioma: 5-year recurrence rate ~25% even after gross total resection',
    ],
    boardPearl: 'Bitemporal hemianopia = pathognomonic of chiasmal disease. The field defect respects the VERTICAL midline. Pituitary adenoma compresses from below → superior temporal loss appears first. Think: pituitary first, then craniopharyngioma (children + calcification).',
    specialTopic: {
      title: 'Why Pituitary Tumours Cause Superior Temporal Loss First',
      body: 'A pituitary adenoma expands upward into the inferior surface of the chiasm, compressing ' +
        'the inferiorly-positioned crossing nasal fibres first. These inferior nasal fibres carry ' +
        'the SUPERIOR TEMPORAL visual field. Therefore the classic early bitemporal hemianopia from ' +
        'a pituitary adenoma preferentially affects the superior temporal quadrants before the ' +
        'inferior temporal quadrants. Craniopharyngiomas, which often compress from above, ' +
        'produce the opposite pattern — inferior temporal loss first.',
    },
    congruence: 'N/A (bitemporal — different defect in each eye by definition)',
  },

  // ── Optic Tracts ────────────────────────────────────────────
  left_optic_tract: {
    vascularSupply: 'Anterior choroidal artery (AChA) + posterior communicating artery (PCoA)',
    vascularDetail:
      'The optic tract is supplied primarily by the anterior choroidal artery (AChA, a branch of the ICA) ' +
      'and the posterior communicating artery. The AChA is a critical perforator also supplying the ' +
      'posterior limb of the internal capsule, globus pallidus, and amygdala/hippocampus. ' +
      'Tract lesions are most commonly caused by mass effect from adjacent structures rather than ' +
      'direct vascular injury.',
    etiologies: [
      { name: 'Craniopharyngioma', frequency: 'most common', note: 'Most common cause of optic tract syndrome. Suprasellar location allows lateral extension.' },
      { name: 'Pituitary adenoma (large)', frequency: 'common', note: 'Lateral extension of a large macroadenoma.' },
      { name: 'Meningioma', frequency: 'common', note: 'Cavernous sinus or suprasellar meningioma extending posteriorly.' },
      { name: 'Demyelination (MS)', frequency: 'uncommon', note: 'MS plaque in the optic tract. Rare but documented.' },
      { name: 'Vascular (AChA infarct)', frequency: 'uncommon', note: 'AChA territory stroke can affect the tract en route to the LGN.' },
    ],
    associatedSigns: [
      { finding: 'Contralateral RAPD (Wernicke\'s hemianopic pupil)', mechanism: 'Pupillomotor fibres diverge from the visual pathway AT the optic tract (→ pretectal nucleus). A left tract lesion reduces afferent input from the right (seeing) side, causing a contralateral (right) RAPD when light is directed into the right hemifield.', importance: 'high' },
      { finding: 'Incongruent homonymous hemianopia', mechanism: 'Nasal and temporal fibres are not fully interleaved in the tract; defects differ between the two eyes.', importance: 'high' },
      { finding: 'Band / bow-tie optic atrophy', mechanism: 'Retrograde degeneration of the optic nerve. After a left tract lesion, the right optic disc develops "bow-tie" atrophy (horizontal pallor of nasal and temporal sectors) because the nasal retinal fibres (which cross) atrophy.', importance: 'medium' },
    ],
    stats: [
      'Optic tract lesions account for ~1.5% of all homonymous hemianopias (Zhang 2006)',
      'RAPD present in optic tract lesions: ~>90% have contralateral RAPD detectable on careful exam',
      'Band atrophy develops weeks to months after the tract lesion',
    ],
    boardPearl: 'Optic tract = the only post-chiasmal structure that causes a contralateral RAPD (because pupillomotor fibres branch off here). Lesions posterior to the brachium of the superior colliculus NEVER cause RAPD.',
    specialTopic: {
      title: 'Wernicke\'s Hemianopic Pupil',
      body: 'When light is directed into the BLIND hemiretina of an optic tract lesion, there is diminished ' +
        'or absent pupillary constriction — because those retinal fibres are destroyed before reaching the ' +
        'pretectal nucleus. Light into the SEEING hemiretina produces normal bilateral constriction. ' +
        'In practice, this is very difficult to detect clinically with a penlight (light always scatters ' +
        'to both hemiretinas). Modern infrared pupillometry can detect it reliably. ' +
        'KEY RULE: ANY lesion posterior to the brachium of the superior colliculus (LGN, radiations, cortex) ' +
        'does NOT cause an RAPD — this is a critical localising sign.',
    },
    congruence: 'Typically INCONGRUENT (nasal and temporal fibres not yet fully interleaved). ~50% show congruent defects in large series — the classic teaching of "always incongruent" is an oversimplification.',
  },

  right_optic_tract: {
    vascularSupply: 'Anterior choroidal artery (AChA) + posterior communicating artery (PCoA)',
    vascularDetail:
      'Same as left optic tract. The AChA is a branch of the ICA immediately distal to the PCoA. ' +
      'It is a critical perforating artery supplying the tract, LGN hilum, posterior limb of internal capsule, ' +
      'and medial temporal structures.',
    etiologies: [
      { name: 'Craniopharyngioma', frequency: 'most common', note: 'Lateral extension into the tract.' },
      { name: 'Pituitary macroadenoma', frequency: 'common', note: 'Lateral extension of large tumour.' },
      { name: 'Meningioma', frequency: 'common', note: 'Cavernous sinus or suprasellar.' },
      { name: 'Glioma', frequency: 'uncommon', note: 'Hypothalamic-optic pathway glioma (NF-1 association).' },
      { name: 'AChA territory infarct', frequency: 'uncommon', note: 'May partially involve the tract.' },
    ],
    associatedSigns: [
      { finding: 'Left RAPD (contralateral)', mechanism: 'Pupillomotor fibres diverge at the tract. Right tract lesion → left hemiretina receives less afferent signal → left RAPD.', importance: 'high' },
      { finding: 'Incongruent left homonymous hemianopia', mechanism: 'Fibres not fully interleaved at tract level.', importance: 'high' },
      { finding: 'Left band atrophy (chronic)', mechanism: 'Retrograde degeneration to left optic disc after right tract lesion.', importance: 'medium' },
    ],
    stats: [
      'Optic tract lesions: ~1.5% of homonymous hemianopias (the rarest post-chiasmal cause)',
      'Contralateral RAPD: present in the majority of optic tract lesions',
    ],
    boardPearl: 'Right tract lesion → LEFT homonymous hemianopia + LEFT RAPD (contralateral to the hemianopia side). No other post-chiasmal lesion produces an RAPD. This is the #1 localising feature.',
    congruence: 'Typically incongruent (less so than optic nerve; more so than radiations/cortex)',
  },

  // ── LGN ─────────────────────────────────────────────────────
  left_lgn: {
    vascularSupply: 'Anterior choroidal artery (lateral 2/3) + posterior lateral choroidal artery (medial 1/3)',
    vascularDetail:
      'The LGN has a unique DUAL blood supply that produces pathognomonic field defect patterns: ' +
      '• AChA (lateral LGN, hilum): supplies upper and lower quadrant representations → infarct causes ' +
      '"QUADRUPLE SECTORANOPIA" (two homonymous wedge defects above and below the horizontal, with the ' +
      'horizontal meridian SPARED). ' +
      '• PLChA (medial LGN): supplies the horizontal meridian representation → infarct causes a ' +
      '"HORIZONTAL SECTORANOPIA" (wedge loss straddling the horizontal, with upper and lower quadrants INTACT).',
    etiologies: [
      { name: 'AChA territory infarct', frequency: 'most common', note: 'Produces the characteristic quadruple sectoranopia. Often accompanied by hemiparesis + hemisensory loss (posterior limb IC).' },
      { name: 'PLChA territory infarct', frequency: 'common', note: 'Horizontal sectoranopia. Rarer — PLChA is a smaller vessel.' },
      { name: 'Cavernous malformation', frequency: 'uncommon', note: 'Can occur at any level; haemorrhage produces acute onset.' },
      { name: 'Thalamic tumour', frequency: 'uncommon', note: 'Glioma or metastasis extending laterally to compress the LGN.' },
      { name: 'MS demyelination', frequency: 'rare', note: 'LGN plaques are documented but rare.' },
    ],
    associatedSigns: [
      { finding: 'NO RAPD', mechanism: 'Pupillomotor fibres have already branched off at the optic tract/brachium of SC. LGN lesions do NOT affect the PLR.', importance: 'high' },
      { finding: 'NO optic atrophy (in adults)', mechanism: 'Transneuronal degeneration from LGN to retina does not occur in adults (unlike in infants/children with congenital lesions).', importance: 'high' },
      { finding: 'Sectoranopia pattern', mechanism: 'Highly congruent, wedge-shaped defects due to the precise dual blood supply pattern.', importance: 'high' },
      { finding: 'Full AChA syndrome (hemiplegia + hemisensory + hemianopia)', mechanism: 'When the AChA lesion is proximal, it also damages the posterior limb of the IC and possibly thalamus.', importance: 'medium' },
    ],
    stats: [
      'LGN lesions: ~1.3% of all homonymous hemianopias (Zhang 2006, 904 patients) — the rarest site',
      'AChA infarct: accounts for ~1% of all ischaemic strokes',
      'Pure LGN infarct (without IC involvement): approximately 25–30% of AChA strokes',
    ],
    boardPearl: 'The LGN has dual blood supply (AChA + PLChA). AChA infarct → QUADRUPLE SECTORANOPIA (homonymous wedge loss ABOVE and BELOW, horizontal strip SPARED). This is pathognomonic of an LGN lesion. No RAPD. No optic atrophy.',
    specialTopic: {
      title: 'Quadruple Sectoranopia — The LGN Signature',
      body: 'The AChA supplies the anterolateral LGN (layers 1, 4, 6 — magnocellular and parvocellular) ' +
        'representing the UPPER and LOWER visual field quadrants. The hilum (horizontal meridian) is supplied ' +
        'by the PLChA. An AChA infarct spares the hilum but damages the quadrant representations → ' +
        'TWO separate homonymous scotomas appear: one in the contralateral upper field and one in the lower field, ' +
        'with a horizontal strip of intact vision between them. This "bowtie" or "dumbbell" pattern on perimetry ' +
        'is PATHOGNOMONIC of an LGN lesion and should prompt MRI of the posterior circulation.',
    },
    congruence: 'Highly congruent (the 6-layer LGN has a precise retinotopic map; sectoranopias are very symmetrical between the two eyes)',
  },

  right_lgn: {
    vascularSupply: 'Anterior choroidal artery (lateral 2/3) + posterior lateral choroidal artery (medial 1/3)',
    vascularDetail:
      'Same dual supply as left LGN. Right LGN lesion → left visual field defect with the characteristic ' +
      'sectoranopia pattern depending on which vessel is affected.',
    etiologies: [
      { name: 'AChA territory infarct', frequency: 'most common', note: 'Left quadruple sectoranopia.' },
      { name: 'PLChA territory infarct', frequency: 'common', note: 'Left horizontal sectoranopia.' },
      { name: 'Cavernous malformation / AVM', frequency: 'uncommon', note: 'Haemorrhagic onset.' },
      { name: 'Thalamic tumour', frequency: 'uncommon', note: 'Extension to lateral geniculate.' },
    ],
    associatedSigns: [
      { finding: 'No RAPD', mechanism: 'Pupillomotor pathway already diverged at the optic tract.', importance: 'high' },
      { finding: 'No optic atrophy in adults', mechanism: 'No retrograde transsynaptic degeneration.', importance: 'medium' },
    ],
    stats: [
      'LGN: rarest post-chiasmal site (~1.3% of homonymous hemianopias)',
      'Congruent field defects in near 100% of LGN lesions',
    ],
    boardPearl: 'Right LGN lesion produces LEFT quadruple sectoranopia (AChA) or horizontal sectoranopia (PLChA). No RAPD. Highly congruent. The wedge pattern is pathognomonic.',
    congruence: 'Highly congruent (most congruent of all homonymous hemianopias except cortex)',
  },

  // ── Meyer's Loop ────────────────────────────────────────────
  left_meyers_loop: {
    vascularSupply: 'MCA inferior temporal branches + anterior choroidal artery (proximal loop)',
    vascularDetail:
      'Meyer\'s loop (anterior temporal optic radiation) is supplied by: ' +
      'inferior temporal MCA branches (anterior and middle temporal arteries) and the AChA proximally. ' +
      'The loop extends to within 24–47 mm of the temporal pole (mean ~34 mm in anatomical studies), ' +
      'immediately adjacent to or slightly anterior to the temporal horn of the lateral ventricle.',
    etiologies: [
      { name: 'Temporal lobe glioma', frequency: 'most common', note: 'Low-grade or high-grade. Insidious or subacute onset of superior quadrantanopia.' },
      { name: 'Temporal lobectomy (epilepsy surgery)', frequency: 'most common', note: 'Anterior temporal resection affects Meyer\'s loop in up to 95% of cases; VF defect found in 50–70%. The "unavoidable complication" of temporal lobectomy.' },
      { name: 'MCA inferior division stroke', frequency: 'common', note: 'Inferior temporal territory. Often accompanied by Wernicke\'s aphasia (dominant hemisphere) or hemispatial neglect.' },
      { name: 'Herpes simplex encephalitis', frequency: 'uncommon', note: 'Preferential temporal lobe involvement. Haemorrhagic necrosis.' },
      { name: 'Metastasis', frequency: 'common', note: 'Temporal lobe metastases from lung, breast, melanoma.' },
    ],
    associatedSigns: [
      { finding: 'Right superior quadrantanopia ("pie in the sky")', mechanism: 'Left Meyer\'s loop carries inferior retinal fibres (right superior VF).', importance: 'high' },
      { finding: 'Wernicke\'s aphasia (dominant hemisphere)', mechanism: 'Left temporal lobe — posterior superior temporal gyrus (Wernicke\'s area) adjacent to the radiation.', importance: 'high' },
      { finding: 'Complex partial seizures', mechanism: 'Temporal lobe is most common seizure focus. Auras: déjà vu, jamais vu, epigastric rising, olfactory/gustatory hallucinations.', importance: 'medium' },
      { finding: 'Memory disturbance', mechanism: 'Hippocampus involvement (dominant: verbal memory; non-dominant: visuospatial memory).', importance: 'medium' },
      { finding: 'Prosopagnosia / face recognition difficulty', mechanism: 'Non-dominant (right) temporal lobe involvement of fusiform face area.', importance: 'low' },
    ],
    stats: [
      'Meyer\'s loop tip is 24–47 mm from the temporal pole (mean 34 mm) — anatomical MRI studies',
      'Temporal lobectomy: VF defects in 50–95% of patients (depending on resection extent)',
      'A 3 cm standard resection damages Meyer\'s loop in virtually 100% of right-handers',
      'Epilepsy surgery-related VF defects: often asymptomatic and found only on formal perimetry',
    ],
    boardPearl: '"Pie in the sky" = right superior quadrantanopia from LEFT temporal lobe lesion. Meyer\'s loop carries inferior retinal fibres (= superior VF). Temporal lobectomy is today\'s most common cause. Often ASYMPTOMATIC.',
    congruence: 'Moderately congruent (increases more posteriorly in the temporal radiation)',
  },

  right_meyers_loop: {
    vascularSupply: 'MCA inferior temporal branches + anterior choroidal artery (proximal loop)',
    vascularDetail:
      'Right Meyer\'s loop supplies the left superior visual field via inferior retinal fibres. ' +
      'The loop sweeps to within ~34 mm of the right temporal pole before turning posteriorly ' +
      'along the temporal horn of the right lateral ventricle.',
    etiologies: [
      { name: 'Right temporal lobe glioma', frequency: 'most common', note: 'Often silent for long periods — right temporal lobe is non-dominant in most right-handers.' },
      { name: 'Right temporal lobectomy', frequency: 'most common', note: 'Post-surgical left superior quadrantanopia.' },
      { name: 'Right MCA inferior division stroke', frequency: 'common', note: 'Hemispatial neglect (left), constructional apraxia.' },
      { name: 'Herpes simplex encephalitis', frequency: 'uncommon', note: 'Bilateral temporal involvement common.' },
      { name: 'Metastasis', frequency: 'common', note: 'Right temporal lobe metastases.' },
    ],
    associatedSigns: [
      { finding: 'Left superior quadrantanopia', mechanism: 'Right Meyer\'s loop carries inferior retinal fibres (left superior VF).', importance: 'high' },
      { finding: 'Left hemispatial neglect', mechanism: 'Right (non-dominant) parietal-temporal involvement.', importance: 'medium' },
      { finding: 'Constructional apraxia', mechanism: 'Right hemisphere visuospatial processing.', importance: 'low' },
    ],
    stats: [
      'Right temporal lobe lesions often clinically "silent" for months before diagnosis',
      'Superior quadrantanopia detected only on formal VF testing in majority of early cases',
    ],
    boardPearl: '"Pie in the sky" — left superior quadrantanopia from RIGHT temporal lesion. The non-dominant (right) temporal lobe lesion is frequently silent until formal perimetry is performed.',
    congruence: 'Moderately congruent',
  },

  // ── Parietal Radiations ─────────────────────────────────────
  left_parietal_radiation: {
    vascularSupply: 'MCA parietal branches (superior division MCA)',
    vascularDetail:
      'The parietal optic radiations (carrying superior retinal / inferior VF fibres) run through the ' +
      'white matter of the parietal lobe and are supplied by MCA superior division branches — ' +
      'angular gyrus artery, posterior parietal artery, and supramarginal gyrus artery. ' +
      'These are among the most commonly infarcted MCA branches.',
    etiologies: [
      { name: 'MCA superior division infarct', frequency: 'most common', note: 'Large or branch MCA stroke affecting the dominant parietal lobe white matter.' },
      { name: 'Parietal glioma', frequency: 'common', note: 'Often presents with a combination of VF defect and cortical sensory/cognitive findings.' },
      { name: 'Metastasis', frequency: 'common', note: 'Parietal lobe metastases from lung, breast, renal cell.' },
      { name: 'MS plaque', frequency: 'uncommon', note: 'Periventricular white matter demyelination.' },
    ],
    associatedSigns: [
      { finding: 'Right inferior quadrantanopia', mechanism: 'Left parietal radiation carries superior retinal fibres (right inferior VF).', importance: 'high' },
      { finding: 'Gerstmann syndrome (dominant)', mechanism: 'Left inferior parietal lobe (angular + supramarginal gyri): AGRAPHIA + ACALCULIA + FINGER AGNOSIA + LEFT-RIGHT DISORIENTATION — the four signs must all be present.', importance: 'high' },
      { finding: 'Cortical sensory loss', mechanism: 'Parietal white matter damage → loss of graphaesthesia, stereognosis, 2-point discrimination.', importance: 'high' },
      { finding: 'Apraxia (ideomotor)', mechanism: 'Dominant parietal involvement — inability to perform learned movements to command.', importance: 'medium' },
      { finding: 'OKN asymmetry', mechanism: 'Optokinetic drum rotated TOWARD the lesion → reduced fast phase response. A reliable localising sign at bedside.', importance: 'medium' },
    ],
    stats: [
      'MCA stroke is the most common cause of acute homonymous VF defects overall',
      'Gerstmann syndrome: all 4 components (tetrad) occur together in <10% of angular gyrus lesions — partial forms are common',
      'OKN asymmetry: drum rotated toward the lesion side produces decreased response in >80% of parieto-occipital lesions',
    ],
    boardPearl: '"Pie on the floor" = right inferior quadrantanopia from LEFT parietal lesion. Dominant (left) parietal → Gerstmann syndrome. OKN response decreased when drum rotated toward the LESION.',
    congruence: 'Moderately to highly congruent (more congruent than tract/temporal radiation)',
  },

  right_parietal_radiation: {
    vascularSupply: 'MCA parietal branches (superior division MCA)',
    vascularDetail:
      'Right parietal optic radiations supply the left inferior visual field. ' +
      'Supplied by right MCA superior division. The right parietal lobe is the major ' +
      'hemispheric centre for visuospatial processing and attention.',
    etiologies: [
      { name: 'MCA superior division infarct (right)', frequency: 'most common', note: 'Left hemispatial neglect, constructional apraxia, dressing apraxia.' },
      { name: 'Right parietal glioma', frequency: 'common', note: 'May present with neglect before VF defect is noted.' },
      { name: 'Metastasis', frequency: 'common', note: 'Posterior fossa tumours occasionally extend.' },
    ],
    associatedSigns: [
      { finding: 'Left inferior quadrantanopia', mechanism: 'Right parietal radiation carries superior retinal fibres (left inferior VF).', importance: 'high' },
      { finding: 'Left hemispatial neglect', mechanism: 'Right (non-dominant) parietal lobe is dominant for directed attention. Neglect is DIFFERENT from hemianopia — the patient ignores stimuli, not just because they can\'t see them.', importance: 'high' },
      { finding: 'Constructional apraxia', mechanism: 'Right parietal — inability to copy drawings, assemble puzzles.', importance: 'medium' },
      { finding: 'Dressing apraxia', mechanism: 'Right parietal — non-dominant spatial body schema.', importance: 'medium' },
      { finding: 'Anosognosia', mechanism: 'Right parietal — unawareness of left-sided deficit.', importance: 'medium' },
    ],
    stats: [
      'Right parietal MCA stroke: hemispatial neglect present in ~40–60% acutely',
      'Neglect resolves by 3 months in ~50–60% of patients',
    ],
    boardPearl: 'Right parietal → left neglect + left inferior quadrantanopia ("pie on the floor"). Neglect ≠ hemianopia: neglect patients see if forced to attend; hemianopic patients cannot see regardless of attention.',
    congruence: 'Moderately to highly congruent',
  },

  // ── Occipital Cortex ────────────────────────────────────────
  left_occipital: {
    vascularSupply: 'Posterior cerebral artery (PCA) — calcarine artery branch',
    vascularDetail:
      'The calcarine artery (a branch of the PCA/P2 segment) supplies V1 along the calcarine sulcus. ' +
      'The POSTERIOR POLE (macular cortex) has a DUAL blood supply from both PCA and MCA via ' +
      'leptomeningeal anastomoses — present in ~40% of individuals. This dual supply is the basis of ' +
      'MACULAR SPARING in PCA territory strokes. Because ~48–55% of V1 is devoted to macular ' +
      'representation (despite the macula covering only ~10° of field), the boundary between ' +
      'PCA and MCA territories always falls within the macular representation, making macular ' +
      'sparing a near-certainty when MCA collaterals are intact.',
    etiologies: [
      { name: 'PCA territory infarct', frequency: 'most common', note: 'Most common cause of homonymous hemianopia in adults. Embolic (cardiac/vertebrobasilar) > thrombotic. Macular sparing in 70–80%.' },
      { name: 'Occipital lobe haemorrhage', frequency: 'common', note: 'Hypertensive haemorrhage, AVM. Usually with severe headache (thunderclap if AVM ruptures).' },
      { name: 'Occipital lobe metastasis', frequency: 'common', note: 'Lung, breast, melanoma, renal. Multiple lesions in 30%.' },
      { name: 'PRES (Posterior Reversible Encephalopathy Syndrome)', frequency: 'uncommon', note: 'Hypertensive emergency, eclampsia, immunosuppressants (cyclosporine, tacrolimus). Visual loss + headache + seizures. Reversible on MRI.' },
      { name: 'Occipital AVM', frequency: 'uncommon', note: 'Young patients. May present with visual seizures (formed/unformed phosphenes).', },
    ],
    associatedSigns: [
      { finding: 'Highly congruent hemianopia', mechanism: 'V1 has the most precise retinotopic organisation. Both eyes\' fibres are fully interleaved.', importance: 'high' },
      { finding: 'Macular sparing', mechanism: 'Dual PCA+MCA blood supply to the posterior macular cortex. Pathognomonic of PCA territory infarct.', importance: 'high' },
      { finding: 'NO RAPD', mechanism: 'Cortical lesions NEVER cause RAPD — pupillomotor pathway diverges at the optic tract, before the cortex.', importance: 'high' },
      { finding: 'Normal optic discs', mechanism: 'No retrograde degeneration in adults from cortical lesions.', importance: 'high' },
      { finding: 'Formed visual hallucinations (Charles Bonnet)', mechanism: 'Deafferentation of visual cortex → spontaneous firing → complex geometric or figurative hallucinations in the blind hemifield. Patient is aware they are not real.', importance: 'medium' },
      { finding: 'Alexia without agraphia (left PCA + splenium)', mechanism: 'Left PCA stroke: right hemianopia + splenium of corpus callosum infarct → visual information from intact right occipital cortex cannot cross to left language hemisphere.', importance: 'medium' },
    ],
    stats: [
      'PCA stroke: most common cause of isolated homonymous hemianopia in adults',
      'Macular sparing in PCA stroke: ~70–80% of cases (varies by study)',
      'V1 macular representation: ~48–55% of total V1 surface area (for only 10° of central field)',
      'Macular sparing eccentricity: ~2–5 degrees spared in most PCA strokes',
      'PRES visual recovery: >90% with appropriate blood pressure control',
      'Only ~17% of cortical hemianopias are incongruent (most highly congruent site)',
    ],
    boardPearl: 'Left V1: right homonymous hemianopia, highly congruent, macular sparing (PCA), NO RAPD, normal discs. Macular sparing = pathognomonic of occipital (never seen with tract/radiation). Alexia without agraphia = left PCA + splenium.',
    specialTopic: {
      title: 'Why Cortical Lesions Never Cause RAPD',
      body: 'The pupillary light reflex (PLR) pathway diverges from the visual pathway at the OPTIC TRACT, ' +
        'heading to the pretectal olivary nucleus in the dorsal midbrain, BEFORE reaching the LGN. ' +
        'Therefore, any lesion posterior to the brachium of the superior colliculus ' +
        '(LGN, optic radiations, visual cortex) has NO effect on the PLR. ' +
        'A patient with complete cortical blindness (bilateral V1 destruction) has NORMAL pupils ' +
        'that constrict normally to light — because the PLR pathway is intact. ' +
        'This is a key bedside examination point and a common board exam question.',
    },
    congruence: 'Highly congruent (~83% of cortical lesions produce congruent defects; the most congruent site in the entire pathway)',
  },

  right_occipital: {
    vascularSupply: 'Posterior cerebral artery (PCA) — right calcarine artery',
    vascularDetail:
      'Right PCA/calcarine artery supplies right V1 (left visual hemifield). ' +
      'The right occipital pole (macular cortex) has dual supply from right PCA + right MCA ' +
      'leptomeningeal anastomoses, providing macular sparing in PCA strokes. ' +
      'The PCA arises from the basilar tip in ~70–80% of individuals (posterior circulation) ' +
      'and from the ICA (fetal PCA) in ~15–20% — important for stroke mechanism.',
    etiologies: [
      { name: 'Right PCA territory infarct', frequency: 'most common', note: 'Left homonymous hemianopia with macular sparing. Basilar artery disease or cardiac embolism.' },
      { name: 'Right occipital haemorrhage', frequency: 'common', note: 'HTN. Sudden onset. Dense left hemianopia.' },
      { name: 'Right occipital metastasis', frequency: 'common', note: 'Often from lung, breast, melanoma.' },
      { name: 'PRES', frequency: 'uncommon', note: 'Bilateral occipital/posterior parietal. Eclampsia most dramatic example.' },
      { name: 'Traumatic contusion', frequency: 'uncommon', note: 'Contrecoup occipital injury.' },
    ],
    associatedSigns: [
      { finding: 'Left homonymous hemianopia (highly congruent)', mechanism: 'Right V1 processes left visual hemifield.', importance: 'high' },
      { finding: 'Macular sparing', mechanism: 'Dual blood supply to posterior macular cortex from PCA + MCA.', importance: 'high' },
      { finding: 'No RAPD', mechanism: 'PLR pathway diverges before the cortex. Cortical lesions never cause RAPD.', importance: 'high' },
      { finding: 'Prosopagnosia', mechanism: 'Right (non-dominant) posterior occipito-temporal lesion involving fusiform face area.', importance: 'medium' },
      { finding: 'Anton syndrome (bilateral)', mechanism: 'If bilateral V1 destruction: cortical blindness with anosognosia. Patient denies blindness. Normal pupils.', importance: 'medium' },
    ],
    stats: [
      'PCA strokes: ~10–15% of all ischaemic strokes; most present with visual symptoms',
      'Fetal PCA (from ICA rather than basilar): ~20% of people — affects stroke pattern',
      'Macular sparing: spares central 2–5 degrees of vision; allows maintained 20/20 acuity',
    ],
    boardPearl: 'Right V1 → left hemianopia, highly congruent, macular sparing with PCA stroke, NO RAPD, normal discs. Anton syndrome (cortical blindness + anosognosia + confabulation) = bilateral V1 destruction, most commonly bilateral PCA infarcts.',
    specialTopic: {
      title: 'Anton Syndrome & Charles Bonnet Syndrome',
      body: 'ANTON SYNDROME: Bilateral V1 destruction → cortical blindness + visual ANOSOGNOSIA (patient denies blindness) + CONFABULATION (patient fabricates visual experiences). ' +
        'Normal pupils (PLR intact), normal optic discs. Usually irreversible. ' +
        'Most common cause: bilateral PCA infarction from basilar artery disease.\n\n' +
        'CHARLES BONNET SYNDROME: Significant visual loss (any level of the pathway) → complex, vivid, ' +
        'FORMED VISUAL HALLUCINATIONS (people, animals, patterns) in the area of field loss. ' +
        'The patient recognises these as NOT real (insight intact — key distinction from psychosis). ' +
        'Mechanism: visual cortex deafferentation → spontaneous firing. Occurs in ~12–15% of patients ' +
        'with significant visual impairment. Important to recognise so patients are not misdiagnosed ' +
        'with psychiatric illness.',
    },
    congruence: 'Highly congruent (most congruent site in the pathway)',
  },
};

// ============================================================
// OcularMotorPanel — Comprehensive Ocular Motor Simulator
// CN III / IV / VI · MLF · PPRF · riMLF · FEF · Dorsal Midbrain
// Multiple simultaneous clickable lesions · 9-position H-test
// ============================================================

import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type LesionSite =
  | 'fef_left'         | 'fef_right'
  | 'dorsal_midbrain'
  | 'rimlf'
  | 'cn3_nucleus_left' | 'cn3_nucleus_right'
  | 'cn4_nucleus_left' | 'cn4_nucleus_right'
  | 'mlf_left'         | 'mlf_right'
  | 'pprf_left'        | 'pprf_right'
  | 'cn6_nucleus_left' | 'cn6_nucleus_right'
  | 'cn3_nerve_left'   | 'cn3_nerve_right'
  | 'cn4_nerve_left'   | 'cn4_nerve_right'
  | 'cn6_nerve_left'   | 'cn6_nerve_right'
  | 'cavsinus_left'    | 'cavsinus_right';

interface EyeDef {
  noAbduct: boolean;       // LR paralysis
  noAdduct: boolean;       // MR paralysis (complete CN III)
  mlfFail: boolean;        // MLF: adduction failure on conjugate gaze
  noElevate: boolean;      // SR+IO (CN III)
  noDepress: boolean;      // IR (CN III)
  soParesis: boolean;      // CN IV SO: excyclotorsion + ↓depress-in-adduction
  ptosis: boolean;
  mydriasis: boolean;
}

interface GlobalDef {
  noGazeRight: boolean;
  noGazeLeft:  boolean;
  noUpgaze:    boolean;
  noDowngaze:  boolean;
  convRetract: boolean;    // convergence-retraction nystagmus (Parinaud's)
  devRight:    boolean;    // resting deviation right (acute left FEF / right PPRF)
  devLeft:     boolean;
  lightNear:   boolean;    // light-near dissociation (Parinaud's)
}

interface GazePos {
  leftX: number; leftY: number;
  rightX: number; rightY: number;
  leftPtosis: boolean; rightPtosis: boolean;
  leftMydriasis: boolean; rightMydriasis: boolean;
  leftExcyclo: boolean; rightExcyclo: boolean;
  leftNys: string; rightNys: string;
  leftLabel: string; rightLabel: string;
  abnormal: boolean;
}

// ─── Simulation Engine ────────────────────────────────────────────────────────

const EMPTY_EYE: EyeDef = {
  noAbduct: false, noAdduct: false, mlfFail: false,
  noElevate: false, noDepress: false, soParesis: false,
  ptosis: false, mydriasis: false,
};
const EMPTY_GLOBAL: GlobalDef = {
  noGazeRight: false, noGazeLeft: false, noUpgaze: false, noDowngaze: false,
  convRetract: false, devRight: false, devLeft: false, lightNear: false,
};

function computeDeficits(lesions: Set<LesionSite>): {
  left: EyeDef; right: EyeDef; global: GlobalDef;
  findings: string[]; diagnosis: string;
} {
  const L = { ...EMPTY_EYE };
  const R = { ...EMPTY_EYE };
  const G = { ...EMPTY_GLOBAL };
  const findings: string[] = [];

  for (const s of lesions) {
    switch (s) {
      case 'fef_left':
        G.devLeft = true;
        findings.push('Left FEF: eyes deviate LEFT (ipsilesional); impaired volitional rightward saccades');
        break;
      case 'fef_right':
        G.devRight = true;
        findings.push('Right FEF: eyes deviate RIGHT (ipsilesional); impaired volitional leftward saccades');
        break;
      case 'dorsal_midbrain':
        G.noUpgaze = true; G.convRetract = true; G.lightNear = true;
        findings.push("Parinaud's syndrome: upgaze palsy · convergence-retraction nystagmus · light-near dissociation · Collier's sign (lid retraction)");
        break;
      case 'rimlf':
        G.noUpgaze = true; G.noDowngaze = true;
        findings.push('Bilateral riMLF / PSP pattern: loss of vertical saccades (downgaze saccades affected first in PSP)');
        break;
      case 'cn3_nucleus_left':
        Object.assign(L, { noAdduct: true, noElevate: true, noDepress: true, ptosis: true, mydriasis: true });
        findings.push('Left CN III nucleus: ipsilateral CN III palsy + bilateral ptosis (levator subnucleus midline) + contralateral SR weakness (SR fibers cross)');
        break;
      case 'cn3_nucleus_right':
        Object.assign(R, { noAdduct: true, noElevate: true, noDepress: true, ptosis: true, mydriasis: true });
        findings.push('Right CN III nucleus: ipsilateral CN III palsy + bilateral ptosis + contralateral SR weakness');
        break;
      // CN IV NUCLEUS: fibers DECUSSATE before exiting → contralateral SO palsy
      case 'cn4_nucleus_left':
        R.soParesis = true;
        findings.push('Left CN IV nucleus → RIGHT SO palsy (decussation): right hypertropia, worse rightward gaze, right head tilt (Bielschowsky +)');
        break;
      case 'cn4_nucleus_right':
        L.soParesis = true;
        findings.push('Right CN IV nucleus → LEFT SO palsy (decussation): left hypertropia, worse leftward gaze, left head tilt');
        break;
      case 'mlf_left':
        L.mlfFail = true;
        findings.push('Left MLF → Left INO: left eye fails to adduct on rightward conjugate gaze; right abducting nystagmus; convergence preserved');
        break;
      case 'mlf_right':
        R.mlfFail = true;
        findings.push('Right MLF → Right INO: right eye fails to adduct on leftward conjugate gaze; left abducting nystagmus');
        break;
      case 'pprf_left':
        G.noGazeLeft = true; G.devRight = true;
        findings.push('Left PPRF: left horizontal gaze palsy; eyes deviate RIGHT at rest (away from brainstem lesion)');
        break;
      case 'pprf_right':
        G.noGazeRight = true; G.devLeft = true;
        findings.push('Right PPRF: right horizontal gaze palsy; eyes deviate LEFT at rest');
        break;
      // CN VI NUCLEUS = gaze center (contains internuclear neurons) → full ipsilateral gaze palsy
      case 'cn6_nucleus_left':
        G.noGazeLeft = true; G.devRight = true;
        findings.push('Left CN VI nucleus: left horizontal gaze palsy (nucleus ≠ just LR — internuclear neurons control full ipsilateral gaze)');
        break;
      case 'cn6_nucleus_right':
        G.noGazeRight = true; G.devLeft = true;
        findings.push('Right CN VI nucleus: right horizontal gaze palsy');
        break;
      case 'cn3_nerve_left':
        Object.assign(L, { noAdduct: true, noElevate: true, noDepress: true, ptosis: true, mydriasis: true });
        findings.push('Left CN III nerve palsy: left eye "down-and-out" · complete ptosis · fixed dilated pupil · compressive causes (PComm aneurysm) affect pupil early');
        break;
      case 'cn3_nerve_right':
        Object.assign(R, { noAdduct: true, noElevate: true, noDepress: true, ptosis: true, mydriasis: true });
        findings.push('Right CN III nerve palsy: right eye "down-and-out" · ptosis · mydriasis');
        break;
      // CN IV NERVE: ipsilateral SO palsy (nerve has already crossed inside brainstem)
      case 'cn4_nerve_left':
        L.soParesis = true;
        findings.push('Left CN IV nerve: LEFT SO palsy · left hypertropia · excyclotorsion · worse right gaze · worse right head tilt (Bielschowsky +)');
        break;
      case 'cn4_nerve_right':
        R.soParesis = true;
        findings.push('Right CN IV nerve: RIGHT SO palsy · right hypertropia · excyclotorsion · worse left gaze · worse left head tilt');
        break;
      case 'cn6_nerve_left':
        L.noAbduct = true;
        findings.push('Left CN VI nerve: left LR palsy · esotropia · diplopia worst on leftward gaze · head turn to left');
        break;
      case 'cn6_nerve_right':
        R.noAbduct = true;
        findings.push('Right CN VI nerve: right LR palsy · esotropia · diplopia worst on rightward gaze · head turn to right');
        break;
      case 'cavsinus_left':
        Object.assign(L, { noAbduct: true, noAdduct: true, noElevate: true, noDepress: true, soParesis: true, ptosis: true, mydriasis: true });
        findings.push('Left cavernous sinus: CN III+IV+VI palsy · complete left ophthalmoplegia · V1 pain/numbness · Horner possible');
        break;
      case 'cavsinus_right':
        Object.assign(R, { noAbduct: true, noAdduct: true, noElevate: true, noDepress: true, soParesis: true, ptosis: true, mydriasis: true });
        findings.push('Right cavernous sinus: CN III+IV+VI palsy · complete right ophthalmoplegia · V1 involvement');
        break;
    }
  }

  // Named syndrome diagnosis
  let diagnosis = lesions.size === 0 ? 'No lesions — normal ocular motility' : '';
  if (!diagnosis) {
    const has = (s: LesionSite) => lesions.has(s);
    if (has('mlf_left') && has('mlf_right')) diagnosis = 'WEBINO (Wall-Eyed Bilateral INO)';
    else if ((has('pprf_left') || has('cn6_nucleus_left')) && has('mlf_left')) diagnosis = 'Left One-and-a-Half Syndrome';
    else if ((has('pprf_right') || has('cn6_nucleus_right')) && has('mlf_right')) diagnosis = 'Right One-and-a-Half Syndrome';
    else if (lesions.size === 1) {
      const diag: Partial<Record<LesionSite, string>> = {
        fef_left: 'Left FEF Lesion', fef_right: 'Right FEF Lesion',
        dorsal_midbrain: "Dorsal Midbrain Syndrome (Parinaud's)",
        rimlf: 'Vertical Gaze Palsy (riMLF/PSP Pattern)',
        cn3_nerve_left: 'Complete Left CN III Palsy', cn3_nerve_right: 'Complete Right CN III Palsy',
        cn4_nerve_left: 'Left CN IV (SO) Palsy', cn4_nerve_right: 'Right CN IV (SO) Palsy',
        cn6_nerve_left: 'Left CN VI (LR) Palsy', cn6_nerve_right: 'Right CN VI (LR) Palsy',
        mlf_left: 'Left INO', mlf_right: 'Right INO',
        pprf_left: 'Left Horizontal Gaze Palsy', pprf_right: 'Right Horizontal Gaze Palsy',
        cn6_nucleus_left: 'Left CN VI Nucleus (Gaze Palsy)', cn6_nucleus_right: 'Right CN VI Nucleus (Gaze Palsy)',
        cn3_nucleus_left: 'Left CN III Nuclear Palsy', cn3_nucleus_right: 'Right CN III Nuclear Palsy',
        cn4_nucleus_left: 'Left CN IV Nucleus → R SO Palsy', cn4_nucleus_right: 'Right CN IV Nucleus → L SO Palsy',
        cavsinus_left: 'Left Cavernous Sinus Syndrome', cavsinus_right: 'Right Cavernous Sinus Syndrome',
      };
      diagnosis = diag[[...lesions][0]] ?? String([...lesions][0]);
    } else {
      diagnosis = `Multiple lesions (${lesions.size})`;
    }
  }

  return { left: L, right: R, global: G, findings, diagnosis };
}

// Compute 9-gaze-position result
// hDir: +1=right, -1=left (patient frame). vDir: +1=up, -1=down
function computePos(
  hDir: number, vDir: number,
  L: EyeDef, R: EyeDef, G: GlobalDef,
): GazePos {
  let h = hDir, v = vDir;
  if (h > 0 && G.noGazeRight) h = 0;
  if (h < 0 && G.noGazeLeft)  h = 0;
  if (v > 0 && G.noUpgaze)    v = 0;
  if (v < 0 && G.noDowngaze)  v = 0;

  const rest = G.devRight ? 0.28 : G.devLeft ? -0.28 : 0;

  // Left eye: abducts going left (h<0), adducts going right (h>0)
  let lx = h !== 0 ? h : rest;
  if (h < 0 && L.noAbduct)            lx = -0.08;
  if (h > 0 && (L.noAdduct || L.mlfFail)) lx = 0.06;
  let ly = v;
  if (v > 0 && L.noElevate) ly = 0.08;
  if (v < 0) {
    const inAdd = h > 0; // left eye adducts in right gaze
    if (L.noDepress) ly = 0.05;
    else if (L.soParesis && inAdd) ly = v * 0.3; // can't depress in adduction
  }
  // SO hypertropia even in primary position
  if (h === 0 && v === 0 && L.soParesis) ly = 0.22;

  // Right eye: abducts going right (h>0), adducts going left (h<0)
  let rx = h !== 0 ? h : rest;
  if (h > 0 && R.noAbduct)            rx = 0.08;
  if (h < 0 && (R.noAdduct || R.mlfFail)) rx = -0.06;
  let ry = v;
  if (v > 0 && R.noElevate) ry = 0.08;
  if (v < 0) {
    const inAdd = h < 0; // right eye adducts in left gaze
    if (R.noDepress) ry = 0.05;
    else if (R.soParesis && inAdd) ry = v * 0.3;
  }
  if (h === 0 && v === 0 && R.soParesis) ry = 0.22;

  // Nystagmus
  let lNys = 'none', rNys = 'none';
  if (G.convRetract && vDir > 0) { lNys = 'CR'; rNys = 'CR'; }
  // Abducting nystagmus (in the abducting eye when the fellow eye has MLF adduction fail)
  if (h > 0 && L.mlfFail) rNys = 'NYS'; // right eye abducts, left fails → right NYS
  if (h < 0 && R.mlfFail) lNys = 'NYS'; // left eye abducts, right fails → left NYS

  // Labels
  const ll: string[] = [], rl: string[] = [];
  if (L.noAbduct && h < 0)               ll.push('↛ abduct');
  if ((L.noAdduct || L.mlfFail) && h > 0) ll.push('↛ adduct');
  if (L.noElevate && v > 0)              ll.push('↛ elevate');
  if (L.soParesis && h > 0 && v < 0)    ll.push('hyperT');
  if (L.soParesis && h === 0 && v === 0) ll.push('hyperT');
  if (lNys !== 'none') ll.push(lNys);

  if (R.noAbduct && h > 0)               rl.push('↛ abduct');
  if ((R.noAdduct || R.mlfFail) && h < 0) rl.push('↛ adduct');
  if (R.noElevate && v > 0)              rl.push('↛ elevate');
  if (R.soParesis && h < 0 && v < 0)    rl.push('hyperT');
  if (R.soParesis && h === 0 && v === 0) rl.push('hyperT');
  if (rNys !== 'none') rl.push(rNys);

  return {
    leftX: lx, leftY: ly, rightX: rx, rightY: ry,
    leftPtosis: L.ptosis, rightPtosis: R.ptosis,
    leftMydriasis: L.mydriasis, rightMydriasis: R.mydriasis,
    leftExcyclo: L.soParesis, rightExcyclo: R.soParesis,
    leftNys: lNys, rightNys: rNys,
    leftLabel: ll.join(' '), rightLabel: rl.join(' '),
    abnormal: ll.length > 0 || rl.length > 0 || L.ptosis || R.ptosis,
  };
}

function computeAll(lesions: Set<LesionSite>) {
  const { left, right, global, findings, diagnosis } = computeDeficits(lesions);
  const grid: GazePos[][] = [];
  for (let row = 0; row < 3; row++) {
    const vDir = row === 0 ? 1 : row === 2 ? -1 : 0;
    grid.push([0, 1, 2].map(col => {
      const hDir = col === 0 ? -1 : col === 2 ? 1 : 0;
      return computePos(hDir, vDir, left, right, global);
    }));
  }
  return { grid, findings, diagnosis, global, left, right };
}

// ─── H-Pattern Display ────────────────────────────────────────────────────────

const CELL_W = 86, CELL_H = 68;
const EYE_LEX = 22, EYE_REX = 64;  // left/right eye cx within a cell
const EYE_CY = 30;
const EYE_RX = 19, EYE_RY = 11;
const IRIS_R = 7.5;
const MAX_SHIFT = 12;

const GAZE_LABELS = [
  ['↖ Up-L', '↑ Up',   '↗ Up-R'],
  ['← Left', '· Pri', '→ Right'],
  ['↙ Dn-L', '↓ Down', '↘ Dn-R'],
];

function MiniEyePair({ pos, cellW, cellH }: { pos: GazePos; cellW: number; cellH: number }) {
  const lx = EYE_LEX + pos.leftX * MAX_SHIFT;
  const rx = EYE_REX + pos.rightX * MAX_SHIFT;
  // Y: positive = up on screen (SVG Y inverted)
  const ly = EYE_CY - pos.leftY * MAX_SHIFT;
  const ry = EYE_CY - pos.rightY * MAX_SHIFT;

  const irisC = (fail: boolean, mydriasis: boolean) =>
    mydriasis ? '#885500' : fail ? '#1a2a3a' : '#0088bb';
  const pupilC = (fail: boolean, mydriasis: boolean) =>
    mydriasis ? '#cc7700' : fail ? '#0a1520' : '#004477';

  const leftFail = pos.leftLabel.includes('↛') || pos.leftLabel.includes('hyperT');
  const rightFail = pos.rightLabel.includes('↛') || pos.rightLabel.includes('hyperT');

  return (
    <g>
      {/* Background for abnormal cells */}
      {pos.abnormal && (
        <rect x={1} y={1} width={cellW - 2} height={cellH - 2} rx={4}
          fill="rgba(255,60,60,0.06)" stroke="rgba(255,100,100,0.25)" strokeWidth={1} />
      )}

      {/* ── Left eye (patient's left) ── */}
      {/* Ptosis overlay */}
      {pos.leftPtosis && (
        <path d={`M ${EYE_LEX - EYE_RX} ${EYE_CY} A ${EYE_RX} ${EYE_RY} 0 0 1 ${EYE_LEX + EYE_RX} ${EYE_CY}`}
          fill="rgba(80,50,20,0.7)" stroke="rgba(180,120,60,0.5)" strokeWidth={1} />
      )}
      <ellipse cx={EYE_LEX} cy={EYE_CY} rx={EYE_RX} ry={EYE_RY}
        fill={pos.leftPtosis ? 'rgba(200,215,240,0.35)' : 'rgba(210,228,252,0.88)'}
        stroke="rgba(80,120,180,0.45)" strokeWidth={1.2} />
      <circle cx={lx} cy={ly} r={IRIS_R}
        fill={irisC(leftFail, pos.leftMydriasis)} />
      <circle cx={lx} cy={ly} r={pos.leftMydriasis ? 5.5 : 4}
        fill={pupilC(leftFail, pos.leftMydriasis)} />
      {!pos.leftPtosis && <circle cx={lx - 3} cy={ly - 3} r={2} fill="rgba(255,255,255,0.8)" />}
      {/* Excyclotorsion indicator */}
      {pos.leftExcyclo && (
        <text x={EYE_LEX} y={EYE_CY - EYE_RY - 4} fontSize={6.5} fill="#f0a040"
          textAnchor="middle">excyclo</text>
      )}

      {/* ── Right eye (patient's right) ── */}
      {pos.rightPtosis && (
        <path d={`M ${EYE_REX - EYE_RX} ${EYE_CY} A ${EYE_RX} ${EYE_RY} 0 0 1 ${EYE_REX + EYE_RX} ${EYE_CY}`}
          fill="rgba(80,50,20,0.7)" stroke="rgba(180,120,60,0.5)" strokeWidth={1} />
      )}
      <ellipse cx={EYE_REX} cy={EYE_CY} rx={EYE_RX} ry={EYE_RY}
        fill={pos.rightPtosis ? 'rgba(200,215,240,0.35)' : 'rgba(210,228,252,0.88)'}
        stroke="rgba(80,120,180,0.45)" strokeWidth={1.2} />
      <circle cx={rx} cy={ry} r={IRIS_R}
        fill={irisC(rightFail, pos.rightMydriasis)} />
      <circle cx={rx} cy={ry} r={pos.rightMydriasis ? 5.5 : 4}
        fill={pupilC(rightFail, pos.rightMydriasis)} />
      {!pos.rightPtosis && <circle cx={rx - 3} cy={ry - 3} r={2} fill="rgba(255,255,255,0.8)" />}
      {pos.rightExcyclo && (
        <text x={EYE_REX} y={EYE_CY - EYE_RY - 4} fontSize={6.5} fill="#f0a040"
          textAnchor="middle">excyclo</text>
      )}

      {/* Labels under eyes */}
      {pos.leftLabel && (
        <text x={EYE_LEX} y={EYE_CY + EYE_RY + 9} fontSize={6} fill="#ff7755"
          textAnchor="middle">{pos.leftLabel}</text>
      )}
      {pos.rightLabel && (
        <text x={EYE_REX} y={EYE_CY + EYE_RY + 9} fontSize={6} fill="#ff7755"
          textAnchor="middle">{pos.rightLabel}</text>
      )}
    </g>
  );
}

function HPatternDisplay({ grid }: { grid: GazePos[][] }) {
  const gridW = CELL_W * 3;
  const gridH = CELL_H * 3;

  return (
    <div style={{ padding: '6px 8px 2px' }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(100,136,170,0.7)', marginBottom: 5 }}>
        9-Position Gaze Test
      </div>
      <svg viewBox={`0 0 ${gridW} ${gridH}`} style={{ width: '100%', maxWidth: gridW, display: 'block', margin: '0 auto' }}>
        {/* Grid lines */}
        {[1, 2].map(i => (
          <React.Fragment key={`gl-${i}`}>
            <line x1={CELL_W * i} y1={0} x2={CELL_W * i} y2={gridH}
              stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <line x1={0} y1={CELL_H * i} x2={gridW} y2={CELL_H * i}
              stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          </React.Fragment>
        ))}
        {/* Direction labels */}
        {GAZE_LABELS.map((row, r) => row.map((lbl, c) => (
          <text key={`lbl-${r}-${c}`}
            x={CELL_W * c + CELL_W / 2} y={CELL_H * r + CELL_H - 6}
            fontSize={6} fill="rgba(100,136,170,0.5)" textAnchor="middle">
            {lbl}
          </text>
        )))}
        {/* Eye pairs */}
        {grid.map((row, r) => row.map((pos, c) => (
          <g key={`cell-${r}-${c}`} transform={`translate(${CELL_W * c},${CELL_H * r})`}>
            <MiniEyePair pos={pos} cellW={CELL_W} cellH={CELL_H} />
          </g>
        )))}
        {/* Legend line */}
        <text x={4} y={gridH - 1} fontSize={5.5} fill="rgba(100,136,170,0.4)">
          L=patient left · R=patient right
        </text>
      </svg>
    </div>
  );
}

// ─── Circuit SVG ──────────────────────────────────────────────────────────────

const SW = 400, SH = 750;
const XL = 82, XR = 318;          // structure centers
const XML = 148, XMR = 252;       // MLF tract centers
const XC = SW / 2;

// Y positions
const Y_FEF       = 48;
const Y_DMIDBRAIN = 118;
const Y_RIMLF     = 155;
const Y_CN3_NUC   = 160;
const Y_CN4_NUC   = 225;
const Y_MLF_TOP   = 158;
const Y_PONS_DIV  = 295;
const Y_PPRF      = 340;
const Y_CN6_NUC   = 418;
const Y_MLF_BOT   = 420;
const Y_NERVE_DIV = 468;
const Y_CN3_NERVE = 490;
const Y_CN4_NERVE = 520;
const Y_CN6_NERVE = 548;
const Y_CAVSINUS  = 578;
const Y_ORBIT     = 680;

const RED = '#ff4444';
const CYAN = '#00d4ff';
const MLF_C = '#aa66ff';
const DIM = 'rgba(100,140,200,0.28)';
const GLOW_C = '#00d4ff';

function lesionX(site: LesionSite): number {
  return site.endsWith('_left') || site === 'fef_left' ? XL : XR;
}

function StructureGlyph({
  active, lesioned, x, y, shape, w, h, r, label, sub, onClick, hovered, onHover,
}: {
  active?: boolean; lesioned: boolean;
  x: number; y: number;
  shape: 'circle' | 'rect' | 'diamond';
  w?: number; h?: number; r?: number;
  label: string; sub?: string;
  onClick: () => void; hovered: boolean;
  onHover: (v: boolean) => void;
}) {
  const fill   = lesioned ? 'rgba(200,30,30,0.18)' : active ? 'rgba(0,212,255,0.12)' : 'rgba(10,22,48,0.75)';
  const stroke = lesioned ? RED : active ? CYAN : DIM;
  const sw     = lesioned ? 2 : active ? 2 : 1.5;
  const lc     = lesioned ? RED : active ? CYAN : 'rgba(180,200,240,0.65)';

  return (
    <g
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Hover ring */}
      {hovered && !lesioned && (
        shape === 'circle'
          ? <circle cx={x} cy={y} r={(r ?? 20) + 5} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
          : <rect x={x - (w ?? 60) / 2 - 5} y={y - (h ?? 28) / 2 - 5} width={(w ?? 60) + 10} height={(h ?? 28) + 10} rx={8}
              fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
      )}
      {/* Shape */}
      {shape === 'circle' && (
        <circle cx={x} cy={y} r={r ?? 20} fill={fill} stroke={stroke} strokeWidth={sw} />
      )}
      {shape === 'rect' && (
        <rect x={x - (w ?? 60) / 2} y={y - (h ?? 28) / 2} width={w ?? 60} height={h ?? 28} rx={7}
          fill={fill} stroke={stroke} strokeWidth={sw} />
      )}
      {shape === 'diamond' && (
        <polygon
          points={`${x},${y - (r ?? 14)} ${x + (r ?? 14)},${y} ${x},${y + (r ?? 14)} ${x - (r ?? 14)},${y}`}
          fill={fill} stroke={stroke} strokeWidth={sw} />
      )}
      {/* Labels */}
      <text x={x} y={y - 1} fill={lc} fontSize={8.5} fontWeight={700}
        textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>
        {label}
      </text>
      {sub && (
        <text x={x} y={y + 10} fill={lc} fontSize={7} textAnchor="middle"
          dominantBaseline="middle" opacity={0.7} style={{ pointerEvents: 'none' }}>
          {sub}
        </text>
      )}
      {/* Lesion X */}
      {lesioned && (
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={x} cy={y} r={(r ?? 20) - 2} fill="rgba(255,30,30,0.12)" />
          <line x1={x - 8} y1={y - 8} x2={x + 8} y2={y + 8} stroke={RED} strokeWidth={2.8} strokeLinecap="round" />
          <line x1={x + 8} y1={y - 8} x2={x - 8} y2={y + 8} stroke={RED} strokeWidth={2.8} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

function CircuitSVG({
  lesions, onToggle,
}: {
  lesions: Set<LesionSite>;
  onToggle: (s: LesionSite) => void;
}) {
  const [hov, setHov] = useState<LesionSite | null>(null);
  const has = (s: LesionSite) => lesions.has(s);
  const h   = (s: LesionSite) => hov === s;

  const mlfLBlocked = has('mlf_left');
  const mlfRBlocked = has('mlf_right');
  const Y_LESION_MLF = (Y_MLF_TOP + Y_MLF_BOT) / 2;

  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="arr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="rgba(100,140,200,0.4)" />
        </marker>
        <marker id="arr-cy" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill={CYAN} />
        </marker>
      </defs>

      {/* ── Zone backgrounds ── */}
      <rect x={0} y={0} width={SW} height={96} fill="rgba(100,60,200,0.04)" />
      <rect x={0} y={96} width={SW} height={Y_PONS_DIV - 96} fill="rgba(60,80,180,0.04)" />
      <rect x={0} y={Y_PONS_DIV} width={SW} height={Y_NERVE_DIV - Y_PONS_DIV} fill="rgba(30,70,160,0.04)" />
      <rect x={0} y={Y_NERVE_DIV} width={SW} height={SH - Y_NERVE_DIV} fill="rgba(15,40,100,0.04)" />

      {/* Zone labels */}
      {[
        { label: 'CORTEX', y: 14, c: 'rgba(160,120,255,0.45)' },
        { label: 'MIDBRAIN', y: Y_PONS_DIV - 8, c: 'rgba(80,130,220,0.4)' },
        { label: 'PONS', y: Y_NERVE_DIV - 8, c: 'rgba(60,110,200,0.4)' },
        { label: 'PERIPHERAL', y: SH - 14, c: 'rgba(40,90,160,0.4)' },
      ].map(({ label, y, c }) => (
        <text key={label} x={14} y={y} fill={c} fontSize={8.5} fontWeight={700} letterSpacing={1.5}>{label}</text>
      ))}
      <line x1={0} y1={96}  x2={SW} y2={96}  stroke="rgba(100,80,220,0.1)" strokeWidth={1} />
      <line x1={0} y1={Y_PONS_DIV} x2={SW} y2={Y_PONS_DIV} stroke="rgba(60,100,200,0.1)" strokeWidth={1} />
      <line x1={0} y1={Y_NERVE_DIV} x2={SW} y2={Y_NERVE_DIV} stroke="rgba(40,80,170,0.1)" strokeWidth={1} />

      {/* Midline */}
      <line x1={XC} y1={20} x2={XC} y2={SH - 30}
        stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeDasharray="4 8" />
      <text x={XC} y={SH - 14} fill="rgba(255,255,255,0.15)" fontSize={8} textAnchor="middle">midline</text>

      {/* ── MLF tracts ── */}
      {[{ x: XML, blocked: mlfLBlocked, side: 'L' }, { x: XMR, blocked: mlfRBlocked, side: 'R' }].map(({ x, blocked, side }) => (
        <g key={`mlf-${side}`}>
          <rect x={x - 5} y={Y_MLF_TOP} width={10} height={Y_MLF_BOT - Y_MLF_TOP} rx={4}
            fill={blocked ? 'rgba(180,30,30,0.15)' : 'rgba(120,60,240,0.12)'} />
          <line x1={x} y1={Y_MLF_TOP} x2={x} y2={Y_MLF_BOT}
            stroke={blocked ? RED : MLF_C}
            strokeWidth={blocked ? 2 : 3}
            strokeDasharray={blocked ? '5 3' : 'none'}
            opacity={0.75} />
          {blocked && (
            <g filter="url(#glow-red)">
              <circle cx={x} cy={Y_LESION_MLF} r={9} fill="rgba(255,30,30,0.22)" stroke={RED} strokeWidth={2} />
              <line x1={x - 5.5} y1={Y_LESION_MLF - 5.5} x2={x + 5.5} y2={Y_LESION_MLF + 5.5} stroke={RED} strokeWidth={2.5} strokeLinecap="round" />
              <line x1={x + 5.5} y1={Y_LESION_MLF - 5.5} x2={x - 5.5} y2={Y_LESION_MLF + 5.5} stroke={RED} strokeWidth={2.5} strokeLinecap="round" />
            </g>
          )}
          <text x={x + (side === 'L' ? -10 : 10)} y={(Y_MLF_TOP + Y_MLF_BOT) / 2 - 4}
            fill={blocked ? RED : MLF_C} fontSize={8.5} fontWeight={700}
            textAnchor={side === 'L' ? 'end' : 'start'} opacity={0.85}>MLF</text>
          <text x={x + (side === 'L' ? -10 : 10)} y={(Y_MLF_TOP + Y_MLF_BOT) / 2 + 8}
            fill={blocked ? RED : MLF_C} fontSize={7.5}
            textAnchor={side === 'L' ? 'end' : 'start'} opacity={0.55}>({side})</text>
        </g>
      ))}

      {/* ── Pathway connections (background) ── */}
      {/* FEF → PPRF (crossed, contralateral) */}
      <path d={`M ${XL + 44} ${Y_FEF} C ${XL + 80} ${Y_FEF + 60} ${XR - 20} ${Y_PPRF - 60} ${XR - 38} ${Y_PPRF - 14}`}
        fill="none" stroke={DIM} strokeWidth={1.5} strokeDasharray="3 5" markerEnd="url(#arr)" />
      <path d={`M ${XR - 44} ${Y_FEF} C ${XR - 80} ${Y_FEF + 60} ${XL + 20} ${Y_PPRF - 60} ${XL + 38} ${Y_PPRF - 14}`}
        fill="none" stroke={DIM} strokeWidth={1.5} strokeDasharray="3 5" markerEnd="url(#arr)" />
      {/* PPRF → CN6 nucleus */}
      <line x1={XL} y1={Y_PPRF + 16} x2={XL} y2={Y_CN6_NUC - 20}
        stroke={DIM} strokeWidth={1.5} markerEnd="url(#arr)" />
      <line x1={XR} y1={Y_PPRF + 16} x2={XR} y2={Y_CN6_NUC - 20}
        stroke={DIM} strokeWidth={1.5} markerEnd="url(#arr)" />
      {/* CN6 interneurons crossing → MLF */}
      <path d={`M ${XL} ${Y_CN6_NUC + 20} C ${XL} ${Y_CN6_NUC + 45} ${XMR} ${Y_CN6_NUC + 45} ${XMR} ${Y_MLF_BOT}`}
        fill="none" stroke={DIM} strokeWidth={1.5} strokeDasharray="3 4" />
      <path d={`M ${XR} ${Y_CN6_NUC + 20} C ${XR} ${Y_CN6_NUC + 45} ${XML} ${Y_CN6_NUC + 45} ${XML} ${Y_MLF_BOT}`}
        fill="none" stroke={DIM} strokeWidth={1.5} strokeDasharray="3 4" />
      {/* MLF → CN3 nucleus */}
      <line x1={XML} y1={Y_MLF_TOP} x2={XL} y2={Y_CN3_NUC + 20}
        stroke={DIM} strokeWidth={1.2} strokeDasharray="3 4" markerEnd="url(#arr)" />
      <line x1={XMR} y1={Y_MLF_TOP} x2={XR} y2={Y_CN3_NUC + 20}
        stroke={DIM} strokeWidth={1.2} strokeDasharray="3 4" markerEnd="url(#arr)" />

      {/* ── Peripheral nerve paths ── */}
      {/* CN III nerve (exits ventrally through cerebral peduncles → cavernous sinus) */}
      <path d={`M ${XL} ${Y_CN3_NUC + 20} L ${XL - 8} ${Y_CN3_NERVE} L ${XL - 14} ${Y_CAVSINUS - 16}`}
        fill="none" stroke={DIM} strokeWidth={1.5} strokeDasharray="2 4" />
      <path d={`M ${XR} ${Y_CN3_NUC + 20} L ${XR + 8} ${Y_CN3_NERVE} L ${XR + 14} ${Y_CAVSINUS - 16}`}
        fill="none" stroke={DIM} strokeWidth={1.5} strokeDasharray="2 4" />
      {/* CN IV nerve (exits DORSALLY then wraps — shown as dashed arc) */}
      <path d={`M ${XL} ${Y_CN4_NUC} C ${XL - 45} ${Y_CN4_NUC + 30} ${XL - 50} ${Y_CN4_NERVE} ${XL - 18} ${Y_CAVSINUS - 12}`}
        fill="none" stroke={DIM} strokeWidth={1.2} strokeDasharray="2 5" opacity={0.7} />
      <path d={`M ${XR} ${Y_CN4_NUC} C ${XR + 45} ${Y_CN4_NUC + 30} ${XR + 50} ${Y_CN4_NERVE} ${XR + 18} ${Y_CAVSINUS - 12}`}
        fill="none" stroke={DIM} strokeWidth={1.2} strokeDasharray="2 5" opacity={0.7} />
      {/* CN VI nerve (from nucleus down) */}
      <path d={`M ${XL} ${Y_CN6_NUC + 20} L ${XL - 4} ${Y_CN6_NERVE} L ${XL - 10} ${Y_CAVSINUS - 8}`}
        fill="none" stroke={DIM} strokeWidth={1.5} strokeDasharray="2 4" />
      <path d={`M ${XR} ${Y_CN6_NUC + 20} L ${XR + 4} ${Y_CN6_NERVE} L ${XR + 10} ${Y_CAVSINUS - 8}`}
        fill="none" stroke={DIM} strokeWidth={1.5} strokeDasharray="2 4" />
      {/* Cavernous sinus → orbit */}
      <line x1={XL - 18} y1={Y_CAVSINUS + 22} x2={XL - 18} y2={Y_ORBIT - 16}
        stroke={DIM} strokeWidth={1.5} markerEnd="url(#arr)" />
      <line x1={XR + 18} y1={Y_CAVSINUS + 22} x2={XR + 18} y2={Y_ORBIT - 16}
        stroke={DIM} strokeWidth={1.5} markerEnd="url(#arr)" />

      {/* ── Clickable structures ── */}
      {/* FEF */}
      <StructureGlyph shape="rect" x={XL} y={Y_FEF} w={78} h={30}
        label="FEF" sub="L gaze ctr" lesioned={has('fef_left')} hovered={h('fef_left')}
        onClick={() => onToggle('fef_left')} onHover={v => setHov(v ? 'fef_left' : null)} />
      <StructureGlyph shape="rect" x={XR} y={Y_FEF} w={78} h={30}
        label="FEF" sub="R gaze ctr" lesioned={has('fef_right')} hovered={h('fef_right')}
        onClick={() => onToggle('fef_right')} onHover={v => setHov(v ? 'fef_right' : null)} />

      {/* Dorsal midbrain (Parinaud's) — centered */}
      <StructureGlyph shape="rect" x={XC} y={Y_DMIDBRAIN} w={148} h={26}
        label="Dorsal Midbrain" sub="Parinaud's / PC" lesioned={has('dorsal_midbrain')} hovered={h('dorsal_midbrain')}
        onClick={() => onToggle('dorsal_midbrain')} onHover={v => setHov(v ? 'dorsal_midbrain' : null)} />

      {/* riMLF — centered */}
      <StructureGlyph shape="rect" x={XC} y={Y_RIMLF} w={110} h={26}
        label="riMLF" sub="vertical saccades" lesioned={has('rimlf')} hovered={h('rimlf')}
        onClick={() => onToggle('rimlf')} onHover={v => setHov(v ? 'rimlf' : null)} />

      {/* CN III nuclei */}
      <StructureGlyph shape="circle" x={XL} y={Y_CN3_NUC} r={22}
        label="CN III" sub="nuc(L)" lesioned={has('cn3_nucleus_left')} hovered={h('cn3_nucleus_left')}
        onClick={() => onToggle('cn3_nucleus_left')} onHover={v => setHov(v ? 'cn3_nucleus_left' : null)} />
      <StructureGlyph shape="circle" x={XR} y={Y_CN3_NUC} r={22}
        label="CN III" sub="nuc(R)" lesioned={has('cn3_nucleus_right')} hovered={h('cn3_nucleus_right')}
        onClick={() => onToggle('cn3_nucleus_right')} onHover={v => setHov(v ? 'cn3_nucleus_right' : null)} />
      <text x={XL - 27} y={Y_CN3_NUC} fill="rgba(150,180,230,0.35)" fontSize={7} textAnchor="end">MR·SR·IR·IO</text>
      <text x={XR + 27} y={Y_CN3_NUC} fill="rgba(150,180,230,0.35)" fontSize={7} textAnchor="start">MR·SR·IR·IO</text>

      {/* CN IV nuclei */}
      <StructureGlyph shape="circle" x={XL} y={Y_CN4_NUC} r={19}
        label="CN IV" sub="nuc(L)" lesioned={has('cn4_nucleus_left')} hovered={h('cn4_nucleus_left')}
        onClick={() => onToggle('cn4_nucleus_left')} onHover={v => setHov(v ? 'cn4_nucleus_left' : null)} />
      <StructureGlyph shape="circle" x={XR} y={Y_CN4_NUC} r={19}
        label="CN IV" sub="nuc(R)" lesioned={has('cn4_nucleus_right')} hovered={h('cn4_nucleus_right')}
        onClick={() => onToggle('cn4_nucleus_right')} onHover={v => setHov(v ? 'cn4_nucleus_right' : null)} />
      <text x={XL - 24} y={Y_CN4_NUC} fill="rgba(150,180,230,0.3)" fontSize={7} textAnchor="end">SO↔contra</text>
      <text x={XR + 24} y={Y_CN4_NUC} fill="rgba(150,180,230,0.3)" fontSize={7} textAnchor="start">SO↔contra</text>

      {/* PPRF */}
      <StructureGlyph shape="rect" x={XL} y={Y_PPRF} w={78} h={32}
        label="PPRF" sub="L horiz. gaze" lesioned={has('pprf_left')} hovered={h('pprf_left')}
        onClick={() => onToggle('pprf_left')} onHover={v => setHov(v ? 'pprf_left' : null)} />
      <StructureGlyph shape="rect" x={XR} y={Y_PPRF} w={78} h={32}
        label="PPRF" sub="R horiz. gaze" lesioned={has('pprf_right')} hovered={h('pprf_right')}
        onClick={() => onToggle('pprf_right')} onHover={v => setHov(v ? 'pprf_right' : null)} />

      {/* CN VI nuclei */}
      <StructureGlyph shape="circle" x={XL} y={Y_CN6_NUC} r={21}
        label="CN VI" sub="nuc(L)" lesioned={has('cn6_nucleus_left')} hovered={h('cn6_nucleus_left')}
        onClick={() => onToggle('cn6_nucleus_left')} onHover={v => setHov(v ? 'cn6_nucleus_left' : null)} />
      <StructureGlyph shape="circle" x={XR} y={Y_CN6_NUC} r={21}
        label="CN VI" sub="nuc(R)" lesioned={has('cn6_nucleus_right')} hovered={h('cn6_nucleus_right')}
        onClick={() => onToggle('cn6_nucleus_right')} onHover={v => setHov(v ? 'cn6_nucleus_right' : null)} />
      <text x={XL - 26} y={Y_CN6_NUC - 5} fill="rgba(150,180,230,0.3)" fontSize={7} textAnchor="end">LR +</text>
      <text x={XL - 26} y={Y_CN6_NUC + 7} fill="rgba(150,180,230,0.3)" fontSize={7} textAnchor="end">interneur.</text>

      {/* MLF click targets (the tract itself) */}
      <rect x={XML - 10} y={Y_MLF_TOP + 20} width={20} height={Y_MLF_BOT - Y_MLF_TOP - 40} rx={4}
        fill="transparent" stroke="transparent" style={{ cursor: 'pointer' }}
        onClick={() => onToggle('mlf_left')} />
      <rect x={XMR - 10} y={Y_MLF_TOP + 20} width={20} height={Y_MLF_BOT - Y_MLF_TOP - 40} rx={4}
        fill="transparent" stroke="transparent" style={{ cursor: 'pointer' }}
        onClick={() => onToggle('mlf_right')} />

      {/* ── Peripheral nerves (clickable) ── */}
      {/* CN III nerves */}
      <StructureGlyph shape="diamond" x={XL - 8} y={Y_CN3_NERVE} r={13}
        label="CN III" sub="(L)" lesioned={has('cn3_nerve_left')} hovered={h('cn3_nerve_left')}
        onClick={() => onToggle('cn3_nerve_left')} onHover={v => setHov(v ? 'cn3_nerve_left' : null)} />
      <StructureGlyph shape="diamond" x={XR + 8} y={Y_CN3_NERVE} r={13}
        label="CN III" sub="(R)" lesioned={has('cn3_nerve_right')} hovered={h('cn3_nerve_right')}
        onClick={() => onToggle('cn3_nerve_right')} onHover={v => setHov(v ? 'cn3_nerve_right' : null)} />

      {/* CN IV nerves */}
      <StructureGlyph shape="diamond" x={XL - 25} y={Y_CN4_NERVE} r={13}
        label="CN IV" sub="(L)" lesioned={has('cn4_nerve_left')} hovered={h('cn4_nerve_left')}
        onClick={() => onToggle('cn4_nerve_left')} onHover={v => setHov(v ? 'cn4_nerve_left' : null)} />
      <StructureGlyph shape="diamond" x={XR + 25} y={Y_CN4_NERVE} r={13}
        label="CN IV" sub="(R)" lesioned={has('cn4_nerve_right')} hovered={h('cn4_nerve_right')}
        onClick={() => onToggle('cn4_nerve_right')} onHover={v => setHov(v ? 'cn4_nerve_right' : null)} />
      {/* CN IV "exits dorsally" label */}
      <text x={XC} y={Y_CN4_NERVE - 4} fill="rgba(140,170,220,0.3)" fontSize={7} textAnchor="middle" fontStyle="italic">
        (CN IV exits dorsally · decussates)
      </text>

      {/* CN VI nerves */}
      <StructureGlyph shape="diamond" x={XL - 4} y={Y_CN6_NERVE} r={13}
        label="CN VI" sub="(L)" lesioned={has('cn6_nerve_left')} hovered={h('cn6_nerve_left')}
        onClick={() => onToggle('cn6_nerve_left')} onHover={v => setHov(v ? 'cn6_nerve_left' : null)} />
      <StructureGlyph shape="diamond" x={XR + 4} y={Y_CN6_NERVE} r={13}
        label="CN VI" sub="(R)" lesioned={has('cn6_nerve_right')} hovered={h('cn6_nerve_right')}
        onClick={() => onToggle('cn6_nerve_right')} onHover={v => setHov(v ? 'cn6_nerve_right' : null)} />

      {/* Cavernous sinuses */}
      <StructureGlyph shape="rect" x={XL - 14} y={Y_CAVSINUS} w={90} h={38}
        label="Cav. Sinus" sub="CN III+IV+VI+V1" lesioned={has('cavsinus_left')} hovered={h('cavsinus_left')}
        onClick={() => onToggle('cavsinus_left')} onHover={v => setHov(v ? 'cavsinus_left' : null)} />
      <StructureGlyph shape="rect" x={XR + 14} y={Y_CAVSINUS} w={90} h={38}
        label="Cav. Sinus" sub="CN III+IV+VI+V1" lesioned={has('cavsinus_right')} hovered={h('cavsinus_right')}
        onClick={() => onToggle('cavsinus_right')} onHover={v => setHov(v ? 'cavsinus_right' : null)} />

      {/* Orbit labels */}
      <text x={XL - 18} y={Y_ORBIT} fill="rgba(140,170,220,0.45)" fontSize={8} textAnchor="middle" fontWeight={600}>L Orbit</text>
      <text x={XL - 18} y={Y_ORBIT + 12} fill="rgba(140,170,220,0.28)" fontSize={7} textAnchor="middle">MR·SR·IR·IO·LR·SO</text>
      <text x={XR + 18} y={Y_ORBIT} fill="rgba(140,170,220,0.45)" fontSize={8} textAnchor="middle" fontWeight={600}>R Orbit</text>
      <text x={XR + 18} y={Y_ORBIT + 12} fill="rgba(140,170,220,0.28)" fontSize={7} textAnchor="middle">MR·SR·IR·IO·LR·SO</text>

      {/* Hover tooltip */}
      {hov && (
        <text x={XC} y={SH - 28} fill="rgba(200,220,255,0.7)" fontSize={9}
          textAnchor="middle" fontWeight={600}>
          Click to {lesions.has(hov) ? 'remove' : 'add'} lesion: {SITE_LABELS[hov]}
        </text>
      )}

      {/* Side labels */}
      <text x={14} y={SH - 10} fill="rgba(200,220,255,0.25)" fontSize={8.5} textAnchor="start">LEFT</text>
      <text x={SW - 14} y={SH - 10} fill="rgba(200,220,255,0.25)" fontSize={8.5} textAnchor="end">RIGHT</text>

      {/* Legend */}
      <g transform={`translate(${SW - 135}, ${Y_PONS_DIV + 8})`}>
        <rect x={0} y={0} width={128} height={54} rx={6}
          fill="rgba(5,10,22,0.8)" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        <circle cx={12} cy={14} r={5} fill="rgba(0,212,255,0.15)" stroke={CYAN} strokeWidth={1.5} />
        <text x={22} y={18} fill="rgba(180,210,240,0.65)" fontSize={8}>Click = toggle lesion</text>
        <circle cx={12} cy={31} r={5} fill="rgba(200,30,30,0.2)" stroke={RED} strokeWidth={1.5} />
        <text x={22} y={35} fill="rgba(180,210,240,0.65)" fontSize={8}>Red ✕ = active lesion</text>
        <line x1={6} y1={47} x2={18} y2={47} stroke={MLF_C} strokeWidth={3} />
        <text x={22} y={50} fill="rgba(180,210,240,0.65)" fontSize={8}>MLF tracts</text>
      </g>
    </svg>
  );
}

// ─── Clinical Education Panel ─────────────────────────────────────────────────

type EduTab = 'cranial' | 'higher' | 'cases';

const SITE_LABELS: Record<LesionSite, string> = {
  fef_left: 'Left FEF', fef_right: 'Right FEF',
  dorsal_midbrain: "Dorsal Midbrain (Parinaud's)",
  rimlf: 'riMLF (bilateral)',
  cn3_nucleus_left: 'Left CN III Nucleus', cn3_nucleus_right: 'Right CN III Nucleus',
  cn4_nucleus_left: 'Left CN IV Nucleus', cn4_nucleus_right: 'Right CN IV Nucleus',
  mlf_left: 'Left MLF', mlf_right: 'Right MLF',
  pprf_left: 'Left PPRF', pprf_right: 'Right PPRF',
  cn6_nucleus_left: 'Left CN VI Nucleus', cn6_nucleus_right: 'Right CN VI Nucleus',
  cn3_nerve_left: 'Left CN III Nerve', cn3_nerve_right: 'Right CN III Nerve',
  cn4_nerve_left: 'Left CN IV Nerve', cn4_nerve_right: 'Right CN IV Nerve',
  cn6_nerve_left: 'Left CN VI Nerve', cn6_nerve_right: 'Right CN VI Nerve',
  cavsinus_left: 'Left Cavernous Sinus', cavsinus_right: 'Right Cavernous Sinus',
};

interface ClinicalCase {
  title: string;
  etiology: string;
  vignette: string;
  lesions: LesionSite[];
  pearl: string;
}

const CASES: ClinicalCase[] = [
  {
    title: 'CN III Palsy — PComm Aneurysm',
    etiology: 'Compressive (surgical emergency)',
    vignette: '52F with sudden-onset severe headache ("thunderclap") and drooping of right eyelid. Right eye deviated down-and-out, complete ptosis, right pupil fixed and dilated to 7mm. Left eye normal.',
    lesions: ['cn3_nerve_right'],
    pearl: 'Pupil-involving CN III palsy = compressive until proven otherwise. Parasympathetics travel on the OUTER surface of CN III — compressed first by aneurysm. STAT CT/CTA + neurosurgery. Pupil-sparing ischemic CN III (diabetes/HTN) = central ischemia spares peripherally-located parasympathetics.',
  },
  {
    title: 'CN IV Palsy — Head Trauma',
    etiology: 'Trauma (most common cause of isolated CN IV palsy)',
    vignette: '28M after MVA. Complains of vertical diplopia worse when reading (downgaze). Right eye appears higher than left. Bielschowsky head-tilt test: hypertropia worsens on right head tilt. Confirms right SO palsy.',
    lesions: ['cn4_nerve_right'],
    pearl: 'CN IV has the longest intracranial course and exits dorsally — uniquely vulnerable to deceleration trauma. Bielschowsky head-tilt test: tilt to the SAME side worsens hypertropia (the SO is needed for incyclotorsion during ipsilateral head tilt). Reading and going downstairs are most symptomatic.',
  },
  {
    title: 'CN VI Palsy — Raised ICP',
    etiology: 'Raised intracranial pressure (false localizing sign)',
    vignette: '14F with headaches and papilledema. Gradually developing diplopia on horizontal gaze. Left eye fails to fully abduct; esotropia worse when looking left. MRI shows no posterior fossa lesion.',
    lesions: ['cn6_nerve_left'],
    pearl: "CN VI has the longest subarachnoid course — stretched over the petrous ridge when ICP rises. It is a FALSE LOCALIZING SIGN (doesn't indicate a lesion at the pons). Other causes: Gradenigo's syndrome (petrous apicitis: CN VI + CN V + ipsilateral ear pain triad), Wernicke's, post-LP.",
  },
  {
    title: 'Left INO — Pontine Stroke',
    etiology: 'Basilar perforator occlusion',
    vignette: '66M with hypertension, sudden horizontal diplopia. Right eye abducts normally on rightward gaze with fine nystagmus; left eye fails to adduct past midline. Convergence intact. MRI DWI: left paramedian pontine lesion.',
    lesions: ['mlf_left'],
    pearl: 'INO named for the adducting (failing) eye. Left MLF lesion = Left INO (left eye fails to adduct on rightward gaze). Preserved convergence is a key localizing feature (convergence uses a separate near-reflex pathway). Unilateral INO in older vascular patient → basilar perforator.',
  },
  {
    title: 'WEBINO — Multiple Sclerosis',
    etiology: 'MS plaques in bilateral MLFs',
    vignette: '26F with MS, presents with 4 days of horizontal binocular diplopia. Both eyes show adduction lag in either direction of horizontal gaze. Abducting nystagmus bilaterally. Convergence preserved. MRI: bilateral dorsal pontine T2 lesions.',
    lesions: ['mlf_left', 'mlf_right'],
    pearl: 'Bilateral INO (WEBINO = Wall-Eyed Bilateral INO) in a young patient = MS until proven otherwise. The exotropia arises from absent adduction tone in both eyes. Bilateral lesions in the dorsal pons are classic MS territory.',
  },
  {
    title: 'One-and-a-Half Syndrome — Pontine Hemorrhage',
    etiology: 'Hypertensive pontine hemorrhage',
    vignette: '58M hypertensive, sudden-onset horizontal gaze palsy. Cannot look left at all. On attempted rightward gaze: right eye abducts but left eye stays at center. The ONLY surviving horizontal movement is right eye abduction.',
    lesions: ['cn6_nucleus_left', 'mlf_left'],
    pearl: 'Left CN VI nucleus (or PPRF) + left MLF. PPRF/CN6 nucleus destroys left gaze center (= "one"); MLF destroys left eye adduction on right gaze (= "half"). Only movement surviving: right eye abduction. First described by Fisher in pontine glioma.',
  },
  {
    title: "Parinaud's Syndrome — Pineal Tumor",
    etiology: 'Pineal gland mass compressing dorsal midbrain / posterior commissure',
    vignette: '19M with headache, blurred vision. Upgaze palsy — both eyes unable to elevate volitionally or by reflex. On attempted upgaze: convergence-retraction nystagmus (eyes jerk inward). Pupils react to accommodation but not to light (light-near dissociation). Eyelid retraction (Collier sign).',
    lesions: ['dorsal_midbrain'],
    pearl: "Parinaud's / Dorsal midbrain syndrome: upgaze palsy + convergence-retraction nystagmus + light-near dissociation + Collier's lid retraction. Causes: pineal tumor (young), midbrain stroke, hydrocephalus (Sylvian aqueduct compression), MS. Vertical vestibular input may be relatively preserved.",
  },
  {
    title: 'Progressive Supranuclear Palsy (PSP)',
    etiology: 'Tau-opathy — bilateral riMLF / midbrain degeneration',
    vignette: '68M with falls (backward), dysarthria, and 1-year history of difficulty reading (downgaze). Downgaze saccades severely reduced; upgaze also limited. Neck rigidity. Vertical VOR preserved (doll\'s head maneuver). "Surprised stare" expression.',
    lesions: ['rimlf'],
    pearl: "PSP (Steele-Richardson-Olszewski): downgaze saccade loss is the EARLIEST eye finding — patients can't read or walk down stairs. Vertical VOR/pursuit may be preserved (supranuclear). Tau tangles in riMLF/INC. Differentiate from Parkinson's by falls, symmetric rigidity, downgaze palsy.",
  },
  {
    title: 'Left Cavernous Sinus Syndrome — Thrombosis',
    etiology: 'Septic cavernous sinus thrombosis (from facial infection)',
    vignette: '35M with facial furuncle, develops fever, proptosis, and painful complete ophthalmoplegia of the left eye. Left eye cannot move in any direction. Left ptosis, fixed dilated pupil, periorbital edema, V1 numbness.',
    lesions: ['cavsinus_left'],
    pearl: 'Cavernous sinus contains: CN III, IV, V1, V2, VI (and ICA). Syndrome = combined ophthalmoplegia + V1/V2 sensory loss ± Horner (sympathetics). Septic thrombosis: starts with CN VI (most medially located → presses on it first). Aseptic: pituitary apoplexy, meningioma, dural fistula. Proptosis from impaired venous drainage.',
  },
  {
    title: "Wernicke's Encephalopathy",
    etiology: "Thiamine (B1) deficiency — often alcohol use disorder",
    vignette: '45M chronic alcohol use, confusion, ataxia, bilateral horizontal gaze palsy with nystagmus. CN VI palsies bilaterally. Classic triad: encephalopathy + ataxia + ophthalmoplegia. Responds partially to IV thiamine.',
    lesions: ['pprf_left', 'pprf_right'],
    pearl: "Wernicke's: Thiamine-dependent mamillary bodies, periaqueductal gray, PPRF/CN VI nuclei selectively damaged. Eye findings: bilateral CN VI palsies, bilateral gaze palsies, nystagmus. GIVE IV THIAMINE BEFORE GLUCOSE (glucose administration can precipitate acute Wernicke's). Responds to thiamine within hours.",
  },
  {
    title: 'Right FEF Stroke — Frontal Lobe Infarct',
    etiology: 'MCA territory infarct (frontal lobe)',
    vignette: '72F with sudden left hemiplegia. Eyes deviate conjugately to the RIGHT. Unable to make volitional saccades to the left (contralateral to infarct). Reflexive saccades to left may partially recover. Ipsilateral gaze preference.',
    lesions: ['fef_right'],
    pearl: "Frontal lobe (FEF) lesion: \"eyes look TOWARD the lesion\" (ipsilesional deviation). Pathophysiology: right FEF normally drives leftward saccades; when destroyed, the left FEF's rightward drive is unopposed. Contrast with brainstem (PPRF): eyes look AWAY from the lesion. FEF effects often improve; PPRF gaze palsies are more persistent.",
  },
];

function ClinicalPanel({
  lesions, onLoad,
}: {
  lesions: Set<LesionSite>;
  onLoad: (ls: LesionSite[]) => void;
}) {
  const [tab, setTab] = useState<EduTab>('cranial');

  return (
    <div className="ino-clinical">
      <div className="ino-tabs">
        {(['cranial', 'higher', 'cases'] as EduTab[]).map(t => (
          <button key={t}
            className={`ino-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}>
            {t === 'cranial' ? 'CN III/IV/VI' : t === 'higher' ? 'Higher Control' : 'Cases'}
          </button>
        ))}
      </div>
      <div className="ino-clinical-body">
        {tab === 'cranial' && <CranialNerveText />}
        {tab === 'higher'  && <HigherControlText />}
        {tab === 'cases'   && <CaseList cases={CASES} lesions={lesions} onLoad={onLoad} />}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="ino-section-label">{title}</div>
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="ino-para">{children}</p>;
}

function B({ children }: { children: React.ReactNode }) {
  return <p className="ino-para ino-bullet">{children}</p>;
}

function CranialNerveText() {
  return (
    <div className="ino-text-block">
      <Section title="CN III — Oculomotor">
        <P>Nucleus: midbrain at level of superior colliculus. Exits ventrally through red nucleus and cerebral peduncles → passes lateral to PComm artery → cavernous sinus (lateral wall) → superior orbital fissure.</P>
        <P><strong>Muscles innervated:</strong></P>
        <B>• Medial rectus (MR) — adduction</B>
        <B>• Superior rectus (SR) — elevation (+ slight intorsion)</B>
        <B>• Inferior rectus (IR) — depression</B>
        <B>• Inferior oblique (IO) — elevation in adduction + extorsion</B>
        <B>• Levator palpebrae — eyelid elevation</B>
        <B>• Pupillary sphincter + ciliary (parasympathetics, travel on outer surface)</B>
        <P><strong>Complete CN III palsy:</strong> "Down-and-out" (LR + SO unopposed), complete ptosis, fixed dilated pupil.</P>
        <P><strong>Key clinical rule:</strong> Compressive CN III (aneurysm, herniation) → pupil INVOLVED early. Ischemic CN III (diabetes, HTN) → pupil SPARED (central ischemia; parasympathetics on periphery survive).</P>
        <P><strong>Nuclear CN III lesion:</strong> Ipsilateral CN III palsy + bilateral ptosis (single levator subnucleus) + contralateral SR weakness (SR subnucleus crosses).</P>
      </Section>

      <Section title="CN IV — Trochlear">
        <P>Only CN to exit the <em>dorsal</em> brainstem. Fibers decussate in anterior medullary velum before exiting. Longest intracranial course → most susceptible to trauma.</P>
        <P><strong>Muscle:</strong> Superior oblique (SO) — primarily depression in adduction; also incyclotorsion (inward rotation of superior pole of eye).</P>
        <P><strong>Key rule (decussation):</strong></P>
        <B>• CN IV NERVE lesion → ipsilateral SO palsy</B>
        <B>• CN IV NUCLEUS lesion → contralateral SO palsy (fibers cross before exiting)</B>
        <P><strong>SO palsy signs:</strong> Hypertropia of affected eye (worse in contralateral horizontal gaze, worse on ipsilateral head tilt — Bielschowsky test). Excyclotorsion. Patients tilt head toward contralateral shoulder to fuse.</P>
      </Section>

      <Section title="CN VI — Abducens">
        <P>Nucleus in dorsomedial pons (floor of 4th ventricle). Long subarachnoid course — runs over petrous ridge (Dorello's canal).</P>
        <P><strong>Critical distinction:</strong></P>
        <B>• CN VI NERVE lesion → isolated ipsilateral LR palsy (only that eye can't abduct)</B>
        <B>• CN VI NUCLEUS lesion → ipsilateral GAZE PALSY (nucleus contains internuclear neurons that drive the entire ipsilateral gaze system via PPRF)</B>
        <P><strong>Muscle:</strong> Lateral rectus — abduction only.</P>
        <P><strong>False localizing sign:</strong> Raised ICP stretches CN VI over petrous ridge → CN VI palsy without a pontine lesion. Always check for papilledema.</P>
        <P><strong>Gradenigo's syndrome:</strong> Petrous apicitis → CN VI palsy + ipsilateral CN V pain + ipsilateral ear discharge (triad).</P>
      </Section>
    </div>
  );
}

function HigherControlText() {
  return (
    <div className="ino-text-block">
      <Section title="Horizontal Gaze Circuit">
        <P><strong>FEF (Frontal Eye Fields, area 8):</strong> Voluntary/volitional saccades to contralateral hemifield. Projects to contralateral PPRF and superior colliculus. FEF lesion → eyes deviate ipsilateral (toward lesion) — contralateral saccades fail. Often recovers.</P>
        <P><strong>PPRF (Paramedian Pontine Reticular Formation):</strong> Horizontal gaze center in the pons. Right PPRF drives rightward saccades. Projects to ipsilateral CN VI nucleus. Lesion → ipsilateral gaze palsy, eyes deviate contralaterally (away from lesion). More persistent than cortical gaze palsies.</P>
        <P><strong>MLF (Medial Longitudinal Fasciculus):</strong> Paired heavily myelinated tract. Carries signal from CN VI internuclear neurons → crosses midline → ascends to contralateral CN III nucleus (for conjugate adduction). MLF lesion = INO.</P>
      </Section>

      <Section title="Vertical Gaze Circuit">
        <P><strong>riMLF (Rostral Interstitial Nucleus of MLF):</strong> In the midbrain tegmentum. Generates vertical saccades. Bilateral lesion → loss of all vertical saccades (classic in PSP — downgaze first). Pursuits and VOR may be preserved (supranuclear).</P>
        <P><strong>INC (Interstitial Nucleus of Cajal):</strong> Adjacent to riMLF. Integrates vertical gaze-holding; also involved in torsional VOR. Lesion → vertical gaze-evoked nystagmus.</P>
        <P><strong>Posterior Commissure:</strong> Crossed fibers for upgaze. Compression (by pineal tumor, hydrocephalus) → upgaze palsy and Parinaud's syndrome.</P>
      </Section>

      <Section title="Dorsal Midbrain Syndrome (Parinaud's)">
        <P>Compression of posterior commissure / pretectum. Tetrad:</P>
        <B>• Upgaze palsy (supranuclear)</B>
        <B>• Convergence-retraction nystagmus on attempted upgaze</B>
        <B>• Light-near dissociation (pupils react to near but not light)</B>
        <B>• Collier's sign (dorsal lid retraction)</B>
        <P>Causes: pineal gland tumor, midbrain stroke, hydrocephalus (aqueductal compression), MS plaques, vascular malformation.</P>
      </Section>

      <Section title="Eye Movement Types">
        <P><strong>Saccades:</strong> Fast, volitional gaze shifts. Generated by PPRF (horizontal) and riMLF (vertical). FEF and SC provide top-down drive. Most commonly tested and most commonly impaired.</P>
        <P><strong>Smooth Pursuit:</strong> Slow tracking of moving targets. Requires MT/V5, MST, flocculus (cerebellar), NRTP. Lesion → ipsilateral pursuit impaired (ocular drifts back). Often affected in cerebellar disease.</P>
        <P><strong>Vergence:</strong> Convergence/divergence — independent of conjugate gaze. Driven by midbrain near-response system (NOT MLF). Convergence is PRESERVED in INO — a key clinical clue.</P>
        <P><strong>VOR (Vestibulo-Ocular Reflex):</strong> Driven by semicircular canals → vestibular nuclei → CN III/IV/VI. Supranuclear gaze palsies (FEF, PPRF, riMLF) may be overcome by VOR testing (doll's head, caloric). Nuclear/infranuclear palsies are NOT overcome by VOR.</P>
      </Section>

      <Section title="Localizing Rules">
        <B>• Eyes deviate TOWARD a destructive cortical (FEF) lesion</B>
        <B>• Eyes deviate AWAY FROM a destructive brainstem (PPRF/CN VI nuc) lesion</B>
        <B>• Gaze palsy overcome by VOR → supranuclear (cortical/subcortical)</B>
        <B>• Gaze palsy NOT overcome by VOR → nuclear/infranuclear</B>
        <B>• Pupil-involving CN III palsy → compressive (surgical emergency)</B>
        <B>• Pupil-sparing CN III palsy → ischemic (medical Rx, observe)</B>
        <B>• INO: convergence preserved → lesion between CN VI nuc and CN III nuc (MLF)</B>
        <B>• CN VI nuc lesion: gaze palsy (not just LR paresis)</B>
        <B>• CN IV nuc lesion: contralateral SO palsy (decussation)</B>
      </Section>
    </div>
  );
}

function CaseList({ cases, onLoad }: {
  cases: ClinicalCase[];
  lesions: Set<LesionSite>;
  onLoad: (ls: LesionSite[]) => void;
}) {
  return (
    <div className="ino-cases">
      {cases.map((c, i) => (
        <div key={i} className="ino-case-card">
          <div className="ino-case-title">{c.title}</div>
          <div style={{ fontSize: 10, color: 'rgba(100,160,220,0.7)', marginBottom: 6, fontStyle: 'italic' }}>
            {c.etiology}
          </div>
          <p className="ino-para">{c.vignette}</p>
          <div className="ino-pearl">
            <span className="ino-pearl-label">Pearl</span> {c.pearl}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button className="ino-load-btn" onClick={() => onLoad(c.lesions)}>
              Load case
            </button>
            <div style={{ fontSize: 10, color: 'rgba(100,136,170,0.65)', alignSelf: 'center' }}>
              {c.lesions.map(l => SITE_LABELS[l]).join(' + ')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const INOPanel: React.FC = () => {
  const [lesions, setLesions] = useState<Set<LesionSite>>(new Set());

  const toggle = (s: LesionSite) => {
    setLesions(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const loadCase = (ls: LesionSite[]) => setLesions(new Set(ls));
  const clearAll = () => setLesions(new Set());

  const { grid, findings, diagnosis, global } = computeAll(lesions);

  const statusColor = lesions.size === 0 ? '#00d4ff'
    : findings.some(f => f.includes('complete') || f.includes('Parinaud') || f.includes('palsy')) ? '#ff4444'
    : '#f0a040';

  return (
    <div className="ino-root">
      {/* ── Left: H-pattern + findings ── */}
      <section className="panel panel-left ino-left">
        <div className="panel-title">Ocular Motor Exam</div>

        {/* Status */}
        <div className="ino-status" style={{ borderColor: statusColor + '44', color: statusColor }}>
          <span className="ino-status-dot" style={{ background: statusColor }} />
          {diagnosis}
        </div>

        {/* 9-position H-test */}
        <HPatternDisplay grid={grid} />

        {/* Global flags */}
        {(global.lightNear || global.convRetract) && (
          <div style={{ margin: '4px 12px', padding: '5px 10px', borderRadius: 7, background: 'rgba(255,160,0,0.08)', border: '1px solid rgba(255,160,0,0.2)', fontSize: 10, color: '#f0a040' }}>
            {global.lightNear && <div>⚠ Light-near dissociation</div>}
            {global.convRetract && <div>⚠ Convergence-retraction nystagmus on upgaze</div>}
          </div>
        )}

        {/* Findings */}
        {findings.length > 0 && (
          <div style={{ margin: '6px 12px', flexShrink: 0 }}>
            <div className="ino-control-label">Clinical Findings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {findings.map((f, i) => (
                <div key={i} style={{
                  fontSize: 10, color: 'rgba(200,220,255,0.75)',
                  padding: '4px 8px', borderRadius: 6,
                  background: 'rgba(15,30,60,0.7)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  lineHeight: 1.5,
                }}>
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active lesion badges */}
        {lesions.size > 0 && (
          <div style={{ margin: '6px 12px', flexShrink: 0 }}>
            <div className="ino-control-label">Active Lesions</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {[...lesions].map(s => (
                <button key={s}
                  onClick={() => toggle(s)}
                  style={{
                    fontSize: 9, padding: '3px 8px', borderRadius: 12,
                    background: 'rgba(200,30,30,0.15)', border: '1px solid rgba(255,60,60,0.35)',
                    color: '#ff8888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                  ✕ {SITE_LABELS[s]}
                </button>
              ))}
            </div>
            <button
              onClick={clearAll}
              style={{
                marginTop: 6, fontSize: 10, padding: '4px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(180,200,240,0.6)', cursor: 'pointer', width: '100%',
              }}>
              Clear all lesions
            </button>
          </div>
        )}

        {lesions.size === 0 && (
          <div className="ino-tip">
            Click any structure in the diagram to place a lesion. Multiple lesions can be active simultaneously.
          </div>
        )}
      </section>

      {/* ── Center: circuit SVG ── */}
      <section className="panel panel-center ino-center">
        <CircuitSVG lesions={lesions} onToggle={toggle} />
      </section>

      {/* ── Right: clinical education ── */}
      <section className="panel panel-right ino-right">
        <div className="panel-title">Pathways &amp; Clinical Cases</div>
        <ClinicalPanel lesions={lesions} onLoad={loadCase} />
      </section>
    </div>
  );
};

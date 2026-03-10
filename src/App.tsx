// ============================================================
// App — main layout, state, and bidirectional interaction wiring
// ============================================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Lesion, AppMode, VFHoverState, StructureId } from './types';
import type { ClinicalCase } from './types';
import { PathwayPanel } from './components/PathwayPanel';
import { VisualFieldPanel } from './components/VisualFieldPanel';
import { ReasoningPanel } from './components/ReasoningPanel';
import { computeVisualField, computeDeficitSummary } from './engine/lesionEngine';
import { hitTestStructure } from './engine/pathwayModel';
import { traceFiber, getStructureVFRegion } from './engine/fiberTracer';
import type { FiberTrace } from './engine/fiberTracer';

// Which structures get highlighted as the "affected chain" when a lesion is placed
const PATHWAY_CHAINS: Record<StructureId, StructureId[]> = {
  left_eye:                ['left_eye', 'left_optic_nerve'],
  right_eye:               ['right_eye', 'right_optic_nerve'],
  left_optic_nerve:        ['left_optic_nerve', 'left_eye'],
  right_optic_nerve:       ['right_optic_nerve', 'right_eye'],
  chiasm:                  ['chiasm'],
  left_optic_tract:        ['left_optic_tract'],
  right_optic_tract:       ['right_optic_tract'],
  left_lgn:                ['left_lgn'],
  right_lgn:               ['right_lgn'],
  left_meyers_loop:        ['left_meyers_loop'],
  right_meyers_loop:       ['right_meyers_loop'],
  left_parietal_radiation: ['left_parietal_radiation'],
  right_parietal_radiation:['right_parietal_radiation'],
  left_occipital:          ['left_occipital'],
  right_occipital:         ['right_occipital'],
};

// ── URL state codec ──────────────────────────────────────────

function lesionToHash(l: Lesion | null): string {
  if (!l) return '';
  const parts = [
    `x=${Math.round(l.position.x)}`,
    `y=${Math.round(l.position.y)}`,
    `r=${Math.round(l.radius)}`,
    l.structure ? `s=${l.structure}` : '',
    l.partialY !== undefined ? `py=${l.partialY.toFixed(2)}` : '',
  ].filter(Boolean);
  return '#' + parts.join('&');
}

function hashToLesion(): Lesion | null {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  const params = Object.fromEntries(hash.split('&').map(p => p.split('=')));
  if (!params.x || !params.y) return null;
  return {
    position: { x: Number(params.x), y: Number(params.y) },
    radius: Number(params.r ?? 22),
    structure: (params.s as StructureId) ?? null,
    partialY: params.py !== undefined ? Number(params.py) : 0.5,
  };
}

export const App: React.FC = () => {
  // ── Core state ───────────────────────────────────────────
  const [lesion, setLesion] = useState<Lesion | null>(() => hashToLesion());
  const [mode, setMode] = useState<AppMode>('explore');
  const [activeCase, setActiveCase] = useState<ClinicalCase | null>(null);

  // ── Hover state (bidirectional fiber tracing) ────────────
  const [vfHover, setVFHover]     = useState<VFHoverState>({ vfPoint: null, eye: null });
  const [pathHover, setPathHover] = useState<StructureId | null>(null);

  // ── Derived values ───────────────────────────────────────
  const vfResult = useMemo(() => computeVisualField(lesion), [lesion]);
  const summary  = useMemo(() => computeDeficitSummary(lesion), [lesion]);

  const highlightedStructures = useMemo((): StructureId[] => {
    if (!lesion?.structure) return [];
    return PATHWAY_CHAINS[lesion.structure] ?? [];
  }, [lesion?.structure]);

  // ── Fiber trace: VF hover → pathway glow ─────────────────
  // When the user hovers a point in the visual field canvas, compute
  // the full fiber trace for that VF coordinate and pass it to the
  // pathway panel, which renders glowing dots at each structure.
  const fiberTrace = useMemo((): FiberTrace | null => {
    if (!vfHover.vfPoint) return null;
    const { vfx, vfy } = vfHover.vfPoint;
    if (vfx * vfx + vfy * vfy > 1.02) return null;
    return traceFiber(vfx, vfy);
  }, [vfHover.vfPoint]);

  // ── Reverse: pathway hover → VF glow ─────────────────────
  // When the user hovers a structure in the pathway, highlight the
  // corresponding visual field region in the perimetry canvases.
  const hoveredStructureRegion = useMemo(() => {
    if (!pathHover) return null;
    return getStructureVFRegion(pathHover);
  }, [pathHover]);

  // ── URL state sync ───────────────────────────────────────
  useEffect(() => {
    const newHash = lesionToHash(lesion);
    if (newHash !== window.location.hash) {
      history.replaceState(null, '', newHash || window.location.pathname);
    }
  }, [lesion]);

  // Sync URL → state on hash change (for shared links)
  useEffect(() => {
    const handler = () => {
      const l = hashToLesion();
      if (l) setLesion(l);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // ── Handlers ─────────────────────────────────────────────
  const handleLesionChange = useCallback((l: Lesion | null) => {
    setLesion(l);
    setActiveCase(null);
  }, []);

  const handleClearLesion = useCallback(() => {
    setLesion(null);
    setActiveCase(null);
    history.replaceState(null, '', window.location.pathname);
  }, []);

  const handleCaseSelect = useCallback((c: ClinicalCase | null) => {
    if (!c) { setActiveCase(null); setLesion(null); return; }
    setActiveCase(c);
    setMode('diagnostic');
    const structure = hitTestStructure(c.lesionPosition, c.lesionRadius);
    setLesion({ position: c.lesionPosition, radius: c.lesionRadius, structure, partialY: 0.35 });
  }, []);

  const handleVFHover = useCallback((state: VFHoverState) => {
    setVFHover(state);
  }, []);

  const copyShareLink = () => {
    navigator.clipboard?.writeText(window.location.href)
      .then(() => alert('Link copied! Share this URL to show this exact lesion.'))
      .catch(() => alert(window.location.href));
  };

  return (
    <div className="app">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo">VizFields</div>
          <div className="logo-sub">Visual Pathway Simulator</div>
        </div>

        <div className="header-center">
          {summary.structure && (
            <div className="header-deficit">
              <span className="header-deficit-dot" />
              {summary.pattern}
              {summary.macula === 'spared' && (
                <span className="header-macular"> · macular sparing</span>
              )}
            </div>
          )}
          {vfHover.vfPoint && (
            <div className="header-trace-hint">
              Tracing fiber from {vfHover.eye?.toUpperCase()} eye →
              {' '}{fiberTrace?.hemisphere === 'right' ? 'right hemisphere' : fiberTrace?.hemisphere === 'left' ? 'left hemisphere' : 'both hemispheres'}
            </div>
          )}
        </div>

        <div className="header-right">
          {lesion && (
            <button className="share-btn" onClick={copyShareLink} title="Copy shareable link">
              Share
            </button>
          )}
        </div>
      </header>

      {/* ── Three panels ─────────────────────────────────────── */}
      <main className="app-main">
        <section className="panel panel-left">
          <VisualFieldPanel
            vfResult={vfResult}
            onHover={handleVFHover}
            hoveredStructureRegion={hoveredStructureRegion}
          />
        </section>

        <section className="panel panel-center">
          <PathwayPanel
            lesion={lesion}
            onLesionChange={handleLesionChange}
            highlightedStructures={highlightedStructures}
            fiberTrace={fiberTrace}
            vfHover={vfHover}
          />
        </section>

        <section className="panel panel-right">
          <ReasoningPanel
            summary={summary}
            lesion={lesion}
            mode={mode}
            onModeChange={setMode}
            onCaseSelect={handleCaseSelect}
            onClearLesion={handleClearLesion}
            activeCase={activeCase}
          />
        </section>
      </main>

      <footer className="app-footer">
        <span>VizFields — Interactive Visual Pathway Simulator</span>
        <span className="footer-sep">|</span>
        <span>Hover visual field to trace fiber · Drag lesion edge to resize</span>
        <span className="footer-sep">|</span>
        <span>For education only</span>
      </footer>
    </div>
  );
};

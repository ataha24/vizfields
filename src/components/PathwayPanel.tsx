// ============================================================
// PathwayPanel — SVG anatomical diagram with:
//   • Lesion placement (click + drag)
//   • Lesion radius handle (drag the edge ring)
//   • Fiber trace overlay (glowing dots at structure positions)
//   • Structure hover highlighting
// ============================================================

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { Lesion, StructureId, VFHoverState } from '../types';
import type { FiberTrace } from '../engine/fiberTracer';
import {
  STRUCTURES, SVG_WIDTH, SVG_HEIGHT,
  hitTestStructure, getOccipitalPartialY,
  X_LEFT, X_RIGHT,
  Y_EYES, Y_CHIASM, Y_LGN, Y_RAD_MID, Y_CORTEX,
} from '../engine/pathwayModel';

interface Props {
  lesion: Lesion | null;
  onLesionChange: (l: Lesion | null) => void;
  highlightedStructures: StructureId[];
  fiberTrace: FiberTrace | null;   // from hovering a VF point
  vfHover: VFHoverState;
}

const MIN_R = 8;
const MAX_R = 60;
const HANDLE_HIT_R = 16; // generous hit radius in SVG units for the resize ring

export const PathwayPanel: React.FC<Props> = ({
  lesion, onLesionChange, highlightedStructures, fiberTrace, vfHover,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragMode, setDragMode] = useState<'lesion' | 'radius' | null>(null);
  const [hoverStruct, setHoverStruct] = useState<StructureId | null>(null);
  const [animFrame, setAnimFrame] = useState(0);
  // SVG-space cursor position (null = cursor outside the SVG)
  const [svgCursor, setSvgCursor] = useState<{ x: number; y: number } | null>(null);

  // Pulse animation for fiber trace dots
  useEffect(() => {
    if (!fiberTrace) return;
    let raf: number;
    const tick = () => { setAnimFrame(f => f + 1); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fiberTrace]);

  /**
   * THE CORRECT way to convert client coords → SVG coords.
   * getScreenCTM().inverse() accounts for:
   *   - SVG viewBox scaling
   *   - preserveAspectRatio letterboxing (the main bug source)
   *   - CSS transforms on the element or any ancestor
   *   - border / padding
   */
  const clientToSVG = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  // Stable refs so the global drag listener never needs to re-attach
  const lesionRef      = useRef(lesion);
  const dragModeRef    = useRef(dragMode);
  const onChangeRef    = useRef(onLesionChange);
  lesionRef.current    = lesion;
  dragModeRef.current  = dragMode;
  onChangeRef.current  = onLesionChange;

  const isNearHandle = useCallback((p: { x: number; y: number }): boolean => {
    if (!lesion) return false;
    const d = Math.hypot(p.x - lesion.position.x, p.y - lesion.position.y);
    return Math.abs(d - lesion.radius) < HANDLE_HIT_R;
  }, [lesion]);

  const isOnLesion = useCallback((p: { x: number; y: number }): boolean => {
    if (!lesion) return false;
    return Math.hypot(p.x - lesion.position.x, p.y - lesion.position.y) < lesion.radius - 4;
  }, [lesion]);

  const applyLesion = useCallback((p: { x: number; y: number }, keepRadius?: number) => {
    const cur = lesionRef.current;
    const r = keepRadius ?? cur?.radius ?? 22;
    const structure = hitTestStructure(p, r);
    let partialY = cur?.partialY ?? 0.5;
    if (structure === 'left_occipital' || structure === 'right_occipital') {
      partialY = getOccipitalPartialY(p, structure === 'left_occipital' ? 'left' : 'right');
    }
    onChangeRef.current({ position: p, radius: r, structure, partialY });
  }, []);

  // ── Global pointer listeners — attached once on mount ───────
  // Using refs means we never remove+re-add listeners during drag,
  // eliminating the micro-gaps that caused missed events.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const mode = dragModeRef.current;
      if (!mode) return;
      const p = clientToSVG(e.clientX, e.clientY);
      if (!p) return;
      setSvgCursor(p);

      const cur = lesionRef.current;
      if (mode === 'lesion') {
        applyLesion(p, cur?.radius);
      } else if (mode === 'radius' && cur) {
        const d = Math.hypot(p.x - cur.position.x, p.y - cur.position.y);
        const r = Math.max(MIN_R, Math.min(MAX_R, d));
        const structure = hitTestStructure(cur.position, r);
        let partialY = cur.partialY ?? 0.5;
        if (structure === 'left_occipital' || structure === 'right_occipital') {
          partialY = getOccipitalPartialY(cur.position, structure === 'left_occipital' ? 'left' : 'right');
        }
        onChangeRef.current({ ...cur, radius: r, structure, partialY });
      }
    };

    const onUp = () => {
      if (dragModeRef.current) setDragMode(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientToSVG, applyLesion]); // stable refs — only changes if SVG mounts/unmounts

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const p = clientToSVG(e.clientX, e.clientY);
    if (!p) return;
    if (isNearHandle(p)) {
      setDragMode('radius');
    } else {
      setDragMode('lesion');
      applyLesion(p);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode) return; // handled by global listeners above
    const p = clientToSVG(e.clientX, e.clientY);
    if (!p) return;
    setSvgCursor(p);
    setHoverStruct(hitTestStructure(p, 8));
  };

  const handlePointerLeave = () => {
    setSvgCursor(null);
    setHoverStruct(null);
  };

  // Cursor mode for the custom SVG crosshair
  const cursorMode: 'resize' | 'move' | 'place' =
    dragMode === 'radius' ? 'resize' :
    (svgCursor && isNearHandle(svgCursor)) ? 'resize' :
    (svgCursor && isOnLesion(svgCursor)) ? 'move' :
    'place';

  // Color helpers
  const sColor = (id: StructureId) => {
    if (lesion?.structure === id) return '#ff4444';
    if (highlightedStructures.includes(id)) return '#44aaff';
    if (hoverStruct === id) return '#55ccee';
    return STRUCTURES.find(s => s.id === id)?.baseColor ?? '#1e4a72';
  };

  const isActive = (id: StructureId) => lesion?.structure === id || highlightedStructures.includes(id);

  // Fiber trace dot pulse (0→1 oscillation)
  const pulse = fiberTrace ? 0.55 + 0.45 * Math.sin(animFrame * 0.07) : 0;

  // ── Radiation paths ───────────────────────────────────────
  const lMeyPath = `M ${X_LEFT} ${Y_LGN + 18}
    C ${X_LEFT - 20} ${Y_LGN + 52}, ${X_LEFT - 56} ${Y_RAD_MID - 20}, ${X_LEFT - 47} ${Y_RAD_MID + 10}
    C ${X_LEFT - 40} ${Y_RAD_MID + 40}, ${X_LEFT - 16} ${Y_CORTEX - 22}, ${X_LEFT + 14} ${Y_CORTEX}`;
  const rMeyPath = `M ${X_RIGHT} ${Y_LGN + 18}
    C ${X_RIGHT + 20} ${Y_LGN + 52}, ${X_RIGHT + 56} ${Y_RAD_MID - 20}, ${X_RIGHT + 47} ${Y_RAD_MID + 10}
    C ${X_RIGHT + 40} ${Y_RAD_MID + 40}, ${X_RIGHT + 16} ${Y_CORTEX - 22}, ${X_RIGHT - 14} ${Y_CORTEX}`;
  const lParPath = `M ${X_LEFT} ${Y_LGN + 18}
    C ${X_LEFT + 16} ${Y_LGN + 62}, ${X_LEFT + 46} ${Y_RAD_MID}, ${X_LEFT + 55} ${Y_CORTEX}`;
  const rParPath = `M ${X_RIGHT} ${Y_LGN + 18}
    C ${X_RIGHT - 16} ${Y_LGN + 62}, ${X_RIGHT - 46} ${Y_RAD_MID}, ${X_RIGHT - 55} ${Y_CORTEX}`;

  return (
    <div className="pathway-panel">
      <div className="panel-title">Visual Pathway — click to place lesion · drag edge to resize</div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="pathway-svg"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ cursor: 'none' }}
      >
        <defs>
          <filter id="glow-red" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-str" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-trace" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="bg-grad" cx="50%" cy="18%" r="75%">
            <stop offset="0%" stopColor="#0d1830"/>
            <stop offset="100%" stopColor="#050a14"/>
          </radialGradient>
        </defs>

        <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#bg-grad)" rx="12"/>

        {/* Side labels */}
        <text x="22" y="22" fill="#1e3050" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="700">LEFT</text>
        <text x={SVG_WIDTH - 22} y="22" fill="#1e3050" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="700" textAnchor="end">RIGHT</text>

        {/* ── Fibers (background) ─────────────────────────────── */}
        {/* Optic nerve fibers */}
        {[-7, -2, 3, 8].map(o => (
          <path key={`lon${o}`}
            d={`M ${X_LEFT + o} ${Y_EYES + 28} C ${X_LEFT + o * 0.3} ${Y_EYES + 80}, ${X_LEFT + 58} ${Y_CHIASM - 65}, ${X_LEFT + 62} ${Y_CHIASM - 28}`}
            stroke={isActive('left_optic_nerve') ? '#ff5555' : '#15304a'} strokeWidth="1.4" fill="none" opacity="0.75"/>
        ))}
        {[-7, -2, 3, 8].map(o => (
          <path key={`ron${o}`}
            d={`M ${X_RIGHT + o} ${Y_EYES + 28} C ${X_RIGHT + o * 0.3} ${Y_EYES + 80}, ${X_RIGHT - 58} ${Y_CHIASM - 65}, ${X_RIGHT - 62} ${Y_CHIASM - 28}`}
            stroke={isActive('right_optic_nerve') ? '#ff5555' : '#15304a'} strokeWidth="1.4" fill="none" opacity="0.75"/>
        ))}

        {/* Chiasm crossing */}
        <path d={`M ${X_LEFT + 55} ${Y_CHIASM - 20} Q 190 ${Y_CHIASM + 8} ${X_RIGHT - 55} ${Y_CHIASM + 20}`}
          stroke={isActive('chiasm') ? '#ff8844' : '#1e5540'} strokeWidth="2.2" fill="none" opacity="0.85"/>
        <path d={`M ${X_RIGHT - 55} ${Y_CHIASM - 20} Q 190 ${Y_CHIASM + 8} ${X_LEFT + 55} ${Y_CHIASM + 20}`}
          stroke={isActive('chiasm') ? '#ff8844' : '#1e5540'} strokeWidth="2.2" fill="none" opacity="0.85"/>

        {/* Optic tracts */}
        {[-5, 0, 5].map(o => (
          <path key={`lot${o}`}
            d={`M ${X_LEFT + 55} ${Y_CHIASM + 28 + o * 0.4} C ${X_LEFT + 40} ${Y_CHIASM + 58}, ${X_LEFT + 10} ${Y_LGN - 36}, ${X_LEFT - 8} ${Y_LGN - 18}`}
            stroke={isActive('left_optic_tract') ? '#ff5555' : '#15304a'} strokeWidth="1.6" fill="none" opacity="0.75"/>
        ))}
        {[-5, 0, 5].map(o => (
          <path key={`rot${o}`}
            d={`M ${X_RIGHT - 55} ${Y_CHIASM + 28 + o * 0.4} C ${X_RIGHT - 40} ${Y_CHIASM + 58}, ${X_RIGHT - 10} ${Y_LGN - 36}, ${X_RIGHT + 8} ${Y_LGN - 18}`}
            stroke={isActive('right_optic_tract') ? '#ff5555' : '#15304a'} strokeWidth="1.6" fill="none" opacity="0.75"/>
        ))}

        {/* Radiations */}
        {[-4, 0, 4].map(o => (<path key={`lml${o}`} d={`M ${X_LEFT + o} ${Y_LGN + 18} C ${X_LEFT - 20 + o} ${Y_LGN + 52}, ${X_LEFT - 56} ${Y_RAD_MID - 20}, ${X_LEFT - 47} ${Y_RAD_MID + 10} C ${X_LEFT - 40} ${Y_RAD_MID + 40}, ${X_LEFT - 16} ${Y_CORTEX - 22}, ${X_LEFT + 14 + o} ${Y_CORTEX}`}
          stroke={isActive('left_meyers_loop') ? '#ff5555' : '#12263f'} strokeWidth="1.4" fill="none" opacity="0.75"/>))}
        {[-4, 0, 4].map(o => (<path key={`rml${o}`} d={`M ${X_RIGHT + o} ${Y_LGN + 18} C ${X_RIGHT + 20 + o} ${Y_LGN + 52}, ${X_RIGHT + 56} ${Y_RAD_MID - 20}, ${X_RIGHT + 47} ${Y_RAD_MID + 10} C ${X_RIGHT + 40} ${Y_RAD_MID + 40}, ${X_RIGHT + 16} ${Y_CORTEX - 22}, ${X_RIGHT - 14 + o} ${Y_CORTEX}`}
          stroke={isActive('right_meyers_loop') ? '#ff5555' : '#12263f'} strokeWidth="1.4" fill="none" opacity="0.75"/>))}
        {[-4, 0, 4].map(o => (<path key={`lpr${o}`} d={`M ${X_LEFT + o} ${Y_LGN + 18} C ${X_LEFT + 16} ${Y_LGN + 62}, ${X_LEFT + 46} ${Y_RAD_MID}, ${X_LEFT + 55 + o} ${Y_CORTEX}`}
          stroke={isActive('left_parietal_radiation') ? '#ff5555' : '#12263f'} strokeWidth="1.4" fill="none" opacity="0.75"/>))}
        {[-4, 0, 4].map(o => (<path key={`rpr${o}`} d={`M ${X_RIGHT + o} ${Y_LGN + 18} C ${X_RIGHT - 16} ${Y_LGN + 62}, ${X_RIGHT - 46} ${Y_RAD_MID}, ${X_RIGHT - 55 + o} ${Y_CORTEX}`}
          stroke={isActive('right_parietal_radiation') ? '#ff5555' : '#12263f'} strokeWidth="1.4" fill="none" opacity="0.75"/>))}

        {/* ── Structures ─────────────────────────────────────── */}

        {/* Eyes */}
        {(['left_eye', 'right_eye'] as StructureId[]).map(id => {
          const cx = id === 'left_eye' ? X_LEFT : X_RIGHT;
          return (
            <g key={id} filter={isActive(id) ? 'url(#glow-str)' : undefined}>
              <circle cx={cx} cy={Y_EYES} r={28} fill={sColor(id)} stroke="#44aadd" strokeWidth="2"/>
              <circle cx={cx} cy={Y_EYES} r={16} fill="#0a1020"/>
              <circle cx={cx} cy={Y_EYES} r={10} fill={sColor(id)} fillOpacity="0.5"/>
              <circle cx={cx - 4} cy={Y_EYES - 4} r={3} fill="white" fillOpacity="0.8"/>
              <text x={cx} y={Y_EYES + 2} fill="#88ccff" fontSize="8" fontFamily="Inter,sans-serif"
                textAnchor="middle" dominantBaseline="middle" fontWeight="600">
                {id === 'left_eye' ? 'OS' : 'OD'}
              </text>
            </g>
          );
        })}

        {/* Optic nerve tubes */}
        <path d={`M ${X_LEFT - 8} ${Y_EYES + 26} C ${X_LEFT - 5} ${Y_CHIASM - 60}, ${X_LEFT + 52} ${Y_CHIASM - 55}, ${X_LEFT + 68} ${Y_CHIASM - 30} L ${X_LEFT + 52} ${Y_CHIASM - 28} C ${X_LEFT + 38} ${Y_CHIASM - 50}, ${X_LEFT + 5} ${Y_CHIASM - 55}, ${X_LEFT + 8} ${Y_EYES + 26} Z`}
          fill={sColor('left_optic_nerve')} stroke="#2a6090" strokeWidth="1.5"
          filter={isActive('left_optic_nerve') ? 'url(#glow-str)' : undefined}/>
        <path d={`M ${X_RIGHT + 8} ${Y_EYES + 26} C ${X_RIGHT + 5} ${Y_CHIASM - 60}, ${X_RIGHT - 52} ${Y_CHIASM - 55}, ${X_RIGHT - 68} ${Y_CHIASM - 30} L ${X_RIGHT - 52} ${Y_CHIASM - 28} C ${X_RIGHT - 38} ${Y_CHIASM - 50}, ${X_RIGHT - 5} ${Y_CHIASM - 55}, ${X_RIGHT - 8} ${Y_EYES + 26} Z`}
          fill={sColor('right_optic_nerve')} stroke="#2a6090" strokeWidth="1.5"
          filter={isActive('right_optic_nerve') ? 'url(#glow-str)' : undefined}/>
        <text x={X_LEFT + 22} y={Y_EYES + 80} fill="#2a4a6a" fontSize="8.5" fontFamily="Inter,sans-serif" textAnchor="middle">Optic n.</text>
        <text x={X_RIGHT - 22} y={Y_EYES + 80} fill="#2a4a6a" fontSize="8.5" fontFamily="Inter,sans-serif" textAnchor="middle">Optic n.</text>

        {/* Chiasm */}
        <ellipse cx={190} cy={Y_CHIASM} rx={78} ry={28}
          fill={sColor('chiasm')} stroke="#33aa88" strokeWidth="2"
          filter={isActive('chiasm') ? 'url(#glow-str)' : undefined}/>
        <text x={190} y={Y_CHIASM + 1} fill="#66ddbb" fontSize="10" fontFamily="Inter,sans-serif"
          textAnchor="middle" dominantBaseline="middle" fontWeight="700">Optic Chiasm</text>

        {/* Optic tracts */}
        <path d={`M ${X_LEFT + 52} ${Y_CHIASM + 30} C ${X_LEFT + 42} ${Y_CHIASM + 55}, ${X_LEFT + 12} ${Y_LGN - 38}, ${X_LEFT - 8} ${Y_LGN - 18} L ${X_LEFT + 8} ${Y_LGN - 18} C ${X_LEFT + 22} ${Y_LGN - 34}, ${X_LEFT + 52} ${Y_CHIASM + 50}, ${X_LEFT + 68} ${Y_CHIASM + 30} Z`}
          fill={sColor('left_optic_tract')} stroke="#2a6090" strokeWidth="1.5"
          filter={isActive('left_optic_tract') ? 'url(#glow-str)' : undefined}/>
        <path d={`M ${X_RIGHT - 52} ${Y_CHIASM + 30} C ${X_RIGHT - 42} ${Y_CHIASM + 55}, ${X_RIGHT - 12} ${Y_LGN - 38}, ${X_RIGHT + 8} ${Y_LGN - 18} L ${X_RIGHT - 8} ${Y_LGN - 18} C ${X_RIGHT - 22} ${Y_LGN - 34}, ${X_RIGHT - 52} ${Y_CHIASM + 50}, ${X_RIGHT - 68} ${Y_CHIASM + 30} Z`}
          fill={sColor('right_optic_tract')} stroke="#2a6090" strokeWidth="1.5"
          filter={isActive('right_optic_tract') ? 'url(#glow-str)' : undefined}/>
        <text x={X_LEFT - 12} y={Y_CHIASM + 62} fill="#2a4a6a" fontSize="8.5" fontFamily="Inter,sans-serif" textAnchor="middle">Optic tract</text>
        <text x={X_RIGHT + 12} y={Y_CHIASM + 62} fill="#2a4a6a" fontSize="8.5" fontFamily="Inter,sans-serif" textAnchor="middle">Optic tract</text>

        {/* LGN */}
        {(['left_lgn', 'right_lgn'] as StructureId[]).map(id => {
          const cx = id === 'left_lgn' ? X_LEFT : X_RIGHT;
          return (
            <g key={id} filter={isActive(id) ? 'url(#glow-str)' : undefined}>
              <circle cx={cx} cy={Y_LGN} r={18} fill={sColor(id)} stroke="#6644aa" strokeWidth="2"/>
              <text x={cx} y={Y_LGN + 1} fill="#bb99ff" fontSize="8.5" fontFamily="Inter,sans-serif"
                textAnchor="middle" dominantBaseline="middle" fontWeight="700">LGN</text>
            </g>
          );
        })}

        {/* Meyer's loop regions */}
        <path d={lMeyPath} stroke={sColor('left_meyers_loop')} strokeWidth="15" fill="none"
          strokeOpacity="0.6" strokeLinecap="round" filter={isActive('left_meyers_loop') ? 'url(#glow-str)' : undefined}/>
        <path d={lMeyPath} stroke="#88aadd" strokeWidth="1.5" fill="none" strokeOpacity="0.35"/>
        <path d={rMeyPath} stroke={sColor('right_meyers_loop')} strokeWidth="15" fill="none"
          strokeOpacity="0.6" strokeLinecap="round" filter={isActive('right_meyers_loop') ? 'url(#glow-str)' : undefined}/>
        <path d={rMeyPath} stroke="#88aadd" strokeWidth="1.5" fill="none" strokeOpacity="0.35"/>

        {/* Parietal radiation regions */}
        <path d={lParPath} stroke={sColor('left_parietal_radiation')} strokeWidth="15" fill="none"
          strokeOpacity="0.6" strokeLinecap="round" filter={isActive('left_parietal_radiation') ? 'url(#glow-str)' : undefined}/>
        <path d={lParPath} stroke="#88aadd" strokeWidth="1.5" fill="none" strokeOpacity="0.35"/>
        <path d={rParPath} stroke={sColor('right_parietal_radiation')} strokeWidth="15" fill="none"
          strokeOpacity="0.6" strokeLinecap="round" filter={isActive('right_parietal_radiation') ? 'url(#glow-str)' : undefined}/>
        <path d={rParPath} stroke="#88aadd" strokeWidth="1.5" fill="none" strokeOpacity="0.35"/>

        {/* Radiation labels */}
        {[
          { x: X_LEFT - 44, y: Y_RAD_MID, label: "Meyer's" },
          { x: X_RIGHT + 44, y: Y_RAD_MID, label: "Meyer's" },
          { x: X_LEFT + 44, y: Y_RAD_MID, label: 'Parietal' },
          { x: X_RIGHT - 44, y: Y_RAD_MID, label: 'Parietal' },
        ].map((l, i) => (
          <text key={i} x={l.x} y={l.y + 4} fill="#2a3a5a" fontSize="8" fontFamily="Inter,sans-serif" textAnchor="middle">{l.label}</text>
        ))}

        {/* Occipital cortex */}
        <rect x={42} y={Y_CORTEX} width={110} height={70} rx={8}
          fill={sColor('left_occipital')} stroke="#336633" strokeWidth="2"
          filter={isActive('left_occipital') ? 'url(#glow-str)' : undefined}/>
        <text x={97} y={Y_CORTEX + 20} fill="#66aa66" fontSize="9" fontFamily="Inter,sans-serif" textAnchor="middle" fontWeight="700">Left V1</text>
        <text x={97} y={Y_CORTEX + 34} fill="#446644" fontSize="8" fontFamily="Inter,sans-serif" textAnchor="middle">Calcarine</text>
        <line x1={42} y1={Y_CORTEX + 36} x2={152} y2={Y_CORTEX + 36} stroke="#225522" strokeWidth="0.8" strokeDasharray="3,3"/>
        <text x={156} y={Y_CORTEX + 39} fill="#2a4a2a" fontSize="7" fontFamily="Inter,sans-serif">mac.</text>

        <rect x={228} y={Y_CORTEX} width={110} height={70} rx={8}
          fill={sColor('right_occipital')} stroke="#336633" strokeWidth="2"
          filter={isActive('right_occipital') ? 'url(#glow-str)' : undefined}/>
        <text x={283} y={Y_CORTEX + 20} fill="#66aa66" fontSize="9" fontFamily="Inter,sans-serif" textAnchor="middle" fontWeight="700">Right V1</text>
        <text x={283} y={Y_CORTEX + 34} fill="#446644" fontSize="8" fontFamily="Inter,sans-serif" textAnchor="middle">Calcarine</text>
        <line x1={228} y1={Y_CORTEX + 36} x2={338} y2={Y_CORTEX + 36} stroke="#225522" strokeWidth="0.8" strokeDasharray="3,3"/>
        <text x={224} y={Y_CORTEX + 39} fill="#2a4a2a" fontSize="7" fontFamily="Inter,sans-serif" textAnchor="end">mac.</text>
        <text x={97}  y={Y_CORTEX + 80} fill="#2a4060" fontSize="8" fontFamily="Inter,sans-serif" textAnchor="middle">↑ post · ant ↓</text>
        <text x={283} y={Y_CORTEX + 80} fill="#2a4060" fontSize="8" fontFamily="Inter,sans-serif" textAnchor="middle">↑ post · ant ↓</text>

        {/* ── Hover tooltip ──────────────────────────────────── */}
        {hoverStruct && !dragMode && (() => {
          const s = STRUCTURES.find(st => st.id === hoverStruct);
          if (!s) return null;
          const shape = s.shape;
          let tx = 190, ty = 32;
          if (shape.kind === 'circle')  { tx = shape.cx; ty = shape.cy - shape.r - 16; }
          if (shape.kind === 'ellipse') { tx = shape.cx; ty = shape.cy - shape.ry - 14; }
          if (shape.kind === 'rect')    { tx = shape.x + shape.w / 2; ty = shape.y - 12; }
          if (shape.kind === 'capsule') { tx = (shape.x1 + shape.x2) / 2; ty = Math.min(shape.y1, shape.y2) - 18; }
          const cx = Math.max(80, Math.min(SVG_WIDTH - 80, tx));
          return (
            <g>
              <rect x={cx - 90} y={ty - 18} width={180} height={24} rx={5}
                fill="#0a1428" stroke="#2244aa" strokeWidth="0.8" fillOpacity="0.94"/>
              <text x={cx} y={ty - 3} fill="#88bbff" fontSize="9" fontFamily="Inter,sans-serif"
                textAnchor="middle">{s.tooltip}</text>
            </g>
          );
        })()}

        {/* ── Fiber Trace Overlay ────────────────────────────── */}
        {fiberTrace && (
          <g className="fiber-trace">
            {/* Connecting polyline */}
            {fiberTrace.polyline.length > 1 && (
              <polyline
                points={fiberTrace.polyline.map(p => `${p.x},${p.y}`).join(' ')}
                stroke="rgba(0, 220, 255, 0.18)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4,5"
              />
            )}
            {/* Glowing dots at each structure */}
            {Object.entries(fiberTrace.positions).map(([id, pos]) => {
              if (!pos) return null;
              const r = 6 + pulse * 3;
              const opacity = 0.65 + pulse * 0.35;
              return (
                <g key={id} filter="url(#glow-trace)">
                  {/* Outer ring */}
                  <circle cx={pos.x} cy={pos.y} r={r + 5}
                    fill="none" stroke="rgba(0,210,255,0.25)" strokeWidth="1.5"/>
                  {/* Inner dot */}
                  <circle cx={pos.x} cy={pos.y} r={r}
                    fill={`rgba(0, 220, 255, ${opacity})`}
                    stroke="rgba(100, 240, 255, 0.9)" strokeWidth="1.2"/>
                  {/* Core */}
                  <circle cx={pos.x} cy={pos.y} r={3}
                    fill="white" fillOpacity="0.9"/>
                </g>
              );
            })}
          </g>
        )}

        {/* ── Lesion ─────────────────────────────────────────── */}
        {lesion && (
          <g>
            {/* Radius handle ring (draggable) */}
            <circle cx={lesion.position.x} cy={lesion.position.y} r={lesion.radius + 12}
              fill="none" stroke="rgba(255,80,30,0.10)" strokeWidth="1"/>
            <circle cx={lesion.position.x} cy={lesion.position.y} r={lesion.radius + 6}
              fill="none" stroke="rgba(255,80,30,0.20)" strokeWidth="1.5"
              strokeDasharray="6,5"/>
            {/* Handle knob at right */}
            <circle
              cx={lesion.position.x + lesion.radius + 6}
              cy={lesion.position.y}
              r={5}
              fill="#ff6633" fillOpacity="0.85"
              stroke="#ffaa88" strokeWidth="1.2"
              style={{ cursor: 'ew-resize' }}
            />

            {/* Lesion body */}
            <circle cx={lesion.position.x} cy={lesion.position.y} r={lesion.radius}
              fill="rgba(255, 45, 20, 0.72)"
              stroke="#ff7755" strokeWidth="2.5"
              filter="url(#glow-red)"/>
            <circle cx={lesion.position.x - 5} cy={lesion.position.y - 5}
              r={lesion.radius * 0.28} fill="white" fillOpacity="0.22"/>

            {/* Coverage indicator */}
            {lesion.structure && (
              <text x={lesion.position.x} y={lesion.position.y + lesion.radius + 20}
                fill="#ff9977" fontSize="9" fontFamily="Inter,sans-serif"
                textAnchor="middle" fontWeight="600">
                {lesion.structure.replace(/_/g, ' ')}
              </text>
            )}
          </g>
        )}

        {/* No lesion guide */}
        {!lesion && !fiberTrace && (
          <g>
            <text x={SVG_WIDTH / 2} y={SVG_HEIGHT * 0.5} fill="#1a2a3a" fontSize="12"
              fontFamily="Inter,sans-serif" textAnchor="middle" fontWeight="500">
              Click to place lesion
            </text>
            <text x={SVG_WIDTH / 2} y={SVG_HEIGHT * 0.5 + 18} fill="#121f2e" fontSize="10"
              fontFamily="Inter,sans-serif" textAnchor="middle">
              Drag edge ring to resize · Hover VF to trace fiber
            </text>
          </g>
        )}

        {/* ── Custom SVG cursor — drawn in SVG space so it is always
            pixel-perfect regardless of zoom, scale or aspect-ratio.
            The system cursor is hidden (cursor:none on the SVG).    ── */}
        {svgCursor && (() => {
          const { x, y } = svgCursor;
          const ARM = 10; // crosshair arm length

          if (cursorMode === 'resize') {
            // Horizontal double-arrow for resize
            return (
              <g pointerEvents="none">
                <circle cx={x} cy={y} r={14} fill="rgba(0,200,160,0.08)" stroke="rgba(0,200,160,0.5)" strokeWidth="1.2"/>
                {/* Left arrow */}
                <polygon points={`${x - 14},${y} ${x - 8},${y - 4} ${x - 8},${y + 4}`}
                  fill="rgba(0,200,160,0.9)"/>
                {/* Right arrow */}
                <polygon points={`${x + 14},${y} ${x + 8},${y - 4} ${x + 8},${y + 4}`}
                  fill="rgba(0,200,160,0.9)"/>
                {/* Horizontal bar */}
                <line x1={x - 8} y1={y} x2={x + 8} y2={y}
                  stroke="rgba(0,200,160,0.9)" strokeWidth="1.5"/>
              </g>
            );
          }

          if (cursorMode === 'move') {
            // Four-arrow move cursor
            const S = 6;
            return (
              <g pointerEvents="none">
                <circle cx={x} cy={y} r={12} fill="rgba(255,160,80,0.1)" stroke="rgba(255,160,80,0.45)" strokeWidth="1.2"/>
                {[0, 90, 180, 270].map(deg => {
                  const rad = deg * Math.PI / 180;
                  const tx = x + Math.cos(rad) * 12;
                  const ty = y + Math.sin(rad) * 12;
                  const ax = x + Math.cos(rad) * 5;
                  const ay = y + Math.sin(rad) * 5;
                  return (
                    <polygon key={deg}
                      points={`${tx},${ty} ${ax + Math.cos(rad + Math.PI / 2) * S * 0.5},${ay + Math.sin(rad + Math.PI / 2) * S * 0.5} ${ax - Math.cos(rad + Math.PI / 2) * S * 0.5},${ay - Math.sin(rad + Math.PI / 2) * S * 0.5}`}
                      fill="rgba(255,160,80,0.9)"/>
                  );
                })}
              </g>
            );
          }

          // Default: clean crosshair for placement
          return (
            <g pointerEvents="none">
              {/* Outer ring hint */}
              <circle cx={x} cy={y} r={22} fill="none"
                stroke="rgba(0,180,255,0.12)" strokeWidth="1"/>
              {/* Gap circle */}
              <circle cx={x} cy={y} r={4} fill="none"
                stroke="rgba(0,180,255,0.7)" strokeWidth="1.2"/>
              {/* Arms — top, right, bottom, left (with gap) */}
              <line x1={x} y1={y - ARM - 3} x2={x} y2={y - 6}
                stroke="rgba(0,180,255,0.85)" strokeWidth="1.2"/>
              <line x1={x + 6} y1={y} x2={x + ARM + 3} y2={y}
                stroke="rgba(0,180,255,0.85)" strokeWidth="1.2"/>
              <line x1={x} y1={y + 6} x2={x} y2={y + ARM + 3}
                stroke="rgba(0,180,255,0.85)" strokeWidth="1.2"/>
              <line x1={x - ARM - 3} y1={y} x2={x - 6} y2={y}
                stroke="rgba(0,180,255,0.85)" strokeWidth="1.2"/>
              {/* Center dot */}
              <circle cx={x} cy={y} r={1.5} fill="rgba(0,200,255,0.9)"/>
            </g>
          );
        })()}
      </svg>
    </div>
  );
};

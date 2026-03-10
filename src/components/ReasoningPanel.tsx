// ============================================================
// ReasoningPanel — clinical education hub
// Tabs: Deficit · Vascular · Signs · Differentials · Pearls
// ============================================================

import React, { useState } from 'react';
import type { DeficitSummary, Lesion, AppMode } from '../types';
import type { StructureClinicalData } from '../data/clinicalData';
import { CLINICAL_DATA } from '../data/clinicalData';
import { CLINICAL_CASES } from '../data/clinicalCases';
import type { ClinicalCase } from '../types';

interface Props {
  summary: DeficitSummary;
  lesion: Lesion | null;
  mode: AppMode;
  onModeChange: (m: AppMode) => void;
  onCaseSelect: (c: ClinicalCase) => void;
  onClearLesion: () => void;
  activeCase: ClinicalCase | null;
}

type ClinicalTab = 'deficit' | 'vascular' | 'signs' | 'differentials' | 'pearls';

const FREQ_COLOR: Record<string, string> = {
  'most common': '#44cc88',
  'common':      '#4499ff',
  'uncommon':    '#f0a040',
  'rare':        '#ff6666',
};
const IMPORTANCE_DOT: Record<string, string> = {
  high:   '#ff6666',
  medium: '#f0a040',
  low:    '#6688aa',
};

const patternColor = (pattern: string) => {
  if (pattern.includes('monocular') || pattern.includes('blindness')) return '#e8aa44';
  if (pattern.includes('bitemporal'))   return '#cc7733';
  if (pattern.includes('homonymous'))   return '#44aacc';
  if (pattern.includes('quadrant'))     return '#6688ee';
  if (pattern.includes('sparing'))      return '#44cc88';
  return '#88aacc';
};

export const ReasoningPanel: React.FC<Props> = ({
  summary, lesion, mode, onModeChange, onCaseSelect, onClearLesion, activeCase,
}) => {
  const clinData: StructureClinicalData | undefined =
    summary.structure ? CLINICAL_DATA[summary.structure] : undefined;

  return (
    <div className="reasoning-panel">
      <div className="mode-tabs">
        <button className={`mode-tab ${mode === 'explore' ? 'active' : ''}`} onClick={() => onModeChange('explore')}>
          Explore
        </button>
        <button className={`mode-tab ${mode === 'diagnostic' ? 'active' : ''}`} onClick={() => onModeChange('diagnostic')}>
          Cases
        </button>
      </div>

      {mode === 'explore' ? (
        <ExploreContent
          summary={summary}
          lesion={lesion}
          clinData={clinData}
          onClearLesion={onClearLesion}
        />
      ) : (
        <CasesContent
          onCaseSelect={onCaseSelect}
          summary={summary}
          activeCase={activeCase}
          clinData={clinData}
        />
      )}
    </div>
  );
};

// ── Explore Mode ────────────────────────────────────────────

const ExploreContent: React.FC<{
  summary: DeficitSummary;
  lesion: Lesion | null;
  clinData: StructureClinicalData | undefined;
  onClearLesion: () => void;
}> = ({ summary, lesion, clinData, onClearLesion }) => {
  const [tab, setTab] = useState<ClinicalTab>('deficit');
  const hasData = !!summary.structure && !!clinData;
  const color = patternColor(summary.pattern);

  if (!hasData) {
    return (
      <div className="reasoning-content">
        <EmptyState />
      </div>
    );
  }

  const tabs: { id: ClinicalTab; label: string }[] = [
    { id: 'deficit',       label: 'Deficit' },
    { id: 'vascular',      label: 'Vascular' },
    { id: 'signs',         label: 'Signs' },
    { id: 'differentials', label: 'DDx' },
    { id: 'pearls',        label: 'Pearls' },
  ];

  return (
    <div className="rp-explore">
      {/* Pattern banner */}
      <div className="rp-pattern-banner" style={{ borderColor: color, background: `${color}0d` }}>
        <div className="rp-pattern-dot" style={{ background: color }} />
        <div>
          <div className="rp-pattern-name" style={{ color }}>{summary.pattern}</div>
          <div className="rp-structure-label">
            {summary.structure?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </div>
        </div>
        {summary.macula !== 'n/a' && (
          <div className={`rp-macula-pill ${summary.macula}`}>
            {summary.macula === 'spared' ? '◎ Macula spared' : '● Macula involved'}
          </div>
        )}
      </div>

      {/* Congruence badge */}
      {clinData && (
        <div className="rp-congruence">
          <span className="rp-congruence-label">Congruence</span>
          <span className="rp-congruence-value">{clinData.congruence}</span>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="rp-subtabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`rp-subtab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rp-tab-content">

        {tab === 'deficit' && (
          <div className="rp-section">
            <div className="rp-field-label">CLINICAL PRESENTATION</div>
            <div className="rp-callout amber">{summary.clinicalNote}</div>
            <div className="rp-field-label" style={{ marginTop: 10 }}>ANATOMICAL BASIS</div>
            <div className="rp-body-text">{summary.anatomicalExplanation}</div>
            {clinData?.specialTopic && (
              <div className="rp-special-topic">
                <div className="rp-special-title">⚡ {clinData.specialTopic.title}</div>
                <div className="rp-special-body">{clinData.specialTopic.body}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'vascular' && clinData && (
          <div className="rp-section">
            <div className="rp-artery-chip">
              <span className="rp-artery-icon">🩸</span>
              <span className="rp-artery-name">{clinData.vascularSupply}</span>
            </div>
            <div className="rp-body-text" style={{ marginTop: 8 }}>{clinData.vascularDetail}</div>
          </div>
        )}

        {tab === 'signs' && clinData && (
          <div className="rp-section">
            {clinData.associatedSigns.map((s, i) => (
              <div key={i} className="rp-sign-row">
                <div
                  className="rp-sign-dot"
                  style={{ background: IMPORTANCE_DOT[s.importance] }}
                  title={`${s.importance} importance`}
                />
                <div>
                  <div className="rp-sign-finding">{s.finding}</div>
                  <div className="rp-sign-mechanism">{s.mechanism}</div>
                </div>
              </div>
            ))}
            <div className="rp-stats-block">
              <div className="rp-field-label" style={{ marginBottom: 6 }}>KEY STATISTICS</div>
              {clinData.stats.map((s, i) => (
                <div key={i} className="rp-stat-row">
                  <span className="rp-stat-bullet">▸</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'differentials' && clinData && (
          <div className="rp-section">
            <div className="rp-field-label" style={{ marginBottom: 8 }}>DIFFERENTIAL DIAGNOSIS</div>
            {clinData.etiologies.map((e, i) => (
              <div key={i} className="rp-ddx-row">
                <div
                  className="rp-freq-badge"
                  style={{ background: `${FREQ_COLOR[e.frequency]}22`, color: FREQ_COLOR[e.frequency], borderColor: `${FREQ_COLOR[e.frequency]}55` }}
                >
                  {e.frequency}
                </div>
                <div>
                  <div className="rp-ddx-name">{e.name}</div>
                  <div className="rp-ddx-note">{e.note}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'pearls' && clinData && (
          <div className="rp-section">
            <div className="rp-pearl-box">
              <div className="rp-pearl-icon">🎯</div>
              <div className="rp-pearl-text">{clinData.boardPearl}</div>
            </div>
            <LocalizationRule structureId={summary.structure} />
            {clinData.specialTopic && (
              <div className="rp-special-topic" style={{ marginTop: 12 }}>
                <div className="rp-special-title">⚡ {clinData.specialTopic.title}</div>
                <div className="rp-special-body">{clinData.specialTopic.body}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {lesion && (
        <button className="clear-btn" onClick={onClearLesion}>Clear Lesion</button>
      )}
    </div>
  );
};

// ── Localisation rule ───────────────────────────────────────

const LocalizationRule: React.FC<{ structureId: string | null }> = ({ structureId }) => {
  const rules: Record<string, string> = {
    left_eye:                 'Pre-chiasmal left. Monocular = anterior to chiasm. RAPD localises to the worse eye.',
    right_eye:                'Pre-chiasmal right. Monocular = anterior to chiasm.',
    left_optic_nerve:         'Pre-chiasmal left. RAPD on left. Junctional scotoma if at chiasmal junction.',
    right_optic_nerve:        'Pre-chiasmal right. RAPD on right.',
    chiasm:                   'Chiasmal. Bitemporal respects the VERTICAL meridian. Think pituitary first.',
    left_optic_tract:         'Post-chiasmal left tract. RAPD on the RIGHT (contralateral). Incongruent. Rare.',
    right_optic_tract:        'Post-chiasmal right tract. RAPD on the LEFT (contralateral). Incongruent.',
    left_lgn:                 'Post-chiasmal left LGN. No RAPD. Sectoranopia. Dual blood supply.',
    right_lgn:                'Post-chiasmal right LGN. No RAPD. Sectoranopia pattern.',
    left_meyers_loop:         'Post-chiasmal left temporal. Superior quad. Seizures / memory clue.',
    right_meyers_loop:        'Post-chiasmal right temporal. Superior quad. Often silent clinically.',
    left_parietal_radiation:  'Post-chiasmal left parietal. Inferior quad. Gerstmann if dominant.',
    right_parietal_radiation: 'Post-chiasmal right parietal. Inferior quad. Neglect if non-dominant.',
    left_occipital:           'Post-chiasmal left V1. Congruent. Macular sparing = PCA. No RAPD.',
    right_occipital:          'Post-chiasmal right V1. Congruent. Macular sparing = PCA. No RAPD.',
  };
  if (!structureId || !rules[structureId]) return null;
  return (
    <div className="rp-localization">
      <div className="rp-field-label">LOCALISATION RULE</div>
      <div className="rp-localization-text">{rules[structureId]}</div>
    </div>
  );
};

// ── Empty state ─────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="empty-state">
    <div className="empty-icon">⬆</div>
    <div className="empty-title">Place a lesion</div>
    <div className="empty-text">Click any structure in the pathway diagram to explore the deficit, vascular supply, differential diagnosis, and board pearls.</div>
    <div className="quick-guide">
      <div className="quick-guide-title">Quick reference</div>
      {[
        ['Optic nerve',      'Monocular blindness + RAPD'],
        ['Chiasm',           'Bitemporal hemianopia'],
        ['Optic tract',      'Contralateral hemianopia + RAPD'],
        ['LGN',              'Sectoranopia (no RAPD)'],
        ["Meyer's loop",     '"Pie in the sky" quad'],
        ['Parietal rad.',    '"Pie on the floor" quad'],
        ['Occipital cortex', 'Hemianopia ± macular sparing'],
      ].map(([s, d]) => (
        <div key={s} className="quick-guide-row">
          <span className="structure-name">{s}</span>
          <span className="arrow">→</span>
          <span className="deficit-name">{d}</span>
        </div>
      ))}
    </div>
  </div>
);

// ── Cases Content ───────────────────────────────────────────

const CasesContent: React.FC<{
  onCaseSelect: (c: ClinicalCase) => void;
  summary: DeficitSummary;
  activeCase: ClinicalCase | null;
  clinData: StructureClinicalData | undefined;
}> = ({ onCaseSelect, summary, activeCase, clinData }) => {
  if (activeCase) {
    return (
      <div className="cases-content">
        <div className="active-case">
          <div className="case-header">
            <span className="case-etiology">{activeCase.etiology}</span>
            <span className="case-title">{activeCase.title}</span>
          </div>
          <div className="case-vignette">{activeCase.description}</div>

          {summary.structure && (
            <div className="case-result">
              <div
                className="rp-pattern-banner"
                style={{ borderColor: patternColor(summary.pattern), background: `${patternColor(summary.pattern)}0d` }}
              >
                <div className="rp-pattern-dot" style={{ background: patternColor(summary.pattern) }} />
                <div className="rp-pattern-name" style={{ color: patternColor(summary.pattern) }}>{summary.pattern}</div>
              </div>
              <div className="case-teaching">
                <div className="rp-field-label" style={{ marginTop: 8 }}>TEACHING POINT</div>
                <div className="rp-body-text">{activeCase.teachingPoint}</div>
              </div>
              {clinData && (
                <div className="rp-pearl-box" style={{ marginTop: 10 }}>
                  <div className="rp-pearl-icon">🎯</div>
                  <div className="rp-pearl-text">{clinData.boardPearl}</div>
                </div>
              )}
            </div>
          )}

          <button className="clear-btn" onClick={() => onCaseSelect(null as unknown as ClinicalCase)}>
            ← All Cases
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cases-content">
      <div className="cases-intro">Select a scenario to load the lesion and explore the clinical correlates:</div>
      <div className="cases-list">
        {CLINICAL_CASES.map(c => (
          <div key={c.id} className="case-card" onClick={() => onCaseSelect(c)}>
            <div className="case-card-etiology">{c.etiology}</div>
            <div className="case-card-title">{c.title}</div>
            <div className="case-card-preview">{c.description.slice(0, 90)}…</div>
          </div>
        ))}
      </div>
    </div>
  );
};

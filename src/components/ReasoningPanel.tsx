// ============================================================
// ReasoningPanel — dynamic clinical explanation + controls
// ============================================================

import React from 'react';
import type { DeficitSummary, Lesion, AppMode } from '../types';
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

const PATTERN_COLORS: Record<string, string> = {
  'No deficit': '#446688',
  'monocular': '#e8aa44',
  'bitemporal': '#cc7733',
  'homonymous': '#44aacc',
  'quadrantanopia': '#6688ee',
  'sparing': '#44cc88',
};

function patternColor(pattern: string): string {
  for (const [key, color] of Object.entries(PATTERN_COLORS)) {
    if (pattern.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#88aacc';
}

export const ReasoningPanel: React.FC<Props> = ({
  summary,
  lesion,
  mode,
  onModeChange,
  onCaseSelect,
  onClearLesion,
  activeCase,
}) => {
  return (
    <div className="reasoning-panel">
      {/* Mode selector */}
      <div className="mode-tabs">
        <button
          className={`mode-tab ${mode === 'explore' ? 'active' : ''}`}
          onClick={() => onModeChange('explore')}
        >
          Explore Mode
        </button>
        <button
          className={`mode-tab ${mode === 'diagnostic' ? 'active' : ''}`}
          onClick={() => onModeChange('diagnostic')}
        >
          Clinical Cases
        </button>
      </div>

      {mode === 'explore' ? (
        <ExploreContent summary={summary} lesion={lesion} onClearLesion={onClearLesion} />
      ) : (
        <CasesContent
          onCaseSelect={onCaseSelect}
          summary={summary}
          lesion={lesion}
          activeCase={activeCase}
        />
      )}
    </div>
  );
};

// ── Explore Mode Content ─────────────────────────────────────

const ExploreContent: React.FC<{
  summary: DeficitSummary;
  lesion: Lesion | null;
  onClearLesion: () => void;
}> = ({ summary, lesion, onClearLesion }) => {
  const color = patternColor(summary.pattern);
  const hasDeficit = summary.structure !== null;

  return (
    <div className="reasoning-content">
      {/* Deficit pattern badge */}
      <div className="deficit-badge" style={{ borderColor: color, color }}>
        <div className="deficit-icon">
          {summary.structure === null ? '○' : '●'}
        </div>
        <div>
          <div className="deficit-pattern">{summary.pattern}</div>
          {summary.structure && (
            <div className="deficit-structure">
              Structure: {summary.structure.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </div>
          )}
        </div>
      </div>

      {/* Macula indicator */}
      {hasDeficit && summary.macula !== 'n/a' && (
        <div className={`macula-badge ${summary.macula === 'spared' ? 'spared' : 'involved'}`}>
          <span className="macula-icon">{summary.macula === 'spared' ? '◎' : '●'}</span>
          Macula {summary.macula === 'spared' ? 'SPARED' : 'involved'}
          {summary.macula === 'spared' && (
            <span className="macula-note"> — suggests PCA territory</span>
          )}
        </div>
      )}

      {/* Clinical note */}
      {hasDeficit && (
        <div className="reasoning-section">
          <div className="section-label">CLINICAL PEARLS</div>
          <div className="clinical-note">{summary.clinicalNote}</div>
        </div>
      )}

      {/* Anatomical explanation */}
      {hasDeficit && (
        <div className="reasoning-section">
          <div className="section-label">ANATOMICAL BASIS</div>
          <div className="anatomical-text">{summary.anatomicalExplanation}</div>
        </div>
      )}

      {/* No lesion state */}
      {!hasDeficit && (
        <div className="empty-state">
          <div className="empty-icon">⬆</div>
          <div className="empty-title">Place a lesion</div>
          <div className="empty-text">
            Click any structure in the pathway diagram to place a lesion
            and see the resulting visual field deficit.
          </div>
          <div className="quick-guide">
            <div className="quick-guide-title">Quick reference:</div>
            <div className="quick-guide-row">
              <span className="structure-name">Optic nerve</span>
              <span className="arrow">→</span>
              <span className="deficit-name">Monocular blindness</span>
            </div>
            <div className="quick-guide-row">
              <span className="structure-name">Chiasm</span>
              <span className="arrow">→</span>
              <span className="deficit-name">Bitemporal hemianopia</span>
            </div>
            <div className="quick-guide-row">
              <span className="structure-name">Optic tract</span>
              <span className="arrow">→</span>
              <span className="deficit-name">Contralateral hemianopia</span>
            </div>
            <div className="quick-guide-row">
              <span className="structure-name">Meyer's loop</span>
              <span className="arrow">→</span>
              <span className="deficit-name">Sup. quadrantanopia</span>
            </div>
            <div className="quick-guide-row">
              <span className="structure-name">Parietal rad.</span>
              <span className="arrow">→</span>
              <span className="deficit-name">Inf. quadrantanopia</span>
            </div>
            <div className="quick-guide-row">
              <span className="structure-name">Occipital cortex</span>
              <span className="arrow">→</span>
              <span className="deficit-name">Hemianopia ± mac. sparing</span>
            </div>
          </div>
        </div>
      )}

      {/* Clear button */}
      {lesion && (
        <button className="clear-btn" onClick={onClearLesion}>
          Clear Lesion
        </button>
      )}

      {/* Localization key */}
      {hasDeficit && (
        <div className="localization-key">
          <div className="section-label">LOCALIZATION RULE</div>
          <LocalizationRule structureId={summary.structure} />
        </div>
      )}
    </div>
  );
};

const LocalizationRule: React.FC<{ structureId: string | null }> = ({ structureId }) => {
  const rules: Record<string, string> = {
    left_eye: 'Pre-chiasmal (left). Loss confined to one eye = anterior to chiasm.',
    right_eye: 'Pre-chiasmal (right). Loss confined to one eye = anterior to chiasm.',
    left_optic_nerve: 'Pre-chiasmal (left). Check for RAPD — indicates optic nerve or severe retinal disease.',
    right_optic_nerve: 'Pre-chiasmal (right). RAPD expected on the affected side.',
    chiasm: 'Chiasmal. Bitemporal loss respects the vertical midline — pathognomonic for chiasmal compression. Think pituitary first.',
    left_optic_tract: 'Post-chiasmal, left tract. Homonymous = always post-chiasmal. Tract: often incongruent.',
    right_optic_tract: 'Post-chiasmal, right tract. Homonymous = always post-chiasmal.',
    left_lgn: 'Post-chiasmal, left LGN. LGN lesions rare; often have distinctive sector-shaped defects (anterior choroidal art.).',
    right_lgn: 'Post-chiasmal, right LGN.',
    left_meyers_loop: 'Post-chiasmal, left temporal lobe. Superior homonymous quadrantanopia = temporal lobe or anterior radiation.',
    right_meyers_loop: 'Post-chiasmal, right temporal lobe.',
    left_parietal_radiation: 'Post-chiasmal, left parietal. Inferior homonymous quadrantanopia = parietal or posterior radiation.',
    right_parietal_radiation: 'Post-chiasmal, right parietal.',
    left_occipital: 'Post-chiasmal, left cortex. Cortical lesions: highly congruent, may spare macula (PCA stroke).',
    right_occipital: 'Post-chiasmal, right cortex. Look for macular sparing to suspect PCA territory infarct.',
  };
  return (
    <div className="localization-text">
      {structureId ? rules[structureId] ?? '' : ''}
    </div>
  );
};

// ── Clinical Cases Content ───────────────────────────────────

const CasesContent: React.FC<{
  onCaseSelect: (c: ClinicalCase) => void;
  summary: DeficitSummary;
  lesion: Lesion | null;
  activeCase: ClinicalCase | null;
}> = ({ onCaseSelect, summary, lesion, activeCase }) => {
  return (
    <div className="cases-content">
      {activeCase ? (
        <div className="active-case">
          <div className="case-header">
            <span className="case-etiology">{activeCase.etiology}</span>
            <span className="case-title">{activeCase.title}</span>
          </div>
          <div className="case-vignette">{activeCase.description}</div>
          <div className="case-teaching">
            <div className="section-label">TEACHING POINT</div>
            <div className="teaching-text">{activeCase.teachingPoint}</div>
          </div>
          {summary.structure && (
            <div className="case-result">
              <div className="deficit-badge" style={{ borderColor: patternColor(summary.pattern), color: patternColor(summary.pattern) }}>
                <div className="deficit-pattern">{summary.pattern}</div>
              </div>
              <div className="anatomical-text" style={{ marginTop: 8 }}>{summary.clinicalNote}</div>
            </div>
          )}
          <button className="clear-btn" onClick={() => onCaseSelect(null as unknown as ClinicalCase)}>
            ← Back to Cases
          </button>
        </div>
      ) : (
        <div className="cases-list">
          <div className="cases-intro">
            Select a clinical scenario to load the lesion and explore the deficit:
          </div>
          {CLINICAL_CASES.map(c => (
            <div
              key={c.id}
              className="case-card"
              onClick={() => onCaseSelect(c)}
            >
              <div className="case-card-etiology">{c.etiology}</div>
              <div className="case-card-title">{c.title}</div>
              <div className="case-card-preview">
                {c.description.slice(0, 90)}…
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

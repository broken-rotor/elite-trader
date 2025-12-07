import React from 'react';
import { BLUEPRINTS_DB, REROLL_STRATEGIES, getMaterial } from '../utils';

const getQualityClass = (quality) => `quality-${quality}`;
const getQualityBgClass = (quality) => `quality-bg-${quality}`;

function BlueprintsTab({
  selectedModule,
  setSelectedModule,
  selectedBp,
  setSelectedBp,
  fromGrade,
  setFromGrade,
  toGrade,
  setToGrade,
  strategy,
  setStrategy,
  selectedBlueprints,
  addBlueprint,
  removeBlueprint,
  blueprintNeeds
}) {
  const availableBlueprints = selectedModule ? Object.keys(BLUEPRINTS_DB[selectedModule]?.blueprints || {}) : [];

  return (
    <div className="panel">
      <h2 className="orange">Select Engineering Blueprints</h2>

      <div className="blueprint-grid">
        <select
          className="col-span-2"
          value={selectedModule}
          onChange={(e) => {
            setSelectedModule(e.target.value);
            setSelectedBp('');
          }}
        >
          <option value="">Select Module...</option>
          {Object.keys(BLUEPRINTS_DB).map(mod => (
            <option key={mod} value={mod}>{BLUEPRINTS_DB[mod].name}</option>
          ))}
        </select>

        <select
          className="col-span-2"
          value={selectedBp}
          onChange={(e) => setSelectedBp(e.target.value)}
          disabled={!selectedModule}
        >
          <option value="">Select Blueprint...</option>
          {availableBlueprints.map(bp => (
            <option key={bp} value={bp}>{bp}</option>
          ))}
        </select>

        <div className="grade-select">
          <select value={fromGrade} onChange={(e) => setFromGrade(parseInt(e.target.value))}>
            {[1,2,3,4,5].map(g => <option key={g} value={g}>G{g}</option>)}
          </select>
          <span>→</span>
          <select value={toGrade} onChange={(e) => setToGrade(parseInt(e.target.value))}>
            {[1,2,3,4,5].map(g => <option key={g} value={g}>G{g}</option>)}
          </select>
        </div>

        <div className="add-row">
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            {Object.entries(REROLL_STRATEGIES).map(([key, strat]) => (
              <option key={key} value={key}>{strat.name}</option>
            ))}
          </select>
          <button className="btn-orange" onClick={addBlueprint} disabled={!selectedBp}>
            Add
          </button>
        </div>
      </div>

      {/* Selected Blueprints */}
      <div className="list-container">
        {selectedBlueprints.map(bp => {
          const strategyName = REROLL_STRATEGIES[bp.strategy]?.name || 'Unknown';
          return (
            <div key={bp.id} className="list-item">
              <span>
                <span className="module">{BLUEPRINTS_DB[bp.module]?.name}</span>
                <span style={{color: '#64748b', margin: '0 8px'}}>→</span>
                <span className="blueprint">{bp.blueprint}</span>
                <span className="grades">G{bp.fromGrade}-G{bp.toGrade}</span>
                <span className="rolls">{strategyName}</span>
              </span>
              <button className="btn-remove" onClick={() => removeBlueprint(bp.id)}>✕</button>
            </div>
          );
        })}
        {selectedBlueprints.length === 0 && (
          <p className="empty-message">
            No blueprints selected. Add blueprints above to calculate material costs.
          </p>
        )}
      </div>

      {/* Blueprint Material Summary */}
      {blueprintNeeds.length > 0 && (
        <div className="material-summary">
          <h3>Materials Required for Blueprints</h3>
          <div className="material-tags">
            {blueprintNeeds.map((n, i) => {
              const mat = getMaterial(n.item);
              return (
                <span key={i} className={`material-tag ${getQualityBgClass(mat?.quality)}`}>
                  <span className={getQualityClass(mat?.quality)}>{n.item}</span>
                  <span style={{color: '#94a3b8', marginLeft: '4px'}}>×{n.quantity}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default BlueprintsTab;

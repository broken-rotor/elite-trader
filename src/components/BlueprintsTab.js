import React from 'react';
import { BLUEPRINTS_DB, REROLL_STRATEGIES, getMaterial } from '../utils';
import Tooltip from './Tooltip';

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
  updateBlueprintRolls,
  performBlueprintRoll,
  blueprintNeeds,
  inventory,
  rollHistory,
  undoRoll
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
            <div key={bp.id} className="list-item blueprint-item">
              <div className="blueprint-header">
                <span>
                  <span className="module">{BLUEPRINTS_DB[bp.module]?.name}</span>
                  <span style={{color: '#64748b', margin: '0 8px'}}>→</span>
                  <span className="blueprint">{bp.blueprint}</span>
                  <span className="grades">G{bp.fromGrade}-G{bp.toGrade}</span>
                  <span className="rolls">{strategyName}</span>
                </span>
                <button className="btn-remove" onClick={() => removeBlueprint(bp.id)}>✕</button>
              </div>
              <div className="rolls-editor">
                {[1, 2, 3, 4, 5].map(grade => {
                  if (grade < bp.fromGrade || grade > bp.toGrade) return null;

                  const currentRolls = bp.rolls?.[grade] ?? 1;
                  const moduleData = BLUEPRINTS_DB[bp.module];
                  const blueprintData = moduleData?.blueprints[bp.blueprint];
                  const gradeMats = blueprintData?.grades[grade] || [];

                  // Check if we have enough materials for this roll and collect missing materials
                  const missingMaterials = [];
                  const canPerformRoll = currentRolls > 0 && gradeMats.every(mat => {
                    const invItem = inventory.find(i => i.item === mat.item);
                    const hasEnough = invItem && invItem.quantity >= mat.qty;
                    if (!hasEnough) {
                      const have = invItem?.quantity || 0;
                      const material = getMaterial(mat.item);
                      missingMaterials.push({ item: mat.item, qty: mat.qty, have, quality: material?.quality });
                    }
                    return hasEnough;
                  });

                  // Build tooltip content
                  let tooltipContent;
                  if (currentRolls <= 0) {
                    tooltipContent = <span>No rolls remaining</span>;
                  } else if (canPerformRoll) {
                    tooltipContent = <span>Perform this roll</span>;
                  } else {
                    tooltipContent = (
                      <div>
                        <div className="tooltip-content-line">Missing materials:</div>
                        {missingMaterials.map((mat, idx) => (
                          <div key={idx} className="tooltip-content-line">
                            <span className={getQualityClass(mat.quality)}>{mat.item}</span>: need {mat.qty}, have {mat.have}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <div key={grade} className="roll-input-group">
                      <label className={getQualityClass(grade)}>G{grade}:</label>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={currentRolls}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          updateBlueprintRolls(bp.id, grade, Math.max(0, Math.min(99, value)));
                        }}
                        className="roll-input"
                      />
                      <span className="roll-label">rolls</span>
                      <Tooltip content={tooltipContent} disabled={!canPerformRoll}>
                        <button
                          className="btn-perform-roll"
                          onClick={() => performBlueprintRoll(bp.id, grade)}
                          disabled={!canPerformRoll}
                        >
                          Roll
                        </button>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
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

      {/* Roll History */}
      {rollHistory.length > 0 && (
        <div className="material-summary">
          <h3>Recent Rolls</h3>
          <div className="history-list">
            {rollHistory.slice(0, 5).map((entry) => (
              <div key={entry.id} className="history-item">
                <span className="history-text">
                  {entry.moduleName} - {entry.blueprintName} G{entry.grade}
                </span>
                <button
                  className="btn-undo"
                  onClick={() => undoRoll(entry)}
                  title="Undo this roll"
                >
                  Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BlueprintsTab;

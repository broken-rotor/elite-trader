import React, { useEffect } from 'react';
import { BLUEPRINTS_DB, getMaterial } from '../database';
import { REROLL_STRATEGIES } from '../utils';
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
  setSelectedBlueprints,
  selectedExperimentals,
  setSelectedExperimentals,
  addBlueprint,
  removeBlueprint,
  updateBlueprintRolls,
  performBlueprintRoll,
  blueprintNeeds,
  inventory,
  rollHistory,
  undoRoll
}) {
  // Download blueprints and experimentals as JSON
  const downloadBlueprints = () => {
    const combinedData = {
      blueprints: selectedBlueprints,
      experimentals: selectedExperimentals
    };
    const dataStr = JSON.stringify(combinedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'elite-trader-builds.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Upload blueprints and experimentals from JSON file
  const uploadBlueprints = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const uploadedData = JSON.parse(e.target.result);

          // Validate the uploaded data
          if (!uploadedData || typeof uploadedData !== 'object') {
            alert('Invalid file format: Expected an object with blueprints and experimentals.');
            return;
          }

          // Validate blueprints if present
          if (uploadedData.blueprints) {
            if (!Array.isArray(uploadedData.blueprints)) {
              alert('Invalid file format: blueprints must be an array.');
              return;
            }

            const isValidBlueprints = uploadedData.blueprints.every(bp =>
              bp &&
              typeof bp === 'object' &&
              typeof bp.module === 'string' &&
              typeof bp.blueprint === 'string' &&
              typeof bp.fromGrade === 'number' &&
              typeof bp.toGrade === 'number'
            );

            if (!isValidBlueprints) {
              alert('Invalid file format: Each blueprint must have valid properties.');
              return;
            }
          }

          // Validate experimentals if present
          if (uploadedData.experimentals) {
            if (!Array.isArray(uploadedData.experimentals)) {
              alert('Invalid file format: experimentals must be an array.');
              return;
            }

            const isValidExperimentals = uploadedData.experimentals.every(exp =>
              exp &&
              typeof exp === 'object' &&
              typeof exp.module === 'string' &&
              typeof exp.experimental === 'string' &&
              (exp.quantity === undefined || typeof exp.quantity === 'number')
            );

            if (!isValidExperimentals) {
              alert('Invalid file format: Each experimental must have valid properties.');
              return;
            }
          }

          // Replace the current data with the uploaded data
          if (uploadedData.blueprints) {
            setSelectedBlueprints(uploadedData.blueprints);
          }
          if (uploadedData.experimentals) {
            setSelectedExperimentals(uploadedData.experimentals);
          }
          alert('Builds uploaded successfully!');
        } catch (error) {
          alert('Error reading file: Invalid JSON format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Clear blueprints and experimentals
  const clearBuilds = () => {
    if (window.confirm('Are you sure you want to clear all blueprints and experimentals? This cannot be undone.')) {
      setSelectedBlueprints([]);
      setSelectedExperimentals([]);
    }
  };

  const availableBlueprints = selectedModule ? Object.keys(BLUEPRINTS_DB[selectedModule]?.blueprints || {}) : [];

  // Get available grades for the currently selected blueprint
  const getAvailableGrades = () => {
    if (!selectedModule || !selectedBp) return [1, 2, 3, 4, 5];
    const blueprintData = BLUEPRINTS_DB[selectedModule]?.blueprints[selectedBp];
    if (!blueprintData) return [1, 2, 3, 4, 5];
    return Object.keys(blueprintData.grades).map(Number).sort((a, b) => a - b);
  };

  const availableGrades = getAvailableGrades();

  // Auto-adjust grade range when blueprint changes
  useEffect(() => {
    if (selectedBp && availableGrades.length > 0) {
      const minGrade = availableGrades[0];
      const maxGrade = availableGrades[availableGrades.length - 1];

      // Adjust fromGrade if it's out of range
      if (fromGrade < minGrade || fromGrade > maxGrade) {
        setFromGrade(minGrade);
      }

      // Adjust toGrade if it's out of range
      if (toGrade < minGrade || toGrade > maxGrade) {
        setToGrade(maxGrade);
      }

      // Ensure fromGrade <= toGrade
      if (fromGrade > toGrade) {
        setToGrade(fromGrade);
      }
    }
  }, [selectedBp, availableGrades.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="orange" style={{ margin: 0 }}>Select Engineering Blueprints</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-download" onClick={uploadBlueprints}>
            ⬆️ Upload
          </button>
          <button className="btn-download" onClick={downloadBlueprints}>
            ⬇️ Download
          </button>
          <button className="btn-download" onClick={clearBuilds} style={{ color: '#dc2626' }}>
            🗑️ Clear
          </button>
        </div>
      </div>

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
          <select
            value={fromGrade}
            onChange={(e) => {
              const newFrom = parseInt(e.target.value);
              setFromGrade(newFrom);
              if (newFrom > toGrade) setToGrade(newFrom);
            }}
            disabled={!selectedBp}
          >
            {availableGrades.map(g => <option key={g} value={g}>G{g}</option>)}
          </select>
          <span>→</span>
          <select
            value={toGrade}
            onChange={(e) => {
              const newTo = parseInt(e.target.value);
              setToGrade(newTo);
              if (newTo < fromGrade) setFromGrade(newTo);
            }}
            disabled={!selectedBp}
          >
            {availableGrades.map(g => <option key={g} value={g}>G{g}</option>)}
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
                  const moduleData = BLUEPRINTS_DB[bp.module];
                  const blueprintData = moduleData?.blueprints[bp.blueprint];
                  const gradeMats = blueprintData?.grades[grade];

                  // Skip if grade doesn't exist for this blueprint or is outside selected range
                  if (!gradeMats || grade < bp.fromGrade || grade > bp.toGrade) return null;

                  const currentRolls = bp.rolls?.[grade] ?? 1;

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

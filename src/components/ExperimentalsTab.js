import React from 'react';
import { EXPERIMENTALS_DB, getMaterial } from '../database';
import Tooltip from './Tooltip';

const getQualityClass = (quality) => `quality-${quality}`;
const getQualityBgClass = (quality) => `quality-bg-${quality}`;

function ExperimentalsTab({
  selectedModule,
  setSelectedModule,
  selectedExperimental,
  setSelectedExperimental,
  selectedExperimentals,
  setSelectedExperimentals,
  selectedBlueprints,
  setSelectedBlueprints,
  addExperimental,
  removeExperimental,
  updateExperimentalQuantity,
  experimentalNeeds,
  performExperimentalRoll,
  inventory,
  experimentalRollHistory,
  undoExperimentalRoll
}) {
  // Download blueprints and experimentals as JSON
  const downloadExperimentals = () => {
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
  const uploadExperimentals = () => {
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

  const availableExperimentals = selectedModule ? Object.keys(EXPERIMENTALS_DB[selectedModule]?.experimentals || {}) : [];

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="orange" style={{ margin: 0 }}>Select Experimental Effects</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-download" onClick={uploadExperimentals}>
            ⬆️ Upload
          </button>
          <button className="btn-download" onClick={downloadExperimentals}>
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
            setSelectedExperimental('');
          }}
        >
          <option value="">Select Module...</option>
          {Object.keys(EXPERIMENTALS_DB).map(mod => (
            <option key={mod} value={mod}>{EXPERIMENTALS_DB[mod].name}</option>
          ))}
        </select>

        <select
          className="col-span-2"
          value={selectedExperimental}
          onChange={(e) => setSelectedExperimental(e.target.value)}
          disabled={!selectedModule}
        >
          <option value="">Select Experimental...</option>
          {availableExperimentals.map(exp => (
            <option key={exp} value={exp}>{exp}</option>
          ))}
        </select>

        <div className="add-row" style={{ gridColumn: 'span 1' }}>
          <button className="btn-orange" onClick={addExperimental} disabled={!selectedExperimental}>
            Add
          </button>
        </div>
      </div>

      {/* Selected Experimentals */}
      <div className="list-container">
        {selectedExperimentals.map(exp => {
          const currentQuantity = exp.quantity ?? 1;
          const moduleData = EXPERIMENTALS_DB[exp.module];
          const experimentalMats = moduleData?.experimentals[exp.experimental] || [];

          // Check if we have enough materials for this roll and collect missing materials
          const missingMaterials = [];
          const canPerformRoll = currentQuantity > 0 && experimentalMats.every(mat => {
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
          if (currentQuantity <= 0) {
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
            <div key={exp.id} className="list-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span>
                  <span className="module">{EXPERIMENTALS_DB[exp.module]?.name}</span>
                  <span style={{color: '#64748b', margin: '0 8px'}}>→</span>
                  <span className="blueprint">{exp.experimental}</span>
                </span>
                <button className="btn-remove" onClick={() => removeExperimental(exp.id)}>✕</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#94a3b8' }}>Quantity:</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={exp.quantity ?? 1}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    updateExperimentalQuantity(exp.id, Math.max(0, Math.min(99, value)));
                  }}
                  style={{
                    width: '60px',
                    padding: '4px 8px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                />
                <Tooltip content={tooltipContent} disabled={!canPerformRoll}>
                  <button
                    className="btn-perform-roll"
                    onClick={() => performExperimentalRoll(exp.id)}
                    disabled={!canPerformRoll}
                    style={{ marginLeft: '8px' }}
                  >
                    Roll
                  </button>
                </Tooltip>
              </div>
            </div>
          );
        })}
        {selectedExperimentals.length === 0 && (
          <p className="empty-message">
            No experimental effects selected. Add experimental effects above to calculate material costs.
          </p>
        )}
      </div>

      {/* Experimental Material Summary */}
      {experimentalNeeds.length > 0 && (
        <div className="material-summary">
          <h3>Materials Required for Experimentals</h3>
          <div className="material-tags">
            {experimentalNeeds.map((n, i) => {
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
      {experimentalRollHistory.length > 0 && (
        <div className="material-summary">
          <h3>Recent Rolls</h3>
          <div className="history-list">
            {experimentalRollHistory.slice(0, 5).map((entry) => (
              <div key={entry.id} className="history-item">
                <span className="history-text">
                  {entry.moduleName} - {entry.experimentalName}
                </span>
                <button
                  className="btn-undo"
                  onClick={() => undoExperimentalRoll(entry)}
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

export default ExperimentalsTab;

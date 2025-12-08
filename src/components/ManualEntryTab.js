import React from 'react';
import { getMaterial } from '../utils';
import MaterialSearch from './MaterialSearch';

const getQualityClass = (quality) => `quality-${quality}`;
const getQualityBgClass = (quality) => `quality-bg-${quality}`;

function ManualEntryTab({
  searchNeeded,
  setSearchNeeded,
  filteredNeeded,
  newNeedQty,
  setNewNeedQty,
  addToNeeds,
  manualNeeds,
  removeFromNeeds,
  updateManualNeedQuantity
}) {
  return (
    <div className="panel">
      <h2 className="amber">Manual Material Needs</h2>

      <MaterialSearch
        searchValue={searchNeeded}
        onSearchChange={setSearchNeeded}
        filteredMaterials={filteredNeeded}
        onSelectMaterial={addToNeeds}
        quantityValue={newNeedQty}
        onQuantityChange={setNewNeedQty}
        className="amber"
      />

      <div className="list-container">
        {manualNeeds.map(need => {
          const mat = getMaterial(need.item);
          return (
            <div key={need.item} className={`inv-item ${getQualityBgClass(mat?.quality)}`}>
              <div>
                <span className={`name ${getQualityClass(mat?.quality)}`}>{need.item}</span>
                <span className="grade-label">G{mat?.quality}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <input
                  type="number"
                  className="qty-input-inline"
                  min="1"
                  value={need.quantity}
                  onChange={(e) => updateManualNeedQuantity(need.item, e.target.value)}
                  style={{width: '80px'}}
                />
                <button className="btn-remove" onClick={() => removeFromNeeds(need.item)}>✕</button>
              </div>
            </div>
          );
        })}
        {manualNeeds.length === 0 && (
          <p className="empty-message">No manual needs added</p>
        )}
      </div>
    </div>
  );
}

export default ManualEntryTab;

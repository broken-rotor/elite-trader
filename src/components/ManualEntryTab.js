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
  removeFromNeeds
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
              <span className={`name ${getQualityClass(mat?.quality)}`}>{need.item}</span>
              <span className="quantity amber">×{need.quantity}</span>
              <button className="btn-remove" onClick={() => removeFromNeeds(need.item)}>✕</button>
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

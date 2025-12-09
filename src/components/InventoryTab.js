import React from 'react';
import { getMaterial } from '../database';
import MaterialSearch from './MaterialSearch';

const getQualityClass = (quality) => `quality-${quality}`;
const getQualityBgClass = (quality) => `quality-bg-${quality}`;

function InventoryTab({
  inventorySubTab,
  setInventorySubTab,
  searchOwned,
  setSearchOwned,
  filteredOwned,
  newQty,
  setNewQty,
  addToInventory,
  filteredInventoryByCategory,
  updateInventoryQuantity,
  removeFromInventory
}) {
  return (
    <div className="panel">
      <h2 className="blue">Your Inventory</h2>

      {/* Inventory Sub-tabs */}
      <div className="tabs" style={{marginBottom: '20px'}}>
        <button
          className={`tab-btn ${inventorySubTab === 'materials' ? 'active' : ''}`}
          onClick={() => setInventorySubTab('materials')}
        >
          Materials
        </button>
        <button
          className={`tab-btn ${inventorySubTab === 'data' ? 'active' : ''}`}
          onClick={() => setInventorySubTab('data')}
        >
          Data
        </button>
      </div>

      <MaterialSearch
        searchValue={searchOwned}
        onSearchChange={setSearchOwned}
        filteredMaterials={filteredOwned}
        onSelectMaterial={addToInventory}
        quantityValue={newQty}
        onQuantityChange={setNewQty}
      />

      <div className="list-container tall">
        {filteredInventoryByCategory.map(inv => {
          const mat = getMaterial(inv.item);
          return (
            <div key={inv.item} className={`inv-item ${getQualityBgClass(mat?.quality)}`}>
              <div>
                <span className={`name ${getQualityClass(mat?.quality)}`}>{inv.item}</span>
                <span className="grade-label">G{mat?.quality}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <input
                  type="number"
                  className="qty-input-inline"
                  min="1"
                  value={inv.quantity}
                  onChange={(e) => updateInventoryQuantity(inv.item, e.target.value)}
                  style={{width: '80px'}}
                />
                <button className="btn-remove" onClick={() => removeFromInventory(inv.item)}>✕</button>
              </div>
            </div>
          );
        })}
        {filteredInventoryByCategory.length === 0 && (
          <p className="empty-message">
            No {inventorySubTab === 'data' ? 'encoded data' : 'materials'} in inventory
          </p>
        )}
      </div>
    </div>
  );
}

export default InventoryTab;

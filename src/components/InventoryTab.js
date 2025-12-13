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
  removeFromInventory,
  inventory,
  setInventory
}) {
  const downloadInventory = () => {
    const dataStr = JSON.stringify(inventory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'elite-trader-inventory.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const uploadInventory = () => {
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
          if (!Array.isArray(uploadedData)) {
            alert('Invalid file format: Expected an array of inventory items.');
            return;
          }

          // Validate each item in the array
          const isValidInventory = uploadedData.every(item => 
            item && 
            typeof item === 'object' && 
            typeof item.item === 'string' && 
            typeof item.quantity === 'number' && 
            item.quantity >= 0
          );

          if (!isValidInventory) {
            alert('Invalid file format: Each item must have "item" (string) and "quantity" (number) properties.');
            return;
          }

          // Replace the current inventory with the uploaded data
          setInventory(uploadedData);
          alert('Inventory uploaded successfully!');
        } catch (error) {
          alert('Error reading file: Invalid JSON format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="blue">Your Inventory</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-download" onClick={uploadInventory}>
            ⬆️ Upload
          </button>
          <button className="btn-download" onClick={downloadInventory}>
            ⬇️ Download
          </button>
        </div>
      </div>

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

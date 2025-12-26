import React, { useState } from 'react';
import { MATERIALS_DB } from '../database';

// Category order matching in-game Material Trader
const CATEGORY_ORDER = {
  raw: [
    'Raw material 1',
    'Raw material 2',
    'Raw material 3',
    'Raw material 4',
    'Raw material 5',
    'Raw material 6',
    'Raw material 7'
  ],
  manufactured: [
    'Chemical',
    'Thermic',
    'Heat',
    'Conductive',
    'Mechanical components',
    'Capacitors',
    'Shielding',
    'Composite',
    'Crystals',
    'Alloys'
  ],
  encoded: [
    'Emission data',
    'Wake scans',
    'Shield data',
    'Encryption files',
    'Data archives',
    'Encoded Firmware'
  ]
};

function MaterialTraderTab({ traderType, setTraderType, inventory, updateInventoryQuantity, setInventory, allNeeds }) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Download inventory as JSON
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

  // Upload inventory from JSON file
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

  // Get materials for a specific category, sorted by grade (1-5)
  const getMaterialsForCategory = (category, type) => {
    const typePrefix = type === 'raw' ? 'Raw' : type === 'manufactured' ? 'Manufactured' : 'Encoded';
    const fullCategory = `${typePrefix} (${category})`;

    // Filter materials by category and exclude Guardian/Thargoid
    const categoryMaterials = MATERIALS_DB.filter(m =>
      m.type === fullCategory &&
      !m.type.includes('Guardian') &&
      !m.type.includes('Thargoid')
    );

    // Create array with slots for grades 1-5
    const materialsByGrade = Array(5).fill(null);

    categoryMaterials.forEach(material => {
      const gradeIndex = material.quality - 1;
      if (gradeIndex >= 0 && gradeIndex < 5) {
        materialsByGrade[gradeIndex] = material;
      }
    });

    return materialsByGrade;
  };

  // Get quantity from inventory
  const getInventoryQuantity = (materialName) => {
    if (!materialName) return 0;
    const invItem = inventory.find(i => i.item === materialName);
    return invItem ? invItem.quantity : 0;
  };

  // Get required quantity from needs
  const getRequiredQuantity = (materialName) => {
    if (!materialName || !allNeeds) return 0;
    const needItem = allNeeds.find(n => n.item === materialName);
    return needItem ? needItem.quantity : 0;
  };

  // Handle cell click to start editing
  const handleCellClick = (material) => {
    if (!material) return;
    setEditingCell(material.item);
    setEditValue(getInventoryQuantity(material.item).toString());
  };

  // Handle save on blur or enter
  const handleSave = (material) => {
    if (!material) return;
    const newQty = parseInt(editValue) || 0;
    updateInventoryQuantity(material.item, newQty);
    setEditingCell(null);
  };

  // Handle key press
  const handleKeyPress = (e, material) => {
    if (e.key === 'Enter') {
      handleSave(material);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Render material cell
  const renderMaterialCell = (material, grade, category) => {
    if (!material) {
      return <div key={`empty-${grade}`} data-testid={`empty-cell-${category}-${grade}`} className="material-cell empty"></div>;
    }

    const quantity = getInventoryQuantity(material.item);
    const required = getRequiredQuantity(material.item);
    const isEditing = editingCell === material.item;
    const qualityClass = `quality-${material.quality}`;

    return (
      <div
        key={material.item}
        data-testid={`material-cell-${material.item}`}
        className={`material-cell ${qualityClass} ${isEditing ? 'editing' : ''}`}
        onClick={() => !isEditing && handleCellClick(material)}
      >
        <div className="grade-indicator">G{material.quality}</div>
        <div className="material-icon">⬡</div>
        {isEditing ? (
          <input
            type="number"
            className="material-quantity-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave(material)}
            onKeyDown={(e) => handleKeyPress(e, material)}
            autoFocus
            min="0"
          />
        ) : (
          <div className="material-quantity">
            {quantity || 0}
            {required > 0 && (
              <span className={`material-required ${quantity >= required ? 'satisfied' : 'unsatisfied'}`}>
                /{required}
              </span>
            )}
          </div>
        )}
        <div className="material-name">{material.item}</div>
      </div>
    );
  };

  // Render category section
  const renderCategory = (category) => {
    const materials = getMaterialsForCategory(category, traderType);
    const categoryHeader = category.toUpperCase();

    return (
      <div key={category} className="material-category">
        <div className="category-header">{categoryHeader}</div>
        <div className="material-grid">
          {materials.map((material, index) => renderMaterialCell(material, index + 1, category))}
        </div>
      </div>
    );
  };

  const categories = CATEGORY_ORDER[traderType];

  return (
    <div className="material-trader-tab">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f97316', margin: 0 }}>Material Trader</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-download" onClick={uploadInventory}>
            ⬆️ Upload
          </button>
          <button className="btn-download" onClick={downloadInventory}>
            ⬇️ Download
          </button>
        </div>
      </div>
      <div className="trader-type-tabs">
        <button
          className={`trader-type-btn ${traderType === 'raw' ? 'active' : ''}`}
          onClick={() => setTraderType('raw')}
        >
          Raw Materials
        </button>
        <button
          className={`trader-type-btn ${traderType === 'manufactured' ? 'active' : ''}`}
          onClick={() => setTraderType('manufactured')}
        >
          Manufactured Materials
        </button>
        <button
          className={`trader-type-btn ${traderType === 'encoded' ? 'active' : ''}`}
          onClick={() => setTraderType('encoded')}
        >
          Encoded Data
        </button>
      </div>

      <div className="material-grid-container">
        {categories.map(category => renderCategory(category))}
      </div>
    </div>
  );
}

export default MaterialTraderTab;

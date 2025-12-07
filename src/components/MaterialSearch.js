import React from 'react';

const getQualityClass = (quality) => `quality-${quality}`;

function MaterialSearch({
  searchValue,
  onSearchChange,
  filteredMaterials,
  onSelectMaterial,
  quantityValue,
  onQuantityChange,
  className = ''
}) {
  return (
    <div className="search-row">
      <div className="search-container">
        <input
          type="text"
          className={`search-input ${className}`}
          placeholder="Search materials..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchValue && filteredMaterials.length > 0 && (
          <div className="dropdown">
            {filteredMaterials.map(m => (
              <button
                key={m.item}
                className="dropdown-item"
                onClick={() => onSelectMaterial(m.item)}
              >
                <span className={getQualityClass(m.quality)}>{m.item}</span>
                <span className="grade">G{m.quality}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        type="number"
        className="qty-input"
        min="1"
        value={quantityValue}
        onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
      />
    </div>
  );
}

export default MaterialSearch;

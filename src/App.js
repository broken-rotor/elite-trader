import React, { useState, useMemo, useEffect } from 'react';
import './App.css';
import {
  MATERIALS_DB,
  BLUEPRINTS_DB,
  REROLL_STRATEGIES,
  getMaterial,
  calculateBlueprintCosts,
  optimizeTrading
} from './utils';
function App() {
  const [activeTab, setActiveTab] = useState('blueprints');
  const [inventorySubTab, setInventorySubTab] = useState('materials'); // materials, data

  // Load inventory from localStorage or use defaults
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('eliteTraderInventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse saved inventory:', e);
      }
    }
    return [];
  });

  const [manualNeeds, setManualNeeds] = useState([]);

  // Load selected blueprints from localStorage or use empty array
  const [selectedBlueprints, setSelectedBlueprints] = useState(() => {
    const saved = localStorage.getItem('eliteTraderBlueprints');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse saved blueprints:', e);
      }
    }
    return [];
  });
  
  const [searchOwned, setSearchOwned] = useState('');
  const [searchNeeded, setSearchNeeded] = useState('');
  const [newQty, setNewQty] = useState(10);
  const [newNeedQty, setNewNeedQty] = useState(1);

  const [selectedModule, setSelectedModule] = useState('');
  const [selectedBp, setSelectedBp] = useState('');
  const [fromGrade, setFromGrade] = useState(1);
  const [toGrade, setToGrade] = useState(5);
  const [strategy, setStrategy] = useState('typical');

  // Save inventory to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('eliteTraderInventory', JSON.stringify(inventory));
  }, [inventory]);

  // Save selected blueprints to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('eliteTraderBlueprints', JSON.stringify(selectedBlueprints));
  }, [selectedBlueprints]);

  const blueprintNeeds = useMemo(() => calculateBlueprintCosts(selectedBlueprints), [selectedBlueprints]);
  
  const allNeeds = useMemo(() => {
    const combined = {};
    for (const n of manualNeeds) {
      combined[n.item] = (combined[n.item] || 0) + n.quantity;
    }
    for (const n of blueprintNeeds) {
      combined[n.item] = (combined[n.item] || 0) + n.quantity;
    }
    return Object.entries(combined).map(([item, quantity]) => ({ item, quantity }));
  }, [manualNeeds, blueprintNeeds]);
  
  const result = useMemo(() => optimizeTrading(inventory, allNeeds), [inventory, allNeeds]);

  const getMaterialCategory = (material) => {
    if (material.type.startsWith('Manufactured')) return 'materials';
    if (material.type.startsWith('Encoded')) return 'data';
    if (material.type.startsWith('Raw')) return 'materials';
    return 'other';
  };

  const filteredOwned = useMemo(() => {
    return MATERIALS_DB.filter(m => {
      const matchesSearch = m.item.toLowerCase().includes(searchOwned.toLowerCase());
      const matchesCategory = getMaterialCategory(m) === inventorySubTab;
      return matchesSearch && matchesCategory;
    }).slice(0, 8);
  }, [searchOwned, inventorySubTab]);
  
  const filteredNeeded = useMemo(() => {
    return MATERIALS_DB.filter(m => m.item.toLowerCase().includes(searchNeeded.toLowerCase())).slice(0, 8);
  }, [searchNeeded]);
  
  const addToInventory = (item) => {
    const existing = inventory.find(i => i.item === item);
    if (existing) {
      setInventory(inventory.map(i => i.item === item ? { ...i, quantity: i.quantity + newQty } : i));
    } else {
      setInventory([...inventory, { item, quantity: newQty }]);
    }
    setSearchOwned('');
  };
  
  const addToNeeds = (item) => {
    const existing = manualNeeds.find(i => i.item === item);
    if (existing) {
      setManualNeeds(manualNeeds.map(i => i.item === item ? { ...i, quantity: i.quantity + newNeedQty } : i));
    } else {
      setManualNeeds([...manualNeeds, { item, quantity: newNeedQty }]);
    }
    setSearchNeeded('');
  };
  
  const addBlueprint = () => {
    if (selectedModule && selectedBp) {
      setSelectedBlueprints([...selectedBlueprints, {
        id: Date.now(),
        module: selectedModule,
        blueprint: selectedBp,
        fromGrade,
        toGrade,
        strategy
      }]);
    }
  };
  
  const removeBlueprint = (id) => setSelectedBlueprints(selectedBlueprints.filter(b => b.id !== id));
  const removeFromInventory = (item) => setInventory(inventory.filter(i => i.item !== item));
  const removeFromNeeds = (item) => setManualNeeds(manualNeeds.filter(i => i.item !== item));

  const updateInventoryQuantity = (item, newQuantity) => {
    const qty = parseInt(newQuantity) || 0;
    if (qty <= 0) {
      removeFromInventory(item);
    } else {
      setInventory(inventory.map(i => i.item === item ? { ...i, quantity: qty } : i));
    }
  };
  
  const availableBlueprints = selectedModule ? Object.keys(BLUEPRINTS_DB[selectedModule]?.blueprints || {}) : [];
  
  const getQualityClass = (quality) => `quality-${quality}`;
  const getQualityBgClass = (quality) => `quality-bg-${quality}`;

  const filteredInventoryByCategory = useMemo(() => {
    return inventory
      .filter(inv => {
        const mat = getMaterial(inv.item);
        return mat && getMaterialCategory(mat) === inventorySubTab;
      })
      .sort((a, b) => a.item.localeCompare(b.item));
  }, [inventory, inventorySubTab]);

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>Elite Dangerous Material Trader</h1>
          <p>Trade ratios: Upgrade 6→1 | Downgrade 1→3 | Cross-type 6→1</p>
        </div>
        
        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'blueprints' ? 'active' : ''}`} onClick={() => setActiveTab('blueprints')}>
            🔧 Blueprints
          </button>
          <button className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>
            📝 Manual Entry
          </button>
          <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            📦 Inventory
          </button>
        </div>
        
        {/* Blueprint Selection Tab */}
        {activeTab === 'blueprints' && (
          <div className="panel">
            <h2 className="orange">Select Engineering Blueprints</h2>
            
            <div className="blueprint-grid">
              <select className="col-span-2" value={selectedModule} onChange={(e) => { setSelectedModule(e.target.value); setSelectedBp(''); }}>
                <option value="">Select Module...</option>
                {Object.keys(BLUEPRINTS_DB).map(mod => (
                  <option key={mod} value={mod}>{BLUEPRINTS_DB[mod].name}</option>
                ))}
              </select>
              
              <select className="col-span-2" value={selectedBp} onChange={(e) => setSelectedBp(e.target.value)} disabled={!selectedModule}>
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
                <button className="btn-orange" onClick={addBlueprint} disabled={!selectedBp}>Add</button>
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
                <p className="empty-message">No blueprints selected. Add blueprints above to calculate material costs.</p>
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
        )}
        
        {/* Manual Entry Tab */}
        {activeTab === 'manual' && (
          <div className="panel">
            <h2 className="amber">Manual Material Needs</h2>
            
            <div className="search-row">
              <div className="search-container">
                <input
                  type="text"
                  className="search-input amber"
                  placeholder="Search materials..."
                  value={searchNeeded}
                  onChange={(e) => setSearchNeeded(e.target.value)}
                />
                {searchNeeded && filteredNeeded.length > 0 && (
                  <div className="dropdown">
                    {filteredNeeded.map(m => (
                      <button key={m.item} className="dropdown-item" onClick={() => addToNeeds(m.item)}>
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
                value={newNeedQty}
                onChange={(e) => setNewNeedQty(parseInt(e.target.value) || 1)}
              />
            </div>
            
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
        )}
        
        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
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

            <div className="search-row">
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search materials..."
                  value={searchOwned}
                  onChange={(e) => setSearchOwned(e.target.value)}
                />
                {searchOwned && filteredOwned.length > 0 && (
                  <div className="dropdown">
                    {filteredOwned.map(m => (
                      <button key={m.item} className="dropdown-item" onClick={() => addToInventory(m.item)}>
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
                value={newQty}
                onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
              />
            </div>

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
        )}
        
        {/* Results */}
        <div className="panel results">
          <h2>⚡ Optimization Results</h2>
          
          {allNeeds.length === 0 ? (
            <p className="empty-message">Select blueprints or add manual needs to see optimization results</p>
          ) : (
            <>
              {/* Trade Sequence */}
              {result.trades.length > 0 && (
                <div className="trade-sequence">
                  <h3 className="purple">Trade Sequence</h3>
                  <div className="trade-list">
                    {result.trades.map((trade, i) => (
                      <div key={i} className="trade-item">
                        <span className={`trade-badge ${
                          trade.action === 'UPGRADE' ? 'upgrade' :
                          trade.action === 'DOWNGRADE' ? 'downgrade' :
                          trade.action === 'CROSS_TYPE' ? 'cross-type' : 'same-slot'
                        }`}>
                          {trade.action.replace('_', ' ')}
                        </span>
                        <span className="input-amt">{trade.input.amount}×</span>
                        <span className={getQualityClass(trade.input.quality)}>{trade.input.item}</span>
                        <span className="arrow">→</span>
                        <span className="output-amt">{trade.output.amount}×</span>
                        <span className={getQualityClass(trade.output.quality)}>{trade.output.item}</span>
                        <span className="ratio">[{trade.ratio}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Summary */}
              <div className="results-grid">
                <div>
                  <h3 className="green">✓ Fulfilled ({result.fulfilled.length})</h3>
                  <div className="result-list">
                    {result.fulfilled.map((f, i) => (
                      <div key={i} className="result-item fulfilled">
                        <span className="name">{f.quantity}× {f.item}</span>
                        <span className="method">
                          {f.method === 'DIRECT' ? '(direct)' : 
                           f.method === 'SAME_SLOT' ? `(from ${f.from})` :
                           `(${f.consumed}× ${f.from})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="red">✗ Unfulfilled ({result.unfulfilled.length})</h3>
                  {result.unfulfilled.length > 0 ? (
                    <div className="result-list">
                      {result.unfulfilled.map((u, i) => (
                        <div key={i} className="result-item unfulfilled">
                          <span className="name">{u.quantity}× {u.item}</span>
                          <div className="source">Source: {u.material?.source}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="success-message">All needs fulfilled! 🎉</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Legend */}
        <div className="legend">
          <span className="quality-1">● G1</span>
          <span className="quality-2">● G2</span>
          <span className="quality-3">● G3</span>
          <span className="quality-4">● G4</span>
          <span className="quality-5">● G5</span>
        </div>
      </div>
    </div>
  );
}

export default App;

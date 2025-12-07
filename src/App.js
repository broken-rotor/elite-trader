import React, { useState, useMemo, useEffect } from 'react';
import './App.css';
import {
  MATERIALS_DB,
  getMaterial,
  calculateBlueprintCosts,
  optimizeTrading
} from './utils';
import BlueprintsTab from './components/BlueprintsTab';
import ManualEntryTab from './components/ManualEntryTab';
import InventoryTab from './components/InventoryTab';
import ResultsPanel from './components/ResultsPanel';

function App() {
  const [activeTab, setActiveTab] = useState('blueprints');
  const [inventorySubTab, setInventorySubTab] = useState('materials');

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

  const blueprintNeeds = useMemo(
    () => calculateBlueprintCosts(selectedBlueprints),
    [selectedBlueprints]
  );

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

  const result = useMemo(
    () => optimizeTrading(inventory, allNeeds),
    [inventory, allNeeds]
  );

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
    return MATERIALS_DB.filter(m =>
      m.item.toLowerCase().includes(searchNeeded.toLowerCase())
    ).slice(0, 8);
  }, [searchNeeded]);

  const addToInventory = (item) => {
    const existing = inventory.find(i => i.item === item);
    if (existing) {
      setInventory(inventory.map(i =>
        i.item === item ? { ...i, quantity: i.quantity + newQty } : i
      ));
    } else {
      setInventory([...inventory, { item, quantity: newQty }]);
    }
    setSearchOwned('');
  };

  const addToNeeds = (item) => {
    const existing = manualNeeds.find(i => i.item === item);
    if (existing) {
      setManualNeeds(manualNeeds.map(i =>
        i.item === item ? { ...i, quantity: i.quantity + newNeedQty } : i
      ));
    } else {
      setManualNeeds([...manualNeeds, { item, quantity: newNeedQty }]);
    }
    setSearchNeeded('');
  };

  const addBlueprint = () => {
    if (selectedModule && selectedBp) {
      setSelectedBlueprints([
        ...selectedBlueprints,
        {
          id: Date.now(),
          module: selectedModule,
          blueprint: selectedBp,
          fromGrade,
          toGrade,
          strategy
        }
      ]);
    }
  };

  const removeBlueprint = (id) =>
    setSelectedBlueprints(selectedBlueprints.filter(b => b.id !== id));

  const removeFromInventory = (item) =>
    setInventory(inventory.filter(i => i.item !== item));

  const removeFromNeeds = (item) =>
    setManualNeeds(manualNeeds.filter(i => i.item !== item));

  const updateInventoryQuantity = (item, newQuantity) => {
    const qty = parseInt(newQuantity) || 0;
    if (qty <= 0) {
      removeFromInventory(item);
    } else {
      setInventory(inventory.map(i =>
        i.item === item ? { ...i, quantity: qty } : i
      ));
    }
  };

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
          <button
            className={`tab-btn ${activeTab === 'blueprints' ? 'active' : ''}`}
            onClick={() => setActiveTab('blueprints')}
          >
            🔧 Blueprints
          </button>
          <button
            className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            📝 Manual Entry
          </button>
          <button
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Inventory
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'blueprints' && (
          <BlueprintsTab
            selectedModule={selectedModule}
            setSelectedModule={setSelectedModule}
            selectedBp={selectedBp}
            setSelectedBp={setSelectedBp}
            fromGrade={fromGrade}
            setFromGrade={setFromGrade}
            toGrade={toGrade}
            setToGrade={setToGrade}
            strategy={strategy}
            setStrategy={setStrategy}
            selectedBlueprints={selectedBlueprints}
            addBlueprint={addBlueprint}
            removeBlueprint={removeBlueprint}
            blueprintNeeds={blueprintNeeds}
          />
        )}

        {activeTab === 'manual' && (
          <ManualEntryTab
            searchNeeded={searchNeeded}
            setSearchNeeded={setSearchNeeded}
            filteredNeeded={filteredNeeded}
            newNeedQty={newNeedQty}
            setNewNeedQty={setNewNeedQty}
            addToNeeds={addToNeeds}
            manualNeeds={manualNeeds}
            removeFromNeeds={removeFromNeeds}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab
            inventorySubTab={inventorySubTab}
            setInventorySubTab={setInventorySubTab}
            searchOwned={searchOwned}
            setSearchOwned={setSearchOwned}
            filteredOwned={filteredOwned}
            newQty={newQty}
            setNewQty={setNewQty}
            addToInventory={addToInventory}
            filteredInventoryByCategory={filteredInventoryByCategory}
            updateInventoryQuantity={updateInventoryQuantity}
            removeFromInventory={removeFromInventory}
          />
        )}

        {/* Results Panel */}
        <ResultsPanel allNeeds={allNeeds} result={result} />

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

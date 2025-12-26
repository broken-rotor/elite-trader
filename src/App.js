import React, { useState, useMemo, useEffect } from 'react';
import './App.css';
import {
  MATERIALS_DB,
  getMaterial,
  BLUEPRINTS_DB,
  EXPERIMENTALS_DB
} from './database';
import {
  calculateBlueprintCosts,
  calculateExperimentalCosts,
  optimizeTrading,
  REROLL_STRATEGIES
} from './utils';
import BlueprintsTab from './components/BlueprintsTab';
import ManualEntryTab from './components/ManualEntryTab';
import InventoryTab from './components/InventoryTab';
import ExperimentalsTab from './components/ExperimentalsTab';
import MaterialTraderTab from './components/MaterialTraderTab';
import ResultsPanel from './components/ResultsPanel';

function App() {
  const [activeTab, setActiveTab] = useState('blueprints');
  const [traderType, setTraderType] = useState('raw');
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

  // History for undo functionality
  const [rollHistory, setRollHistory] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [experimentalRollHistory, setExperimentalRollHistory] = useState([]);

  const [searchOwned, setSearchOwned] = useState('');
  const [searchNeeded, setSearchNeeded] = useState('');
  const [newQty, setNewQty] = useState(10);
  const [newNeedQty, setNewNeedQty] = useState(1);

  const [selectedModule, setSelectedModule] = useState('');
  const [selectedBp, setSelectedBp] = useState('');
  const [fromGrade, setFromGrade] = useState(1);
  const [toGrade, setToGrade] = useState(5);
  const [strategy, setStrategy] = useState('typical');

  // Experimentals tab state
  const [selectedExpModule, setSelectedExpModule] = useState('');
  const [selectedExperimental, setSelectedExperimental] = useState('');

  // Load selected experimentals from localStorage or use empty array
  const [selectedExperimentals, setSelectedExperimentals] = useState(() => {
    const saved = localStorage.getItem('eliteTraderExperimentals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse saved experimentals:', e);
      }
    }
    return [];
  });

  // Save inventory to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('eliteTraderInventory', JSON.stringify(inventory));
  }, [inventory]);

  // Save selected blueprints to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('eliteTraderBlueprints', JSON.stringify(selectedBlueprints));
  }, [selectedBlueprints]);

  // Save selected experimentals to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('eliteTraderExperimentals', JSON.stringify(selectedExperimentals));
  }, [selectedExperimentals]);

  const blueprintNeeds = useMemo(
    () => calculateBlueprintCosts(selectedBlueprints),
    [selectedBlueprints]
  );

  const experimentalNeeds = useMemo(
    () => calculateExperimentalCosts(selectedExperimentals),
    [selectedExperimentals]
  );

  const allNeeds = useMemo(() => {
    const combined = {};
    for (const n of manualNeeds) {
      combined[n.item] = (combined[n.item] || 0) + n.quantity;
    }
    for (const n of blueprintNeeds) {
      combined[n.item] = (combined[n.item] || 0) + n.quantity;
    }
    for (const n of experimentalNeeds) {
      combined[n.item] = (combined[n.item] || 0) + n.quantity;
    }
    return Object.entries(combined).map(([item, quantity]) => ({ item, quantity }));
  }, [manualNeeds, blueprintNeeds, experimentalNeeds]);

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
      const strategyData = REROLL_STRATEGIES[strategy];
      setSelectedBlueprints([
        ...selectedBlueprints,
        {
          id: Date.now(),
          module: selectedModule,
          blueprint: selectedBp,
          fromGrade,
          toGrade,
          strategy,
          rolls: { ...strategyData.rolls }
        }
      ]);
    }
  };

  const removeBlueprint = (id) =>
    setSelectedBlueprints(selectedBlueprints.filter(b => b.id !== id));

  const updateBlueprintRolls = (id, grade, rolls) => {
    setSelectedBlueprints(selectedBlueprints.map(bp =>
      bp.id === id ? { ...bp, rolls: { ...bp.rolls, [grade]: rolls } } : bp
    ));
  };

  const addExperimental = () => {
    if (selectedExpModule && selectedExperimental) {
      setSelectedExperimentals([
        ...selectedExperimentals,
        {
          id: Date.now(),
          module: selectedExpModule,
          experimental: selectedExperimental,
          quantity: 1
        }
      ]);
    }
  };

  const removeExperimental = (id) =>
    setSelectedExperimentals(selectedExperimentals.filter(e => e.id !== id));

  const updateExperimentalQuantity = (id, quantity) => {
    setSelectedExperimentals(selectedExperimentals.map(exp =>
      exp.id === id ? { ...exp, quantity } : exp
    ));
  };

  const performBlueprintRoll = (blueprintId, grade) => {
    const blueprint = selectedBlueprints.find(bp => bp.id === blueprintId);
    if (!blueprint) return;

    const currentRolls = blueprint.rolls?.[grade] ?? 1;
    if (currentRolls <= 0) return;

    // Get materials needed for this grade
    const moduleData = BLUEPRINTS_DB[blueprint.module];
    if (!moduleData) return;

    const blueprintData = moduleData.blueprints[blueprint.blueprint];
    if (!blueprintData) return;

    const gradeMats = blueprintData.grades[grade];
    if (!gradeMats) return;

    // Check if we have enough materials
    const newInventory = [...inventory];
    const materialsNeeded = gradeMats.map(m => ({ item: m.item, qty: m.qty }));

    // Check availability
    for (const needed of materialsNeeded) {
      const invItem = newInventory.find(i => i.item === needed.item);
      if (!invItem || invItem.quantity < needed.qty) {
        alert(`Not enough ${needed.item}. Need ${needed.qty}, have ${invItem?.quantity || 0}`);
        return;
      }
    }

    // Record this action for undo
    const historyEntry = {
      id: Date.now(),
      blueprintId,
      grade,
      moduleName: moduleData.name,
      blueprintName: blueprint.blueprint,
      materialsConsumed: materialsNeeded.map(m => ({ ...m })),
      previousRolls: currentRolls
    };

    // Deduct materials
    for (const needed of materialsNeeded) {
      const invItem = newInventory.find(i => i.item === needed.item);
      invItem.quantity -= needed.qty;
    }

    // Filter out zero-quantity items
    setInventory(newInventory.filter(i => i.quantity > 0));

    // Reduce roll count
    updateBlueprintRolls(blueprintId, grade, Math.max(0, currentRolls - 1));

    // Add to history
    setRollHistory([historyEntry, ...rollHistory]);
  };

  const undoRoll = (historyEntry) => {
    // Restore materials
    const newInventory = [...inventory];
    for (const material of historyEntry.materialsConsumed) {
      const invItem = newInventory.find(i => i.item === material.item);
      if (invItem) {
        invItem.quantity += material.qty;
      } else {
        newInventory.push({ item: material.item, quantity: material.qty });
      }
    }
    setInventory(newInventory);

    // Restore roll count
    updateBlueprintRolls(historyEntry.blueprintId, historyEntry.grade, historyEntry.previousRolls);

    // Remove from history
    setRollHistory(rollHistory.filter(h => h.id !== historyEntry.id));
  };

  const performExperimentalRoll = (experimentalId) => {
    const experimental = selectedExperimentals.find(exp => exp.id === experimentalId);
    if (!experimental) return;

    const currentQuantity = experimental.quantity ?? 1;
    if (currentQuantity <= 0) return;

    // Get materials needed for this experimental
    const moduleData = EXPERIMENTALS_DB[experimental.module];
    if (!moduleData) return;

    const experimentalMats = moduleData.experimentals[experimental.experimental];
    if (!experimentalMats) return;

    // Check if we have enough materials
    const newInventory = [...inventory];
    const materialsNeeded = experimentalMats.map(m => ({ item: m.item, qty: m.qty }));

    // Check availability
    for (const needed of materialsNeeded) {
      const invItem = newInventory.find(i => i.item === needed.item);
      if (!invItem || invItem.quantity < needed.qty) {
        alert(`Not enough ${needed.item}. Need ${needed.qty}, have ${invItem?.quantity || 0}`);
        return;
      }
    }

    // Record this action for undo
    const historyEntry = {
      id: Date.now(),
      experimentalId,
      moduleName: moduleData.name,
      experimentalName: experimental.experimental,
      materialsConsumed: materialsNeeded.map(m => ({ ...m })),
      previousQuantity: currentQuantity
    };

    // Deduct materials
    for (const needed of materialsNeeded) {
      const invItem = newInventory.find(i => i.item === needed.item);
      invItem.quantity -= needed.qty;
    }

    // Filter out zero-quantity items
    setInventory(newInventory.filter(i => i.quantity > 0));

    // Reduce quantity
    updateExperimentalQuantity(experimentalId, Math.max(0, currentQuantity - 1));

    // Add to history
    setExperimentalRollHistory([historyEntry, ...experimentalRollHistory]);
  };

  const undoExperimentalRoll = (historyEntry) => {
    // Restore materials
    const newInventory = [...inventory];
    for (const material of historyEntry.materialsConsumed) {
      const invItem = newInventory.find(i => i.item === material.item);
      if (invItem) {
        invItem.quantity += material.qty;
      } else {
        newInventory.push({ item: material.item, quantity: material.qty });
      }
    }
    setInventory(newInventory);

    // Restore quantity
    updateExperimentalQuantity(historyEntry.experimentalId, historyEntry.previousQuantity);

    // Remove from history
    setExperimentalRollHistory(experimentalRollHistory.filter(h => h.id !== historyEntry.id));
  };

  const removeFromInventory = (item) =>
    setInventory(inventory.filter(i => i.item !== item));

  const removeFromNeeds = (item) =>
    setManualNeeds(manualNeeds.filter(i => i.item !== item));

  const updateManualNeedQuantity = (item, newQuantity) => {
    const qty = parseInt(newQuantity) || 0;
    if (qty <= 0) {
      removeFromNeeds(item);
    } else {
      setManualNeeds(manualNeeds.map(i =>
        i.item === item ? { ...i, quantity: qty } : i
      ));
    }
  };

  const updateInventoryQuantity = (item, newQuantity) => {
    const qty = parseInt(newQuantity) || 0;
    if (qty <= 0) {
      removeFromInventory(item);
    } else {
      const existing = inventory.find(i => i.item === item);
      if (existing) {
        setInventory(inventory.map(i =>
          i.item === item ? { ...i, quantity: qty } : i
        ));
      } else {
        setInventory([...inventory, { item, quantity: qty }]);
      }
    }
  };

  const executeTrade = (trade) => {
    const newInventory = [...inventory];

    // Subtract input materials
    const inputItem = newInventory.find(i => i.item === trade.input.item);
    if (!inputItem || inputItem.quantity < trade.input.amount) {
      alert(`Not enough ${trade.input.item}. Need ${trade.input.amount}, have ${inputItem?.quantity || 0}`);
      return;
    }

    // Record this action for undo
    const historyEntry = {
      id: Date.now(),
      trade: JSON.parse(JSON.stringify(trade)) // Deep copy the trade
    };

    inputItem.quantity -= trade.input.amount;

    // Add output materials
    const outputItem = newInventory.find(i => i.item === trade.output.item);
    if (outputItem) {
      outputItem.quantity += trade.output.amount;
    } else {
      newInventory.push({ item: trade.output.item, quantity: trade.output.amount });
    }

    // Add remainder if present
    if (trade.remainder && trade.remainder.amount > 0) {
      const remainderItem = newInventory.find(i => i.item === trade.remainder.item);
      if (remainderItem) {
        remainderItem.quantity += trade.remainder.amount;
      } else {
        newInventory.push({ item: trade.remainder.item, quantity: trade.remainder.amount });
      }
    }

    // Filter out zero-quantity items
    setInventory(newInventory.filter(i => i.quantity > 0));

    // Add to history
    setTradeHistory([historyEntry, ...tradeHistory]);
  };

  const undoTrade = (historyEntry) => {
    const trade = historyEntry.trade;
    const newInventory = [...inventory];

    // Restore input materials
    const inputItem = newInventory.find(i => i.item === trade.input.item);
    if (inputItem) {
      inputItem.quantity += trade.input.amount;
    } else {
      newInventory.push({ item: trade.input.item, quantity: trade.input.amount });
    }

    // Remove output materials
    const outputItem = newInventory.find(i => i.item === trade.output.item);
    if (outputItem) {
      outputItem.quantity -= trade.output.amount;
    }

    // Remove remainder if present
    if (trade.remainder && trade.remainder.amount > 0) {
      const remainderItem = newInventory.find(i => i.item === trade.remainder.item);
      if (remainderItem) {
        remainderItem.quantity -= trade.remainder.amount;
      }
    }

    // Filter out zero-quantity items
    setInventory(newInventory.filter(i => i.quantity > 0));

    // Remove from history
    setTradeHistory(tradeHistory.filter(h => h.id !== historyEntry.id));
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
            className={`tab-btn ${activeTab === 'experimentals' ? 'active' : ''}`}
            onClick={() => setActiveTab('experimentals')}
          >
            ⚡ Experimentals
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
          <button
            className={`tab-btn ${activeTab === 'trader' ? 'active' : ''}`}
            onClick={() => setActiveTab('trader')}
          >
            🔄 Material Trader
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
            setSelectedBlueprints={setSelectedBlueprints}
            addBlueprint={addBlueprint}
            removeBlueprint={removeBlueprint}
            updateBlueprintRolls={updateBlueprintRolls}
            performBlueprintRoll={performBlueprintRoll}
            blueprintNeeds={blueprintNeeds}
            inventory={inventory}
            rollHistory={rollHistory}
            undoRoll={undoRoll}
          />
        )}

        {activeTab === 'experimentals' && (
          <ExperimentalsTab
            selectedModule={selectedExpModule}
            setSelectedModule={setSelectedExpModule}
            selectedExperimental={selectedExperimental}
            setSelectedExperimental={setSelectedExperimental}
            selectedExperimentals={selectedExperimentals}
            setSelectedExperimentals={setSelectedExperimentals}
            addExperimental={addExperimental}
            removeExperimental={removeExperimental}
            updateExperimentalQuantity={updateExperimentalQuantity}
            experimentalNeeds={experimentalNeeds}
            performExperimentalRoll={performExperimentalRoll}
            inventory={inventory}
            experimentalRollHistory={experimentalRollHistory}
            undoExperimentalRoll={undoExperimentalRoll}
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
            updateManualNeedQuantity={updateManualNeedQuantity}
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
            inventory={inventory}
            setInventory={setInventory}
          />
        )}

        {activeTab === 'trader' && (
          <MaterialTraderTab
            traderType={traderType}
            setTraderType={setTraderType}
            inventory={inventory}
            updateInventoryQuantity={updateInventoryQuantity}
            setInventory={setInventory}
            allNeeds={allNeeds}
          />
        )}

        {/* Results Panel */}
        {activeTab !== 'inventory' && activeTab !== 'trader' && (
          <ResultsPanel
            allNeeds={allNeeds}
            result={result}
            executeTrade={executeTrade}
            inventory={inventory}
            tradeHistory={tradeHistory}
            undoTrade={undoTrade}
          />
        )}

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

import { EXPERIMENTALS_DB } from './database';

describe('Experimental Roll and Undo Logic', () => {
  let state;
  let updateExperimentalQuantity;
  let performExperimentalRoll;
  let undoExperimentalRoll;

  beforeEach(() => {
    // Use a state object to ensure mutable references work correctly
    state = {
      inventory: [
        { item: 'Atypical Disrupted Wake Echoes', quantity: 20 },
        { item: 'Galvanising Alloys', quantity: 10 },
        { item: 'Eccentric Hyperspace Trajectories', quantity: 5 }
      ],
      selectedExperimentals: [
        {
          id: 1,
          module: 'FSD',
          experimental: 'Deep Charge',
          quantity: 3
        }
      ],
      experimentalRollHistory: [],
      idCounter: 1
    };

    // Mock functions
    updateExperimentalQuantity = jest.fn((id, newQuantity) => {
      state.selectedExperimentals = state.selectedExperimentals.map(exp =>
        exp.id === id ? { ...exp, quantity: newQuantity } : exp
      );
    });

    // Implementation of performExperimentalRoll
    performExperimentalRoll = (experimentalId) => {
      const experimental = state.selectedExperimentals.find(exp => exp.id === experimentalId);
      if (!experimental) return;

      const currentQuantity = experimental.quantity ?? 1;
      if (currentQuantity <= 0) return;

      // Get materials needed for this experimental
      const moduleData = EXPERIMENTALS_DB[experimental.module];
      if (!moduleData) return;

      const experimentalMats = moduleData.experimentals[experimental.experimental];
      if (!experimentalMats) return;

      // Check if we have enough materials
      const materialsNeeded = experimentalMats.map(m => ({ item: m.item, qty: m.qty }));

      // Check availability
      for (const needed of materialsNeeded) {
        const invItem = state.inventory.find(i => i.item === needed.item);
        if (!invItem || invItem.quantity < needed.qty) {
          throw new Error(`Not enough ${needed.item}. Need ${needed.qty}, have ${invItem?.quantity || 0}`);
        }
      }

      // Record this action for undo
      const historyEntry = {
        id: state.idCounter++,
        experimentalId,
        moduleName: moduleData.name,
        experimentalName: experimental.experimental,
        materialsConsumed: materialsNeeded.map(m => ({ ...m })),
        previousQuantity: currentQuantity
      };

      // Deduct materials
      for (const needed of materialsNeeded) {
        const invItem = state.inventory.find(i => i.item === needed.item);
        invItem.quantity -= needed.qty;
      }

      // Filter out zero-quantity items
      state.inventory = state.inventory.filter(i => i.quantity > 0);

      // Reduce quantity
      updateExperimentalQuantity(experimentalId, Math.max(0, currentQuantity - 1));

      // Add to history
      state.experimentalRollHistory = [historyEntry, ...state.experimentalRollHistory];

      return historyEntry;
    };

    // Implementation of undoExperimentalRoll
    undoExperimentalRoll = (historyEntry) => {
      // Restore materials
      for (const material of historyEntry.materialsConsumed) {
        const invItem = state.inventory.find(i => i.item === material.item);
        if (invItem) {
          invItem.quantity += material.qty;
        } else {
          state.inventory.push({ item: material.item, quantity: material.qty });
        }
      }

      // Restore quantity
      updateExperimentalQuantity(historyEntry.experimentalId, historyEntry.previousQuantity);

      // Remove from history
      state.experimentalRollHistory = state.experimentalRollHistory.filter(h => h.id !== historyEntry.id);
    };
  });

  describe('performExperimentalRoll', () => {
    test('deducts correct materials from inventory', () => {
      performExperimentalRoll(1);

      // Deep Charge requires: 5x Atypical Disrupted Wake Echoes, 3x Galvanising Alloys, 1x Eccentric Hyperspace Trajectories
      expect(state.inventory.find(i => i.item === 'Atypical Disrupted Wake Echoes').quantity).toBe(15); // 20 - 5
      expect(state.inventory.find(i => i.item === 'Galvanising Alloys').quantity).toBe(7); // 10 - 3
      expect(state.inventory.find(i => i.item === 'Eccentric Hyperspace Trajectories').quantity).toBe(4); // 5 - 1
    });

    test('decreases experimental quantity by 1', () => {
      performExperimentalRoll(1);

      expect(updateExperimentalQuantity).toHaveBeenCalledWith(1, 2); // 3 - 1
      expect(state.selectedExperimentals[0].quantity).toBe(2);
    });

    test('adds entry to roll history', () => {
      performExperimentalRoll(1);

      expect(state.experimentalRollHistory).toHaveLength(1);
      expect(state.experimentalRollHistory[0].experimentalId).toBe(1);
      expect(state.experimentalRollHistory[0].moduleName).toBe('Frame Shift Drive');
      expect(state.experimentalRollHistory[0].experimentalName).toBe('Deep Charge');
      expect(state.experimentalRollHistory[0].previousQuantity).toBe(3);
    });

    test('records consumed materials in history', () => {
      performExperimentalRoll(1);

      const historyEntry = state.experimentalRollHistory[0];
      expect(historyEntry.materialsConsumed).toHaveLength(3);
      expect(historyEntry.materialsConsumed.find(m => m.item === 'Atypical Disrupted Wake Echoes').qty).toBe(5);
      expect(historyEntry.materialsConsumed.find(m => m.item === 'Galvanising Alloys').qty).toBe(3);
      expect(historyEntry.materialsConsumed.find(m => m.item === 'Eccentric Hyperspace Trajectories').qty).toBe(1);
    });

    test('throws error when materials are insufficient', () => {
      state.inventory = [{ item: 'Atypical Disrupted Wake Echoes', quantity: 2 }]; // Not enough

      expect(() => performExperimentalRoll(1)).toThrow(/Not enough/);
    });

    test('does nothing when quantity is 0', () => {
      state.selectedExperimentals[0].quantity = 0;

      performExperimentalRoll(1);

      // Inventory should remain unchanged
      expect(state.inventory.find(i => i.item === 'Atypical Disrupted Wake Echoes').quantity).toBe(20);
      expect(state.experimentalRollHistory).toHaveLength(0);
    });

    test('removes materials from inventory when quantity reaches 0', () => {
      state.inventory = [
        { item: 'Atypical Disrupted Wake Echoes', quantity: 5 },
        { item: 'Galvanising Alloys', quantity: 3 },
        { item: 'Eccentric Hyperspace Trajectories', quantity: 1 }
      ];

      performExperimentalRoll(1);

      // All materials should be consumed exactly
      expect(state.inventory).toHaveLength(0);
    });

    test('can perform multiple rolls consecutively', () => {
      performExperimentalRoll(1); // First roll: qty 3 -> 2
      performExperimentalRoll(1); // Second roll: qty 2 -> 1
      performExperimentalRoll(1); // Third roll: qty 1 -> 0

      expect(state.selectedExperimentals[0].quantity).toBe(0);
      expect(state.experimentalRollHistory).toHaveLength(3);
      expect(state.inventory.find(i => i.item === 'Atypical Disrupted Wake Echoes').quantity).toBe(5); // 20 - 15
    });
  });

  describe('undoExperimentalRoll', () => {
    test('restores materials to inventory', () => {
      const historyEntry = performExperimentalRoll(1);

      // Inventory after roll
      expect(state.inventory.find(i => i.item === 'Atypical Disrupted Wake Echoes').quantity).toBe(15);

      undoExperimentalRoll(historyEntry);

      // Inventory should be restored
      expect(state.inventory.find(i => i.item === 'Atypical Disrupted Wake Echoes').quantity).toBe(20);
      expect(state.inventory.find(i => i.item === 'Galvanising Alloys').quantity).toBe(10);
      expect(state.inventory.find(i => i.item === 'Eccentric Hyperspace Trajectories').quantity).toBe(5);
    });

    test('restores experimental quantity', () => {
      const historyEntry = performExperimentalRoll(1);

      expect(state.selectedExperimentals[0].quantity).toBe(2);

      undoExperimentalRoll(historyEntry);

      expect(updateExperimentalQuantity).toHaveBeenCalledWith(1, 3);
      expect(state.selectedExperimentals[0].quantity).toBe(3);
    });

    test('removes entry from roll history', () => {
      const historyEntry = performExperimentalRoll(1);

      expect(state.experimentalRollHistory).toHaveLength(1);

      undoExperimentalRoll(historyEntry);

      expect(state.experimentalRollHistory).toHaveLength(0);
    });

    test('adds materials back to inventory even if not present', () => {
      const historyEntry = performExperimentalRoll(1);

      // Remove all materials from inventory
      state.inventory = [];

      undoExperimentalRoll(historyEntry);

      // Materials should be restored
      expect(state.inventory.find(i => i.item === 'Atypical Disrupted Wake Echoes').quantity).toBe(5);
      expect(state.inventory.find(i => i.item === 'Galvanising Alloys').quantity).toBe(3);
      expect(state.inventory.find(i => i.item === 'Eccentric Hyperspace Trajectories').quantity).toBe(1);
    });

    test('can undo multiple rolls in reverse order', () => {
      const entry1 = performExperimentalRoll(1);
      const entry2 = performExperimentalRoll(1);
      const entry3 = performExperimentalRoll(1);

      expect(state.selectedExperimentals[0].quantity).toBe(0);
      expect(state.experimentalRollHistory).toHaveLength(3);

      // Undo in reverse order (most recent first)
      undoExperimentalRoll(entry3);
      expect(state.selectedExperimentals[0].quantity).toBe(1);

      undoExperimentalRoll(entry2);
      expect(state.selectedExperimentals[0].quantity).toBe(2);

      undoExperimentalRoll(entry1);
      expect(state.selectedExperimentals[0].quantity).toBe(3);

      // Inventory should be fully restored
      expect(state.inventory.find(i => i.item === 'Atypical Disrupted Wake Echoes').quantity).toBe(20);
      expect(state.experimentalRollHistory).toHaveLength(0);
    });
  });

  describe('Integration scenarios', () => {
    test('roll, undo, then roll again works correctly', () => {
      const historyEntry = performExperimentalRoll(1);

      expect(state.selectedExperimentals[0].quantity).toBe(2);
      expect(state.inventory.find(i => i.item === 'Atypical Disrupted Wake Echoes').quantity).toBe(15);

      undoExperimentalRoll(historyEntry);

      expect(state.selectedExperimentals[0].quantity).toBe(3);
      expect(state.inventory.find(i => i.item === 'Atypical Disrupted Wake Echoes').quantity).toBe(20);

      const newHistoryEntry = performExperimentalRoll(1);

      expect(state.selectedExperimentals[0].quantity).toBe(2);
      expect(state.inventory.find(i => i.item === 'Atypical Disrupted Wake Echoes').quantity).toBe(15);
      expect(state.experimentalRollHistory).toHaveLength(1);
      expect(newHistoryEntry.id).not.toBe(historyEntry.id); // New entry
    });

    test('multiple experimentals can be rolled independently', () => {
      state.selectedExperimentals.push({
        id: 2,
        module: 'Power Plant',
        experimental: 'Thermal Spread',
        quantity: 2
      });

      state.inventory.push(
        { item: 'Grid Resistors', quantity: 10 },
        { item: 'Vanadium', quantity: 6 },
        { item: 'Heat Vanes', quantity: 3 }
      );

      performExperimentalRoll(1); // Roll FSD experimental
      performExperimentalRoll(2); // Roll Power Plant experimental

      expect(state.experimentalRollHistory).toHaveLength(2);
      expect(state.experimentalRollHistory[0].experimentalId).toBe(2);
      expect(state.experimentalRollHistory[1].experimentalId).toBe(1);
    });

    test('undo works correctly with multiple different experimentals', () => {
      state.selectedExperimentals.push({
        id: 2,
        module: 'Power Plant',
        experimental: 'Thermal Spread',
        quantity: 2
      });

      state.inventory.push(
        { item: 'Grid Resistors', quantity: 10 },
        { item: 'Vanadium', quantity: 6 },
        { item: 'Heat Vanes', quantity: 3 }
      );

      const entry1 = performExperimentalRoll(1);
      const entry2 = performExperimentalRoll(2);

      undoExperimentalRoll(entry2); // Undo Power Plant roll

      // Only FSD roll should remain
      expect(state.experimentalRollHistory).toHaveLength(1);
      expect(state.experimentalRollHistory[0]).toBe(entry1);
      expect(state.experimentalRollHistory[0].experimentalId).toBe(1);

      // Power Plant materials should be restored
      expect(state.inventory.find(i => i.item === 'Grid Resistors').quantity).toBe(10);
      expect(state.inventory.find(i => i.item === 'Vanadium').quantity).toBe(6);
      expect(state.inventory.find(i => i.item === 'Heat Vanes').quantity).toBe(3);

      // FSD materials should still be consumed
      expect(state.inventory.find(i => i.item === 'Atypical Disrupted Wake Echoes').quantity).toBe(15);
    });
  });
});

/**
 * Unit tests for roll and trade undo functionality
 * These tests focus on the business logic of undo operations
 */

describe('Roll Undo Logic', () => {
  test('roll history entry contains all necessary information', () => {
    // Simulate creating a roll history entry
    const historyEntry = {
      id: Date.now(),
      blueprintId: 'test-bp-1',
      grade: 3,
      moduleName: 'Frame Shift Drive',
      blueprintName: 'Increased Range',
      materialsConsumed: [
        { item: 'Chromium', qty: 1 },
        { item: 'Mechanical Components', qty: 1 }
      ],
      previousRolls: 5
    };

    // Verify all required fields are present
    expect(historyEntry).toHaveProperty('id');
    expect(historyEntry).toHaveProperty('blueprintId');
    expect(historyEntry).toHaveProperty('grade');
    expect(historyEntry).toHaveProperty('moduleName');
    expect(historyEntry).toHaveProperty('blueprintName');
    expect(historyEntry).toHaveProperty('materialsConsumed');
    expect(historyEntry).toHaveProperty('previousRolls');

    // Verify data types
    expect(typeof historyEntry.id).toBe('number');
    expect(typeof historyEntry.blueprintId).toBe('string');
    expect(typeof historyEntry.grade).toBe('number');
    expect(typeof historyEntry.moduleName).toBe('string');
    expect(typeof historyEntry.blueprintName).toBe('string');
    expect(Array.isArray(historyEntry.materialsConsumed)).toBe(true);
    expect(typeof historyEntry.previousRolls).toBe('number');
  });

  test('materials consumed array contains item and qty', () => {
    const materialsConsumed = [
      { item: 'Chromium', qty: 1 },
      { item: 'Mechanical Components', qty: 1 }
    ];

    materialsConsumed.forEach(material => {
      expect(material).toHaveProperty('item');
      expect(material).toHaveProperty('qty');
      expect(typeof material.item).toBe('string');
      expect(typeof material.qty).toBe('number');
      expect(material.qty).toBeGreaterThan(0);
    });
  });

  test('undo roll should restore exact material quantities', () => {
    // Simulate inventory before roll
    const inventoryBeforeRoll = [
      { item: 'Chromium', quantity: 5 },
      { item: 'Mechanical Components', quantity: 3 }
    ];

    // Simulate inventory after roll (materials consumed)
    const inventoryAfterRoll = [
      { item: 'Chromium', quantity: 4 },
      { item: 'Mechanical Components', quantity: 2 }
    ];

    // Materials that were consumed
    const materialsConsumed = [
      { item: 'Chromium', qty: 1 },
      { item: 'Mechanical Components', qty: 1 }
    ];

    // Simulate undo - restore materials
    const restoredInventory = [...inventoryAfterRoll];
    materialsConsumed.forEach(material => {
      const item = restoredInventory.find(i => i.item === material.item);
      if (item) {
        item.quantity += material.qty;
      } else {
        restoredInventory.push({ item: material.item, quantity: material.qty });
      }
    });

    // Verify inventory matches original
    expect(restoredInventory).toEqual(inventoryBeforeRoll);
  });

  test('undo roll should handle materials not in inventory', () => {
    // Simulate inventory after roll with item completely consumed
    const inventoryAfterRoll = [
      { item: 'Chromium', quantity: 4 }
      // Mechanical Components was depleted to 0 and removed
    ];

    // Materials that were consumed
    const materialsConsumed = [
      { item: 'Chromium', qty: 1 },
      { item: 'Mechanical Components', qty: 1 }
    ];

    // Simulate undo - restore materials
    const restoredInventory = [...inventoryAfterRoll];
    materialsConsumed.forEach(material => {
      const item = restoredInventory.find(i => i.item === material.item);
      if (item) {
        item.quantity += material.qty;
      } else {
        // Item not in inventory, add it back
        restoredInventory.push({ item: material.item, quantity: material.qty });
      }
    });

    // Verify both materials are restored
    expect(restoredInventory).toContainEqual({ item: 'Chromium', quantity: 5 });
    expect(restoredInventory).toContainEqual({ item: 'Mechanical Components', quantity: 1 });
  });
});

describe('Trade Undo Logic', () => {
  test('trade history entry contains complete trade information', () => {
    const tradeHistoryEntry = {
      id: Date.now(),
      trade: {
        input: { item: 'Chromium', amount: 6, quality: 2 },
        output: { item: 'Vanadium', amount: 1, quality: 3 },
        action: 'UPGRADE',
        ratio: '6:1'
      }
    };

    // Verify structure
    expect(tradeHistoryEntry).toHaveProperty('id');
    expect(tradeHistoryEntry).toHaveProperty('trade');
    expect(tradeHistoryEntry.trade).toHaveProperty('input');
    expect(tradeHistoryEntry.trade).toHaveProperty('output');
    expect(tradeHistoryEntry.trade).toHaveProperty('action');

    // Verify input/output structure
    expect(tradeHistoryEntry.trade.input).toHaveProperty('item');
    expect(tradeHistoryEntry.trade.input).toHaveProperty('amount');
    expect(tradeHistoryEntry.trade.input).toHaveProperty('quality');
    expect(tradeHistoryEntry.trade.output).toHaveProperty('item');
    expect(tradeHistoryEntry.trade.output).toHaveProperty('amount');
    expect(tradeHistoryEntry.trade.output).toHaveProperty('quality');
  });

  test('undo trade restores input and removes output', () => {
    // Simulate inventory after trade
    // Started with 6 Chromium, traded all 6, got 1 Vanadium
    const inventoryAfterTrade = [
      { item: 'Vanadium', quantity: 1 }  // Received from trade
    ];

    const trade = {
      input: { item: 'Chromium', amount: 6, quality: 2 },
      output: { item: 'Vanadium', amount: 1, quality: 3 }
    };

    // Simulate undo
    const restoredInventory = [...inventoryAfterTrade];

    // Restore input materials
    const inputItem = restoredInventory.find(i => i.item === trade.input.item);
    if (inputItem) {
      inputItem.quantity += trade.input.amount;
    } else {
      restoredInventory.push({ item: trade.input.item, quantity: trade.input.amount });
    }

    // Remove output materials
    const outputItem = restoredInventory.find(i => i.item === trade.output.item);
    if (outputItem) {
      outputItem.quantity -= trade.output.amount;
    }

    // Filter out zero quantities
    const finalInventory = restoredInventory.filter(i => i.quantity > 0);

    // Should restore original 6 Chromium, remove Vanadium
    expect(finalInventory).toContainEqual({ item: 'Chromium', quantity: 6 });
    expect(finalInventory.find(i => i.item === 'Vanadium')).toBeUndefined();
  });

  test('undo trade handles trade without remainder', () => {
    const inventoryAfterTrade = [
      { item: 'Iron', quantity: 0 }, // Used all 6
      { item: 'Nickel', quantity: 1 } // Received from trade
    ];

    const trade = {
      input: { item: 'Iron', amount: 6, quality: 1 },
      output: { item: 'Nickel', amount: 1, quality: 2 }
    };

    // Simulate undo
    const restoredInventory = [...inventoryAfterTrade];

    // Restore input
    const inputItem = restoredInventory.find(i => i.item === trade.input.item);
    if (inputItem) {
      inputItem.quantity += trade.input.amount;
    } else {
      restoredInventory.push({ item: trade.input.item, quantity: trade.input.amount });
    }

    // Remove output
    const outputItem = restoredInventory.find(i => i.item === trade.output.item);
    if (outputItem) {
      outputItem.quantity -= trade.output.amount;
    }

    // Filter zeros
    const finalInventory = restoredInventory.filter(i => i.quantity > 0);

    // Should restore original 6 Iron, remove Nickel
    expect(finalInventory).toContainEqual({ item: 'Iron', quantity: 6 });
    expect(finalInventory.find(i => i.item === 'Nickel')).toBeUndefined();
  });
});

describe('History Management', () => {
  test('history array maintains chronological order', () => {
    const history = [];

    // Add entries with increasing timestamps
    const entry1 = { id: 1000, data: 'first' };
    const entry2 = { id: 2000, data: 'second' };
    const entry3 = { id: 3000, data: 'third' };

    // New entries are added to the front
    history.unshift(entry1);
    history.unshift(entry2);
    history.unshift(entry3);

    // Most recent should be first
    expect(history[0]).toEqual(entry3);
    expect(history[1]).toEqual(entry2);
    expect(history[2]).toEqual(entry1);
  });

  test('history slice limits display to 5 entries', () => {
    const history = [
      { id: 6, data: 'entry6' },
      { id: 5, data: 'entry5' },
      { id: 4, data: 'entry4' },
      { id: 3, data: 'entry3' },
      { id: 2, data: 'entry2' },
      { id: 1, data: 'entry1' }
    ];

    const displayedHistory = history.slice(0, 5);

    expect(displayedHistory.length).toBe(5);
    expect(displayedHistory[0].id).toBe(6);
    expect(displayedHistory[4].id).toBe(2);
    expect(displayedHistory.find(e => e.id === 1)).toBeUndefined();
  });

  test('removing entry from history filters by id', () => {
    const history = [
      { id: 3, data: 'entry3' },
      { id: 2, data: 'entry2' },
      { id: 1, data: 'entry1' }
    ];

    const idToRemove = 2;
    const updatedHistory = history.filter(h => h.id !== idToRemove);

    expect(updatedHistory.length).toBe(2);
    expect(updatedHistory.find(h => h.id === 2)).toBeUndefined();
    expect(updatedHistory).toContainEqual({ id: 3, data: 'entry3' });
    expect(updatedHistory).toContainEqual({ id: 1, data: 'entry1' });
  });
});

describe('Roll Count Edge Cases', () => {
  test('nullish coalescing operator correctly handles 0 rolls', () => {
    const blueprint = {
      rolls: {
        1: 0,  // Explicitly set to 0
        2: 5,
        3: undefined,  // Not set
        4: null        // Explicitly null
      }
    };

    // Using || would incorrectly treat 0 as falsy
    const grade1RollsWrong = blueprint.rolls[1] || 1;
    expect(grade1RollsWrong).toBe(1); // Wrong! Should be 0

    // Using ?? correctly handles 0
    const grade1RollsCorrect = blueprint.rolls[1] ?? 1;
    expect(grade1RollsCorrect).toBe(0); // Correct!

    const grade2Rolls = blueprint.rolls[2] ?? 1;
    expect(grade2Rolls).toBe(5); // Has value

    const grade3Rolls = blueprint.rolls[3] ?? 1;
    expect(grade3Rolls).toBe(1); // Undefined, use default

    const grade4Rolls = blueprint.rolls[4] ?? 1;
    expect(grade4Rolls).toBe(1); // Null, use default
  });

  test('performing roll decreases count correctly including to 0', () => {
    const currentRolls = 1;
    const newRolls = Math.max(0, currentRolls - 1);

    expect(newRolls).toBe(0);

    // Another roll attempt should not go negative
    const afterZero = Math.max(0, newRolls - 1);
    expect(afterZero).toBe(0);
  });
});

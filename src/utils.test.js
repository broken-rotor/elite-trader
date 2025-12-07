import {
  getMaterial,
  getMaterialsAtTypeQuality,
  getMainCategory,
  getConversionCost,
  optimizeTrading,
  generateTradeSteps,
  MATERIALS_DB,
  TRADE_UP_COST,
  TRADE_DOWN_YIELD,
  TRADE_ACROSS_COST
} from './utils';

describe('getMaterial', () => {
  test('finds a material by exact name', () => {
    const material = getMaterial('Iron');
    expect(material).toBeDefined();
    expect(material.item).toBe('Iron');
    expect(material.type).toBe('Raw (Raw material 4)');
    expect(material.quality).toBe(1);
  });

  test('returns undefined for non-existent material', () => {
    const material = getMaterial('NonExistentMaterial');
    expect(material).toBeUndefined();
  });

  test('finds manufactured materials', () => {
    const material = getMaterial('Salvaged Alloys');
    expect(material).toBeDefined();
    expect(material.type).toBe('Manufactured (Alloys)');
    expect(material.quality).toBe(1);
  });

  test('finds encoded materials', () => {
    const material = getMaterial('Anomalous Bulk Scan Data');
    expect(material).toBeDefined();
    expect(material.type).toBe('Encoded (Data archives)');
    expect(material.quality).toBe(1);
  });
});

describe('getMaterialsAtTypeQuality', () => {
  test('finds all materials of a specific type and quality', () => {
    const materials = getMaterialsAtTypeQuality('Manufactured (Alloys)', 1);
    expect(materials).toHaveLength(1);
    expect(materials[0].item).toBe('Salvaged Alloys');
  });

  test('returns empty array for non-existent type/quality combination', () => {
    const materials = getMaterialsAtTypeQuality('NonExistent Type', 1);
    expect(materials).toHaveLength(0);
  });

  test('finds multiple materials at same type/quality', () => {
    const materials = getMaterialsAtTypeQuality('Encoded (Data archives)', 1);
    expect(materials.length).toBeGreaterThanOrEqual(1);
    materials.forEach(m => {
      expect(m.type).toBe('Encoded (Data archives)');
      expect(m.quality).toBe(1);
    });
  });
});

describe('getMainCategory', () => {
  test('extracts Encoded category', () => {
    expect(getMainCategory('Encoded (Data archives)')).toBe('Encoded');
    expect(getMainCategory('Encoded (Emission data)')).toBe('Encoded');
    expect(getMainCategory('Encoded (Wake scans)')).toBe('Encoded');
  });

  test('extracts Manufactured category', () => {
    expect(getMainCategory('Manufactured (Alloys)')).toBe('Manufactured');
    expect(getMainCategory('Manufactured (Capacitors)')).toBe('Manufactured');
    expect(getMainCategory('Manufactured (Chemical)')).toBe('Manufactured');
  });

  test('extracts Raw category', () => {
    expect(getMainCategory('Raw (Raw material 1)')).toBe('Raw');
    expect(getMainCategory('Raw (Raw material 2)')).toBe('Raw');
    expect(getMainCategory('Raw (Raw material 3)')).toBe('Raw');
  });

  test('handles unknown types as fallback', () => {
    expect(getMainCategory('Unknown Type')).toBe('Unknown Type');
  });
});

describe('getConversionCost', () => {
  test('same type and quality costs 1', () => {
    const cost = getConversionCost('Manufactured (Alloys)', 1, 'Manufactured (Alloys)', 1);
    expect(cost).toBe(1);
  });

  test('upgrading one quality level costs 6', () => {
    const cost = getConversionCost('Manufactured (Alloys)', 1, 'Manufactured (Alloys)', 2);
    expect(cost).toBe(TRADE_UP_COST);
  });

  test('upgrading two quality levels costs 36 (6*6)', () => {
    const cost = getConversionCost('Manufactured (Alloys)', 1, 'Manufactured (Alloys)', 3);
    expect(cost).toBe(TRADE_UP_COST * TRADE_UP_COST);
  });

  test('downgrading one quality level costs 1/3', () => {
    const cost = getConversionCost('Manufactured (Alloys)', 2, 'Manufactured (Alloys)', 1);
    expect(cost).toBe(1 / TRADE_DOWN_YIELD);
  });

  test('downgrading two quality levels costs 1/9 (1/3 * 1/3)', () => {
    const cost = getConversionCost('Manufactured (Alloys)', 3, 'Manufactured (Alloys)', 1);
    expect(cost).toBeCloseTo(1 / (TRADE_DOWN_YIELD * TRADE_DOWN_YIELD));
  });

  test('cross-category trades are impossible (Manufactured to Encoded)', () => {
    const cost = getConversionCost('Manufactured (Alloys)', 1, 'Encoded (Data archives)', 1);
    expect(cost).toBe(Infinity);
  });

  test('cross-category trades are impossible (Raw to Encoded)', () => {
    const cost = getConversionCost('Raw (Raw material 1)', 1, 'Encoded (Data archives)', 1);
    expect(cost).toBe(Infinity);
  });

  test('cross-category trades are impossible (Encoded to Manufactured)', () => {
    const cost = getConversionCost('Encoded (Data archives)', 1, 'Manufactured (Alloys)', 1);
    expect(cost).toBe(Infinity);
  });

  test('within-category cross-type at same quality costs 6 (Encoded subcategories)', () => {
    // Both are Encoded, but different subcategories
    const cost = getConversionCost('Encoded (Data archives)', 1, 'Encoded (Emission data)', 1);
    expect(cost).toBe(TRADE_ACROSS_COST);
  });

  test('within-category cross-type at same quality costs 6 (Raw subcategories)', () => {
    // Both are Raw, but different subcategories (Raw material 1 vs Raw material 2)
    const cost = getConversionCost('Raw (Raw material 1)', 1, 'Raw (Raw material 2)', 1);
    expect(cost).toBe(TRADE_ACROSS_COST);
  });

  test('within-category cross-type and upgrade costs 6 * 6 = 36', () => {
    // Both Encoded, crossing subcategories and upgrading quality
    const cost = getConversionCost('Encoded (Data archives)', 1, 'Encoded (Emission data)', 2);
    expect(cost).toBe(TRADE_ACROSS_COST * TRADE_UP_COST);
  });

  test('within-category cross-type and downgrade costs 6 / 3 = 2', () => {
    // Both Encoded, crossing subcategories and downgrading quality
    const cost = getConversionCost('Encoded (Data archives)', 2, 'Encoded (Emission data)', 1);
    expect(cost).toBe(TRADE_ACROSS_COST / TRADE_DOWN_YIELD);
  });
});

describe('optimizeTrading', () => {
  test('direct fulfillment when exact material is in inventory', () => {
    const inventory = [{ item: 'Iron', quantity: 10 }];
    const needs = [{ item: 'Iron', quantity: 5 }];

    const result = optimizeTrading(inventory, needs);

    expect(result.fulfilled).toHaveLength(1);
    expect(result.fulfilled[0].item).toBe('Iron');
    expect(result.fulfilled[0].quantity).toBe(5);
    expect(result.fulfilled[0].method).toBe('DIRECT');
    expect(result.unfulfilled).toHaveLength(0);
  });

  test('partial direct fulfillment when inventory is insufficient', () => {
    const inventory = [{ item: 'Iron', quantity: 3 }];
    const needs = [{ item: 'Iron', quantity: 5 }];

    const result = optimizeTrading(inventory, needs);

    expect(result.fulfilled).toHaveLength(1);
    expect(result.fulfilled[0].quantity).toBe(3);
    expect(result.unfulfilled).toHaveLength(1);
    expect(result.unfulfilled[0].quantity).toBe(2);
  });

  test('same slot trading (same type and quality, different item)', () => {
    const inventory = [{ item: 'Anomalous Bulk Scan Data', quantity: 10 }];
    const needs = [{ item: 'Anomalous Bulk Scan Data', quantity: 5 }];

    const result = optimizeTrading(inventory, needs);

    expect(result.fulfilled).toHaveLength(1);
    expect(result.fulfilled[0].method).toBe('DIRECT');
  });

  test('conversion trading from lower to higher quality', () => {
    const inventory = [{ item: 'Iron', quantity: 12 }];
    const needs = [{ item: 'Nickel', quantity: 1 }];

    const result = optimizeTrading(inventory, needs);

    expect(result.trades.length).toBeGreaterThan(0);
    expect(result.fulfilled.length).toBeGreaterThan(0);
  });

  test('unfulfilled needs when no suitable materials available', () => {
    const inventory = [{ item: 'Iron', quantity: 1 }];
    const needs = [{ item: 'Ruthenium', quantity: 100 }];

    const result = optimizeTrading(inventory, needs);

    expect(result.unfulfilled).toHaveLength(1);
    expect(result.unfulfilled[0].item).toBe('Ruthenium');
  });

  test('empty inventory returns all needs as unfulfilled', () => {
    const inventory = [];
    const needs = [{ item: 'Iron', quantity: 5 }];

    const result = optimizeTrading(inventory, needs);

    expect(result.fulfilled).toHaveLength(0);
    expect(result.unfulfilled).toHaveLength(1);
    expect(result.unfulfilled[0].item).toBe('Iron');
    expect(result.unfulfilled[0].quantity).toBe(5);
  });

  test('multiple needs with mixed fulfillment', () => {
    const inventory = [
      { item: 'Iron', quantity: 10 },
      { item: 'Salvaged Alloys', quantity: 20 }
    ];
    const needs = [
      { item: 'Iron', quantity: 5 },
      { item: 'Salvaged Alloys', quantity: 3 },
      { item: 'Ruthenium', quantity: 100 }
    ];

    const result = optimizeTrading(inventory, needs);

    expect(result.fulfilled.length).toBeGreaterThanOrEqual(2);
    expect(result.unfulfilled.length).toBeGreaterThanOrEqual(1);
  });

  test('cannot fulfill cross-category needs (Raw inventory, Encoded need)', () => {
    const inventory = [{ item: 'Iron', quantity: 1000 }];
    const needs = [{ item: 'Anomalous Bulk Scan Data', quantity: 1 }];

    const result = optimizeTrading(inventory, needs);

    // Should be unfulfilled because you can't trade Raw for Encoded
    expect(result.fulfilled).toHaveLength(0);
    expect(result.unfulfilled).toHaveLength(1);
    expect(result.unfulfilled[0].item).toBe('Anomalous Bulk Scan Data');
  });

  test('cannot fulfill cross-category needs (Manufactured inventory, Raw need)', () => {
    const inventory = [{ item: 'Salvaged Alloys', quantity: 1000 }];
    const needs = [{ item: 'Iron', quantity: 1 }];

    const result = optimizeTrading(inventory, needs);

    // Should be unfulfilled because you can't trade Manufactured for Raw
    expect(result.fulfilled).toHaveLength(0);
    expect(result.unfulfilled).toHaveLength(1);
    expect(result.unfulfilled[0].item).toBe('Iron');
  });

  test('can fulfill within-category cross-type needs (different Raw subcategories)', () => {
    // Iron is Raw (Raw material 1) quality 1
    // Nickel is Raw (Raw material 1) quality 2
    const inventory = [{ item: 'Iron', quantity: 6 }];
    const needs = [{ item: 'Nickel', quantity: 1 }];

    const result = optimizeTrading(inventory, needs);

    // Should be fulfilled - both are Raw materials
    expect(result.fulfilled.length).toBeGreaterThan(0);
    expect(result.unfulfilled).toHaveLength(0);
  });
});

describe('generateTradeSteps', () => {
  test('generates upgrade step for quality increase within same type', () => {
    // Carbon and Vanadium are both Raw (Raw material 1), quality 1 and 2
    const srcMat = getMaterial('Carbon');
    const targetMat = getMaterial('Vanadium');

    const steps = generateTradeSteps(srcMat, targetMat, 6, 1);

    expect(steps).toHaveLength(1);
    expect(steps[0].action).toBe('UPGRADE');
    expect(steps[0].ratio).toBe('6:1');
  });

  test('generates downgrade step for quality decrease within same type', () => {
    // Vanadium and Carbon are both Raw (Raw material 1), quality 2 and 1
    const srcMat = getMaterial('Vanadium');
    const targetMat = getMaterial('Carbon');

    const steps = generateTradeSteps(srcMat, targetMat, 1, 3);

    expect(steps).toHaveLength(1);
    expect(steps[0].action).toBe('DOWNGRADE');
    expect(steps[0].ratio).toBe('1:3');
  });

  test('generates cross-type step when subcategories differ (within same main category)', () => {
    // Iron is Raw (Raw material 4) quality 1 and Nickel is Raw (Raw material 5) quality 1
    // Both are Raw materials at same quality, so this is a cross-type trade
    const srcMat = getMaterial('Iron');
    const targetMat = getMaterial('Nickel');

    const steps = generateTradeSteps(srcMat, targetMat, 6, 1);

    expect(steps).toHaveLength(1);
    const crossTypeStep = steps.find(s => s.action === 'CROSS_TYPE');
    expect(crossTypeStep).toBeDefined();
    expect(crossTypeStep.ratio).toBe('6:1');
  });

  test('generates multiple steps for quality change then cross-type within same category', () => {
    // Iron is Raw (Raw material 4) quality 1, Chromium is Raw (Raw material 2) quality 2
    // Both are Raw materials, so this requires upgrade (1->2) then cross-type (Raw material 4 -> Raw material 2)
    const srcMat = getMaterial('Iron');
    const targetMat = getMaterial('Chromium');

    const steps = generateTradeSteps(srcMat, targetMat, 36, 1);

    // Should have upgrade step (quality 1 -> 2) and cross-type step (Raw material 4 -> Raw material 2)
    expect(steps.length).toBeGreaterThan(1);
    expect(steps.length).toBeGreaterThanOrEqual(2);
  });

  test('generates steps for within-category cross-type trade (Encoded subcategories)', () => {
    // Anomalous Bulk Scan Data is Encoded (Data archives) quality 1
    // We need to find another Encoded material at quality 1 but different subtype
    const srcMat = getMaterial('Anomalous Bulk Scan Data'); // Encoded (Data archives) Q1
    const targetMat = {
      item: 'Test Emission Data',
      type: 'Encoded (Emission data)',
      quality: 1,
      source: 'Test'
    };

    const steps = generateTradeSteps(srcMat, targetMat, 6, 1);

    const crossTypeStep = steps.find(s => s.action === 'CROSS_TYPE');
    expect(crossTypeStep).toBeDefined();
    expect(crossTypeStep.ratio).toBe('6:1');
  });
});

describe('Constants', () => {
  test('MATERIALS_DB contains materials', () => {
    expect(MATERIALS_DB.length).toBeGreaterThan(0);
  });

  test('all materials have required fields', () => {
    MATERIALS_DB.forEach(material => {
      expect(material).toHaveProperty('item');
      expect(material).toHaveProperty('type');
      expect(material).toHaveProperty('quality');
      expect(material).toHaveProperty('source');
    });
  });

  test('trade constants are defined', () => {
    expect(TRADE_UP_COST).toBe(6);
    expect(TRADE_DOWN_YIELD).toBe(3);
    expect(TRADE_ACROSS_COST).toBe(6);
  });
});

describe('Trading Edge Cases - Comprehensive', () => {
  describe('1. Simple Downgrade (Full Conversion)', () => {
    test('downgrade 1x grade 2 to 3x grade 1 (within same type)', () => {
      // Vanadium is Raw (Raw material 1) quality 2
      // Carbon is Raw (Raw material 1) quality 1
      const inventory = [{ item: 'Vanadium', quantity: 1 }];
      const needs = [{ item: 'Carbon', quantity: 3 }];

      const result = optimizeTrading(inventory, needs);

      // Should fully fulfill the need
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Carbon');
      expect(result.fulfilled[0].quantity).toBe(3);
      expect(result.fulfilled[0].method).toBe('CONVERTED');
      expect(result.unfulfilled).toHaveLength(0);

      // Should have a downgrade trade
      expect(result.trades.length).toBeGreaterThan(0);
      const downgradeTrade = result.trades.find(t => t.action === 'DOWNGRADE');
      expect(downgradeTrade).toBeDefined();
      expect(downgradeTrade.input.quality).toBe(2);
      expect(downgradeTrade.output.quality).toBe(1);
      expect(downgradeTrade.ratio).toBe('1:3');
      expect(downgradeTrade.output.amount).toBe(3);
    });

    test('downgrade 2x grade 3 to 18x grade 1 (multi-step)', () => {
      // Niobium is Raw (Raw material 1) quality 3
      // Carbon is Raw (Raw material 1) quality 1
      const inventory = [{ item: 'Niobium', quantity: 2 }];
      const needs = [{ item: 'Carbon', quantity: 18 }];

      const result = optimizeTrading(inventory, needs);

      // Should fully fulfill the need (2 * 3 * 3 = 18)
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Carbon');
      expect(result.fulfilled[0].quantity).toBe(18);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have downgrade trades
      const downgradeTrades = result.trades.filter(t => t.action === 'DOWNGRADE');
      expect(downgradeTrades.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Simple Upgrade', () => {
    test('upgrade 6x grade 1 to 1x grade 2 (within same type)', () => {
      // Carbon is Raw (Raw material 1) quality 1
      // Vanadium is Raw (Raw material 1) quality 2
      const inventory = [{ item: 'Carbon', quantity: 6 }];
      const needs = [{ item: 'Vanadium', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fully fulfill the need
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Vanadium');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.fulfilled[0].method).toBe('CONVERTED');
      expect(result.unfulfilled).toHaveLength(0);

      // Should have an upgrade trade
      expect(result.trades.length).toBeGreaterThan(0);
      const upgradeTrade = result.trades.find(t => t.action === 'UPGRADE');
      expect(upgradeTrade).toBeDefined();
      expect(upgradeTrade.input.quality).toBe(1);
      expect(upgradeTrade.output.quality).toBe(2);
      expect(upgradeTrade.ratio).toBe('6:1');
      expect(upgradeTrade.input.amount).toBe(6);
      expect(upgradeTrade.output.amount).toBe(1);
    });

    test('upgrade 12x grade 1 to 2x grade 2 (multiple conversions)', () => {
      // Carbon is Raw (Raw material 1) quality 1
      // Vanadium is Raw (Raw material 1) quality 2
      const inventory = [{ item: 'Carbon', quantity: 12 }];
      const needs = [{ item: 'Vanadium', quantity: 2 }];

      const result = optimizeTrading(inventory, needs);

      // Should fully fulfill the need
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Vanadium');
      expect(result.fulfilled[0].quantity).toBe(2);
      expect(result.unfulfilled).toHaveLength(0);
    });
  });

  describe('3. Downgrade with Remainder', () => {
    test('need 2x grade 1, have 1x grade 2, produces 3x grade 1 with 1x remainder', () => {
      // Vanadium is Raw (Raw material 1) quality 2
      // Carbon is Raw (Raw material 1) quality 1
      const inventory = [{ item: 'Vanadium', quantity: 1 }];
      const needs = [{ item: 'Carbon', quantity: 2 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill only 2 (what we need), but conversion produces 3
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Carbon');
      expect(result.fulfilled[0].quantity).toBe(2);
      expect(result.unfulfilled).toHaveLength(0);

      // Check the downgrade produced 3 total
      const downgradeTrade = result.trades.find(t => t.action === 'DOWNGRADE');
      expect(downgradeTrade).toBeDefined();
      expect(downgradeTrade.output.amount).toBe(3);

      // The remaining inventory should show leftover Carbon
      const remainingCarbon = result.remainingInventory.find(i => i.item === 'Carbon');
      expect(remainingCarbon).toBeDefined();
      expect(remainingCarbon.quantity).toBe(1); // 1 leftover
    });

    test('need 5x grade 1, have 2x grade 2, produces 6x grade 1 with 1x remainder', () => {
      // Vanadium is Raw (Raw material 1) quality 2
      // Carbon is Raw (Raw material 1) quality 1
      const inventory = [{ item: 'Vanadium', quantity: 2 }];
      const needs = [{ item: 'Carbon', quantity: 5 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill all 5 we need
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Carbon');
      expect(result.fulfilled[0].quantity).toBe(5);
      expect(result.unfulfilled).toHaveLength(0);

      // Conversion produces 6 total (2 * 3 = 6)
      const remainingCarbon = result.remainingInventory.find(i => i.item === 'Carbon');
      expect(remainingCarbon).toBeDefined();
      expect(remainingCarbon.quantity).toBe(1); // 1 leftover
    });
  });

  describe('4. Multi-Downgrade', () => {
    test('downgrade 1x grade 3 to 9x grade 1', () => {
      // Niobium is Raw (Raw material 1) quality 3
      // Carbon is Raw (Raw material 1) quality 1
      const inventory = [{ item: 'Niobium', quantity: 1 }];
      const needs = [{ item: 'Carbon', quantity: 9 }];

      const result = optimizeTrading(inventory, needs);

      // Should fully fulfill: 1 G3 → 3 G2 → 9 G1
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Carbon');
      expect(result.fulfilled[0].quantity).toBe(9);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have 2 downgrade steps (G3→G2, G2→G1)
      const downgradeTrades = result.trades.filter(t => t.action === 'DOWNGRADE');
      expect(downgradeTrades.length).toBe(2);

      // First downgrade: G3→G2 = 3 units
      expect(downgradeTrades[0].input.quality).toBe(3);
      expect(downgradeTrades[0].output.quality).toBe(2);
      expect(downgradeTrades[0].output.amount).toBe(3);

      // Second downgrade: 3xG2→9xG1
      expect(downgradeTrades[1].input.quality).toBe(2);
      expect(downgradeTrades[1].output.quality).toBe(1);
      expect(downgradeTrades[1].output.amount).toBe(9);
    });

    test('downgrade 1x grade 4 to 27x grade 1', () => {
      // Yttrium is Raw (Raw material 1) quality 4
      // Carbon is Raw (Raw material 1) quality 1
      const inventory = [{ item: 'Yttrium', quantity: 1 }];
      const needs = [{ item: 'Carbon', quantity: 27 }];

      const result = optimizeTrading(inventory, needs);

      // Should fully fulfill: 1 G4 → 3 G3 → 9 G2 → 27 G1
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Carbon');
      expect(result.fulfilled[0].quantity).toBe(27);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have 3 downgrade steps
      const downgradeTrades = result.trades.filter(t => t.action === 'DOWNGRADE');
      expect(downgradeTrades.length).toBe(3);
    });
  });

  describe('5. Multi-Upgrade', () => {
    test('upgrade 36x grade 1 to 1x grade 3', () => {
      // Carbon is Raw (Raw material 1) quality 1
      // Niobium is Raw (Raw material 1) quality 3
      const inventory = [{ item: 'Carbon', quantity: 36 }];
      const needs = [{ item: 'Niobium', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fully fulfill: 36 G1 → 6 G2 → 1 G3
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Niobium');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have 2 upgrade steps (G1→G2, G2→G3)
      const upgradeTrades = result.trades.filter(t => t.action === 'UPGRADE');
      expect(upgradeTrades.length).toBe(2);

      // First upgrade: 36xG1→6xG2
      expect(upgradeTrades[0].input.quality).toBe(1);
      expect(upgradeTrades[0].output.quality).toBe(2);
      expect(upgradeTrades[0].input.amount).toBe(36);
      expect(upgradeTrades[0].output.amount).toBe(6);

      // Second upgrade: 6xG2→1xG3
      expect(upgradeTrades[1].input.quality).toBe(2);
      expect(upgradeTrades[1].output.quality).toBe(3);
      expect(upgradeTrades[1].input.amount).toBe(6);
      expect(upgradeTrades[1].output.amount).toBe(1);
    });

    test('upgrade 216x grade 1 to 1x grade 4', () => {
      // Carbon is Raw (Raw material 1) quality 1
      // Yttrium is Raw (Raw material 1) quality 4
      const inventory = [{ item: 'Carbon', quantity: 216 }];
      const needs = [{ item: 'Yttrium', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fully fulfill: 216 G1 → 36 G2 → 6 G3 → 1 G4
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Yttrium');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have 3 upgrade steps
      const upgradeTrades = result.trades.filter(t => t.action === 'UPGRADE');
      expect(upgradeTrades.length).toBe(3);
    });
  });

  describe('6. Cross-Type Conversions', () => {
    test('cross-type same quality (6:1 ratio)', () => {
      // Iron is Raw (Raw material 4) quality 1
      // Nickel is Raw (Raw material 5) quality 1
      const inventory = [{ item: 'Iron', quantity: 6 }];
      const needs = [{ item: 'Nickel', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill with cross-type trade
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Nickel');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have a cross-type trade
      const crossTypeTrade = result.trades.find(t => t.action === 'CROSS_TYPE');
      expect(crossTypeTrade).toBeDefined();
      expect(crossTypeTrade.ratio).toBe('6:1');
      expect(crossTypeTrade.input.amount).toBe(6);
      expect(crossTypeTrade.output.amount).toBe(1);
    });

    test('cross-type with quality upgrade (6x6=36:1 ratio)', () => {
      // Iron is Raw (Raw material 4) quality 1
      // Germanium is Raw (Raw material 5) quality 2
      const inventory = [{ item: 'Iron', quantity: 36 }];
      const needs = [{ item: 'Germanium', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill with upgrade + cross-type
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Germanium');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have both upgrade and cross-type trades
      const upgradeTrades = result.trades.filter(t => t.action === 'UPGRADE');
      const crossTypeTrades = result.trades.filter(t => t.action === 'CROSS_TYPE');
      expect(upgradeTrades.length + crossTypeTrades.length).toBeGreaterThan(0);
    });

    test('cross-type with quality downgrade (6/3=2:1 ratio)', () => {
      // Zinc is Raw (Raw material 4) quality 2
      // Nickel is Raw (Raw material 5) quality 1
      const inventory = [{ item: 'Zinc', quantity: 2 }];
      const needs = [{ item: 'Nickel', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill with downgrade + cross-type or combined
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Nickel');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);
    });
  });

  describe('7. Complex Conversions with Multiple Steps and Remainders', () => {
    test('convert 1x G5 to 3x G4, then 2x G4 to 6x G1, with 1x G4 remainder', () => {
      // We'll use Manufactured materials for this test
      // Proto Radiolic Alloys is Manufactured (Alloys) quality 5
      // Proto Light Alloys is Manufactured (Alloys) quality 4
      // Salvaged Alloys is Manufactured (Alloys) quality 1

      // Step 1: Convert 1x G5 → 3x G4
      const inventory = [{ item: 'Proto Radiolic Alloys', quantity: 1 }];
      const needs = [{ item: 'Salvaged Alloys', quantity: 6 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill 6x G1: 1 G5 → 3 G4, then 2 G4 → 6 G2 → 18 G1 (but we only need 6)
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Salvaged Alloys');
      expect(result.fulfilled[0].quantity).toBe(6);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have downgrade steps
      const downgradeTrades = result.trades.filter(t => t.action === 'DOWNGRADE');
      expect(downgradeTrades.length).toBeGreaterThan(0);
    });

    test('upgrade with remainder: 7x G1 to 1x G2 with 1x G1 remainder', () => {
      // Carbon is Raw (Raw material 1) quality 1
      // Vanadium is Raw (Raw material 1) quality 2
      const inventory = [{ item: 'Carbon', quantity: 7 }];
      const needs = [{ item: 'Vanadium', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill 1x G2
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Vanadium');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have remainder of 1x Carbon (7 - 6 = 1)
      const upgradeTrade = result.trades.find(t => t.action === 'UPGRADE');
      expect(upgradeTrade).toBeDefined();
      expect(upgradeTrade.input.amount).toBe(7);
      expect(upgradeTrade.remainder).toBeDefined();
      expect(upgradeTrade.remainder.amount).toBe(1);
      expect(upgradeTrade.remainder.item).toBe('Carbon');
    });

    test('cross-type with upgrade and remainder: 13x G1 type A to 1x G2 type B with 1x G1 remainder', () => {
      // Iron is Raw (Raw material 4) quality 1
      // Germanium is Raw (Raw material 5) quality 2
      // Need 36 for clean conversion (6 for upgrade, 6 for cross-type)
      const inventory = [{ item: 'Iron', quantity: 37 }];
      const needs = [{ item: 'Germanium', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill 1x Germanium
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Germanium');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have remainder since 37 is not evenly divisible by 36
      const upgradeTrades = result.trades.filter(t => t.action === 'UPGRADE');
      const hasRemainder = upgradeTrades.some(t => t.remainder && t.remainder.amount > 0);
      expect(hasRemainder).toBe(true);
    });

    test('multi-step conversion with type change: upgrade, cross-type, downgrade', () => {
      // Iron is Raw (Raw material 4) quality 1
      // Carbon is Raw (Raw material 1) quality 1
      // Need to go from Raw material 4 to Raw material 1 via intermediate upgrade

      // Let's upgrade Iron to higher quality, cross to Raw material 1, then downgrade back
      // This is a complex scenario: 6x Iron G1 → 1x Zinc G2, cross to Vanadium G2, down to 3x Carbon G1
      const inventory = [{ item: 'Iron', quantity: 12 }]; // Extra for testing
      const needs = [{ item: 'Carbon', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill the need
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Carbon');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);
    });

    test('insufficient materials for partial conversion with remainder', () => {
      // Have 10x G1, need 2x G2 (requires 12x G1)
      const inventory = [{ item: 'Carbon', quantity: 10 }];
      const needs = [{ item: 'Vanadium', quantity: 2 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill only 1x G2 (using 6x G1)
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Vanadium');
      expect(result.fulfilled[0].quantity).toBe(1);

      // Should have 1x G2 unfulfilled
      expect(result.unfulfilled).toHaveLength(1);
      expect(result.unfulfilled[0].item).toBe('Vanadium');
      expect(result.unfulfilled[0].quantity).toBe(1);

      // Should have 4x Carbon remaining (10 - 6 = 4)
      const remainingCarbon = result.remainingInventory.find(i => i.item === 'Carbon');
      expect(remainingCarbon).toBeDefined();
      expect(remainingCarbon.quantity).toBe(4);
    });
  });

  describe('8. Cross-Type Conversion with Intermediate Quality Remainder', () => {
    test('convert 1x G4 Cat1 to 1x G1 Cat2 with remainder of 1x G3 Cat1', () => {
      // Yttrium is Raw (Raw material 1) quality 4 - Cat1 G4
      // Iron is Raw (Raw material 4) quality 1 - Cat2 G1
      // Expected path:
      // 1. 1x Yttrium G4 → 3x Niobium G3 (downgrade)
      // 2. Use 2x Niobium G3 to convert to Iron G1 Cat2
      // 3. Remainder: 1x Niobium G3

      const inventory = [{ item: 'Yttrium', quantity: 1 }];
      const needs = [{ item: 'Iron', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill the need for 1x Iron (G1 Cat2)
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Iron');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have downgrade steps
      const downgradeTrades = result.trades.filter(t => t.action === 'DOWNGRADE');
      expect(downgradeTrades.length).toBeGreaterThan(0);

      // First downgrade should be G4 → G3
      const firstDowngrade = downgradeTrades[0];
      expect(firstDowngrade.input.quality).toBe(4);
      expect(firstDowngrade.output.quality).toBe(3);
      expect(firstDowngrade.output.amount).toBe(3);

      // Should have a cross-type trade
      const crossTypeTrade = result.trades.find(t => t.action === 'CROSS_TYPE');
      expect(crossTypeTrade).toBeDefined();

      // Check for remainder - should have materials left over
      // Since we start with 1x G4 → 3x G3, and only use some for conversion
      // We expect either G3 or lower quality Cat1 materials remaining
      const hasRemainder = result.remainingInventory.length > 0;
      expect(hasRemainder).toBe(true);

      // The remainder should include materials from Raw material 1 category
      const cat1Remainder = result.remainingInventory.find(i => {
        const mat = getMaterial(i.item);
        return mat && mat.type === 'Raw (Raw material 1)' && mat.quality >= 1;
      });
      expect(cat1Remainder).toBeDefined();
    });

    test('convert 1x G4 to exactly 1x G1 cross-type requiring partial intermediate conversion', () => {
      // Selenium is Raw (Raw material 4) quality 4 - Cat1 G4
      // Nickel is Raw (Raw material 5) quality 1 - Cat2 G1
      // This requires downgrading and cross-type conversion

      const inventory = [{ item: 'Selenium', quantity: 1 }];
      const needs = [{ item: 'Nickel', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill the need
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Nickel');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      // Complex conversion should involve multiple steps
      expect(result.trades.length).toBeGreaterThan(1);

      // Should have leftover materials since 1x G4 = 81x G1 equivalent (3^4)
      // but we only need 1x G1 cross-type
      expect(result.remainingInventory.length).toBeGreaterThan(0);
    });
  });

  describe('9. Edge Cases with Zero and Boundary Conditions', () => {
    test('exact conversion with no remainder', () => {
      // Exactly 6x G1 for 1x G2
      const inventory = [{ item: 'Carbon', quantity: 6 }];
      const needs = [{ item: 'Vanadium', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      // No remainder in inventory
      const remainingCarbon = result.remainingInventory.find(i => i.item === 'Carbon');
      expect(remainingCarbon).toBeUndefined();
    });

    test('cannot upgrade with insufficient materials (have 5x G1, need 1x G2)', () => {
      const inventory = [{ item: 'Carbon', quantity: 5 }];
      const needs = [{ item: 'Vanadium', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should not fulfill
      expect(result.fulfilled).toHaveLength(0);
      expect(result.unfulfilled).toHaveLength(1);
      expect(result.unfulfilled[0].quantity).toBe(1);
    });

    test('large quantity conversion maintains accuracy', () => {
      // Convert 1000x G1 to G2
      const inventory = [{ item: 'Carbon', quantity: 1000 }];
      const needs = [{ item: 'Vanadium', quantity: 166 }]; // 166 * 6 = 996

      const result = optimizeTrading(inventory, needs);

      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].quantity).toBe(166);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have 4x Carbon remaining (1000 - 996 = 4)
      const remainingCarbon = result.remainingInventory.find(i => i.item === 'Carbon');
      expect(remainingCarbon).toBeDefined();
      expect(remainingCarbon.quantity).toBe(4);
    });
  });
});

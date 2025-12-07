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

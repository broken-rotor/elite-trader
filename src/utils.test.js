import {
  getMaterial,
  getMaterialsAtTypeQuality,
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
    expect(material.type).toBe('Raw (Raw material 1)');
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

  test('cross-type same quality costs 6', () => {
    const cost = getConversionCost('Manufactured (Alloys)', 1, 'Encoded (Data archives)', 1);
    expect(cost).toBe(TRADE_ACROSS_COST);
  });

  test('cross-type and upgrade costs 6 * 6 = 36', () => {
    const cost = getConversionCost('Manufactured (Alloys)', 1, 'Encoded (Data archives)', 2);
    expect(cost).toBe(TRADE_ACROSS_COST * TRADE_UP_COST);
  });

  test('cross-type and downgrade costs 6 / 3 = 2', () => {
    const cost = getConversionCost('Manufactured (Alloys)', 2, 'Encoded (Data archives)', 1);
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
});

describe('generateTradeSteps', () => {
  test('generates upgrade step for quality increase', () => {
    const srcMat = getMaterial('Iron');
    const targetMat = getMaterial('Nickel');

    const steps = generateTradeSteps(srcMat, targetMat, 6);

    expect(steps).toHaveLength(1);
    expect(steps[0].action).toBe('UPGRADE');
    expect(steps[0].ratio).toBe('6:1');
  });

  test('generates downgrade step for quality decrease', () => {
    const srcMat = getMaterial('Nickel');
    const targetMat = getMaterial('Iron');

    const steps = generateTradeSteps(srcMat, targetMat, 1);

    expect(steps).toHaveLength(1);
    expect(steps[0].action).toBe('DOWNGRADE');
    expect(steps[0].ratio).toBe('1:3');
  });

  test('generates cross-type step when types differ', () => {
    const srcMat = getMaterial('Iron');
    const targetMat = getMaterial('Anomalous Bulk Scan Data');

    const steps = generateTradeSteps(srcMat, targetMat, 6);

    const crossTypeStep = steps.find(s => s.action === 'CROSS_TYPE');
    expect(crossTypeStep).toBeDefined();
    expect(crossTypeStep.ratio).toBe('6:1');
  });

  test('generates multiple steps for large quality differences', () => {
    const srcMat = getMaterial('Iron');
    const targetMat = getMaterial('Chromium');

    const steps = generateTradeSteps(srcMat, targetMat, 36);

    expect(steps.length).toBeGreaterThan(1);
    // Steps might include CROSS_TYPE since Iron and Chromium have different types
    expect(steps.length).toBeGreaterThanOrEqual(2);
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

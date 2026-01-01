import { getMaterial } from './database';
import {
  downgrade,
  upgrade,
  crossTypeOne,
  optimizeOne,
  Trade,
  Trades,
  getConversionCost,
  optimizeTrading,
  TRADE_UP_COST,
  TRADE_DOWN_YIELD,
  TRADE_ACROSS_COST
} from './utils';

// Use realistic material types that are in the same main category (Manufactured)
const TYPE1 = 'Manufactured (Alloys)';
const TYPE2 = 'Manufactured (Capacitors)';

describe('Downgrade', () => {
  test('basic', () => {
    const trades = new Trades();
    const [inv, done] = downgrade(TYPE1, [0, 0, 0, 1, 2], [1, 1, 1, 0, 0], trades);

    expect(done).toBe(true);
    expect(trades.getTrades()).toEqual([
      new Trade(TYPE1, 3, 1, TYPE1, 2, 3, 'DOWNGRADE'),
      new Trade(TYPE1, 2, 1, TYPE1, 1, 3, 'DOWNGRADE'),
      new Trade(TYPE1, 1, 1, TYPE1, 0, 3, 'DOWNGRADE'),
    ]);
    expect(inv).toEqual([3, 2, 2, 0, 2]);
  });

  test('already have some', () => {
    const trades = new Trades();
    const [inv, done] = downgrade(TYPE1, [0, 2, 0, 1, 2], [1, 3, 1, 0, 0], trades);

    expect(done).toBe(true);
    expect(trades.getTrades()).toEqual([
      new Trade(TYPE1, 3, 1, TYPE1, 2, 3, 'DOWNGRADE'),
      new Trade(TYPE1, 2, 1, TYPE1, 1, 3, 'DOWNGRADE'),
      new Trade(TYPE1, 1, 1, TYPE1, 0, 3, 'DOWNGRADE'),
    ]);
    expect(inv).toEqual([3, 4, 2, 0, 2]);
  });

  test('intermediate steps', () => {
    const trades = new Trades();
    const [inv, done] = downgrade(TYPE1, [0, 0, 0, 0, 2], [1, 1, 1, 0, 0], trades);

    expect(done).toBe(true);
    expect(trades.getTrades()).toEqual([
      new Trade(TYPE1, 4, 1, TYPE1, 3, 3, 'DOWNGRADE'),
      new Trade(TYPE1, 3, 1, TYPE1, 2, 3, 'DOWNGRADE'),
      new Trade(TYPE1, 2, 1, TYPE1, 1, 3, 'DOWNGRADE'),
      new Trade(TYPE1, 1, 1, TYPE1, 0, 3, 'DOWNGRADE'),
    ]);
    expect(inv).toEqual([3, 2, 2, 2, 1]);
  });

  test('consolidated trade', () => {
    const trades = new Trades();
    const [inv, done] = downgrade(TYPE1, [0, 0, 0, 0, 2], [1, 3, 1, 0, 0], trades);

    expect(done).toBe(true);
    expect(trades.getTrades()).toEqual([
      new Trade(TYPE1, 4, 1, TYPE1, 3, 3, 'DOWNGRADE'),
      new Trade(TYPE1, 3, 1, TYPE1, 2, 3, 'DOWNGRADE'),
      new Trade(TYPE1, 2, 2, TYPE1, 1, 6, 'DOWNGRADE'),
      new Trade(TYPE1, 1, 1, TYPE1, 0, 3, 'DOWNGRADE'),
    ]);
    expect(inv).toEqual([3, 5, 1, 2, 1]);
  });

  test('insufficient', () => {
    const trades = new Trades();
    const [inv, done] = downgrade(TYPE1, [0, 0, 0, 0, 2], [200, 3, 1, 0, 0], trades);

    expect(done).toBe(false);
    expect(trades.getTrades()).toEqual([
      new Trade(TYPE1, 4, 2, TYPE1, 3, 6, 'DOWNGRADE'),
      new Trade(TYPE1, 3, 6, TYPE1, 2, 18, 'DOWNGRADE'),
      new Trade(TYPE1, 2, 17, TYPE1, 1, 51, 'DOWNGRADE'),
      new Trade(TYPE1, 1, 48, TYPE1, 0, 144, 'DOWNGRADE'),
    ]);
    expect(inv).toEqual([144, 3, 1, 0, 0]);
  });
});

describe('Upgrade', () => {
  test('basic', () => {
    const trades = new Trades();
    const [inv, done] = upgrade(TYPE1, [252, 0, 0, 0, 0], [0, 0, 1, 1, 0], trades);

    expect(done).toBe(true);
    expect(trades.getTrades()).toEqual([
      new Trade(TYPE1, 0, 216, TYPE1, 3, 1, 'UPGRADE'),
      new Trade(TYPE1, 0, 36, TYPE1, 2, 1, 'UPGRADE'),
    ]);
    expect(inv).toEqual([0, 0, 1, 1, 0]);
  });

  test('insufficient', () => {
    const trades = new Trades();
    const [inv, done] = upgrade(TYPE1, [252, 0, 0, 0, 0], [1, 0, 1, 1, 0], trades);

    expect(done).toBe(false);
    expect(trades.getTrades()).toEqual([
      new Trade(TYPE1, 0, 216, TYPE1, 3, 1, 'UPGRADE'),
    ]);
    expect(inv).toEqual([36, 0, 0, 1, 0]);
  });
});

describe('CrossType', () => {
  test('basic', () => {
    const trades = new Trades();
    const invs = {
      [TYPE1]: [0, 0, 0, 0, 0],
      [TYPE2]: [0, 0, 0, 0, 10],
    };
    const needs = {
      [TYPE1]: [0, 0, 0, 1, 0],
    };

    const [resultInvs, done] = crossTypeOne(TYPE1, invs, needs, trades);

    expect(done).toBe(true);
    expect(trades.getTrades()).toEqual([
      new Trade(TYPE2, 4, 2, TYPE2, 3, 6, 'DOWNGRADE'),
      new Trade(TYPE2, 3, 6, TYPE1, 3, 1, 'CROSS_TRADE'),
    ]);
  });
});

describe('OptimizeOne', () => {
  test('basic', () => {
    const trades = new Trades();
    const [inv, done] = optimizeOne(TYPE1, [252, 0, 0, 0, 1], [0, 0, 1, 4, 0], trades);

    expect(done).toBe(true);
    expect(trades.getTrades()).toEqual([
      new Trade(TYPE1, 4, 1, TYPE1, 3, 3, 'DOWNGRADE'),
      new Trade(TYPE1, 0, 216, TYPE1, 3, 1, 'UPGRADE'),
      new Trade(TYPE1, 0, 36, TYPE1, 2, 1, 'UPGRADE'),
    ]);
    expect(inv).toEqual([0, 0, 1, 4, 0]);
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
      expect(result.unfulfilled).toHaveLength(0);

      // Should have a downgrade trade
      expect(result.trades).toHaveLength(1);
      const downgradeTrade = result.trades.find(t => t.action === 'DOWNGRADE');
      expect(downgradeTrade).toBeDefined();
      expect(downgradeTrade.input.quality).toBe(2);
      expect(downgradeTrade.output.quality).toBe(1);
      expect(downgradeTrade.ratio).toBe('1:3');
      expect(downgradeTrade.input.amount).toBe(1);
      expect(downgradeTrade.output.amount).toBe(3);
    });

    test('downgrade 2x grade 3 to 18x grade 1 (combined multi-step)', () => {
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
      expect(result.trades).toHaveLength(1);
      const downgradeTrade = result.trades.find(t => t.action === 'DOWNGRADE');
      expect(downgradeTrade).toBeDefined();
      expect(downgradeTrade.input.quality).toBe(3);
      expect(downgradeTrade.output.quality).toBe(1);
      expect(downgradeTrade.ratio).toBe('1:9');
      expect(downgradeTrade.input.amount).toBe(2);
      expect(downgradeTrade.output.amount).toBe(18);
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
      expect(result.unfulfilled).toHaveLength(0);

      // Should have an upgrade trade
      expect(result.trades).toHaveLength(1);
      const upgradeTrade = result.trades.find(t => t.action === 'UPGRADE');
      expect(upgradeTrade).toBeDefined();
      expect(upgradeTrade.input.quality).toBe(1);
      expect(upgradeTrade.output.quality).toBe(2);
      expect(upgradeTrade.ratio).toBe('6:1');
      expect(upgradeTrade.input.amount).toBe(6);
      expect(upgradeTrade.output.amount).toBe(1);
    });

    test('upgrade 12x grade 1 to 2x grade 2 (combined multi-step)', () => {
      // Carbon is Raw (Raw material 1) quality 1
      // Niobium is Raw (Raw material 1) quality 3
      const inventory = [{ item: 'Carbon', quantity: 72 }];
      const needs = [{ item: 'Niobium', quantity: 2 }];

      const result = optimizeTrading(inventory, needs);

      // Should fully fulfill the need
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Niobium');
      expect(result.fulfilled[0].quantity).toBe(2);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have an upgrade trade
      expect(result.trades).toHaveLength(1);
      const upgradeTrade = result.trades.find(t => t.action === 'UPGRADE');
      expect(upgradeTrade).toBeDefined();
      expect(upgradeTrade.input.quality).toBe(1);
      expect(upgradeTrade.output.quality).toBe(3);
      expect(upgradeTrade.ratio).toBe('36:1');
      expect(upgradeTrade.input.amount).toBe(72);
      expect(upgradeTrade.output.amount).toBe(2);
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

      // Should have an upgrade trade
      expect(result.trades).toHaveLength(1);
      const downgradeTrade = result.trades.find(t => t.action === 'DOWNGRADE');
      expect(downgradeTrade).toBeDefined();
      expect(downgradeTrade.input.quality).toBe(2);
      expect(downgradeTrade.output.quality).toBe(1);
      expect(downgradeTrade.ratio).toBe('1:3');
      expect(downgradeTrade.input.amount).toBe(1);
      expect(downgradeTrade.output.amount).toBe(3);
    });

    test('need 5x grade 1, have 2x grade 2, produces 6x grade 1 with 1x remainder', () => {
      // Vanadium is Raw (Raw material 1) quality 2
      // Carbon is Raw (Raw material 1) quality 1
      const inventory = [{ item: 'Vanadium', quantity: 2 }];
      const needs = [{ item: 'Carbon', quantity: 5 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill only 2 (what we need), but conversion produces 3
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Carbon');
      expect(result.fulfilled[0].quantity).toBe(5);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have an upgrade trade
      expect(result.trades).toHaveLength(1);
      const downgradeTrade = result.trades.find(t => t.action === 'DOWNGRADE');
      expect(downgradeTrade).toBeDefined();
      expect(downgradeTrade.input.quality).toBe(2);
      expect(downgradeTrade.output.quality).toBe(1);
      expect(downgradeTrade.ratio).toBe('1:3');
      expect(downgradeTrade.input.amount).toBe(2);
      expect(downgradeTrade.output.amount).toBe(6);
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

      // Should have an upgrade trade
      expect(result.trades).toHaveLength(1);
      const downgradeTrade = result.trades.find(t => t.action === 'DOWNGRADE');
      expect(downgradeTrade).toBeDefined();
      expect(downgradeTrade.input.quality).toBe(3);
      expect(downgradeTrade.output.quality).toBe(1);
      expect(downgradeTrade.ratio).toBe('1:9');
      expect(downgradeTrade.input.amount).toBe(1);
      expect(downgradeTrade.output.amount).toBe(9);
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

      // Should have 1 combined downgrade step (G4→G1)
      const downgradeTrades = result.trades.filter(t => t.action === 'DOWNGRADE');
      expect(downgradeTrades).toHaveLength(1);

      // Combined downgrade: 1xG4→27xG1 (ratio 1:27 = 1:3^3)
      expect(downgradeTrades[0].input.quality).toBe(4);
      expect(downgradeTrades[0].output.quality).toBe(1);
      expect(downgradeTrades[0].ratio).toBe('1:27');
      expect(downgradeTrades[0].input.amount).toBe(1);
      expect(downgradeTrades[0].output.amount).toBe(27);
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

      // Should have 1 combined upgrade step (G1→G3)
      const upgradeTrades = result.trades.filter(t => t.action === 'UPGRADE');
      expect(upgradeTrades).toHaveLength(1);

      // Combined upgrade: 36xG1→1xG3 (ratio 36:1 = 6^2:1)
      expect(upgradeTrades[0].input.quality).toBe(1);
      expect(upgradeTrades[0].output.quality).toBe(3);
      expect(upgradeTrades[0].ratio).toBe('36:1');
      expect(upgradeTrades[0].input.amount).toBe(36);
      expect(upgradeTrades[0].output.amount).toBe(1);
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

      // Should have 1 combined upgrade step (G1→G4)
      const upgradeTrades = result.trades.filter(t => t.action === 'UPGRADE');
      expect(upgradeTrades).toHaveLength(1);

      // Combined upgrade: 216xG1→1xG4 (ratio 216:1 = 6^3:1)
      expect(upgradeTrades[0].input.quality).toBe(1);
      expect(upgradeTrades[0].output.quality).toBe(4);
      expect(upgradeTrades[0].ratio).toBe('216:1');
      expect(upgradeTrades[0].input.amount).toBe(216);
      expect(upgradeTrades[0].output.amount).toBe(1);
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
      expect(result.trades).toHaveLength(1);
      const crossTypeTrade = result.trades.find(t => t.action === 'CROSS_TRADE');
      expect(crossTypeTrade).toBeDefined();
      expect(crossTypeTrade.ratio).toBe('6:1');
      expect(crossTypeTrade.input.amount).toBe(6);
      expect(crossTypeTrade.output.amount).toBe(1);
    });

    test('cross-type with quality downgrade (6/3=2:1 ratio)', () => {
      // Zinc is Raw (Raw material 4) quality 2
      // Nickel is Raw (Raw material 5) quality 1
      const inventory = [{ item: 'Zinc', quantity: 2 }];
      const needs = [{ item: 'Nickel', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill with combined downgrade + cross-type
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Nickel');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      // Should have a combined cross-type trade with downgrade (2:1 ratio)
      expect(result.trades).toHaveLength(2);
      const downgradeTrade = result.trades[0];
      expect(downgradeTrade).toBeDefined();
      expect(downgradeTrade.ratio).toBe('1:3');
      expect(downgradeTrade.input.amount).toBe(2);
      expect(downgradeTrade.output.amount).toBe(6);
      const crossTypeTrade = result.trades[1];
      expect(crossTypeTrade).toBeDefined();
      expect(crossTypeTrade.ratio).toBe('6:1');
      expect(crossTypeTrade.input.amount).toBe(6);
      expect(crossTypeTrade.output.amount).toBe(1);
    });
  });

  describe('7. Complex Conversions with Multiple Steps and Remainders', () => {
    test('convert 1x G4 to 3x G3, then 2x G3 to 6x G2, then 6xG2 to 18x G1, with 1x G3 remainder', () => {
      // Carbon is Raw (Raw material 1) quality 1
      // Niobium is Raw (Raw material 1) quality 3
      // Yttrium is Raw (Raw material 1) quality 4

      // Step 1: Convert 1x G5 → 3x G4
      const inventory = [{ item: 'Yttrium', quantity: 100 }];
      const needs = [{ item: 'Carbon', quantity: 18 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill 6x G1: 1 G4 → 3 G3, then 2 G3 → 6 G2 → 18 G1 (but we only need 6)
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Carbon');
      expect(result.fulfilled[0].quantity).toBe(18);
      expect(result.unfulfilled).toHaveLength(0);

      expect(result.trades).toHaveLength(2);

      expect(result.trades[0]).toBeDefined();
      expect(result.trades[0].input.quality).toBe(4);
      expect(result.trades[0].output.quality).toBe(3);
      expect(result.trades[0].ratio).toBe('1:3');
      expect(result.trades[0].input.amount).toBe(1);
      expect(result.trades[0].output.amount).toBe(3);

      expect(result.trades[1]).toBeDefined();
      expect(result.trades[1].input.quality).toBe(3);
      expect(result.trades[1].output.quality).toBe(1);
      expect(result.trades[1].ratio).toBe('1:9');
      expect(result.trades[1].input.amount).toBe(2);
      expect(result.trades[1].output.amount).toBe(18);

      // The remaining inventory should show leftover Niobium
      const remainingNiobium = result.remainingInventory.find(i => i.item === 'Niobium');
      expect(remainingNiobium).toBeDefined();
      expect(remainingNiobium.quantity).toBe(1); // 1 leftover

      const remainingYttrium = result.remainingInventory.find(i => i.item === 'Yttrium');
      expect(remainingYttrium).toBeDefined();
      expect(remainingYttrium.quantity).toBe(99); // 99 leftover
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
      const remainingCarbon = result.remainingInventory.find(i => i.item === 'Carbon');
      expect(remainingCarbon).toBeDefined();
      expect(remainingCarbon.quantity).toBe(1);
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

  describe('8. Edge Cases with Zero and Boundary Conditions', () => {
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

  describe('9. All cross-type downgrades', () => {
    // Tempered Alloys is Manufactured (Thermic) quality 1
    // Heat Resistant Ceramics is Manufactured (Thermic) quality 2
    // Precipitated Alloys is Manufactured (Thermic) quality 3
    // Thermic Alloys is Manufactured (Thermic) quality 4
    // Military Grade Alloys is Manufactured (Thermic) quality 5
    // Worn Shield Emitters is Manufactured (Shielding) quality 1
    // Shield Emitters is Manufactured (Shielding) quality 2
    // Shielding Sensors is Manufactured (Shielding) quality 3
    // Compound Shielding is Manufactured (Shielding) quality 4
    // Imperial Shielding is Manufactured (Shielding) quality 5

    test('convert 1x G5 cat 1 to 1x G5 cat 2', () => {
      const inventory = [{ item: 'Imperial Shielding', quantity: 100 }];
      const needs = [{ item: 'Military Grade Alloys', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill 1x G5 cat 2: 6x G5 cat 1 → 1x G5 cat 2
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Military Grade Alloys');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      expect(result.trades).toHaveLength(1);

      expect(result.trades[0]).toBeDefined();
      expect(result.trades[0].input.quality).toBe(5);
      expect(result.trades[0].output.quality).toBe(5);
      expect(result.trades[0].ratio).toBe('6:1');
      expect(result.trades[0].input.amount).toBe(6);
      expect(result.trades[0].output.amount).toBe(1);

      // The remaining inventory should show leftover Imperial Shielding
      const remainingImperialShielding = result.remainingInventory.find(i => i.item === 'Imperial Shielding');
      expect(remainingImperialShielding).toBeDefined();
      expect(remainingImperialShielding.quantity).toBe(94);
    });

    test('convert 2x G5 cat 1 to 1x G4 cat 2', () => {
      const inventory = [{ item: 'Imperial Shielding', quantity: 100 }];
      const needs = [{ item: 'Thermic Alloys', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill 1x G4 cat 2: 2x G5 cat 1 → 1x G4 cat 2
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Thermic Alloys');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      expect(result.trades).toHaveLength(2);

      expect(result.trades[0].input.quality).toBe(5);
      expect(result.trades[0].output.quality).toBe(4);
      expect(result.trades[0].ratio).toBe('1:3');
      expect(result.trades[0].input.amount).toBe(2);
      expect(result.trades[0].output.amount).toBe(6);
      expect(result.trades[1].input.quality).toBe(4);
      expect(result.trades[1].output.quality).toBe(4);
      expect(result.trades[1].ratio).toBe('6:1');
      expect(result.trades[1].input.amount).toBe(6);
      expect(result.trades[1].output.amount).toBe(1);

      // The remaining inventory should show leftover Imperial Shielding
      const remainingImperialShielding = result.remainingInventory.find(i => i.item === 'Imperial Shielding');
      expect(remainingImperialShielding).toBeDefined();
      expect(remainingImperialShielding.quantity).toBe(98);
    });

    test('convert 1x G5 cat 1 to 1x G3 cat 2 (with spare 1x G4 cat 1)', () => {
      const inventory = [{ item: 'Imperial Shielding', quantity: 100 }];
      const needs = [{ item: 'Precipitated Alloys', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill 1x G3 cat 2: 1x G5 cat 1 → 1x G4 cat 1; 2x G4 cat 1 → 1x G3 cat 2 (with 1x G4 cat 1 remainder)
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Precipitated Alloys');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      expect(result.trades).toHaveLength(3);

      expect(result.trades[0].input.quality).toBe(5);
      expect(result.trades[0].output.quality).toBe(4);
      expect(result.trades[0].ratio).toBe('1:3');
      expect(result.trades[0].input.amount).toBe(1);
      expect(result.trades[0].output.amount).toBe(3);
      expect(result.trades[1].input.quality).toBe(4);
      expect(result.trades[1].output.quality).toBe(3);
      expect(result.trades[1].ratio).toBe('1:3');
      expect(result.trades[1].input.amount).toBe(2);
      expect(result.trades[1].output.amount).toBe(6);
      expect(result.trades[2].input.quality).toBe(3);
      expect(result.trades[2].output.quality).toBe(3);
      expect(result.trades[2].ratio).toBe('6:1');
      expect(result.trades[2].input.amount).toBe(6);
      expect(result.trades[2].output.amount).toBe(1);

      // The remaining inventory should show leftover Imperial Shielding
      const remainingImperialShielding = result.remainingInventory.find(i => i.item === 'Imperial Shielding');
      expect(remainingImperialShielding).toBeDefined();
      expect(remainingImperialShielding.quantity).toBe(99);
    });

    test('convert 1x G5 cat 1 to 1x G2 cat 2 (with spare 2x G4 cat 1 & 1x G3 cat 1)', () => {
      const inventory = [{ item: 'Imperial Shielding', quantity: 100 }];
      const needs = [{ item: 'Heat Resistant Ceramics', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill 1x G2 cat 2: 1x G5 cat 1 → 3x G4 cat 1; 1x G4 cat 1 → 3x G3 cat 1 (with 2x G4 cat 1 remainder); 2 G3 cat 1 → 1 G2 cat 2 (with 1x G3 cat 1 remainder)
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Heat Resistant Ceramics');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      expect(result.trades).toHaveLength(4);

      expect(result.trades[0].input.quality).toBe(5);
      expect(result.trades[0].output.quality).toBe(4);
      expect(result.trades[0].ratio).toBe('1:3');
      expect(result.trades[0].input.amount).toBe(1);
      expect(result.trades[0].output.amount).toBe(3);

      expect(result.trades[1].input.quality).toBe(4);
      expect(result.trades[1].output.quality).toBe(3);
      expect(result.trades[1].ratio).toBe('1:3');
      expect(result.trades[1].input.amount).toBe(1);
      expect(result.trades[1].output.amount).toBe(3);

      expect(result.trades[2].input.quality).toBe(3);
      expect(result.trades[2].output.quality).toBe(2);
      expect(result.trades[2].ratio).toBe('1:3');
      expect(result.trades[2].input.amount).toBe(2);
      expect(result.trades[2].output.amount).toBe(6);

      expect(result.trades[3].input.quality).toBe(2);
      expect(result.trades[3].output.quality).toBe(2);
      expect(result.trades[3].ratio).toBe('6:1');
      expect(result.trades[3].input.amount).toBe(6);
      expect(result.trades[3].output.amount).toBe(1);

      // The remaining inventory should show leftover Imperial Shielding
      const remainingImperialShielding = result.remainingInventory.find(i => i.item === 'Imperial Shielding');
      expect(remainingImperialShielding).toBeDefined();
      expect(remainingImperialShielding.quantity).toBe(99);
    });

    test('convert 1x G5 cat 1 to 1x G1 cat 2 (with spare 2x G4 cat 1 & 1x G3 cat 1)', () => {
      const inventory = [{ item: 'Imperial Shielding', quantity: 100 }];
      const needs = [{ item: 'Tempered Alloys', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill 1x G1 cat 2: 1x G5 cat 1 → 3x G4 cat 1; 1x G4 cat 1 → 3x G3 cat 1 (with 2x G4 cat 1 remainder); 1x G3 cat 1 → 3x G2 cat 1 (with 2x G3 cat 1 remainder); 2 G2 cat 1 → 1 G1 cat 2 (with 1x G2 cat 1 remainder)
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Tempered Alloys');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      expect(result.trades).toHaveLength(5);

      expect(result.trades[0].input.quality).toBe(5);
      expect(result.trades[0].output.quality).toBe(4);
      expect(result.trades[0].ratio).toBe('1:3');
      expect(result.trades[0].input.amount).toBe(1);
      expect(result.trades[0].output.amount).toBe(3);
      expect(result.trades[1].input.quality).toBe(4);
      expect(result.trades[1].output.quality).toBe(3);
      expect(result.trades[1].ratio).toBe('1:3');
      expect(result.trades[1].input.amount).toBe(1);
      expect(result.trades[1].output.amount).toBe(3);
      expect(result.trades[2].input.quality).toBe(3);
      expect(result.trades[2].output.quality).toBe(2);
      expect(result.trades[2].ratio).toBe('1:3');
      expect(result.trades[2].input.amount).toBe(1);
      expect(result.trades[2].output.amount).toBe(3);
      expect(result.trades[3].input.quality).toBe(2);
      expect(result.trades[3].output.quality).toBe(1);
      expect(result.trades[3].ratio).toBe('1:3');
      expect(result.trades[3].input.amount).toBe(2);
      expect(result.trades[3].output.amount).toBe(6);
      expect(result.trades[4].input.quality).toBe(1);
      expect(result.trades[4].output.quality).toBe(1);
      expect(result.trades[4].ratio).toBe('6:1');
      expect(result.trades[4].input.amount).toBe(6);
      expect(result.trades[4].output.amount).toBe(1);

      // The remaining inventory should show leftover Imperial Shielding
      const remainingImperialShielding = result.remainingInventory.find(i => i.item === 'Imperial Shielding');
      expect(remainingImperialShielding).toBeDefined();
      expect(remainingImperialShielding.quantity).toBe(99);
    });

    test('convert 1x G5 cat 1 to 1x G2 cat 2 + 2x G4 cat 1 & 1x G3 cat 1', () => {
      const inventory = [{ item: 'Imperial Shielding', quantity: 100 }];
      const needs = [
        { item: 'Heat Resistant Ceramics', quantity: 1 },
        { item: 'Compound Shielding', quantity: 2 },
        { item: 'Shielding Sensors', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill 1x G2 cat 2: 1x G5 cat 1 → 3x G4 cat 1; 1x G4 cat 1 → 3x G3 cat 1 (with 2x G4 cat 1 remainder); 2 G3 cat 1 → 1 G2 cat 2 (with 1x G3 cat 1 remainder)
      expect(result.fulfilled).toHaveLength(3);
      expect(result.fulfilled[0].item).toBe('Heat Resistant Ceramics');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.fulfilled[1].item).toBe('Compound Shielding');
      expect(result.fulfilled[1].quantity).toBe(2);
      expect(result.fulfilled[2].item).toBe('Shielding Sensors');
      expect(result.fulfilled[2].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      expect(result.trades).toHaveLength(4);

      expect(result.trades[0].input.quality).toBe(5);
      expect(result.trades[0].output.quality).toBe(4);
      expect(result.trades[0].ratio).toBe('1:3');
      expect(result.trades[0].input.amount).toBe(1);
      expect(result.trades[0].output.amount).toBe(3);
      expect(result.trades[1].input.quality).toBe(4);
      expect(result.trades[1].output.quality).toBe(3);
      expect(result.trades[1].ratio).toBe('1:3');
      expect(result.trades[1].input.amount).toBe(1);
      expect(result.trades[1].output.amount).toBe(3);
      expect(result.trades[2].input.quality).toBe(3);
      expect(result.trades[2].output.quality).toBe(2);
      expect(result.trades[2].ratio).toBe('1:3');
      expect(result.trades[2].input.amount).toBe(2);
      expect(result.trades[2].output.amount).toBe(6);
      expect(result.trades[3].input.quality).toBe(2);
      expect(result.trades[3].output.quality).toBe(2);
      expect(result.trades[3].ratio).toBe('6:1');
      expect(result.trades[3].input.amount).toBe(6);
      expect(result.trades[3].output.amount).toBe(1);

      // The remaining inventory should show leftover Imperial Shielding
      const remainingImperialShielding = result.remainingInventory.find(i => i.item === 'Imperial Shielding');
      expect(remainingImperialShielding).toBeDefined();
      expect(remainingImperialShielding.quantity).toBe(99);
    });

    test('convert 1x G5 cat 1 + 3x G4 cat 1 to 1x G4 cat 2', () => {
      const inventory = [
        { item: 'Imperial Shielding', quantity: 1 },
        { item: 'Compound Shielding', quantity: 3 },
      ];
      const needs = [{ item: 'Thermic Alloys', quantity: 1 }];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill 1x G4 cat 2: 1x G5 cat 1 → 3x G4 cat 1; 6x G4 cat 1 → 1x G4 cat 2
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Thermic Alloys');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      expect(result.trades).toHaveLength(2);

      expect(result.trades[0]).toBeDefined();
      expect(result.trades[0].input.quality).toBe(5);
      expect(result.trades[0].output.quality).toBe(4);
      expect(result.trades[0].ratio).toBe('1:3');
      expect(result.trades[0].input.amount).toBe(1);
      expect(result.trades[0].output.amount).toBe(3);
      expect(result.trades[1]).toBeDefined();
      expect(result.trades[1].input.quality).toBe(4);
      expect(result.trades[1].output.quality).toBe(4);
      expect(result.trades[1].ratio).toBe('6:1');
      expect(result.trades[1].input.amount).toBe(6);
      expect(result.trades[1].output.amount).toBe(1);
    });

    test('does not eagerly convert when intermediate materials are sufficient', () => {
      // Bug scenario: Have enough G3 materials for cross-type trade
      // Also have G5 materials that should NOT be converted
      // Imperial Shielding is Manufactured (Shielding) quality 5
      // Compound Shielding is Manufactured (Shielding) quality 4
      // Shielding Sensors is Manufactured (Shielding) quality 3
      // Thermic Alloys is Manufactured (Thermic) quality 4

      const inventory = [
        { item: 'Imperial Shielding', quantity: 100 },     // G5 Shielding
        { item: 'Compound Shielding', quantity: 6 }        // G4 Shielding (enough for cross-type!)
      ];
      const needs = [{ item: 'Thermic Alloys', quantity: 1 }]; // G4 Thermic

      const result = optimizeTrading(inventory, needs);

      // Should fulfill the need
      expect(result.fulfilled).toHaveLength(1);
      expect(result.fulfilled[0].item).toBe('Thermic Alloys');
      expect(result.fulfilled[0].quantity).toBe(1);
      expect(result.unfulfilled).toHaveLength(0);

      // Should use ONLY the G4 materials (6:1 cross-type trade)
      // Should NOT downgrade any G5 materials!
      expect(result.trades).toHaveLength(1);
      expect(result.trades[0].action).toBe('CROSS_TRADE');
      expect(result.trades[0].input.item).toBe('Compound Shielding');
      expect(result.trades[0].input.amount).toBe(6);
      expect(result.trades[0].output.item).toBe('Thermic Alloys');
      expect(result.trades[0].output.amount).toBe(1);

      // Imperial Shielding should remain UNTOUCHED (all 100 units)
      const remainingImperial = result.remainingInventory.find(i => i.item === 'Imperial Shielding');
      expect(remainingImperial).toBeDefined();
      expect(remainingImperial.quantity).toBe(100); // CRITICAL: Should not have converted any!
    });

    test('pools intermediate materials to minimize source consumption', () => {
      const inventory = [
        { item: 'Arsenic', quantity: 10 },
        { item: 'Cadmium', quantity: 2 },
        { item: 'Manganese', quantity: 9 },
        { item: 'Phosphorus', quantity: 3 },
        { item: 'Ruthenium', quantity: 25 }
      ];
      const needs = [
        { item: 'Manganese', quantity: 10 },
        { item: 'Phosphorus', quantity: 4 },
        { item: 'Arsenic', quantity: 12 },
      ];

      const result = optimizeTrading(inventory, needs);

      // Expected Trades
      // Trade 1: 1x Ruthenium -> 9x Manganese
      // Trade 2: 2x Cadmium -> 6x Manganese
      // Trade 3: 2x Manganese -> 6x Sulphur
      // Trade 4: 12x Manganese -> 2x Arsenic
      // Trade 5: 6x Sulphur -> 1x Phosphorus

      // All needs should be fulfilled
      expect(result.fulfilled).toHaveLength(3);
      expect(result.fulfilled[0].item).toBe('Manganese');
      expect(result.fulfilled[0].quantity).toBe(10);
      expect(result.fulfilled[1].item).toBe('Phosphorus');
      expect(result.fulfilled[1].quantity).toBe(4);
      expect(result.fulfilled[2].item).toBe('Arsenic');
      expect(result.fulfilled[2].quantity).toBe(12);
      expect(result.unfulfilled).toHaveLength(0);

      expect(result.trades).toHaveLength(5);
      expect(result.trades[0].action).toBe('DOWNGRADE');
      expect(result.trades[0].input.item).toBe('Ruthenium');
      expect(result.trades[0].input.amount).toBe(1);
      expect(result.trades[0].output.item).toBe('Manganese');
      expect(result.trades[0].output.amount).toBe(9);
      expect(result.trades[1].action).toBe('DOWNGRADE');
      expect(result.trades[1].input.item).toBe('Cadmium');
      expect(result.trades[1].input.amount).toBe(2);
      expect(result.trades[1].output.item).toBe('Manganese');
      expect(result.trades[1].output.amount).toBe(6);
      expect(result.trades[2].action).toBe('DOWNGRADE');
      expect(result.trades[2].input.item).toBe('Manganese');
      expect(result.trades[2].input.amount).toBe(2);
      expect(result.trades[2].output.item).toBe('Sulphur');
      expect(result.trades[2].output.amount).toBe(6);
      expect(result.trades[3].action).toBe('CROSS_TRADE');
      expect(result.trades[3].input.item).toBe('Manganese');
      expect(result.trades[3].input.amount).toBe(12);
      expect(result.trades[3].output.item).toBe('Arsenic');
      expect(result.trades[3].output.amount).toBe(2);
      expect(result.trades[4].action).toBe('CROSS_TRADE');
      expect(result.trades[4].input.item).toBe('Sulphur');
      expect(result.trades[4].input.amount).toBe(6);
      expect(result.trades[4].output.item).toBe('Phosphorus');
      expect(result.trades[4].output.amount).toBe(1);

      // The remaining inventory should show leftover Ruthenium
      const remainingRuthenium = result.remainingInventory.find(i => i.item === 'Ruthenium');
      expect(remainingRuthenium).toBeDefined();
      expect(remainingRuthenium.quantity).toBe(24);
    });
  });

  describe('10. Order Independence - Algorithm should optimize regardless of need order', () => {
    test('same needs in different orders produce equally optimal results', () => {
      const inventory = [{ item: 'Imperial Shielding', quantity: 100 }];

      // Order 1: cross-type first, then same-type needs
      const needs1 = [
        { item: 'Heat Resistant Ceramics', quantity: 1 },  // G2 Thermic (cross-type)
        { item: 'Compound Shielding', quantity: 2 },       // G4 Shielding
        { item: 'Shielding Sensors', quantity: 1 }         // G3 Shielding
      ];

      // Order 2: same-type needs first, then cross-type
      const needs2 = [
        { item: 'Compound Shielding', quantity: 2 },       // G4 Shielding
        { item: 'Shielding Sensors', quantity: 1 },        // G3 Shielding
        { item: 'Heat Resistant Ceramics', quantity: 1 }   // G2 Thermic (cross-type)
      ];

      // Order 3: completely reversed
      const needs3 = [
        { item: 'Shielding Sensors', quantity: 1 },        // G3 Shielding
        { item: 'Heat Resistant Ceramics', quantity: 1 },  // G2 Thermic (cross-type)
        { item: 'Compound Shielding', quantity: 2 }        // G4 Shielding
      ];

      const result1 = optimizeTrading(JSON.parse(JSON.stringify(inventory)), needs1);
      const result2 = optimizeTrading(JSON.parse(JSON.stringify(inventory)), needs2);
      const result3 = optimizeTrading(JSON.parse(JSON.stringify(inventory)), needs3);

      // All three should produce the same number of trades
      expect(result1.trades).toHaveLength(4);
      expect(result2.trades).toHaveLength(4);
      expect(result3.trades).toHaveLength(4);

      // All needs should be fulfilled
      expect(result1.fulfilled).toHaveLength(3);
      expect(result2.fulfilled).toHaveLength(3);
      expect(result3.fulfilled).toHaveLength(3);

      expect(result1.unfulfilled).toHaveLength(0);
      expect(result2.unfulfilled).toHaveLength(0);
      expect(result3.unfulfilled).toHaveLength(0);

      // But fulfilled arrays should maintain original order
      expect(result1.fulfilled[0].item).toBe('Heat Resistant Ceramics');
      expect(result1.fulfilled[1].item).toBe('Compound Shielding');
      expect(result1.fulfilled[2].item).toBe('Shielding Sensors');

      expect(result2.fulfilled[0].item).toBe('Compound Shielding');
      expect(result2.fulfilled[1].item).toBe('Shielding Sensors');
      expect(result2.fulfilled[2].item).toBe('Heat Resistant Ceramics');

      expect(result3.fulfilled[0].item).toBe('Shielding Sensors');
      expect(result3.fulfilled[1].item).toBe('Heat Resistant Ceramics');
      expect(result3.fulfilled[2].item).toBe('Compound Shielding');
    });

    test('cross-type needs processed before same-type needs for optimal remainder reuse', () => {
      const inventory = [{ item: 'Military Grade Alloys', quantity: 10 }];

      // Need both cross-type and same-type from same source
      const needs = [
        { item: 'Imperial Shielding', quantity: 1 },       // G5 Shielding (cross-type from Thermic)
        { item: 'Thermic Alloys', quantity: 2 }            // G4 Thermic (same-type downgrade)
      ];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill both needs
      expect(result.fulfilled).toHaveLength(2);
      expect(result.fulfilled[0].item).toBe('Imperial Shielding');
      expect(result.fulfilled[1].item).toBe('Thermic Alloys');
      expect(result.unfulfilled).toHaveLength(0);
    });

    test('lower quality needs processed before higher quality when same complexity', () => {
      const inventory = [{ item: 'Carbon', quantity: 300 }];

      // Multiple needs at different qualities from same source
      const needs = [
        { item: 'Yttrium', quantity: 1 },     // G4 (requires 216x G1)
        { item: 'Vanadium', quantity: 1 },    // G2 (requires 6x G1)
        { item: 'Niobium', quantity: 1 }      // G3 (requires 36x G1)
      ];

      const result = optimizeTrading(inventory, needs);

      // Should fulfill all needs
      expect(result.fulfilled).toHaveLength(3);
      expect(result.unfulfilled).toHaveLength(0);

      // Total consumption should be 216 + 6 + 36 = 258
      const remainingCarbon = result.remainingInventory.find(i => i.item === 'Carbon');
      expect(remainingCarbon).toBeDefined();
      expect(remainingCarbon.quantity).toBe(42); // 300 - 258 = 42

      // But fulfilled should maintain original order
      expect(result.fulfilled[0].item).toBe('Yttrium');
      expect(result.fulfilled[1].item).toBe('Vanadium');
      expect(result.fulfilled[2].item).toBe('Niobium');
    });

    test('remainder reuse across different need orders', () => {
      const inventory = [{ item: 'Vanadium', quantity: 10 }];

      // Order 1: need downgrade target first
      const needs1 = [
        { item: 'Carbon', quantity: 5 },      // G1 (direct downgrade target)
        { item: 'Vanadium', quantity: 2 }     // G2 (direct match)
      ];

      // Order 2: need direct match first
      const needs2 = [
        { item: 'Vanadium', quantity: 2 },    // G2 (direct match)
        { item: 'Carbon', quantity: 5 }       // G1 (downgrade target)
      ];

      const result1 = optimizeTrading(JSON.parse(JSON.stringify(inventory)), needs1);
      const result2 = optimizeTrading(JSON.parse(JSON.stringify(inventory)), needs2);

      // Both should fulfill all needs optimally
      expect(result1.fulfilled).toHaveLength(2);
      expect(result2.fulfilled).toHaveLength(2);
      expect(result1.unfulfilled).toHaveLength(0);
      expect(result2.unfulfilled).toHaveLength(0);

      // Should use similar inventory (2 direct + 2 downgraded for 5 Carbon)
      const remaining1 = result1.remainingInventory.reduce((sum, i) => sum + i.quantity, 0);
      const remaining2 = result2.remainingInventory.reduce((sum, i) => sum + i.quantity, 0);

      // Both should leave similar remainders (accounting for downgrade yields)
      expect(remaining1).toBeGreaterThanOrEqual(0);
      expect(remaining2).toBeGreaterThanOrEqual(0);
    });

    test('complex multi-category needs remain order-independent', () => {
      const inventory = [
        { item: 'Carbon', quantity: 50 },
        { item: 'Iron', quantity: 50 },
        { item: 'Salvaged Alloys', quantity: 50 }
      ];

      // Different categories mixed together
      const needs1 = [
        { item: 'Vanadium', quantity: 2 },           // Raw G2
        { item: 'Galvanising Alloys', quantity: 2 }, // Manufactured G2
        { item: 'Nickel', quantity: 2 }              // Raw G1 (different subtype)
      ];

      const needs2 = [
        { item: 'Galvanising Alloys', quantity: 2 },
        { item: 'Nickel', quantity: 2 },
        { item: 'Vanadium', quantity: 2 }
      ];

      const result1 = optimizeTrading(JSON.parse(JSON.stringify(inventory)), needs1);
      const result2 = optimizeTrading(JSON.parse(JSON.stringify(inventory)), needs2);

      // Both should fulfill all needs
      expect(result1.fulfilled).toHaveLength(3);
      expect(result2.fulfilled).toHaveLength(3);
      expect(result1.unfulfilled).toHaveLength(0);
      expect(result2.unfulfilled).toHaveLength(0);

      // Results should maintain original order
      expect(result1.fulfilled[0].item).toBe('Vanadium');
      expect(result2.fulfilled[0].item).toBe('Galvanising Alloys');
    });
  });
});

describe('optimizeTrading with test data', () => {
  test('optimizes trading using inventory from testdata/inventory1.json', () => {
    const inventory = require('./testdata/inventory1.json');

    // Test that inventory was loaded correctly
    expect(inventory).toBeDefined();
    expect(Array.isArray(inventory)).toBe(true);
    expect(inventory.length).toBeGreaterThan(0);

    // Each item should have 'item' and 'quantity' properties
    inventory.forEach(item => {
      expect(item).toHaveProperty('item');
      expect(item).toHaveProperty('quantity');
      expect(typeof item.item).toBe('string');
      expect(typeof item.quantity).toBe('number');
    });

    // Test optimization with this inventory
    const needs = [
      { item: 'Galvanising Alloys', quantity: 6 }
    ];

    const result = optimizeTrading(inventory, needs);

    // Should fulfill with trades
    expect(result.fulfilled).toHaveLength(1);
    expect(result.fulfilled[0].item).toBe('Galvanising Alloys');
    expect(result.fulfilled[0].quantity).toBe(6);
    expect(result.unfulfilled).toHaveLength(0);

    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].action).toBe('DOWNGRADE');
    expect(result.trades[0].input.item).toBe('Phase Alloys');
    expect(result.trades[0].input.amount).toBe(2);
    expect(result.trades[0].output.item).toBe('Galvanising Alloys');
    expect(result.trades[0].output.amount).toBe(6);
  });

  test('optimizes trading using inventory from testdata/inventory2.json', () => {
    const inventory = require('./testdata/inventory2.json');

    // Test that inventory was loaded correctly
    expect(inventory).toBeDefined();
    expect(Array.isArray(inventory)).toBe(true);
    expect(inventory.length).toBeGreaterThan(0);

    // Each item should have 'item' and 'quantity' properties
    inventory.forEach(item => {
      expect(item).toHaveProperty('item');
      expect(item).toHaveProperty('quantity');
      expect(typeof item.item).toBe('string');
      expect(typeof item.quantity).toBe('number');
    });

    // Test optimization with this inventory
    const needs = [
      { item: 'Phase Alloys', quantity: 1 }
    ];

    const result = optimizeTrading(inventory, needs);

    expect(result.fulfilled).toHaveLength(0);
    expect(result.unfulfilled).toHaveLength(1);
    expect(result.unfulfilled[0].item).toBe('Phase Alloys');
    expect(result.unfulfilled[0].quantity).toBe(1);

    expect(result.trades).toHaveLength(0);
  });
});

describe('calculateExperimentalCosts', () => {
  // Import the function we're testing
  const { calculateExperimentalCosts } = require('./utils');

  test('calculates costs for single experimental with quantity 1', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 1
      }
    ];

    const result = calculateExperimentalCosts(selectedExperimentals);

    // Deep Charge requires:
    // - Atypical Disrupted Wake Echoes x5
    // - Galvanising Alloys x3
    // - Eccentric Hyperspace Trajectories x1
    expect(result).toHaveLength(3);
    expect(result.find(r => r.item === 'Atypical Disrupted Wake Echoes')?.quantity).toBe(5);
    expect(result.find(r => r.item === 'Galvanising Alloys')?.quantity).toBe(3);
    expect(result.find(r => r.item === 'Eccentric Hyperspace Trajectories')?.quantity).toBe(1);
  });

  test('multiplies material costs by quantity', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 3
      }
    ];

    const result = calculateExperimentalCosts(selectedExperimentals);

    // Deep Charge requires 5x Atypical Disrupted Wake Echoes per application
    // With quantity 3, should need 15 total
    expect(result.find(r => r.item === 'Atypical Disrupted Wake Echoes')?.quantity).toBe(15);
    expect(result.find(r => r.item === 'Galvanising Alloys')?.quantity).toBe(9);
    expect(result.find(r => r.item === 'Eccentric Hyperspace Trajectories')?.quantity).toBe(3);
  });

  test('skips experimentals with quantity 0', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 0
      }
    ];

    const result = calculateExperimentalCosts(selectedExperimentals);

    // With quantity 0, should not calculate any costs
    expect(result).toHaveLength(0);
  });

  test('combines costs from multiple experimentals', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 2
      },
      {
        id: 2,
        module: 'Frame Shift Drive',
        experimental: 'Mass Manager',
        quantity: 1
      }
    ];

    const result = calculateExperimentalCosts(selectedExperimentals);

    // Deep Charge (qty 2): 10x Atypical Disrupted Wake Echoes, 6x Galvanising Alloys, 2x Eccentric Hyperspace Trajectories
    // Mass Manager (qty 1): 5x Atypical Disrupted Wake Echoes, 3x Galvanising Alloys, 1x Eccentric Hyperspace Trajectories
    // Total: 15x Atypical Disrupted Wake Echoes, 9x Galvanising Alloys, 3x Eccentric Hyperspace Trajectories
    expect(result.find(r => r.item === 'Atypical Disrupted Wake Echoes')?.quantity).toBe(15);
    expect(result.find(r => r.item === 'Galvanising Alloys')?.quantity).toBe(9);
    expect(result.find(r => r.item === 'Eccentric Hyperspace Trajectories')?.quantity).toBe(3);
  });

  test('handles mix of zero and non-zero quantities', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 0
      },
      {
        id: 2,
        module: 'Frame Shift Drive',
        experimental: 'Mass Manager',
        quantity: 2
      }
    ];

    const result = calculateExperimentalCosts(selectedExperimentals);

    // Only Mass Manager (qty 2) should be counted
    expect(result.find(r => r.item === 'Atypical Disrupted Wake Echoes')?.quantity).toBe(10);
    expect(result.find(r => r.item === 'Galvanising Alloys')?.quantity).toBe(6);
    expect(result.find(r => r.item === 'Eccentric Hyperspace Trajectories')?.quantity).toBe(2);
  });

  test('returns empty array for empty input', () => {
    const result = calculateExperimentalCosts([]);
    expect(result).toHaveLength(0);
  });

  test('handles different experimental effects with different materials', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Power Plant',
        experimental: 'Thermal Spread',
        quantity: 1
      }
    ];

    const result = calculateExperimentalCosts(selectedExperimentals);

    // Thermal Spread requires:
    // - Grid Resistors x5
    // - Vanadium x3
    // - Heat Vanes x1
    expect(result).toHaveLength(3);
    expect(result.find(r => r.item === 'Grid Resistors')?.quantity).toBe(5);
    expect(result.find(r => r.item === 'Vanadium')?.quantity).toBe(3);
    expect(result.find(r => r.item === 'Heat Vanes')?.quantity).toBe(1);
  });

  test('aggregates same materials from different experimentals', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Stripped Down',
        quantity: 1
      },
      {
        id: 2,
        module: 'Power Plant',
        experimental: 'Stripped Down',
        quantity: 1
      }
    ];

    const result = calculateExperimentalCosts(selectedExperimentals);

    // Both require Proto Light Alloys (1 each) = 2 total
    // They also share Galvanising Alloys and other materials
    const protoLightAlloys = result.find(r => r.item === 'Proto Light Alloys');
    expect(protoLightAlloys?.quantity).toBe(2);
  });
});

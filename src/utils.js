import {
  getMaterial,
  getMaterialsAtTypeQuality,
  getMainCategory,
  getBlueprint,
  getExperimentals
} from './database';

// Reroll strategies - number of rolls per grade
export const REROLL_STRATEGIES = {
  single: {
    name: 'Single',
    rolls: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }
  },
  typical: {
    name: 'Typical',
    rolls: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }
  },
  unlock: {
    name: 'Unlock',
    rolls: { 1: 5, 2: 5, 3: 5, 4: 5, 5: 5 }
  }
};

// Trade ratios
const TRADE_UP_COST = 6;
const TRADE_DOWN_YIELD = 3;
const TRADE_ACROSS_COST = 6;

// Trade class to represent a single trade
export class Trade {
  constructor(sourceType, sourceGrade, sourceQty, targetType, targetGrade, targetQty = 0, tradeType = '') {
    this.sourceType = sourceType;
    this.sourceGrade = sourceGrade;
    this.sourceQty = sourceQty;
    this.targetType = targetType;
    this.targetGrade = targetGrade;
    this.targetQty = targetQty;
    this.tradeType = tradeType;

    // Calculate target quantity if not provided
    if (!this.targetQty) {
      if (this.sourceGrade >= this.targetGrade) {
        this.targetQty = this.sourceQty * Math.pow(TRADE_DOWN_YIELD, this.sourceGrade - this.targetGrade);
      } else {
        this.targetQty = Math.floor(this.sourceQty / Math.pow(TRADE_UP_COST, this.targetGrade - this.sourceGrade));
      }

      if (this.sourceType !== this.targetType) {
        if (this.targetQty % TRADE_ACROSS_COST !== 0) {
          throw new Error(`Invalid cross-type trade: ${this.sourceType}/${this.sourceGrade}/${this.sourceQty} => ${this.targetType}/${this.targetGrade}`);
        }
        this.targetQty = Math.floor(this.targetQty / TRADE_ACROSS_COST);
      }
    }

    // Determine trade type if not provided
    if (!this.tradeType) {
      let t;
      if (this.sourceGrade > this.targetGrade) {
        t = 'DOWNGRADE';
      } else if (this.sourceGrade < this.targetGrade) {
        t = 'UPGRADE';
      } else {
        t = 'TRADE';
      }
      this.tradeType = this.sourceType !== this.targetType ? `CROSS_${t}` : t;
    }
  }
}

// Trades collection class
export class Trades {
  constructor() {
    this._trades = new Map();
  }

  addTrade(sourceType, sourceGrade, targetType, targetGrade, sourceQty) {
    const key = `${sourceType}|${sourceGrade}|${targetType}|${targetGrade}`;
    const current = this._trades.get(key) || 0;
    this._trades.set(key, current + sourceQty);
  }

  getTrades() {
    const sortKey = (entry) => {
      const [key] = entry;
      const [sourceType, sourceGrade, targetType, targetGrade] = key.split('|').map((v, i) => i % 2 === 1 ? parseInt(v) : v);

      let order;
      if (sourceType !== targetType) {
        order = 1;
      } else if (parseInt(sourceGrade) < parseInt(targetGrade)) {
        order = 2;
      } else {
        order = 3;
      }

      return [order, sourceType, sourceGrade, targetType, targetGrade];
    };

    const entries = Array.from(this._trades.entries());
    entries.sort((a, b) => {
      const keyA = sortKey(a);
      const keyB = sortKey(b);

      for (let i = 0; i < keyA.length; i++) {
        if (keyA[i] < keyB[i]) return 1;
        if (keyA[i] > keyB[i]) return -1;
      }
      return 0;
    });

    const ret = [];
    for (const [key, sourceQty] of entries) {
      const [sourceType, sourceGrade, targetType, targetGrade] = key.split('|').map((v, i) => i % 2 === 1 ? parseInt(v) : v);
      ret.push(new Trade(sourceType, sourceGrade, sourceQty, targetType, targetGrade));
    }

    return ret;
  }
}

// Find the highest grade with a deficit
function findHighestDeficit(inv, need) {
  for (let i = inv.length - 1; i >= 0; i--) {
    const deficit = need[i] - inv[i];
    if (deficit > 0) {
      return [i, deficit];
    }
  }
  return [-1, 0];
}

// Find a higher grade with surplus
function findHigherSurplus(inv, need, targetGrade) {
  for (let i = targetGrade + 1; i < inv.length; i++) {
    const surplus = inv[i] - need[i];
    if (surplus > 0) {
      return [i, surplus];
    }
  }
  return [-1, 0];
}

// Find a lower grade with surplus (considering upgrade cost)
function findLowerSurplus(inv, need, targetGrade) {
  for (let i = targetGrade - 1; i >= 0; i--) {
    const p = Math.pow(TRADE_UP_COST, targetGrade - i);
    const surplus = inv[i] - need[i];
    if (surplus >= p) {
      return [i, surplus, p];
    }
  }
  return [-1, 0, 0];
}

// Downgrade materials within same type
export function downgrade(targetType, inv, need, trades) {
  const newInv = [...inv];

  while (true) {
    const [targetGrade, deficit] = findHighestDeficit(newInv, need);
    if (targetGrade < 0) {
      return [newInv, true];
    }

    const [sourceGrade, surplus] = findHigherSurplus(newInv, need, targetGrade);
    if (sourceGrade < 0) {
      return [newInv, false];
    }

    let p = Math.pow(TRADE_DOWN_YIELD, sourceGrade - targetGrade);
    let actualTargetGrade = targetGrade;
    let actualDeficit = deficit;

    if (deficit % p > 0) {
      actualTargetGrade = sourceGrade - 1;
      actualDeficit = Math.ceil(deficit / (p / TRADE_DOWN_YIELD));
      p = TRADE_DOWN_YIELD;
    }

    const sourceQty = Math.min(Math.ceil(actualDeficit / p), surplus);
    newInv[actualTargetGrade] += sourceQty * p;
    newInv[sourceGrade] -= sourceQty;
    trades.addTrade(targetType, sourceGrade, targetType, actualTargetGrade, sourceQty);
  }
}

// Upgrade materials within same type
export function upgrade(targetType, inv, need, trades) {
  const newInv = [...inv];

  while (true) {
    const [targetGrade, deficit] = findHighestDeficit(newInv, need);
    if (targetGrade < 0) {
      return [newInv, true];
    }

    const [sourceGrade, surplus, p] = findLowerSurplus(newInv, need, targetGrade);
    if (sourceGrade < 0) {
      return [newInv, false];
    }

    const targetQty = Math.min(deficit, Math.floor(surplus / p));

    newInv[targetGrade] += targetQty;
    newInv[sourceGrade] -= targetQty * p;
    trades.addTrade(targetType, sourceGrade, targetType, targetGrade, targetQty * p);
  }
}

// Optimize one material type
export function optimizeOne(targetType, inv, need, trades) {
  let [newInv, done] = downgrade(targetType, inv, need, trades);

  if (!done) {
    [newInv, done] = upgrade(targetType, newInv, need, trades);
  }

  return [newInv, done];
}

// Get converted surplus at target grade
function getConvertedSurplus(inv, need, targetGrade) {
  const surplus = inv.map((qty, i) => Math.max(0, qty - need[i]));

  let total = 0;
  for (let i = targetGrade; i < surplus.length; i++) {
    total += surplus[i] * Math.pow(TRADE_DOWN_YIELD, i - targetGrade);
  }

  return total;
}

// Get proportional budgets for cross-type trading
function getProportionalBudgets(targetType, invs, needs, targetGrade, deficit) {
  const budgets = {};

  // Get the main category of the target type
  const targetMainCategory = getMainCategory(targetType);

  for (const sourceType of Object.keys(invs)) {
    if (sourceType === targetType) continue;

    // Only allow cross-type trading within the same main category
    // (Manufactured can only trade with Manufactured, Encoded with Encoded, Raw with Raw)
    if (getMainCategory(sourceType) !== targetMainCategory) {
      continue;
    }

    const sourceNeed = needs[sourceType] || Array(invs[sourceType].length).fill(0);
    const budget = getConvertedSurplus(invs[sourceType], sourceNeed, targetGrade);

    if (budget > 0) {
      budgets[sourceType] = budget;
    }
  }

  const combinedBudget = Object.values(budgets).reduce((sum, val) => sum + val, 0);

  if (combinedBudget < TRADE_ACROSS_COST) {
    return {};
  }

  const proportionalBudgets = {};
  for (const [k, v] of Object.entries(budgets)) {
    // Both values must be multiples of TRADE_ACROSS_COST (6)
    const proportionalAmount = Math.floor((TRADE_ACROSS_COST * deficit * (v / combinedBudget) + 5) / TRADE_ACROSS_COST) * TRADE_ACROSS_COST;
    const maxFromBudget = Math.floor(v / TRADE_ACROSS_COST) * TRADE_ACROSS_COST;

    proportionalBudgets[k] = Math.min(proportionalAmount, maxFromBudget);
  }

  while (Object.values(proportionalBudgets).reduce((sum, val) => sum + val, 0) > deficit * TRADE_ACROSS_COST) {
    const entries = Object.entries(proportionalBudgets)
      .filter(([_, v]) => v >= TRADE_ACROSS_COST)
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      });

    if (entries.length === 0) break;

    const [name] = entries[0];
    proportionalBudgets[name] -= TRADE_ACROSS_COST;
  }

  // Filter out zero-value budgets to prevent 0-quantity trades
  const filteredBudgets = {};
  for (const [k, v] of Object.entries(proportionalBudgets)) {
    if (v > 0) {
      filteredBudgets[k] = v;
    }
  }

  return filteredBudgets;
}

// Cross-type trading for one target type
export function crossTypeOne(targetType, invs, needs, trades) {
  if (!(targetType in needs)) {
    return [invs, true];
  }

  const newInvs = JSON.parse(JSON.stringify(invs));

  while (true) {
    const [targetGrade, deficit] = findHighestDeficit(newInvs[targetType], needs[targetType]);
    if (targetGrade < 0) {
      return [newInvs, true];
    }

    const proportionalBudgets = getProportionalBudgets(targetType, newInvs, needs, targetGrade, deficit);
    if (Object.keys(proportionalBudgets).length === 0) {
      return [newInvs, false];
    }

    // Track if we made any progress this iteration
    let madeProgress = false;

    for (const [sourceType, convertedSourceQty] of Object.entries(proportionalBudgets)) {
      // Skip zero-quantity conversions
      if (convertedSourceQty === 0) {
        continue;
      }

      const newNeeds = [...(needs[sourceType] || Array(newInvs[sourceType].length).fill(0))];
      newNeeds[targetGrade] += convertedSourceQty;

      const [newSrcInv, downgradeOk] = downgrade(sourceType, newInvs[sourceType], newNeeds, trades);

      if (!downgradeOk) {
        throw new Error('Downgrade should have succeeded');
      }

      if (convertedSourceQty % TRADE_ACROSS_COST !== 0) {
        throw new Error('Cross-type quantity must be divisible by 6');
      }

      newInvs[sourceType] = newSrcInv;
      newInvs[sourceType][targetGrade] -= convertedSourceQty;
      const targetIncrease = Math.floor(convertedSourceQty / TRADE_ACROSS_COST);
      newInvs[targetType][targetGrade] += targetIncrease;
      trades.addTrade(sourceType, targetGrade, targetType, targetGrade, convertedSourceQty);

      if (targetIncrease > 0) {
        madeProgress = true;
      }
    }

    // Prevent infinite loop: if we didn't make any progress, exit
    if (!madeProgress) {
      return [newInvs, false];
    }
  }
}

// Main optimization function
function optimize(invs, needs) {
  let allDone = true;
  const trades = new Trades();
  const newInvs = {};

  // Initialize newInvs with all types from inventory
  for (const targetType of Object.keys(invs)) {
    newInvs[targetType] = [...invs[targetType]];
  }

  // Also initialize types that are in needs but not in inventory
  for (const targetType of Object.keys(needs)) {
    if (!(targetType in newInvs)) {
      // Create empty inventory for this type
      const gradeCount = needs[targetType].length;
      newInvs[targetType] = Array(gradeCount).fill(0);
    }
  }

  // First pass: optimize within each type
  for (const targetType of Object.keys(needs)) {
    const inv = newInvs[targetType];
    const [optimizedInv, done] = optimizeOne(targetType, inv, needs[targetType], trades);
    newInvs[targetType] = optimizedInv;
    allDone = allDone && done;
  }

  // Second pass: cross-type trading if needed
  if (!allDone) {
    allDone = true;
    for (const targetType of Object.keys(needs)) {
      // Check if this type still has deficits before doing cross-type trades
      const [targetGrade] = findHighestDeficit(newInvs[targetType], needs[targetType]);
      if (targetGrade >= 0) {
        // Only do cross-type trading if there's still a deficit
        const [updatedInvs, done] = crossTypeOne(targetType, newInvs, needs, trades);
        Object.assign(newInvs, updatedInvs);
        allDone = allDone && done;
      }
    }
  }

  return [newInvs, trades, allDone];
}

// Convert item-based inventory to grade-based inventory structure
function convertToGradeInventory(inventory) {
  const invs = {};

  for (const item of inventory) {
    const mat = getMaterial(item.item);
    if (!mat) continue;

    if (!invs[mat.type]) {
      invs[mat.type] = [0, 0, 0, 0, 0];
    }

    // Grades are 1-5, but array indices are 0-4
    // Use += to handle multiple items of same type and quality
    invs[mat.type][mat.quality - 1] += item.quantity;
  }

  return invs;
}

// Convert item-based needs to grade-based needs structure
function convertToGradeNeeds(needs) {
  const gradeNeeds = {};

  for (const need of needs) {
    const mat = getMaterial(need.item);
    if (!mat) continue;

    if (!gradeNeeds[mat.type]) {
      gradeNeeds[mat.type] = [0, 0, 0, 0, 0];
    }

    // Grades are 1-5, but array indices are 0-4
    gradeNeeds[mat.type][mat.quality - 1] += need.quantity;
  }

  return gradeNeeds;
}

// Convert Trade objects to displayable format
function convertTradesToDisplay(trades) {
  const displayTrades = [];

  for (const trade of trades) {
    // Get material items at source and target grades
    // Convert 0-indexed grades to 1-indexed quality values
    const sourceItems = getMaterialsAtTypeQuality(trade.sourceType, trade.sourceGrade + 1);
    const targetItems = getMaterialsAtTypeQuality(trade.targetType, trade.targetGrade + 1);

    const sourceItem = sourceItems.length > 0 ? sourceItems[0].item : `${trade.sourceType} G${trade.sourceGrade + 1}`;
    const targetItem = targetItems.length > 0 ? targetItems[0].item : `${trade.targetType} G${trade.targetGrade + 1}`;

    // Determine ratio
    let ratio;
    if (trade.tradeType === 'DOWNGRADE') {
      const yieldPerUnit = Math.pow(TRADE_DOWN_YIELD, trade.sourceGrade - trade.targetGrade);
      ratio = `1:${yieldPerUnit}`;
    } else if (trade.tradeType === 'UPGRADE') {
      const costPerUnit = Math.pow(TRADE_UP_COST, trade.targetGrade - trade.sourceGrade);
      ratio = `${costPerUnit}:1`;
    } else if (trade.tradeType.startsWith('CROSS_')) {
      if (trade.tradeType === 'CROSS_DOWNGRADE') {
        const yieldPerUnit = Math.pow(TRADE_DOWN_YIELD, trade.sourceGrade - trade.targetGrade);
        ratio = `${TRADE_ACROSS_COST * yieldPerUnit}:1`;
      } else if (trade.tradeType === 'CROSS_UPGRADE') {
        const costPerUnit = Math.pow(TRADE_UP_COST, trade.targetGrade - trade.sourceGrade);
        ratio = `${costPerUnit * TRADE_ACROSS_COST}:1`;
      } else {
        ratio = `${TRADE_ACROSS_COST}:1`;
      }
    } else {
      ratio = '1:1';
    }

    displayTrades.push({
      action: trade.tradeType,
      input: {
        item: sourceItem,
        type: trade.sourceType,
        quality: trade.sourceGrade + 1,  // Convert 0-indexed to 1-indexed
        amount: trade.sourceQty
      },
      output: {
        item: targetItem,
        type: trade.targetType,
        quality: trade.targetGrade + 1,  // Convert 0-indexed to 1-indexed
        amount: trade.targetQty
      },
      ratio: ratio
    });
  }

  return displayTrades;
}

// Calculate fulfilled and unfulfilled from optimized inventory
function calculateFulfilledUnfulfilled(originalNeeds, finalInvs, gradeNeeds) {
  const fulfilled = [];
  const unfulfilled = [];

  for (const need of originalNeeds) {
    const mat = getMaterial(need.item);
    if (!mat) continue;

    const finalQty = finalInvs[mat.type] ? finalInvs[mat.type][mat.quality - 1] : 0;
    const neededQty = gradeNeeds[mat.type] ? gradeNeeds[mat.type][mat.quality - 1] : 0;

    if (finalQty >= neededQty) {
      fulfilled.push({
        item: need.item,
        quantity: need.quantity,
        material: mat
      });
    } else {
      const shortfall = neededQty - finalQty;
      if (shortfall > 0) {
        unfulfilled.push({
          item: need.item,
          quantity: shortfall,
          material: mat
        });
      }

      const partialFulfillment = need.quantity - shortfall;
      if (partialFulfillment > 0) {
        fulfilled.push({
          item: need.item,
          quantity: partialFulfillment,
          material: mat
        });
      }
    }
  }

  return [fulfilled, unfulfilled];
}

// Main entry point for trading optimization
export function optimizeTrading(inventory, needs) {
  const invs = convertToGradeInventory(inventory);
  const gradeNeeds = convertToGradeNeeds(needs);

  const [finalInvs, tradesObj] = optimize(invs, gradeNeeds);

  const trades = convertTradesToDisplay(tradesObj.getTrades());
  const [fulfilled, unfulfilled] = calculateFulfilledUnfulfilled(needs, finalInvs, gradeNeeds);

  // Convert final inventories back to item-based format
  const remainingInventory = [];
  for (const [type, gradeArray] of Object.entries(finalInvs)) {
    for (let grade = 0; grade < gradeArray.length; grade++) {
      const qty = gradeArray[grade];
      if (qty > 0) {
        const items = getMaterialsAtTypeQuality(type, grade + 1);
        if (items.length > 0) {
          remainingInventory.push({
            item: items[0].item,
            quantity: qty
          });
        }
      }
    }
  }

  const groupedTrades = groupTradesByBaseType(trades);

  return {
    trades,
    groupedTrades,
    fulfilled,
    unfulfilled,
    remainingInventory
  };
}

export function calculateBlueprintCosts(selectedBlueprints) {
  const totals = {};

  for (const bp of selectedBlueprints) {
    const moduleData = getBlueprint(bp.module);
    if (!moduleData) continue;

    const blueprintData = moduleData.blueprints[bp.blueprint];
    if (!blueprintData) continue;

    // Get the rolls from the blueprint object, fallback to strategy if not available
    const rolls = bp.rolls || REROLL_STRATEGIES[bp.strategy || 'single']?.rolls || { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 };

    for (let g = bp.fromGrade; g <= bp.toGrade; g++) {
      const gradeMats = blueprintData.grades[g];
      if (!gradeMats) continue;

      // Get rolls for this specific grade
      const rollsForGrade = rolls[g] ?? 1;

      for (const mat of gradeMats) {
        const key = mat.item;
        if (!totals[key]) totals[key] = 0;
        totals[key] += mat.qty * rollsForGrade;
      }
    }
  }

  return Object.entries(totals).map(([item, quantity]) => ({ item, quantity }));
}

export function calculateExperimentalCosts(selectedExperimentals) {
  const totals = {};

  for (const exp of selectedExperimentals) {
    const moduleData = getExperimentals(exp.module);
    if (!moduleData) continue;

    const experimentalData = moduleData.experimentals[exp.experimental];
    if (!experimentalData) continue;

    // Multiply by quantity (number of times this experimental is being applied)
    const quantity = exp.quantity ?? 1;

    // Skip if quantity is 0
    if (quantity === 0) continue;

    for (const mat of experimentalData) {
      const key = mat.item;
      if (!totals[key]) totals[key] = 0;
      totals[key] += mat.qty * quantity;
    }
  }

  return Object.entries(totals).map(([item, quantity]) => ({ item, quantity }));
}

// Extract base material type (Raw, Manufactured, Encoded) from material type string
export function getBaseMaterialType(materialType) {
  if (materialType.startsWith('Raw')) return 'Raw';
  if (materialType.startsWith('Manufactured')) return 'Manufactured';
  if (materialType.startsWith('Encoded')) return 'Encoded';
  return 'Unknown';
}

// Group trades by base material type (Raw, Manufactured, Encoded)
export function groupTradesByBaseType(trades) {
  const groups = {
    'Raw': [],
    'Manufactured': [],
    'Encoded': []
  };

  for (const trade of trades) {
    // Determine the base type from the input material (the material being traded away)
    const baseType = getBaseMaterialType(trade.input.type);
    if (groups[baseType]) {
      groups[baseType].push(trade);
    }
  }

  // Filter out empty groups
  const result = {};
  for (const [type, tradeList] of Object.entries(groups)) {
    if (tradeList.length > 0) {
      result[type] = tradeList;
    }
  }

  return result;
}

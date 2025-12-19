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
  minimum: {
    name: 'Minimum',
    rolls: { 1: 1, 2: 1, 3: 3, 4: 4, 5: 6 }
  },
  typical: {
    name: 'Typical',
    rolls: { 1: 1, 2: 2, 3: 4, 4: 8, 5: 10 }
  },
  maximum: {
    name: 'Maximum',
    rolls: { 1: 2, 2: 3, 3: 5, 4: 10, 5: 12 }
  }
};

// Trade ratios
export const TRADE_UP_COST = 6;
export const TRADE_DOWN_YIELD = 3;
export const TRADE_ACROSS_COST = 6;

export function getConversionCost(fromType, fromQuality, toType, toQuality) {
  // Cannot trade between different main categories (Encoded, Manufactured, Raw)
  if (getMainCategory(fromType) !== getMainCategory(toType)) {
    return Infinity; // Impossible trade
  }

  let cost = 1;
  let currentQuality = fromQuality;

  while (currentQuality !== toQuality) {
    if (currentQuality < toQuality) {
      cost *= TRADE_UP_COST;
      currentQuality++;
    } else {
      cost /= TRADE_DOWN_YIELD;
      currentQuality--;
    }
  }

  if (fromType !== toType) {
    cost *= TRADE_ACROSS_COST;
  }

  return cost;
}

export function optimizeTrading(inventory, needs) {
  const inv = JSON.parse(JSON.stringify(inventory));
  const req = JSON.parse(JSON.stringify(needs));
  const trades = [];
  const fulfilled = [];
  const unfulfilled = [];

  // Store original order for later restoration
  const originalOrder = new Map();
  req.forEach((need, index) => {
    originalOrder.set(need, index);
  });

  // Direct fulfillment
  for (const need of req) {
    const match = inv.find(i => i.item === need.item);
    if (match && match.quantity > 0) {
      const take = Math.min(match.quantity, need.quantity);
      match.quantity -= take;
      need.quantity -= take;
      if (take > 0) {
        fulfilled.push({
          item: need.item,
          quantity: take,
          method: 'DIRECT',
          material: getMaterial(need.item)
        });
      }
    }
  }

  // Same type/quality matches
  for (const need of req) {
    if (need.quantity <= 0) continue;
    const needMat = getMaterial(need.item);

    for (const source of inv) {
      if (source.quantity <= 0) continue;
      const srcMat = getMaterial(source.item);

      if (srcMat.type === needMat.type && srcMat.quality === needMat.quality && srcMat.item !== needMat.item) {
        const take = Math.min(source.quantity, need.quantity);
        source.quantity -= take;
        need.quantity -= take;
        if (take > 0) {
          fulfilled.push({
            item: need.item,
            quantity: take,
            method: 'SAME_SLOT',
            from: source.item,
            material: needMat
          });
          trades.push({
            action: 'SAME_SLOT_TRADE',
            input: { item: source.item, type: srcMat.type, quality: srcMat.quality, amount: take },
            output: { item: need.item, type: needMat.type, quality: needMat.quality, amount: take },
            ratio: '1:1'
          });
        }
      }
    }
  }

  // Sort needs to optimize remainder reuse
  // Priority: cross-type conversions first (most complex), then by quality (lowest first)
  // This maximizes the chance that remainders from complex conversions fulfill simpler needs
  req.sort((a, b) => {
    const matA = getMaterial(a.item);
    const matB = getMaterial(b.item);
    if (!matA || !matB) return 0;

    // Check if conversion requires cross-type (different subcategory within same main category)
    const needsCrossTypeA = inv.some(i => {
      const srcMat = getMaterial(i.item);
      return i.quantity > 0 && srcMat &&
             getMainCategory(srcMat.type) === getMainCategory(matA.type) &&
             srcMat.type !== matA.type;
    });

    const needsCrossTypeB = inv.some(i => {
      const srcMat = getMaterial(i.item);
      return i.quantity > 0 && srcMat &&
             getMainCategory(srcMat.type) === getMainCategory(matB.type) &&
             srcMat.type !== matB.type;
    });

    // Cross-type conversions go first
    if (needsCrossTypeA && !needsCrossTypeB) return -1;
    if (!needsCrossTypeA && needsCrossTypeB) return 1;

    // Within same conversion type, process lower quality first
    // This way higher quality remainders can fulfill lower quality needs
    return matA.quality - matB.quality;
  });

  // Type conversions
  for (const need of req) {
    if (need.quantity <= 0) continue;
    const needMat = getMaterial(need.item);

    // Check if we can combine multiple sources through intermediate conversions
    // This handles cases where preexisting inventory at intermediate quality can be pooled
    const needsCrossType = inv.some(i => {
      const mat = getMaterial(i.item);
      return i.quantity > 0 && mat && getMainCategory(mat.type) === getMainCategory(needMat.type) && mat.type !== needMat.type;
    });

    if (needsCrossType) {
      // Group inventory by main category and quality
      const sameCategory = inv.filter(i => {
        const mat = getMaterial(i.item);
        return i.quantity > 0 && mat && getMainCategory(mat.type) === getMainCategory(needMat.type);
      });

      // Build preliminary options to determine which type will be selected for conversion
      const prelimOptions = [];
      for (const source of sameCategory) {
        const srcMat = getMaterial(source.item);
        if (!srcMat) continue;
        const costPerUnit = getConversionCost(srcMat.type, srcMat.quality, needMat.type, needMat.quality);
        if (costPerUnit > 0 && isFinite(costPerUnit)) {
          const qualityDistance = Math.abs(srcMat.quality - needMat.quality);
          prelimOptions.push({ source, srcMat, costPerUnit, qualityDistance });
        }
      }

      // Sort to find which type will be selected (same logic as main options sorting)
      prelimOptions.sort((a, b) => {
        if (a.qualityDistance !== b.qualityDistance) {
          return a.qualityDistance - b.qualityDistance;
        }
        return a.costPerUnit - b.costPerUnit;
      });

      // Get the type that will be selected for conversion
      const selectedType = prelimOptions[0]?.srcMat.type;

      // Only consolidate materials for the selected type
      if (selectedType) {
        for (const source of sameCategory) {
          const srcMat = getMaterial(source.item);
          // Only process materials of the selected type
          if (!srcMat || srcMat.type !== selectedType || srcMat.type === needMat.type) continue;

          // Check if we should downgrade this to match other materials at target quality
          if (srcMat.quality > needMat.quality && srcMat.type !== needMat.type) {
            // Calculate how much we'd have at target quality after downgrading
            const yieldPerUnit = Math.pow(TRADE_DOWN_YIELD, srcMat.quality - needMat.quality);
            const potentialAtTargetQuality = source.quantity * yieldPerUnit;

            // Check if we have existing inventory at the intermediate quality (target quality, source type)
            const intermediateItems = getMaterialsAtTypeQuality(srcMat.type, needMat.quality);
            let existingAtIntermediate = 0;
            for (const intItem of intermediateItems) {
              const existing = inv.find(i => i.item === intItem.item && i.quantity > 0);
              if (existing) {
                existingAtIntermediate += existing.quantity;
              }
            }

            // If pooling would give us enough for the cross-type conversion
            const neededForCrossType = need.quantity * TRADE_ACROSS_COST;
            const totalAfterPooling = potentialAtTargetQuality + existingAtIntermediate;

            if (totalAfterPooling >= neededForCrossType && existingAtIntermediate > 0) {
              // Calculate how much intermediate we still need after using existing inventory
              const intermediateStillNeeded = Math.max(0, neededForCrossType - existingAtIntermediate);

              // Calculate how much source to downgrade to get that intermediate amount
              const sourceToDowngrade = Math.ceil(intermediateStillNeeded / yieldPerUnit);
              const actualSourceToDowngrade = Math.min(source.quantity, sourceToDowngrade);

              // Only downgrade if we actually need more intermediate material
              if (actualSourceToDowngrade > 0) {
                const intermediateItem = intermediateItems[0];
                if (intermediateItem) {
                  const downgradeOutput = actualSourceToDowngrade * yieldPerUnit;
                  const downgradeRatio = srcMat.quality === needMat.quality + 1 ? '1:3' : `1:${yieldPerUnit}`;

                  trades.push({
                    action: 'DOWNGRADE',
                    input: { item: source.item, type: srcMat.type, quality: srcMat.quality, amount: actualSourceToDowngrade },
                    output: { item: intermediateItem.item, type: srcMat.type, quality: needMat.quality, amount: downgradeOutput },
                    ratio: downgradeRatio
                  });

                  // Update inventory: remove only what we converted, add to intermediate
                  source.quantity -= actualSourceToDowngrade;
                  const existingIntermediate = inv.find(i => i.item === intermediateItem.item);
                  if (existingIntermediate) {
                    existingIntermediate.quantity += downgradeOutput;
                  } else {
                    inv.push({ item: intermediateItem.item, quantity: downgradeOutput });
                  }
                }
              }
            }
          }
        }
      }
    }

    const options = [];

    for (const source of inv) {
      if (source.quantity <= 0) continue;
      const srcMat = getMaterial(source.item);
      if (srcMat.item === needMat.item) continue;

      const costPerUnit = getConversionCost(srcMat.type, srcMat.quality, needMat.type, needMat.quality);

      if (costPerUnit > 0 && isFinite(costPerUnit)) {
        // Calculate quality distance to prefer intermediate materials over raw materials
        const qualityDistance = Math.abs(srcMat.quality - needMat.quality);
        options.push({ source, srcMat, costPerUnit, qualityDistance, efficiency: 1 / costPerUnit });
      }
    }

    // Sort by quality distance first (prefer intermediate materials), then by cost
    options.sort((a, b) => {
      // Always prefer closer quality to use up intermediate materials first
      if (a.qualityDistance !== b.qualityDistance) {
        return a.qualityDistance - b.qualityDistance;
      }
      // If same quality distance, prefer lower cost
      return a.costPerUnit - b.costPerUnit;
    });

    for (const opt of options) {
      if (need.quantity <= 0) break;
      if (opt.source.quantity <= 0) continue;

      // Check if this is a multi-step conversion with potential intermediate materials
      let effectiveSourceQuantity = opt.source.quantity;
      let intermediateContribution = 0;
      let intermediateItemFound = null;

      // If source and target are different types or qualities, check for intermediate materials
      if (opt.srcMat.type !== needMat.type || opt.srcMat.quality !== needMat.quality) {
        // Look for intermediate materials at the source's type
        // The intermediate would be at a quality level between source and target
        const minQ = Math.min(opt.srcMat.quality, needMat.quality);
        const maxQ = Math.max(opt.srcMat.quality, needMat.quality);

        for (let q = minQ; q <= maxQ; q++) {
          if (q === opt.srcMat.quality) continue; // Skip source quality

          const intermediateItems = getMaterialsAtTypeQuality(opt.srcMat.type, q);
          for (const intItem of intermediateItems) {
            const existing = inv.find(i => i.item === intItem.item && i.quantity > 0);
            if (!existing) continue;

            // Check if this intermediate can convert to target
            const intToTargetCost = getConversionCost(intItem.type, intItem.quality, needMat.type, needMat.quality);
            if (!isFinite(intToTargetCost)) continue;

            // Check if source can convert to this intermediate
            const srcToIntCost = getConversionCost(opt.srcMat.type, opt.srcMat.quality, intItem.type, intItem.quality);
            if (!isFinite(srcToIntCost)) continue;

            // This is a valid intermediate! Calculate how much we can save
            // How much intermediate do we need total to fulfill the target need?
            const intermediateNeededTotal = need.quantity * intToTargetCost;

            // We have some intermediate already - even if partial, it reduces what we need to convert
            const intermediateWeHave = existing.quantity;

            if (intermediateWeHave > 0) {
              intermediateItemFound = {item: intItem, cost: intToTargetCost};

              // Calculate how much more intermediate we still need
              const intermediateStillNeeded = Math.max(0, intermediateNeededTotal - intermediateWeHave);

              // How much source do we need to produce the still-needed intermediate?
              let sourceNeededForIntermediate;
              let intermediateFromSource = 0;
              if (opt.srcMat.quality > intItem.quality) {
                // Downgrade: 1 source → multiple intermediate
                const yieldPerSource = Math.pow(TRADE_DOWN_YIELD, opt.srcMat.quality - intItem.quality);
                sourceNeededForIntermediate = Math.ceil(intermediateStillNeeded / yieldPerSource);
              } else {
                // Upgrade: need multiple source → 1 intermediate
                const costPerIntermediate = Math.pow(TRADE_UP_COST, intItem.quality - opt.srcMat.quality);
                sourceNeededForIntermediate = Math.ceil(intermediateStillNeeded * costPerIntermediate);
              }

              effectiveSourceQuantity = Math.min(opt.source.quantity, sourceNeededForIntermediate);

              // Recalculate intermediateFromSource based on what we actually have
              if (opt.srcMat.quality > intItem.quality) {
                // Downgrade: 1 source → multiple intermediate
                const yieldPerSource = Math.pow(TRADE_DOWN_YIELD, opt.srcMat.quality - intItem.quality);
                intermediateFromSource = effectiveSourceQuantity * yieldPerSource;
              } else {
                // Upgrade: need multiple source → 1 intermediate
                const costPerIntermediate = Math.pow(TRADE_UP_COST, intItem.quality - opt.srcMat.quality);
                intermediateFromSource = Math.floor(effectiveSourceQuantity / costPerIntermediate);
              }

              // Calculate total intermediate after pooling (existing + produced)
              const totalIntermediate = intermediateWeHave + intermediateFromSource;
              intermediateContribution = Math.floor(totalIntermediate / intToTargetCost);
              break;
            }
          }
          if (effectiveSourceQuantity !== opt.source.quantity) break;
        }
      }

      // Calculate how much we can actually produce with whole number inputs
      // Account for intermediate material contribution
      const maxProducibleFromSource = Math.floor(effectiveSourceQuantity / opt.costPerUnit);
      const maxProducible = maxProducibleFromSource + intermediateContribution;
      const toProduce = Math.min(maxProducible, need.quantity);

      if (toProduce > 0) {
        // Calculate the exact whole number of source materials needed
        // If we have intermediate materials, only consume what's needed for the source→intermediate conversion
        let consumed;
        if (intermediateContribution > 0) {
          // We're using intermediate materials, so only consume effectiveSourceQuantity
          consumed = effectiveSourceQuantity;
        } else {
          // No intermediate materials, use full source→target cost
          consumed = Math.ceil(toProduce * opt.costPerUnit);
        }

        // Ensure we don't consume more than we have
        const actualConsumed = Math.min(consumed, opt.source.quantity);

        // Recalculate actual production based on whole number consumption
        let actualProduced;
        if (intermediateContribution > 0) {
          // When using intermediate materials, production is from pooling, not just source
          actualProduced = toProduce; // We already calculated this correctly above
        } else {
          // No intermediate materials, calculate from source consumption
          actualProduced = Math.floor(actualConsumed / opt.costPerUnit);
        }

        // Only proceed if we can actually produce something
        if (actualProduced > 0 && actualConsumed <= opt.source.quantity) {
          // Calculate how much we actually fulfill
          const toFulfill = Math.min(actualProduced, need.quantity);

          // For upgrades, check if there will be a remainder
          // If so, include it in the input amount for the trade
          let inputForTrade = actualConsumed;
          if (opt.srcMat.quality < needMat.quality) {
            // This is an upgrade - check for remainder
            const remainder = opt.source.quantity - actualConsumed;
            if (remainder > 0 && remainder < opt.costPerUnit) {
              // Include the remainder in the trade input (but don't consume it from inventory)
              inputForTrade = actualConsumed + remainder;
            }
          }

          opt.source.quantity -= actualConsumed;
          need.quantity -= toFulfill;

          // If we're using intermediate pooling, we need to generate trades that show the pooled amounts
          let tradeSteps;
          if (intermediateContribution > 0 && intermediateItemFound) {
            // We're pooling intermediate materials
            // Find and consume the existing intermediate from inventory
            const existingInt = inv.find(i => i.item === intermediateItemFound.item.item && i.quantity > 0);
            const intermediateUsed = existingInt ? existingInt.quantity : 0;

            // Calculate how much intermediate we're producing from source
            let intermediateProduced = 0;
            if (opt.srcMat.quality > intermediateItemFound.item.quality) {
              // Downgrade
              const yieldPerSource = Math.pow(TRADE_DOWN_YIELD, opt.srcMat.quality - intermediateItemFound.item.quality);
              intermediateProduced = actualConsumed * yieldPerSource;
            } else if (opt.srcMat.quality < intermediateItemFound.item.quality) {
              // Upgrade
              const costPerIntermediate = Math.pow(TRADE_UP_COST, intermediateItemFound.item.quality - opt.srcMat.quality);
              intermediateProduced = Math.floor(actualConsumed / costPerIntermediate);
            }

            // Total intermediate available
            const totalIntermediate = intermediateUsed + intermediateProduced;

            // Consume the existing intermediate from inventory
            if (existingInt && intermediateUsed > 0) {
              existingInt.quantity -= intermediateUsed;
            }

            // Generate trades: source → intermediate, then intermediate → target (using total pooled amount)
            tradeSteps = [];

            // Step 1: source → intermediate (if we're producing any)
            if (actualConsumed > 0 && intermediateProduced > 0) {
              const srcToIntSteps = generateTradeSteps(opt.srcMat, intermediateItemFound.item, actualConsumed, intermediateProduced, intermediateProduced);
              tradeSteps.push(...srcToIntSteps);
            }

            // Step 2: intermediate → target (using total pooled amount)
            if (totalIntermediate > 0) {
              const intToTargetSteps = generateTradeSteps(intermediateItemFound.item, needMat, totalIntermediate, toFulfill, toFulfill);
              tradeSteps.push(...intToTargetSteps);
            }
          } else {
            // No intermediate pooling, generate trades normally
            tradeSteps = generateTradeSteps(opt.srcMat, needMat, inputForTrade, toFulfill, need.quantity + toFulfill);
          }

          // Check if the trades produced more than needed at the target quality
          // This happens with single-level downgrades where we can't leave remainder at higher quality
          const qualityDiff = Math.abs(opt.srcMat.quality - needMat.quality);
          const sameType = opt.srcMat.type === needMat.type;

          // For single-level downgrades of same type, calculate leftover
          if (sameType && qualityDiff === 1 && opt.srcMat.quality > needMat.quality) {
            const leftover = actualProduced - toFulfill;
            if (leftover > 0) {
              const existingLeftover = inv.find(i => i.item === needMat.item);
              if (existingLeftover) {
                existingLeftover.quantity += leftover;
              } else {
                inv.push({ item: needMat.item, quantity: leftover });
              }
            }
          }

          // Always show detailed steps - don't simplify multi-step conversions
          // This allows users to see the full conversion path
          trades.push(...tradeSteps);

          // Add any remainders from intermediate conversion steps back to inventory
          // Skip the first step's remainder as it's already tracked in opt.source.quantity
          for (let i = 1; i < tradeSteps.length; i++) {
            const step = tradeSteps[i];
            if (step.remainder && step.remainder.amount > 0) {
              const existingRemainder = inv.find(item => item.item === step.remainder.item);
              if (existingRemainder) {
                existingRemainder.quantity += step.remainder.amount;
              } else {
                inv.push({ item: step.remainder.item, quantity: step.remainder.amount });
              }
            }
          }

          fulfilled.push({
            item: need.item,
            quantity: toFulfill,
            method: 'CONVERTED',
            from: opt.source.item,
            consumed: actualConsumed,
            material: needMat
          });
        }
      }
    }

    // After processing conversions for this need, check if remainders can directly fulfill other needs
    for (const otherNeed of req) {
      if (otherNeed === need || otherNeed.quantity <= 0) continue;
      const match = inv.find(i => i.item === otherNeed.item);
      if (match && match.quantity > 0) {
        const take = Math.min(match.quantity, otherNeed.quantity);
        match.quantity -= take;
        otherNeed.quantity -= take;
        if (take > 0) {
          fulfilled.push({
            item: otherNeed.item,
            quantity: take,
            method: 'DIRECT',
            material: getMaterial(otherNeed.item)
          });
        }
      }
    }

    if (need.quantity > 0) {
      unfulfilled.push({
        item: need.item,
        quantity: need.quantity,
        material: needMat
      });
    }
  }

  // Group trades by base material type
  const groupedTrades = groupTradesByBaseType(trades);

  // Consolidate fulfilled entries by item
  const consolidatedFulfilled = [];
  const fulfilledByItem = new Map();

  for (const entry of fulfilled) {
    if (!fulfilledByItem.has(entry.item)) {
      fulfilledByItem.set(entry.item, {
        item: entry.item,
        quantity: 0,
        method: entry.method,
        material: entry.material,
        from: entry.from,
        consumed: 0
      });
      consolidatedFulfilled.push(fulfilledByItem.get(entry.item));
    }

    const consolidated = fulfilledByItem.get(entry.item);
    consolidated.quantity += entry.quantity;

    // Update method if we have both direct and converted
    if (consolidated.method === 'DIRECT' && entry.method === 'CONVERTED') {
      consolidated.method = 'MIXED';
      consolidated.from = entry.from;
      consolidated.consumed = entry.consumed;
    } else if (entry.method === 'CONVERTED') {
      consolidated.consumed += (entry.consumed || 0);
    }
  }

  // Sort fulfilled back to original order for user expectations
  consolidatedFulfilled.sort((a, b) => {
    const needA = req.find(n => n.item === a.item);
    const needB = req.find(n => n.item === b.item);
    const orderA = needA ? originalOrder.get(needA) : Infinity;
    const orderB = needB ? originalOrder.get(needB) : Infinity;
    return orderA - orderB;
  });

  return {
    trades,
    groupedTrades,
    fulfilled: consolidatedFulfilled,
    unfulfilled,
    remainingInventory: inv.filter(i => i.quantity > 0)
  };
}

export function generateTradeSteps(srcMat, targetMat, inputAmount, targetQuantity, totalNeeded) {
  // Find the optimal conversion path that respects integer constraints
  return findOptimalConversionPath(srcMat, targetMat, inputAmount, targetQuantity, totalNeeded);
}

// Find the optimal conversion path that produces exactly the target quantity
// while keeping remainders at the highest possible grade
function findOptimalConversionPath(srcMat, targetMat, availableAmount, targetQuantity, totalNeeded) {
  const steps = [];

  // If same material, no conversion needed
  if (srcMat.item === targetMat.item) {
    return steps;
  }

  // Use direct conversion strategy for better control
  const result = directConversionStrategy(srcMat, targetMat, availableAmount, targetQuantity, totalNeeded);

  return result ? result.steps : [];
}

// Direct conversion strategy - convert step by step
function directConversionStrategy(srcMat, targetMat, inputAmount, targetQuantity, _totalNeeded) {
  const steps = [];
  const currentType = srcMat.type;
  let currentQuality = srcMat.quality;
  let currentAmount = inputAmount;
  let currentItem = srcMat.item;

  // Calculate how much we need at each quality level for cross-type conversions
  const needsCrossType = currentType !== targetMat.type;
  let neededAtTargetQuality = targetQuantity;

  if (needsCrossType) {
    // Work backwards to figure out how much we need at the target quality level
    // before the cross-type conversion
    neededAtTargetQuality = targetQuantity * TRADE_ACROSS_COST;
  }

  // First, handle quality changes within the same type
  if (currentQuality !== targetMat.quality) {
    if (currentQuality < targetMat.quality) {
      // Multi-step upgrade: combine into single trade
      const qualityDiff = targetMat.quality - currentQuality;
      const costPerUnit = Math.pow(TRADE_UP_COST, qualityDiff);

      const output = Math.floor(currentAmount / costPerUnit);
      if (output === 0) {
        // Can't upgrade, return empty steps
        return { steps: [], inputUsed: 0, outputQuantity: 0 };
      }

      const consumed = output * costPerUnit;
      const remainder = currentAmount - consumed;

      const targetItems = getMaterialsAtTypeQuality(currentType, targetMat.quality);
      const targetItem = targetItems[0]?.item || `Grade ${targetMat.quality}`;

      const ratio = qualityDiff === 1 ? '6:1' : `${costPerUnit}:1`;

      const step = {
        action: 'UPGRADE',
        input: { item: currentItem, type: currentType, quality: currentQuality, amount: currentAmount },
        output: { item: targetItem, type: currentType, quality: targetMat.quality, amount: output },
        ratio: ratio
      };

      // Add remainder information if there is one
      if (remainder > 0) {
        step.remainder = {
          item: currentItem,
          type: currentType,
          quality: currentQuality,
          amount: remainder
        };
      }

      steps.push(step);

      currentAmount = output;
      currentQuality = targetMat.quality;
      currentItem = targetItem;
    } else {
      // Downgrade: Use step-by-step approach to leave remainders at highest quality
      const qualityDiff = currentQuality - targetMat.quality;

      // For cross-type downgrades, we need to handle the final step specially
      // We downgrade step-by-step until we reach targetQuality + 1, then combine
      // the final downgrade with the cross-type conversion
      if (needsCrossType && qualityDiff > 0) {
        // Calculate how much we need at each quality level, working backwards
        // For the final step (targetQuality+1 → targetQuality with cross-type): need 2:1 ratio
        const neededAtTargetQualityPlus1 = targetQuantity * 2;

        // Build the chain of needed amounts at each quality level
        const neededAtQuality = {};
        neededAtQuality[targetMat.quality + 1] = neededAtTargetQualityPlus1;

        // Work backwards to calculate how much we need at each intermediate quality
        for (let q = targetMat.quality + 2; q <= currentQuality; q++) {
          // To get X at quality (q-1), we need Math.ceil(X/3) at quality q
          neededAtQuality[q] = Math.ceil(neededAtQuality[q - 1] / TRADE_DOWN_YIELD);
        }

        // Now downgrade step-by-step, only converting what we need
        while (currentQuality > targetMat.quality + 1) {
          const nextQuality = currentQuality - 1;
          const nextQualityItems = getMaterialsAtTypeQuality(currentType, nextQuality);
          const nextQualityItem = nextQualityItems[0]?.item || `Grade ${nextQuality}`;

          // Calculate how much to convert at this step
          const neededAtNextQuality = neededAtQuality[nextQuality];
          const amountToConvert = Math.ceil(neededAtNextQuality / TRADE_DOWN_YIELD);
          const actualConvert = Math.min(currentAmount, amountToConvert);
          const output = actualConvert * TRADE_DOWN_YIELD;
          const remainder = currentAmount - actualConvert;

          const step = {
            action: 'DOWNGRADE',
            input: { item: currentItem, type: currentType, quality: currentQuality, amount: actualConvert },
            output: { item: nextQualityItem, type: currentType, quality: nextQuality, amount: output },
            ratio: '1:3'
          };

          if (remainder > 0) {
            step.remainder = {
              item: currentItem,
              type: currentType,
              quality: currentQuality,
              amount: remainder
            };
          }

          steps.push(step);

          currentAmount = output;
          currentQuality = nextQuality;
          currentItem = nextQualityItem;
        }

        // Now we're at targetQuality + 1, and we need to do the final downgrade + cross-type
        // The combined cost is: (1/3 downgrade) * (6 cross-type) = 2
        // So the ratio is 2:1 (need 2 units to get 1 unit)
        const neededInput = targetQuantity * 2; // 2:1 ratio
        const amountToConvert = Math.min(currentAmount, neededInput);
        const output = Math.floor(amountToConvert / 2);

        if (output > 0) {
          const consumed = output * 2;
          const remainder = currentAmount - consumed;

          const step = {
            action: 'CROSS_TYPE',
            input: { item: currentItem, type: currentType, quality: currentQuality, amount: consumed },
            output: { item: targetMat.item, type: targetMat.type, quality: targetMat.quality, amount: output },
            ratio: '2:1'
          };

          if (remainder > 0) {
            step.remainder = {
              item: currentItem,
              type: currentType,
              quality: currentQuality,
              amount: remainder
            };
          }

          steps.push(step);
          currentAmount = output;
          currentQuality = targetMat.quality;
          currentItem = targetMat.item;
        }

        // We've already handled the cross-type, so we're done
        return {
          steps,
          inputUsed: inputAmount,
          outputQuantity: currentAmount
        };
      }

      // Standard downgrade without cross-type
      // If multiple steps needed and we won't use all material, downgrade incrementally
      if (qualityDiff > 1) {
        // Calculate total yield if we converted everything
        const totalYieldPerUnit = Math.pow(TRADE_DOWN_YIELD, qualityDiff);
        const totalPossibleOutput = currentAmount * totalYieldPerUnit;

        // Determine target amount considering cross-type needs
        let actualTargetQuantity = targetQuantity;
        if (currentType !== targetMat.type) {
          actualTargetQuantity = neededAtTargetQuality;
        }

        // If we'd produce significantly more than needed, downgrade step-by-step
        if (totalPossibleOutput > actualTargetQuantity) {
          // First downgrade one level
          const firstStepOutput = currentAmount * TRADE_DOWN_YIELD;
          const nextQuality = currentQuality - 1;
          const nextQualityItems = getMaterialsAtTypeQuality(currentType, nextQuality);
          const nextQualityItem = nextQualityItems[0]?.item || `Grade ${nextQuality}`;

          steps.push({
            action: 'DOWNGRADE',
            input: { item: currentItem, type: currentType, quality: currentQuality, amount: currentAmount },
            output: { item: nextQualityItem, type: currentType, quality: nextQuality, amount: firstStepOutput },
            ratio: '1:3'
          });

          currentAmount = firstStepOutput;
          currentQuality = nextQuality;
          currentItem = nextQualityItem;

          // Now calculate how much we need from this level
          const remainingQualityDiff = nextQuality - targetMat.quality;
          const remainingYieldPerUnit = Math.pow(TRADE_DOWN_YIELD, remainingQualityDiff);
          const neededAtCurrentLevel = Math.ceil(actualTargetQuantity / remainingYieldPerUnit);
          const amountToConvert = Math.min(currentAmount, neededAtCurrentLevel);

          // If we still have multiple levels, combine the rest
          if (remainingQualityDiff > 0) {
            const output = amountToConvert * remainingYieldPerUnit;
            const targetItems = getMaterialsAtTypeQuality(currentType, targetMat.quality);
            const targetItem = targetItems[0]?.item || `Grade ${targetMat.quality}`;
            const ratio = remainingQualityDiff === 1 ? '1:3' : `1:${remainingYieldPerUnit}`;

            const step = {
              action: 'DOWNGRADE',
              input: { item: currentItem, type: currentType, quality: currentQuality, amount: amountToConvert },
              output: { item: targetItem, type: currentType, quality: targetMat.quality, amount: output },
              ratio: ratio
            };

            const remainder = currentAmount - amountToConvert;
            if (remainder > 0) {
              step.remainder = {
                item: currentItem,
                type: currentType,
                quality: currentQuality,
                amount: remainder
              };
            }

            steps.push(step);
            currentAmount = output;
            currentQuality = targetMat.quality;
            currentItem = targetItem;
          }
        } else {
          // We need most/all of it, so combine into single trade
          const yieldPerUnit = totalYieldPerUnit;
          const output = currentAmount * yieldPerUnit;
          const targetItems = getMaterialsAtTypeQuality(currentType, targetMat.quality);
          const targetItem = targetItems[0]?.item || `Grade ${targetMat.quality}`;
          const ratio = `1:${yieldPerUnit}`;

          steps.push({
            action: 'DOWNGRADE',
            input: { item: currentItem, type: currentType, quality: currentQuality, amount: currentAmount },
            output: { item: targetItem, type: currentType, quality: targetMat.quality, amount: output },
            ratio: ratio
          });

          currentAmount = output;
          currentQuality = targetMat.quality;
          currentItem = targetItem;
        }
      } else {
        // Single level downgrade
        const output = currentAmount * TRADE_DOWN_YIELD;
        const targetItems = getMaterialsAtTypeQuality(currentType, targetMat.quality);
        const targetItem = targetItems[0]?.item || `Grade ${targetMat.quality}`;

        steps.push({
          action: 'DOWNGRADE',
          input: { item: currentItem, type: currentType, quality: currentQuality, amount: currentAmount },
          output: { item: targetItem, type: currentType, quality: targetMat.quality, amount: output },
          ratio: '1:3'
        });

        currentAmount = output;
        currentQuality = targetMat.quality;
        currentItem = targetItem;
      }
    }
  }

  // Then handle type change if needed (only if not already handled above)
  if (currentType !== targetMat.type) {
    // Calculate how much we need to convert for cross-type
    const neededInput = Math.min(currentAmount, targetQuantity * TRADE_ACROSS_COST);
    const actualInput = Math.floor(neededInput / TRADE_ACROSS_COST) * TRADE_ACROSS_COST;

    const output = Math.floor(actualInput / TRADE_ACROSS_COST);
    if (output > 0) {
      const consumed = output * TRADE_ACROSS_COST;
      const remainder = currentAmount - consumed;

      const step = {
        action: 'CROSS_TYPE',
        input: { item: currentItem, type: currentType, quality: currentQuality, amount: actualInput },
        output: { item: targetMat.item, type: targetMat.type, quality: targetMat.quality, amount: output },
        ratio: '6:1'
      };

      // Add remainder information if there is one
      if (remainder > 0) {
        step.remainder = {
          item: currentItem,
          type: currentType,
          quality: currentQuality,
          amount: remainder
        };
      }

      steps.push(step);
      currentAmount = output;
    }
  }

  return {
    steps,
    inputUsed: inputAmount,
    outputQuantity: currentAmount
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

// Check if a trade chain has remainders that would require detailed steps
export function hasTradeRemainders(steps) {
  if (steps.length <= 1) return false;
  
  // Check if any step in the chain produces a remainder
  for (let i = 0; i < steps.length - 1; i++) {
    const currentStep = steps[i];
    
    // For upgrades (6:1 ratio), check if input amount is not perfectly divisible by 6
    if (currentStep.action === 'UPGRADE' && currentStep.input.amount % 6 !== 0) {
      return true;
    }
    
    // For cross-type trades (6:1 ratio), check if input amount is not perfectly divisible by 6
    if (currentStep.action === 'CROSS_TYPE' && currentStep.input.amount % 6 !== 0) {
      return true;
    }
  }
  
  return false;
}

// Create a simplified direct conversion from a chain of trade steps
export function simplifyTradeChain(steps) {
  if (steps.length === 0) return null;
  if (steps.length === 1) return steps[0];
  
  const firstStep = steps[0];
  const lastStep = steps[steps.length - 1];
  
  // Calculate the overall conversion ratio
  let totalRatio = 1;
  for (const step of steps) {
    if (step.action === 'UPGRADE' || step.action === 'CROSS_TYPE') {
      totalRatio *= 6; // 6:1 ratio
    } else if (step.action === 'DOWNGRADE') {
      totalRatio /= 3; // 1:3 ratio
    }
  }
  
  return {
    action: 'DIRECT_CONVERSION',
    input: firstStep.input,
    output: lastStep.output,
    ratio: `${Math.round(totalRatio)}:1`,
    originalSteps: steps
  };
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

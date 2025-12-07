// Elite Dangerous Materials Database
export const MATERIALS_DB = [
  { item: 'Anomalous Bulk Scan Data', type: 'Encoded (Data archives)', quality: 1, source: 'Ship scanning (Transport ships), Mission reward' },
  { item: 'Unidentified Scan Archives', type: 'Encoded (Data archives)', quality: 2, source: 'Ship scanning (Transport ships)' },
  { item: 'Classified Scan Databanks', type: 'Encoded (Data archives)', quality: 3, source: 'Ship scanning (Transport ships), Surface POI' },
  { item: 'Divergent Scan Data', type: 'Encoded (Data archives)', quality: 4, source: 'Surface data point, Mission reward' },
  { item: 'Classified Scan Fragment', type: 'Encoded (Data archives)', quality: 5, source: 'Surface data point, Mission reward, Ship scanning (Military & authority ships)' },
  { item: 'Salvaged Alloys', type: 'Manufactured (Alloys)', quality: 1, source: 'Ship salvage (Combat ships), USS (Combat aftermath)' },
  { item: 'Galvanising Alloys', type: 'Manufactured (Alloys)', quality: 2, source: 'Ship salvage (Combat ships), USS, Mission reward' },
  { item: 'Phase Alloys', type: 'Manufactured (Alloys)', quality: 3, source: 'Ship salvage (Combat ships), USS' },
  { item: 'Proto Light Alloys', type: 'Manufactured (Alloys)', quality: 4, source: 'USS (High grade emissions), Mission reward' },
  { item: 'Proto Radiolic Alloys', type: 'Manufactured (Alloys)', quality: 5, source: 'USS (High grade emissions)' },
  { item: 'Iron', type: 'Raw (Raw material 1)', quality: 1, source: 'Surface mining, Asteroid mining' },
  { item: 'Nickel', type: 'Raw (Raw material 1)', quality: 2, source: 'Surface mining, Asteroid mining' },
  { item: 'Chromium', type: 'Raw (Raw material 2)', quality: 3, source: 'Surface mining, Asteroid mining' },
  { item: 'Manganese', type: 'Raw (Raw material 2)', quality: 4, source: 'Surface mining, Asteroid mining' },
  { item: 'Ruthenium', type: 'Raw (Raw material 3)', quality: 5, source: 'Surface mining, Asteroid mining' }
];

// Trade ratios
export const TRADE_UP_COST = 6;
export const TRADE_DOWN_YIELD = 3;
export const TRADE_ACROSS_COST = 6;

// Helper functions
export function getMaterial(itemName) {
  return MATERIALS_DB.find(m => m.item === itemName);
}

export function getMaterialsAtTypeQuality(type, quality) {
  return MATERIALS_DB.filter(m => m.type === type && m.quality === quality);
}

export function getConversionCost(fromType, fromQuality, toType, toQuality) {
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

  // Type conversions
  for (const need of req) {
    if (need.quantity <= 0) continue;
    const needMat = getMaterial(need.item);

    const options = [];

    for (const source of inv) {
      if (source.quantity <= 0) continue;
      const srcMat = getMaterial(source.item);
      if (srcMat.item === needMat.item) continue;

      const costPerUnit = getConversionCost(srcMat.type, srcMat.quality, needMat.type, needMat.quality);

      if (costPerUnit > 0 && isFinite(costPerUnit)) {
        options.push({ source, srcMat, costPerUnit, efficiency: 1 / costPerUnit });
      }
    }

    options.sort((a, b) => a.costPerUnit - b.costPerUnit);

    for (const opt of options) {
      if (need.quantity <= 0) break;
      if (opt.source.quantity <= 0) continue;

      const maxProducible = Math.floor(opt.source.quantity / opt.costPerUnit);
      const toProduce = Math.min(maxProducible, need.quantity);

      if (toProduce > 0) {
        const consumed = Math.ceil(toProduce * opt.costPerUnit);
        opt.source.quantity -= consumed;
        need.quantity -= toProduce;

        const tradeSteps = generateTradeSteps(opt.srcMat, needMat, consumed, toProduce);
        trades.push(...tradeSteps);

        fulfilled.push({
          item: need.item,
          quantity: toProduce,
          method: 'CONVERTED',
          from: opt.source.item,
          consumed,
          material: needMat
        });
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

  return { trades, fulfilled, unfulfilled, remainingInventory: inv.filter(i => i.quantity > 0) };
}

export function generateTradeSteps(srcMat, targetMat, inputAmount) {
  const steps = [];
  const currentType = srcMat.type;
  let currentQuality = srcMat.quality;
  let currentAmount = inputAmount;
  let currentItem = srcMat.item;

  while (currentQuality !== targetMat.quality) {
    if (currentQuality < targetMat.quality) {
      const output = Math.floor(currentAmount / TRADE_UP_COST);
      const targetItems = getMaterialsAtTypeQuality(currentType, currentQuality + 1);
      const targetItem = targetItems[0]?.item || `Grade ${currentQuality + 1}`;

      steps.push({
        action: 'UPGRADE',
        input: { item: currentItem, type: currentType, quality: currentQuality, amount: currentAmount },
        output: { item: targetItem, type: currentType, quality: currentQuality + 1, amount: output },
        ratio: '6:1'
      });
      currentAmount = output;
      currentQuality++;
      currentItem = targetItem;
    } else {
      const output = currentAmount * TRADE_DOWN_YIELD;
      const targetItems = getMaterialsAtTypeQuality(currentType, currentQuality - 1);
      const targetItem = targetItems[0]?.item || `Grade ${currentQuality - 1}`;

      steps.push({
        action: 'DOWNGRADE',
        input: { item: currentItem, type: currentType, quality: currentQuality, amount: currentAmount },
        output: { item: targetItem, type: currentType, quality: currentQuality - 1, amount: output },
        ratio: '1:3'
      });
      currentAmount = output;
      currentQuality--;
      currentItem = targetItem;
    }
  }

  if (currentType !== targetMat.type) {
    const output = Math.floor(currentAmount / TRADE_ACROSS_COST);
    steps.push({
      action: 'CROSS_TYPE',
      input: { item: currentItem, type: currentType, quality: currentQuality, amount: currentAmount },
      output: { item: targetMat.item, type: targetMat.type, quality: targetMat.quality, amount: output },
      ratio: '6:1'
    });
  }

  return steps;
}

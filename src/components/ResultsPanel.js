import React, { useState, useMemo, useEffect } from 'react';
import Tooltip from './Tooltip';
import { getMaterial } from '../database';

const getQualityClass = (quality) => `quality-${quality}`;

// Extract subcategory from type (e.g., "Raw (Raw material 3)" -> "Raw material 3")
const getSubcategory = (itemName) => {
  const material = getMaterial(itemName);
  if (!material?.type) return 'Unknown';

  const match = material.type.match(/\(([^)]+)\)/);
  return match ? match[1] : material.type;
};

function ResultsPanel({ allNeeds, result, executeTrade, inventory, tradeHistory, undoTrade }) {
  const [tradeTab, setTradeTab] = useState('Raw');

  // Get available trade categories - wrapped in useMemo to prevent recreating array on every render
  const availableCategories = useMemo(() =>
    result.groupedTrades ? Object.keys(result.groupedTrades) : [],
    [result.groupedTrades]
  );

  // Set default tab to first available category if current tab doesn't exist
  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.includes(tradeTab)) {
      setTradeTab(availableCategories[0]);
    }
  }, [availableCategories, tradeTab]);

  if (allNeeds.length === 0) {
    return (
      <div className="panel results">
        <h2>⚡ Optimization Results</h2>
        <p className="empty-message">
          Select blueprints or add manual needs to see optimization results
        </p>
      </div>
    );
  }

  return (
    <div className="panel results">
      <h2>⚡ Optimization Results</h2>

      {/* Trade Sequence */}
      {result.trades.length > 0 && (
        <div className="trade-sequence">
          <h3 className="purple">Trade Sequence</h3>
          {result.groupedTrades && Object.keys(result.groupedTrades).length > 0 ? (
            <>
              {/* Material Type Tabs */}
              <div className="tabs">
                {availableCategories.includes('Raw') && (
                  <button
                    className={`tab-btn ${tradeTab === 'Raw' ? 'active' : ''}`}
                    onClick={() => setTradeTab('Raw')}
                  >
                    ⛏️ Raw Materials
                  </button>
                )}
                {availableCategories.includes('Manufactured') && (
                  <button
                    className={`tab-btn ${tradeTab === 'Manufactured' ? 'active' : ''}`}
                    onClick={() => setTradeTab('Manufactured')}
                  >
                    🔧 Manufactured
                  </button>
                )}
                {availableCategories.includes('Encoded') && (
                  <button
                    className={`tab-btn ${tradeTab === 'Encoded' ? 'active' : ''}`}
                    onClick={() => setTradeTab('Encoded')}
                  >
                    💾 Encoded Data
                  </button>
                )}
              </div>

              {/* Display trades for active tab */}
              {result.groupedTrades[tradeTab] && (
                <div className="trade-list">
                  {result.groupedTrades[tradeTab].map((trade, i) => {
                    // Check if we have enough input materials
                    const inputItem = inventory.find(item => item.item === trade.input.item);
                    const canExecute = inputItem && inputItem.quantity >= trade.input.amount;

                    // Build tooltip content
                    const tooltipContent = canExecute ? (
                      <span>Execute this trade</span>
                    ) : (
                      <div>
                        <div className="tooltip-content-line">Missing:</div>
                        <div className="tooltip-content-line">
                          <span className={getQualityClass(trade.input.quality)}>{trade.input.item}</span>
                          {' '}(need {trade.input.amount}, have {inputItem?.quantity || 0})
                        </div>
                      </div>
                    );

                    return (
                      <div key={i} className="trade-item">
                        <span className={`trade-badge ${trade.action.toLowerCase()}`}>
                          {trade.action.replace('_', ' ')}
                        </span>
                        <span className="input-amt">{trade.input.amount}×</span>
                        <span className={getQualityClass(trade.input.quality)}>
                          {trade.input.item} ({getSubcategory(trade.input.item)})
                        </span>
                        <span className="arrow">→</span>
                        <span className="output-amt">{trade.output.amount}×</span>
                        <span className={getQualityClass(trade.output.quality)}>
                          {trade.output.item} ({getSubcategory(trade.output.item)})
                        </span>
                        <span className="ratio">[{trade.ratio}]</span>
                        <span className="filler"></span>
                        <Tooltip content={tooltipContent} disabled={!canExecute}>
                          <button
                            className="btn-execute-trade"
                            onClick={() => executeTrade(trade)}
                            disabled={!canExecute}
                          >
                            Execute
                          </button>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            // Fallback to ungrouped trades if grouping failed
            <div className="trade-list">
              {result.trades.map((trade, i) => {
                // Check if we have enough input materials
                const inputItem = inventory.find(item => item.item === trade.input.item);
                const canExecute = inputItem && inputItem.quantity >= trade.input.amount;

                // Build tooltip content
                const tooltipContent = canExecute ? (
                  <span>Execute this trade</span>
                ) : (
                  <div>
                    <div className="tooltip-content-line">Missing:</div>
                    <div className="tooltip-content-line">
                      <span className={getQualityClass(trade.input.quality)}>{trade.input.item}</span>
                      {' '}(need {trade.input.amount}, have {inputItem?.quantity || 0})
                    </div>
                  </div>
                );

                return (
                  <div key={i} className="trade-item">
                    <span className={`trade-badge ${trade.action.toLowerCase()}`}>
                      {trade.action.replace('_', ' ')}
                    </span>
                    <span className="input-amt">{trade.input.amount}×</span>
                    <span className={getQualityClass(trade.input.quality)}>
                      {trade.input.item} ({getSubcategory(trade.input.item)})
                    </span>
                    <span className="arrow">→</span>
                    <span className="output-amt">{trade.output.amount}×</span>
                    <span className={getQualityClass(trade.output.quality)}>
                      {trade.output.item} ({getSubcategory(trade.output.item)})
                    </span>
                    <span className="ratio">[{trade.ratio}]</span>
                    <Tooltip content={tooltipContent} disabled={!canExecute}>
                      <button
                        className="btn-execute-trade"
                        onClick={() => executeTrade(trade)}
                        disabled={!canExecute}
                      >
                        Execute
                      </button>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="results-grid">
        <div>
          <h3 className="green">✓ Fulfilled ({result.fulfilled.length})</h3>
          <div className="result-list">
            {result.fulfilled.map((f, i) => (
              <div key={i} className="result-item fulfilled">
                <span className="name">{f.quantity}× {f.item}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="red">✗ Unfulfilled ({result.unfulfilled.length})</h3>
          {result.unfulfilled.length > 0 ? (
            <div className="result-list">
              {result.unfulfilled.map((u, i) => (
                <div key={i} className="result-item unfulfilled">
                  <span className="name">{u.quantity}× {u.item}</span>
                  <div className="source">Source: {u.material?.source}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="success-message">All needs fulfilled! 🎉</p>
          )}
        </div>
      </div>

      {/* Trade History */}
      {tradeHistory.length > 0 && (
        <div className="trade-history">
          <h3 className="purple">Recent Trades</h3>
          <div className="history-list">
            {tradeHistory.slice(0, 5).map((entry) => (
              <div key={entry.id} className="history-item">
                <span className="history-text">
                  <span className={getQualityClass(entry.trade.input.quality)}>
                    {entry.trade.input.amount}× {entry.trade.input.item}
                  </span>
                  <span className="arrow"> → </span>
                  <span className={getQualityClass(entry.trade.output.quality)}>
                    {entry.trade.output.amount}× {entry.trade.output.item}
                  </span>
                </span>
                <button
                  className="btn-undo"
                  onClick={() => undoTrade(entry)}
                  title="Undo this trade"
                >
                  Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultsPanel;

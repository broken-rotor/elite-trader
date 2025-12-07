import React from 'react';

const getQualityClass = (quality) => `quality-${quality}`;

function ResultsPanel({ allNeeds, result }) {
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
            // Show grouped trades by base type
            Object.entries(result.groupedTrades).map(([baseType, trades]) => (
              <div key={baseType} className="trade-group">
                <h4 className={`trade-group-header ${baseType.toLowerCase()}`}>
                  {baseType === 'Raw' && '⛏️ Raw Materials'}
                  {baseType === 'Manufactured' && '🔧 Manufactured Materials'}
                  {baseType === 'Encoded' && '💾 Encoded Data'}
                </h4>
                <div className="trade-list">
                  {trades.map((trade, i) => (
                    <div key={i} className="trade-item">
                      <span className={`trade-badge ${
                        trade.action === 'UPGRADE' ? 'upgrade' :
                        trade.action === 'DOWNGRADE' ? 'downgrade' :
                        trade.action === 'CROSS_TYPE' ? 'cross-type' :
                        trade.action === 'DIRECT_CONVERSION' ? 'direct-conversion' : 'same-slot'
                      }`}>
                        {trade.action === 'DIRECT_CONVERSION' ? 'DIRECT' : trade.action.replace('_', ' ')}
                      </span>
                      <span className="input-amt">{trade.input.amount}×</span>
                      <span className={getQualityClass(trade.input.quality)}>
                        {trade.input.item}
                      </span>
                      <span className="arrow">→</span>
                      <span className="output-amt">{trade.output.amount}×</span>
                      <span className={getQualityClass(trade.output.quality)}>
                        {trade.output.item}
                      </span>
                      <span className="ratio">[{trade.ratio}]</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Fallback to ungrouped trades if grouping failed
            <div className="trade-list">
              {result.trades.map((trade, i) => (
                <div key={i} className="trade-item">
                  <span className={`trade-badge ${
                    trade.action === 'UPGRADE' ? 'upgrade' :
                    trade.action === 'DOWNGRADE' ? 'downgrade' :
                    trade.action === 'CROSS_TYPE' ? 'cross-type' :
                    trade.action === 'DIRECT_CONVERSION' ? 'direct-conversion' : 'same-slot'
                  }`}>
                    {trade.action === 'DIRECT_CONVERSION' ? 'DIRECT' : trade.action.replace('_', ' ')}
                  </span>
                  <span className="input-amt">{trade.input.amount}×</span>
                  <span className={getQualityClass(trade.input.quality)}>
                    {trade.input.item}
                  </span>
                  <span className="arrow">→</span>
                  <span className="output-amt">{trade.output.amount}×</span>
                  <span className={getQualityClass(trade.output.quality)}>
                    {trade.output.item}
                  </span>
                  <span className="ratio">[{trade.ratio}]</span>
                </div>
              ))}
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
                <span className="method">
                  {f.method === 'DIRECT' ? '(direct)' :
                   f.method === 'SAME_SLOT' ? `(from ${f.from})` :
                   `(${f.consumed}× ${f.from})`}
                </span>
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
    </div>
  );
}

export default ResultsPanel;

import React from 'react';
import { render, screen } from '@testing-library/react';
import ResultsPanel from './ResultsPanel';

describe('ResultsPanel', () => {
  const defaultProps = {
    executeTrade: jest.fn(),
    inventory: [],
    tradeHistory: [],
    undoTrade: jest.fn()
  };

  test('displays empty state when no needs are provided', () => {
    const result = { trades: [], fulfilled: [], unfulfilled: [] };

    render(<ResultsPanel allNeeds={[]} result={result} {...defaultProps} />);

    expect(screen.getByText('⚡ Optimization Results')).toBeInTheDocument();
    expect(
      screen.getByText('Select blueprints or add manual needs to see optimization results')
    ).toBeInTheDocument();
  });

  test('does not display trade sequence when no trades exist', () => {
    const allNeeds = [{ item: 'Iron', quantity: 5 }];
    const result = {
      trades: [],
      fulfilled: [{ item: 'Iron', quantity: 5 }],
      unfulfilled: []
    };

    render(<ResultsPanel allNeeds={allNeeds} result={result} {...defaultProps} />);

    expect(screen.queryByText('Trade Sequence')).not.toBeInTheDocument();
  });

  test('displays trade sequence when trades exist', () => {
    const allNeeds = [{ item: 'Carbon', quantity: 3 }];
    const result = {
      trades: [
        {
          action: 'UPGRADE',
          input: { item: 'Iron', amount: 6, quality: 1 },
          output: { item: 'Carbon', amount: 1, quality: 2 },
          ratio: '6:1'
        }
      ],
      fulfilled: [{ item: 'Carbon', quantity: 3, from: 'Iron', consumed: 18 }],
      unfulfilled: []
    };

    render(<ResultsPanel allNeeds={allNeeds} result={result} {...defaultProps} />);

    expect(screen.getByText('Trade Sequence')).toBeInTheDocument();
    expect(screen.getByText('UPGRADE')).toBeInTheDocument();
    expect(screen.getByText('6×')).toBeInTheDocument();
    expect(screen.getByText(/Iron \(/)).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
    expect(screen.getByText('1×')).toBeInTheDocument();
    expect(screen.getByText(/Carbon \(/)).toBeInTheDocument();
    expect(screen.getByText('[6:1]')).toBeInTheDocument();
  });

  test('displays DOWNGRADE trade badge correctly', () => {
    const allNeeds = [{ item: 'Iron', quantity: 9 }];
    const result = {
      trades: [
        {
          action: 'DOWNGRADE',
          input: { item: 'Carbon', amount: 3, quality: 2 },
          output: { item: 'Iron', amount: 9, quality: 1 },
          ratio: '1:3'
        }
      ],
      fulfilled: [{ item: 'Iron', quantity: 9, from: 'Carbon', consumed: 3 }],
      unfulfilled: []
    };

    render(<ResultsPanel allNeeds={allNeeds} result={result} {...defaultProps} />);

    const badge = screen.getByText('DOWNGRADE');
    expect(badge).toHaveClass('downgrade');
  });

  test('displays CROSS_TRADE trade badge correctly', () => {
    const allNeeds = [{ item: 'Nickel', quantity: 1 }];
    const result = {
      trades: [
        {
          action: 'CROSS_TRADE',
          input: { item: 'Iron', amount: 6, quality: 1 },
          output: { item: 'Nickel', amount: 1, quality: 1 },
          ratio: '6:1'
        }
      ],
      fulfilled: [{ item: 'Nickel', quantity: 1, from: 'Iron', consumed: 6 }],
      unfulfilled: []
    };

    render(<ResultsPanel allNeeds={allNeeds} result={result} {...defaultProps} />);

    const badge = screen.getByText('CROSS TRADE');
    expect(badge).toHaveClass('cross_trade');
  });

  test('displays unfulfilled materials with sources', () => {
    const allNeeds = [{ item: 'Iron', quantity: 10 }];
    const result = {
      trades: [],
      fulfilled: [],
      unfulfilled: [
        {
          item: 'Iron',
          quantity: 10,
          material: { item: 'Iron', source: 'Surface prospecting' }
        }
      ]
    };

    render(<ResultsPanel allNeeds={allNeeds} result={result} {...defaultProps} />);

    expect(screen.getByText('✗ Unfulfilled (1)')).toBeInTheDocument();
    expect(screen.getByText('10× Iron')).toBeInTheDocument();
    expect(screen.getByText('Source: Surface prospecting')).toBeInTheDocument();
  });

  test('displays success message when all needs are fulfilled', () => {
    const allNeeds = [{ item: 'Iron', quantity: 5 }];
    const result = {
      trades: [],
      fulfilled: [{ item: 'Iron', quantity: 5 }],
      unfulfilled: []
    };

    render(<ResultsPanel allNeeds={allNeeds} result={result} {...defaultProps} />);

    expect(screen.getByText('All needs fulfilled! 🎉')).toBeInTheDocument();
  });

  test('displays multiple fulfilled materials', () => {
    const allNeeds = [
      { item: 'Iron', quantity: 5 },
      { item: 'Nickel', quantity: 3 }
    ];
    const result = {
      trades: [],
      fulfilled: [
        { item: 'Iron', quantity: 5 },
        { item: 'Nickel', quantity: 3 }
      ],
      unfulfilled: []
    };

    render(<ResultsPanel allNeeds={allNeeds} result={result} {...defaultProps} />);

    expect(screen.getByText('✓ Fulfilled (2)')).toBeInTheDocument();
    expect(screen.getByText('5× Iron')).toBeInTheDocument();
    expect(screen.getByText('3× Nickel')).toBeInTheDocument();
  });

  test('displays multiple unfulfilled materials', () => {
    const allNeeds = [
      { item: 'Iron', quantity: 10 },
      { item: 'Nickel', quantity: 5 }
    ];
    const result = {
      trades: [],
      fulfilled: [],
      unfulfilled: [
        {
          item: 'Iron',
          quantity: 10,
          material: { item: 'Iron', source: 'Surface prospecting' }
        },
        {
          item: 'Nickel',
          quantity: 5,
          material: { item: 'Nickel', source: 'Mining' }
        }
      ]
    };

    render(<ResultsPanel allNeeds={allNeeds} result={result} {...defaultProps} />);

    expect(screen.getByText('✗ Unfulfilled (2)')).toBeInTheDocument();
    expect(screen.getByText('10× Iron')).toBeInTheDocument();
    expect(screen.getByText('Source: Surface prospecting')).toBeInTheDocument();
    expect(screen.getByText('5× Nickel')).toBeInTheDocument();
    expect(screen.getByText('Source: Mining')).toBeInTheDocument();
  });

  test('displays both fulfilled and unfulfilled materials', () => {
    const allNeeds = [
      { item: 'Iron', quantity: 5 },
      { item: 'Nickel', quantity: 10 }
    ];
    const result = {
      trades: [],
      fulfilled: [{ item: 'Iron', quantity: 5 }],
      unfulfilled: [
        {
          item: 'Nickel',
          quantity: 10,
          material: { item: 'Nickel', source: 'Mining' }
        }
      ]
    };

    render(<ResultsPanel allNeeds={allNeeds} result={result} {...defaultProps} />);

    expect(screen.getByText('✓ Fulfilled (1)')).toBeInTheDocument();
    expect(screen.getByText('5× Iron')).toBeInTheDocument();
    expect(screen.getByText('✗ Unfulfilled (1)')).toBeInTheDocument();
    expect(screen.getByText('10× Nickel')).toBeInTheDocument();
  });

  test('displays multiple trades in sequence', () => {
    const allNeeds = [{ item: 'Carbon', quantity: 2 }];
    const result = {
      trades: [
        {
          action: 'UPGRADE',
          input: { item: 'Iron', amount: 6, quality: 1 },
          output: { item: 'Carbon', amount: 1, quality: 2 },
          ratio: '6:1'
        },
        {
          action: 'DOWNGRADE',
          input: { item: 'Germanium', amount: 1, quality: 4 },
          output: { item: 'Carbon', amount: 3, quality: 1 },
          ratio: '1:3'
        }
      ],
      fulfilled: [{ item: 'Carbon', quantity: 2, from: 'Iron', consumed: 12 }],
      unfulfilled: []
    };

    render(<ResultsPanel allNeeds={allNeeds} result={result} {...defaultProps} />);

    const trades = screen.getAllByText(/UPGRADE|DOWNGRADE/);
    expect(trades).toHaveLength(2);
  });

  test('applies quality classes to materials in trades', () => {
    const allNeeds = [{ item: 'Carbon', quantity: 1 }];
    const result = {
      trades: [
        {
          action: 'UPGRADE',
          input: { item: 'Iron', amount: 6, quality: 1 },
          output: { item: 'Carbon', amount: 1, quality: 2 },
          ratio: '6:1'
        }
      ],
      fulfilled: [{ item: 'Carbon', quantity: 1, from: 'Iron', consumed: 6 }],
      unfulfilled: []
    };

    render(<ResultsPanel allNeeds={allNeeds} result={result} {...defaultProps} />);

    const ironElement = screen.getByText(/Iron \(/);
    expect(ironElement).toHaveClass('quality-1');

    const carbonElement = screen.getByText(/Carbon \(/);
    expect(carbonElement).toHaveClass('quality-2');
  });
});

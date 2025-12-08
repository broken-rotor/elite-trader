import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ManualEntryTab from './ManualEntryTab';

describe('ManualEntryTab', () => {
  const mockMaterials = [
    { item: 'Iron', quality: 1 },
    { item: 'Nickel', quality: 2 }
  ];

  const defaultProps = {
    searchNeeded: '',
    setSearchNeeded: jest.fn(),
    filteredNeeded: [],
    newNeedQty: 1,
    setNewNeedQty: jest.fn(),
    addToNeeds: jest.fn(),
    manualNeeds: [],
    removeFromNeeds: jest.fn(),
    updateManualNeedQuantity: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders manual material needs interface', () => {
    render(<ManualEntryTab {...defaultProps} />);

    expect(screen.getByText('Manual Material Needs')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search materials...')).toBeInTheDocument();
  });

  test('passes correct props to MaterialSearch', () => {
    render(
      <ManualEntryTab
        {...defaultProps}
        searchNeeded="iron"
        filteredNeeded={mockMaterials}
        newNeedQty={5}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search materials...');
    expect(searchInput).toHaveValue('iron');
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  test('displays empty message when no manual needs added', () => {
    render(<ManualEntryTab {...defaultProps} />);

    expect(screen.getByText('No manual needs added')).toBeInTheDocument();
  });

  test('displays manual needs list', () => {
    const needs = [
      { item: 'Iron', quantity: 5 },
      { item: 'Nickel', quantity: 3 }
    ];

    render(<ManualEntryTab {...defaultProps} manualNeeds={needs} />);

    expect(screen.getByText('Iron')).toBeInTheDocument();
    expect(screen.getByText('Nickel')).toBeInTheDocument();

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[1]).toHaveValue(5); // First input is the search qty, second is Iron
    expect(inputs[2]).toHaveValue(3); // Third is Nickel
  });

  test('calls removeFromNeeds when clicking remove button', () => {
    const needs = [{ item: 'Iron', quantity: 5 }];

    render(<ManualEntryTab {...defaultProps} manualNeeds={needs} />);

    const removeButton = screen.getByText('✕');
    fireEvent.click(removeButton);

    expect(defaultProps.removeFromNeeds).toHaveBeenCalledWith('Iron');
  });

  test('displays multiple remove buttons for multiple needs', () => {
    const needs = [
      { item: 'Iron', quantity: 5 },
      { item: 'Nickel', quantity: 3 }
    ];

    render(<ManualEntryTab {...defaultProps} manualNeeds={needs} />);

    const removeButtons = screen.getAllByText('✕');
    expect(removeButtons).toHaveLength(2);
  });

  test('applies amber className to search input', () => {
    render(<ManualEntryTab {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search materials...');
    expect(searchInput).toHaveClass('amber');
  });

  test('displays quality classes for materials', () => {
    const needs = [{ item: 'Iron', quantity: 5 }];

    render(<ManualEntryTab {...defaultProps} manualNeeds={needs} />);

    const ironElement = screen.getByText('Iron');
    expect(ironElement).toHaveClass('quality-1');
  });

  test('calls updateManualNeedQuantity when changing quantity input', () => {
    const needs = [{ item: 'Iron', quantity: 5 }];

    render(<ManualEntryTab {...defaultProps} manualNeeds={needs} />);

    const inputs = screen.getAllByRole('spinbutton');
    const quantityInput = inputs[1]; // First is search qty, second is Iron quantity

    fireEvent.change(quantityInput, { target: { value: '10' } });

    expect(defaultProps.updateManualNeedQuantity).toHaveBeenCalledWith('Iron', '10');
  });

  test('displays grade labels for materials', () => {
    const needs = [
      { item: 'Iron', quantity: 5 },
      { item: 'Nickel', quantity: 3 }
    ];

    render(<ManualEntryTab {...defaultProps} manualNeeds={needs} />);

    const gradeLabels = screen.getAllByText(/G[1-5]/);
    expect(gradeLabels.length).toBeGreaterThan(0);
  });
});

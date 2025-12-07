import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MaterialSearch from './MaterialSearch';

describe('MaterialSearch', () => {
  const mockMaterials = [
    { item: 'Iron', quality: 1 },
    { item: 'Nickel', quality: 2 },
    { item: 'Carbon', quality: 1 }
  ];

  const defaultProps = {
    searchValue: '',
    onSearchChange: jest.fn(),
    filteredMaterials: [],
    onSelectMaterial: jest.fn(),
    quantityValue: 10,
    onQuantityChange: jest.fn(),
    className: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search input and quantity input', () => {
    render(<MaterialSearch {...defaultProps} />);

    expect(screen.getByPlaceholderText('Search materials...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  test('calls onSearchChange when typing in search input', () => {
    render(<MaterialSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search materials...');
    fireEvent.change(searchInput, { target: { value: 'iron' } });

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('iron');
  });

  test('calls onQuantityChange when changing quantity', () => {
    render(<MaterialSearch {...defaultProps} />);

    const qtyInput = screen.getByDisplayValue('10');
    fireEvent.change(qtyInput, { target: { value: '5' } });

    expect(defaultProps.onQuantityChange).toHaveBeenCalledWith(5);
  });

  test('displays dropdown when searchValue is not empty and materials are filtered', () => {
    render(
      <MaterialSearch
        {...defaultProps}
        searchValue="iron"
        filteredMaterials={mockMaterials}
      />
    );

    expect(screen.getByText('Iron')).toBeInTheDocument();
    expect(screen.getByText('Nickel')).toBeInTheDocument();
    expect(screen.getByText('Carbon')).toBeInTheDocument();
  });

  test('does not display dropdown when searchValue is empty', () => {
    render(
      <MaterialSearch
        {...defaultProps}
        searchValue=""
        filteredMaterials={mockMaterials}
      />
    );

    expect(screen.queryByText('Iron')).not.toBeInTheDocument();
  });

  test('does not display dropdown when no materials are filtered', () => {
    render(
      <MaterialSearch
        {...defaultProps}
        searchValue="xyz"
        filteredMaterials={[]}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('calls onSelectMaterial when clicking a material in dropdown', () => {
    render(
      <MaterialSearch
        {...defaultProps}
        searchValue="iron"
        filteredMaterials={mockMaterials}
      />
    );

    const ironButton = screen.getByRole('button', { name: /Iron/i });
    fireEvent.click(ironButton);

    expect(defaultProps.onSelectMaterial).toHaveBeenCalledWith('Iron');
  });

  test('displays quality grades for materials', () => {
    render(
      <MaterialSearch
        {...defaultProps}
        searchValue="iron"
        filteredMaterials={mockMaterials}
      />
    );

    const grades = screen.getAllByText(/G[12]/);
    expect(grades.length).toBeGreaterThan(0);
    expect(screen.getByText('G2')).toBeInTheDocument();
  });

  test('applies custom className to search input', () => {
    render(
      <MaterialSearch
        {...defaultProps}
        className="custom-class"
      />
    );

    const searchInput = screen.getByPlaceholderText('Search materials...');
    expect(searchInput).toHaveClass('search-input', 'custom-class');
  });

  test('handles quantity change with invalid input (defaults to 1)', () => {
    render(<MaterialSearch {...defaultProps} />);

    const qtyInput = screen.getByDisplayValue('10');
    fireEvent.change(qtyInput, { target: { value: 'abc' } });

    expect(defaultProps.onQuantityChange).toHaveBeenCalledWith(1);
  });
});

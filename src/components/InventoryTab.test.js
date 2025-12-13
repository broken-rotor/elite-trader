import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryTab from './InventoryTab';

describe('InventoryTab', () => {
  const mockMaterials = [
    { item: 'Iron', quality: 1 },
    { item: 'Nickel', quality: 2 }
  ];

  const defaultProps = {
    inventorySubTab: 'materials',
    setInventorySubTab: jest.fn(),
    searchOwned: '',
    setSearchOwned: jest.fn(),
    filteredOwned: [],
    newQty: 10,
    setNewQty: jest.fn(),
    addToInventory: jest.fn(),
    filteredInventoryByCategory: [],
    updateInventoryQuantity: jest.fn(),
    removeFromInventory: jest.fn(),
    inventory: [],
    setInventory: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders inventory interface with sub-tabs', () => {
    render(<InventoryTab {...defaultProps} />);

    expect(screen.getByText('Your Inventory')).toBeInTheDocument();
    expect(screen.getByText('Materials')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
  });

  test('materials sub-tab is active by default', () => {
    render(<InventoryTab {...defaultProps} />);

    const materialsTab = screen.getByRole('button', { name: 'Materials' });
    expect(materialsTab).toHaveClass('active');
  });

  test('data sub-tab can be active', () => {
    render(<InventoryTab {...defaultProps} inventorySubTab="data" />);

    const dataTab = screen.getByRole('button', { name: 'Data' });
    expect(dataTab).toHaveClass('active');
  });

  test('calls setInventorySubTab when switching to data tab', () => {
    render(<InventoryTab {...defaultProps} />);

    const dataTab = screen.getByText('Data');
    fireEvent.click(dataTab);

    expect(defaultProps.setInventorySubTab).toHaveBeenCalledWith('data');
  });

  test('calls setInventorySubTab when switching to materials tab', () => {
    render(<InventoryTab {...defaultProps} inventorySubTab="data" />);

    const materialsTab = screen.getByText('Materials');
    fireEvent.click(materialsTab);

    expect(defaultProps.setInventorySubTab).toHaveBeenCalledWith('materials');
  });

  test('passes correct props to MaterialSearch', () => {
    render(
      <InventoryTab
        {...defaultProps}
        searchOwned="iron"
        filteredOwned={mockMaterials}
        newQty={15}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search materials...');
    expect(searchInput).toHaveValue('iron');
    expect(screen.getByDisplayValue('15')).toBeInTheDocument();
  });

  test('displays empty message when no materials in inventory', () => {
    render(<InventoryTab {...defaultProps} filteredInventoryByCategory={[]} />);

    expect(screen.getByText('No materials in inventory')).toBeInTheDocument();
  });

  test('displays empty message for data when on data tab', () => {
    render(
      <InventoryTab
        {...defaultProps}
        inventorySubTab="data"
        filteredInventoryByCategory={[]}
      />
    );

    expect(screen.getByText('No encoded data in inventory')).toBeInTheDocument();
  });

  test('displays inventory items with quantities', () => {
    const inventory = [
      { item: 'Iron', quantity: 25 },
      { item: 'Nickel', quantity: 15 }
    ];

    render(<InventoryTab {...defaultProps} filteredInventoryByCategory={inventory} />);

    expect(screen.getByText('Iron')).toBeInTheDocument();
    expect(screen.getByText('Nickel')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15')).toBeInTheDocument();
  });

  test('displays quality grades for inventory items', () => {
    const inventory = [{ item: 'Iron', quantity: 25 }];

    render(<InventoryTab {...defaultProps} filteredInventoryByCategory={inventory} />);

    expect(screen.getByText('G1')).toBeInTheDocument();
  });

  test('calls updateInventoryQuantity when changing quantity', () => {
    const inventory = [{ item: 'Iron', quantity: 25 }];

    render(<InventoryTab {...defaultProps} filteredInventoryByCategory={inventory} />);

    const qtyInput = screen.getByDisplayValue('25');
    fireEvent.change(qtyInput, { target: { value: '30' } });

    expect(defaultProps.updateInventoryQuantity).toHaveBeenCalledWith('Iron', '30');
  });

  test('calls removeFromInventory when clicking remove button', () => {
    const inventory = [{ item: 'Iron', quantity: 25 }];

    render(<InventoryTab {...defaultProps} filteredInventoryByCategory={inventory} />);

    const removeButton = screen.getByText('✕');
    fireEvent.click(removeButton);

    expect(defaultProps.removeFromInventory).toHaveBeenCalledWith('Iron');
  });

  test('displays multiple remove buttons for multiple items', () => {
    const inventory = [
      { item: 'Iron', quantity: 25 },
      { item: 'Nickel', quantity: 10 }
    ];

    render(<InventoryTab {...defaultProps} filteredInventoryByCategory={inventory} />);

    const removeButtons = screen.getAllByText('✕');
    expect(removeButtons).toHaveLength(2);
  });

  test('displays quality classes for inventory items', () => {
    const inventory = [{ item: 'Iron', quantity: 25 }];

    render(<InventoryTab {...defaultProps} filteredInventoryByCategory={inventory} />);

    const ironElement = screen.getByText('Iron');
    expect(ironElement).toHaveClass('quality-1');
  });

  test('applies quality background class to inventory items', () => {
    const inventory = [{ item: 'Iron', quantity: 25 }];

    render(<InventoryTab {...defaultProps} filteredInventoryByCategory={inventory} />);

    const invItem = screen.getByText('Iron');
    expect(invItem).toHaveClass('quality-1');
    expect(invItem).toBeInTheDocument();
  });

  describe('Download and Upload functionality', () => {
    test('renders download button', () => {
      render(<InventoryTab {...defaultProps} />);
      
      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeInTheDocument();
      expect(downloadButton).toHaveClass('btn-download');
    });

    test('renders upload button', () => {
      render(<InventoryTab {...defaultProps} />);
      
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton).toHaveClass('btn-download');
    });

    test('upload and download buttons are positioned together', () => {
      render(<InventoryTab {...defaultProps} />);
      
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      const downloadButton = screen.getByRole('button', { name: /download/i });
      
      // Both buttons should be present
      expect(uploadButton).toBeInTheDocument();
      expect(downloadButton).toBeInTheDocument();
      
      // Both should have the same CSS class for consistent styling
      expect(uploadButton).toHaveClass('btn-download');
      expect(downloadButton).toHaveClass('btn-download');
    });

    test('upload button has correct emoji and text', () => {
      render(<InventoryTab {...defaultProps} />);
      
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      expect(uploadButton).toHaveTextContent('⬆️ Upload');
    });

    test('download button has correct emoji and text', () => {
      render(<InventoryTab {...defaultProps} />);
      
      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toHaveTextContent('⬇️ Download');
    });

    test('setInventory prop is passed correctly', () => {
      const mockSetInventory = jest.fn();
      const propsWithSetInventory = {
        ...defaultProps,
        setInventory: mockSetInventory
      };
      
      render(<InventoryTab {...propsWithSetInventory} />);
      
      // Component should render without errors when setInventory is provided
      expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    });
  });
});

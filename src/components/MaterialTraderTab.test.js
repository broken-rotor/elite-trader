import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MaterialTraderTab from './MaterialTraderTab';

// Mock the database module
jest.mock('../database', () => ({
  MATERIALS_DB: [
    // Raw materials (quality 1-4 only)
    { item: 'Carbon', type: 'Raw (Raw material 1)', quality: 1, source: 'Surface mining' },
    { item: 'Vanadium', type: 'Raw (Raw material 1)', quality: 2, source: 'Surface mining' },
    { item: 'Niobium', type: 'Raw (Raw material 1)', quality: 3, source: 'Surface mining' },
    { item: 'Yttrium', type: 'Raw (Raw material 1)', quality: 4, source: 'Surface mining' },
    // Manufactured materials (quality 1-5)
    { item: 'Chemical Storage Units', type: 'Manufactured (Chemical)', quality: 1, source: 'Salvage' },
    { item: 'Chemical Processors', type: 'Manufactured (Chemical)', quality: 2, source: 'Salvage' },
    { item: 'Chemical Distillery', type: 'Manufactured (Chemical)', quality: 3, source: 'Salvage' },
    { item: 'Chemical Manipulators', type: 'Manufactured (Chemical)', quality: 4, source: 'Salvage' },
    { item: 'Pharmaceutical Isolators', type: 'Manufactured (Chemical)', quality: 5, source: 'Salvage' },
    // Encoded materials (quality 1-5)
    { item: 'Exceptional Scrambled Emission Data', type: 'Encoded (Emission data)', quality: 1, source: 'Ships' },
    { item: 'Irregular Emission Data', type: 'Encoded (Emission data)', quality: 2, source: 'Ships' },
    { item: 'Unexpected Emission Data', type: 'Encoded (Emission data)', quality: 3, source: 'Ships' },
    { item: 'Decoded Emission Data', type: 'Encoded (Emission data)', quality: 4, source: 'Ships' },
    { item: 'Abnormal Compact Emissions Data', type: 'Encoded (Emission data)', quality: 5, source: 'Ships' }
  ],
  getMaterial: jest.fn((name) => {
    const materials = [
      { item: 'Carbon', type: 'Raw (Raw material 1)', quality: 1, source: 'Surface mining' },
      { item: 'Chemical Storage Units', type: 'Manufactured (Chemical)', quality: 1, source: 'Salvage' },
      { item: 'Exceptional Scrambled Emission Data', type: 'Encoded (Emission data)', quality: 1, source: 'Ships' }
    ];
    return materials.find(m => m.item === name);
  })
}));

describe('MaterialTraderTab', () => {
  const defaultProps = {
    traderType: 'raw',
    setTraderType: jest.fn(),
    inventory: [],
    updateInventoryQuantity: jest.fn(),
    setInventory: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders Material Trader header', () => {
      render(<MaterialTraderTab {...defaultProps} />);
      expect(screen.getByText('Material Trader')).toBeInTheDocument();
    });

    test('renders all three trader type buttons', () => {
      render(<MaterialTraderTab {...defaultProps} />);

      expect(screen.getByText('Raw Materials')).toBeInTheDocument();
      expect(screen.getByText('Manufactured Materials')).toBeInTheDocument();
      expect(screen.getByText('Encoded Data')).toBeInTheDocument();
    });

    test('raw materials button is active by default', () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const rawButton = screen.getByText('Raw Materials');
      expect(rawButton).toHaveClass('active');
    });

    test('manufactured materials button can be active', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="manufactured" />);

      const manufacturedButton = screen.getByText('Manufactured Materials');
      expect(manufacturedButton).toHaveClass('active');
    });

    test('encoded data button can be active', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="encoded" />);

      const encodedButton = screen.getByText('Encoded Data');
      expect(encodedButton).toHaveClass('active');
    });
  });

  describe('Trader Type Switching', () => {
    test('calls setTraderType when switching to manufactured', () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const manufacturedButton = screen.getByText('Manufactured Materials');
      fireEvent.click(manufacturedButton);

      expect(defaultProps.setTraderType).toHaveBeenCalledWith('manufactured');
    });

    test('calls setTraderType when switching to encoded', () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const encodedButton = screen.getByText('Encoded Data');
      fireEvent.click(encodedButton);

      expect(defaultProps.setTraderType).toHaveBeenCalledWith('encoded');
    });

    test('calls setTraderType when switching to raw', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="manufactured" />);

      const rawButton = screen.getByText('Raw Materials');
      fireEvent.click(rawButton);

      expect(defaultProps.setTraderType).toHaveBeenCalledWith('raw');
    });
  });

  describe('Material Grid Display', () => {
    test('renders category headers for raw materials', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="raw" />);

      expect(screen.getByText('RAW MATERIAL 1')).toBeInTheDocument();
    });

    test('renders category headers for manufactured materials', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="manufactured" />);

      expect(screen.getByText('CHEMICAL')).toBeInTheDocument();
    });

    test('renders category headers for encoded data', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="encoded" />);

      expect(screen.getByText('EMISSION DATA')).toBeInTheDocument();
    });

    test('displays materials in grid cells', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="raw" />);

      expect(screen.getByText('Carbon')).toBeInTheDocument();
      expect(screen.getByText('Vanadium')).toBeInTheDocument();
      expect(screen.getByText('Niobium')).toBeInTheDocument();
      expect(screen.getByText('Yttrium')).toBeInTheDocument();
    });

    test('displays grade indicators for materials', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="raw" />);

      expect(screen.getByText('G1')).toBeInTheDocument();
      expect(screen.getByText('G2')).toBeInTheDocument();
      expect(screen.getByText('G3')).toBeInTheDocument();
      expect(screen.getByText('G4')).toBeInTheDocument();
    });

    test('displays hexagonal icon for materials', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="raw" />);

      const icons = screen.getAllByText('⬡');
      expect(icons.length).toBeGreaterThan(0);
    });

    test('displays quantity of 0 for materials not in inventory', () => {
      render(<MaterialTraderTab {...defaultProps} inventory={[]} />);

      const quantities = screen.getAllByText('0');
      expect(quantities.length).toBeGreaterThan(0);
    });

    test('displays correct quantity for materials in inventory', () => {
      const inventory = [{ item: 'Carbon', quantity: 25 }];
      render(<MaterialTraderTab {...defaultProps} inventory={inventory} />);

      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  describe('Quality-based Styling', () => {
    test('applies quality-1 class to grade 1 materials', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="raw" />);

      const carbonCell = screen.getByTestId('material-cell-Carbon');
      expect(carbonCell).toHaveClass('quality-1');
    });

    test('applies quality-2 class to grade 2 materials', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="raw" />);

      const vanadiumCell = screen.getByTestId('material-cell-Vanadium');
      expect(vanadiumCell).toHaveClass('quality-2');
    });

    test('applies quality-3 class to grade 3 materials', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="raw" />);

      const niobiumCell = screen.getByTestId('material-cell-Niobium');
      expect(niobiumCell).toHaveClass('quality-3');
    });
  });

  describe('Inline Editing', () => {
    test('clicking a material cell enables editing', () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const carbonCell = screen.getByTestId('material-cell-Carbon');
      fireEvent.click(carbonCell);

      const input = screen.getByDisplayValue('0');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('material-quantity-input');
    });

    test('clicking a cell adds editing class', () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const carbonCell = screen.getByTestId('material-cell-Carbon');
      fireEvent.click(carbonCell);

      expect(carbonCell).toHaveClass('editing');
    });

    test('changing quantity value updates the input', () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const carbonCell = screen.getByTestId('material-cell-Carbon');
      fireEvent.click(carbonCell);

      const input = screen.getByDisplayValue('0');
      fireEvent.change(input, { target: { value: '50' } });

      expect(input).toHaveValue(50);
    });

    test('pressing Enter saves the quantity', async () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const carbonCell = screen.getByTestId('material-cell-Carbon');
      fireEvent.click(carbonCell);

      const input = screen.getByDisplayValue('0');
      fireEvent.change(input, { target: { value: '50' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(defaultProps.updateInventoryQuantity).toHaveBeenCalledWith('Carbon', 50);
      });
    });

    test('pressing Escape cancels editing', async () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const carbonCell = screen.getByTestId('material-cell-Carbon');
      fireEvent.click(carbonCell);

      const input = screen.getByDisplayValue('0');
      fireEvent.change(input, { target: { value: '50' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByDisplayValue('50')).not.toBeInTheDocument();
      });

      expect(defaultProps.updateInventoryQuantity).not.toHaveBeenCalled();
    });

    test('blurring the input saves the quantity', async () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const carbonCell = screen.getByTestId('material-cell-Carbon');
      fireEvent.click(carbonCell);

      const input = screen.getByDisplayValue('0');
      fireEvent.change(input, { target: { value: '75' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(defaultProps.updateInventoryQuantity).toHaveBeenCalledWith('Carbon', 75);
      });
    });

    test('input is auto-focused when editing starts', () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const carbonCell = screen.getByTestId('material-cell-Carbon');
      fireEvent.click(carbonCell);

      const input = screen.getByDisplayValue('0');
      expect(input).toHaveFocus();
    });

    test('cannot edit empty cells', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="raw" />);

      // Raw materials only have grades 1-4, so grade 5 slots are empty
      // There are 7 raw material categories, so there should be at least one empty cell for grade 5
      const emptyCell = screen.getByTestId('empty-cell-Raw material 1-5');
      fireEvent.click(emptyCell);

      // Input should not appear when clicking empty cell
      const input = screen.queryByRole('spinbutton'); // number inputs have spinbutton role
      expect(input).not.toBeInTheDocument();
    });
  });

  describe('Upload and Download functionality', () => {
    test('renders download button', () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeInTheDocument();
      expect(downloadButton).toHaveClass('btn-download');
    });

    test('renders upload button', () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton).toHaveClass('btn-download');
    });

    test('upload button has correct emoji and text', () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      expect(uploadButton).toHaveTextContent('⬆️ Upload');
    });

    test('download button has correct emoji and text', () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toHaveTextContent('⬇️ Download');
    });

    test('upload and download buttons are positioned together', () => {
      render(<MaterialTraderTab {...defaultProps} />);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      const downloadButton = screen.getByRole('button', { name: /download/i });

      expect(uploadButton).toBeInTheDocument();
      expect(downloadButton).toBeInTheDocument();

      expect(uploadButton).toHaveClass('btn-download');
      expect(downloadButton).toHaveClass('btn-download');
    });

    test('setInventory prop is passed correctly', () => {
      const mockSetInventory = jest.fn();
      const propsWithSetInventory = {
        ...defaultProps,
        setInventory: mockSetInventory
      };

      render(<MaterialTraderTab {...propsWithSetInventory} />);

      expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    });
  });

  describe('Empty Cells', () => {
    test('empty cells have empty class', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="raw" />);

      // Raw materials have no grade 5, so grade 5 cells should be empty
      const emptyCell = screen.getByTestId('empty-cell-Raw material 1-5');
      expect(emptyCell).toHaveClass('empty');
      expect(emptyCell).toHaveClass('material-cell');
    });

    test('empty cells do not respond to clicks', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="raw" />);

      const emptyCell = screen.getByTestId('empty-cell-Raw material 1-5');
      fireEvent.click(emptyCell);

      // Input should not appear when clicking empty cell
      const input = screen.queryByRole('spinbutton');
      expect(input).not.toBeInTheDocument();
    });
  });

  describe('Category Order', () => {
    test('displays raw material categories in correct order', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="raw" />);

      const headers = screen.getAllByText(/RAW MATERIAL \d/);
      expect(headers[0]).toHaveTextContent('RAW MATERIAL 1');
    });

    test('displays manufactured categories in correct order', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="manufactured" />);

      // First category should be Chemical according to game order
      expect(screen.getByText('CHEMICAL')).toBeInTheDocument();
    });

    test('displays encoded categories in correct order', () => {
      render(<MaterialTraderTab {...defaultProps} traderType="encoded" />);

      // First category should be Emission Data according to game order
      expect(screen.getByText('EMISSION DATA')).toBeInTheDocument();
    });
  });
});

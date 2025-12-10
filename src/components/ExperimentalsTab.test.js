import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExperimentalsTab from './ExperimentalsTab';

describe('ExperimentalsTab', () => {
  const defaultProps = {
    selectedModule: '',
    setSelectedModule: jest.fn(),
    selectedExperimental: '',
    setSelectedExperimental: jest.fn(),
    selectedExperimentals: [],
    addExperimental: jest.fn(),
    removeExperimental: jest.fn(),
    updateExperimentalQuantity: jest.fn(),
    experimentalNeeds: [],
    performExperimentalRoll: jest.fn(),
    inventory: [],
    experimentalRollHistory: [],
    undoExperimentalRoll: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders experimental selection interface', () => {
    render(<ExperimentalsTab {...defaultProps} />);

    expect(screen.getByText('Select Experimental Effects')).toBeInTheDocument();
    expect(screen.getByText('Select Module...')).toBeInTheDocument();
  });

  test('displays module options', () => {
    render(<ExperimentalsTab {...defaultProps} />);

    const moduleSelect = screen.getByDisplayValue('Select Module...');
    expect(moduleSelect).toBeInTheDocument();
  });

  test('calls setSelectedModule when selecting a module', () => {
    render(<ExperimentalsTab {...defaultProps} />);

    const moduleSelect = screen.getByDisplayValue('Select Module...');
    fireEvent.change(moduleSelect, { target: { value: 'Frame Shift Drive' } });

    expect(defaultProps.setSelectedModule).toHaveBeenCalledWith('Frame Shift Drive');
  });

  test('experimental select is disabled when no module is selected', () => {
    render(<ExperimentalsTab {...defaultProps} />);

    const selects = screen.getAllByRole('combobox');
    // Experimental select is the second combobox (index 1)
    expect(selects[1]).toBeDisabled();
  });

  test('experimental select is enabled when module is selected', () => {
    render(<ExperimentalsTab {...defaultProps} selectedModule="FSD" />);

    const selects = screen.getAllByRole('combobox');
    // Experimental select is the second combobox (index 1)
    expect(selects[1]).not.toBeDisabled();
  });

  test('Add button is disabled when no experimental is selected', () => {
    render(<ExperimentalsTab {...defaultProps} />);

    const addButton = screen.getByText('Add');
    expect(addButton).toBeDisabled();
  });

  test('Add button is enabled when experimental is selected', () => {
    render(<ExperimentalsTab {...defaultProps} selectedModule="FSD" selectedExperimental="Deep Charge" />);

    const addButton = screen.getByText('Add');
    expect(addButton).not.toBeDisabled();
  });

  test('calls addExperimental when Add button is clicked', () => {
    render(<ExperimentalsTab {...defaultProps} selectedModule="FSD" selectedExperimental="Deep Charge" />);

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    expect(defaultProps.addExperimental).toHaveBeenCalled();
  });

  test('displays empty message when no experimentals are selected', () => {
    render(<ExperimentalsTab {...defaultProps} />);

    expect(screen.getByText(/No experimental effects selected/i)).toBeInTheDocument();
  });

  test('displays selected experimentals', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 2
      }
    ];

    render(<ExperimentalsTab {...defaultProps} selectedExperimentals={selectedExperimentals} />);

    expect(screen.getAllByText('Frame Shift Drive').length).toBeGreaterThan(0);
    expect(screen.getByText('Deep Charge')).toBeInTheDocument();
  });

  test('displays quantity input for each experimental', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 3
      }
    ];

    render(<ExperimentalsTab {...defaultProps} selectedExperimentals={selectedExperimentals} />);

    const quantityInput = screen.getByDisplayValue('3');
    expect(quantityInput).toBeInTheDocument();
    expect(quantityInput).toHaveAttribute('type', 'number');
  });

  test('calls updateExperimentalQuantity when quantity is changed', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 2
      }
    ];

    render(<ExperimentalsTab {...defaultProps} selectedExperimentals={selectedExperimentals} />);

    const quantityInput = screen.getByDisplayValue('2');
    fireEvent.change(quantityInput, { target: { value: '5' } });

    expect(defaultProps.updateExperimentalQuantity).toHaveBeenCalledWith(1, 5);
  });

  test('displays remove button for each experimental', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 2
      }
    ];

    render(<ExperimentalsTab {...defaultProps} selectedExperimentals={selectedExperimentals} />);

    const removeButton = screen.getByText('✕');
    expect(removeButton).toBeInTheDocument();
  });

  test('calls removeExperimental when remove button is clicked', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 2
      }
    ];

    render(<ExperimentalsTab {...defaultProps} selectedExperimentals={selectedExperimentals} />);

    const removeButton = screen.getByText('✕');
    fireEvent.click(removeButton);

    expect(defaultProps.removeExperimental).toHaveBeenCalledWith(1);
  });

  test('displays Roll button for each experimental', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 2
      }
    ];

    const inventory = [
      { item: 'Atypical Disrupted Wake Echoes', quantity: 10 },
      { item: 'Galvanising Alloys', quantity: 5 },
      { item: 'Eccentric Hyperspace Trajectories', quantity: 2 }
    ];

    render(<ExperimentalsTab {...defaultProps} selectedExperimentals={selectedExperimentals} inventory={inventory} />);

    const rollButton = screen.getByText('Roll');
    expect(rollButton).toBeInTheDocument();
  });

  test('Roll button is disabled when materials are insufficient', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 2
      }
    ];

    const inventory = [
      { item: 'Atypical Disrupted Wake Echoes', quantity: 1 } // Not enough
    ];

    render(<ExperimentalsTab {...defaultProps} selectedExperimentals={selectedExperimentals} inventory={inventory} />);

    const rollButton = screen.getByText('Roll');
    expect(rollButton).toBeDisabled();
  });

  test('Roll button is enabled when materials are sufficient', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 2
      }
    ];

    const inventory = [
      { item: 'Atypical Disrupted Wake Echoes', quantity: 10 },
      { item: 'Galvanising Alloys', quantity: 5 },
      { item: 'Eccentric Hyperspace Trajectories', quantity: 2 }
    ];

    render(<ExperimentalsTab {...defaultProps} selectedExperimentals={selectedExperimentals} inventory={inventory} />);

    const rollButton = screen.getByText('Roll');
    expect(rollButton).not.toBeDisabled();
  });

  test('calls performExperimentalRoll when Roll button is clicked', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 2
      }
    ];

    const inventory = [
      { item: 'Atypical Disrupted Wake Echoes', quantity: 10 },
      { item: 'Galvanising Alloys', quantity: 5 },
      { item: 'Eccentric Hyperspace Trajectories', quantity: 2 }
    ];

    render(<ExperimentalsTab {...defaultProps} selectedExperimentals={selectedExperimentals} inventory={inventory} />);

    const rollButton = screen.getByText('Roll');
    fireEvent.click(rollButton);

    expect(defaultProps.performExperimentalRoll).toHaveBeenCalledWith(1);
  });

  test('Roll button is disabled when quantity is 0', () => {
    const selectedExperimentals = [
      {
        id: 1,
        module: 'Frame Shift Drive',
        experimental: 'Deep Charge',
        quantity: 0
      }
    ];

    const inventory = [
      { item: 'Atypical Disrupted Wake Echoes', quantity: 10 },
      { item: 'Galvanising Alloys', quantity: 5 },
      { item: 'Eccentric Hyperspace Trajectories', quantity: 2 }
    ];

    render(<ExperimentalsTab {...defaultProps} selectedExperimentals={selectedExperimentals} inventory={inventory} />);

    const rollButton = screen.getByText('Roll');
    expect(rollButton).toBeDisabled();
  });

  test('displays material summary when experimentalNeeds has items', () => {
    const experimentalNeeds = [
      { item: 'Atypical Disrupted Wake Echoes', quantity: 5 },
      { item: 'Galvanising Alloys', quantity: 3 }
    ];

    render(<ExperimentalsTab {...defaultProps} experimentalNeeds={experimentalNeeds} />);

    expect(screen.getByText('Materials Required for Experimentals')).toBeInTheDocument();
    expect(screen.getByText('Atypical Disrupted Wake Echoes')).toBeInTheDocument();
    expect(screen.getByText('Galvanising Alloys')).toBeInTheDocument();
  });

  test('does not display material summary when experimentalNeeds is empty', () => {
    render(<ExperimentalsTab {...defaultProps} experimentalNeeds={[]} />);

    expect(screen.queryByText('Materials Required for Experimentals')).not.toBeInTheDocument();
  });

  test('displays roll history when experimentalRollHistory has entries', () => {
    const rollHistory = [
      {
        id: 1,
        experimentalId: 1,
        moduleName: 'Frame Shift Drive',
        experimentalName: 'Deep Charge',
        materialsConsumed: [],
        previousQuantity: 3
      }
    ];

    render(<ExperimentalsTab {...defaultProps} experimentalRollHistory={rollHistory} />);

    expect(screen.getByText('Recent Rolls')).toBeInTheDocument();
    expect(screen.getByText(/Frame Shift Drive - Deep Charge/)).toBeInTheDocument();
  });

  test('does not display roll history when experimentalRollHistory is empty', () => {
    render(<ExperimentalsTab {...defaultProps} experimentalRollHistory={[]} />);

    expect(screen.queryByText('Recent Rolls')).not.toBeInTheDocument();
  });

  test('displays undo button for each history entry', () => {
    const rollHistory = [
      {
        id: 1,
        experimentalId: 1,
        moduleName: 'Frame Shift Drive',
        experimentalName: 'Deep Charge',
        materialsConsumed: [],
        previousQuantity: 3
      }
    ];

    render(<ExperimentalsTab {...defaultProps} experimentalRollHistory={rollHistory} />);

    const undoButton = screen.getByText('Undo');
    expect(undoButton).toBeInTheDocument();
  });

  test('calls undoExperimentalRoll when undo button is clicked', () => {
    const rollHistory = [
      {
        id: 1,
        experimentalId: 1,
        moduleName: 'Frame Shift Drive',
        experimentalName: 'Deep Charge',
        materialsConsumed: [],
        previousQuantity: 3
      }
    ];

    render(<ExperimentalsTab {...defaultProps} experimentalRollHistory={rollHistory} />);

    const undoButton = screen.getByText('Undo');
    fireEvent.click(undoButton);

    expect(defaultProps.undoExperimentalRoll).toHaveBeenCalledWith(rollHistory[0]);
  });

  test('limits roll history display to 5 entries', () => {
    const rollHistory = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      experimentalId: i,
      moduleName: 'Frame Shift Drive',
      experimentalName: 'Deep Charge',
      materialsConsumed: [],
      previousQuantity: 3
    }));

    render(<ExperimentalsTab {...defaultProps} experimentalRollHistory={rollHistory} />);

    const undoButtons = screen.getAllByText('Undo');
    expect(undoButtons).toHaveLength(5);
  });
});

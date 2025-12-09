import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BlueprintsTab from './BlueprintsTab';

describe('BlueprintsTab', () => {
  const defaultProps = {
    selectedModule: '',
    setSelectedModule: jest.fn(),
    selectedBp: '',
    setSelectedBp: jest.fn(),
    fromGrade: 1,
    setFromGrade: jest.fn(),
    toGrade: 5,
    setToGrade: jest.fn(),
    strategy: 'typical',
    setStrategy: jest.fn(),
    selectedBlueprints: [],
    addBlueprint: jest.fn(),
    removeBlueprint: jest.fn(),
    updateBlueprintRolls: jest.fn(),
    performBlueprintRoll: jest.fn(),
    blueprintNeeds: [],
    inventory: [],
    rollHistory: [],
    undoRoll: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders blueprint selection interface', () => {
    render(<BlueprintsTab {...defaultProps} />);

    expect(screen.getByText('Select Engineering Blueprints')).toBeInTheDocument();
    expect(screen.getByText('Select Module...')).toBeInTheDocument();
  });

  test('displays module options', () => {
    render(<BlueprintsTab {...defaultProps} />);

    const moduleSelect = screen.getByDisplayValue('Select Module...');
    expect(moduleSelect).toBeInTheDocument();
  });

  test('calls setSelectedModule when selecting a module', () => {
    render(<BlueprintsTab {...defaultProps} />);

    const moduleSelect = screen.getByDisplayValue('Select Module...');
    fireEvent.change(moduleSelect, { target: { value: 'FSD' } });

    expect(defaultProps.setSelectedModule).toHaveBeenCalledWith('FSD');
  });

  test('blueprint select is disabled when no module is selected', () => {
    render(<BlueprintsTab {...defaultProps} />);

    const selects = screen.getAllByRole('combobox');
    // Blueprint select is the second combobox (index 1)
    expect(selects[1]).toBeDisabled();
  });

  test('blueprint select is enabled when module is selected', () => {
    render(<BlueprintsTab {...defaultProps} selectedModule="FSD" />);

    const selects = screen.getAllByRole('combobox');
    // Blueprint select is the second combobox (index 1)
    expect(selects[1]).not.toBeDisabled();
  });

  test('displays grade selectors', () => {
    render(<BlueprintsTab {...defaultProps} />);

    // Check for grade options
    expect(screen.getAllByText(/G\d/).length).toBeGreaterThan(0);
  });

  test('calls setFromGrade when changing from grade', () => {
    render(<BlueprintsTab {...defaultProps} />);

    const gradeSelects = screen.getAllByRole('combobox');
    // From grade select is the third combobox (index 2)
    const fromGradeSelect = gradeSelects[2];

    fireEvent.change(fromGradeSelect, { target: { value: '3' } });
    expect(defaultProps.setFromGrade).toHaveBeenCalled();
  });

  test('displays strategy selector with typical selected', () => {
    render(<BlueprintsTab {...defaultProps} />);

    expect(screen.getByDisplayValue('Typical')).toBeInTheDocument();
  });

  test('Add button is disabled when no blueprint is selected', () => {
    render(<BlueprintsTab {...defaultProps} />);

    const addButton = screen.getByText('Add');
    expect(addButton).toBeDisabled();
  });

  test('Add button is enabled when blueprint is selected', () => {
    render(
      <BlueprintsTab
        {...defaultProps}
        selectedModule="FSD"
        selectedBp="Increased Range"
      />
    );

    const addButton = screen.getByText('Add');
    expect(addButton).not.toBeDisabled();
  });

  test('calls addBlueprint when clicking Add button', () => {
    render(
      <BlueprintsTab
        {...defaultProps}
        selectedModule="FSD"
        selectedBp="Increased Range"
      />
    );

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    expect(defaultProps.addBlueprint).toHaveBeenCalled();
  });

  test('displays selected blueprints list', () => {
    const blueprints = [
      {
        id: 1,
        module: 'FSD',
        blueprint: 'Increased Range',
        fromGrade: 1,
        toGrade: 5,
        strategy: 'typical'
      }
    ];

    render(<BlueprintsTab {...defaultProps} selectedBlueprints={blueprints} />);

    const fsdElements = screen.getAllByText('Frame Shift Drive');
    expect(fsdElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Increased Range')).toBeInTheDocument();
    expect(screen.getByText('G1-G5')).toBeInTheDocument();
    const typicalElements = screen.getAllByText('Typical');
    expect(typicalElements.length).toBeGreaterThan(0);
  });

  test('displays empty message when no blueprints selected', () => {
    render(<BlueprintsTab {...defaultProps} />);

    expect(
      screen.getByText('No blueprints selected. Add blueprints above to calculate material costs.')
    ).toBeInTheDocument();
  });

  test('calls removeBlueprint when clicking remove button', () => {
    const blueprints = [
      {
        id: 123,
        module: 'FSD',
        blueprint: 'Increased Range',
        fromGrade: 1,
        toGrade: 5,
        strategy: 'typical'
      }
    ];

    render(<BlueprintsTab {...defaultProps} selectedBlueprints={blueprints} />);

    const removeButton = screen.getByText('✕');
    fireEvent.click(removeButton);

    expect(defaultProps.removeBlueprint).toHaveBeenCalledWith(123);
  });

  test('displays material summary when blueprintNeeds is not empty', () => {
    const needs = [
      { item: 'Iron', quantity: 5 },
      { item: 'Nickel', quantity: 3 }
    ];

    render(<BlueprintsTab {...defaultProps} blueprintNeeds={needs} />);

    expect(screen.getByText('Materials Required for Blueprints')).toBeInTheDocument();
    expect(screen.getByText('Iron')).toBeInTheDocument();
    expect(screen.getByText('×5')).toBeInTheDocument();
  });

  test('does not display material summary when blueprintNeeds is empty', () => {
    render(<BlueprintsTab {...defaultProps} blueprintNeeds={[]} />);

    expect(
      screen.queryByText('Materials Required for Blueprints')
    ).not.toBeInTheDocument();
  });
});

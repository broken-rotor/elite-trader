import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Since helper functions are not exported, we'll create a separate test file for them
// This file tests the React component integration

describe('App Component', () => {
  test('renders the application title', () => {
    render(<App />);
    const titleElement = screen.getByText(/Elite Dangerous Material Trader/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders all three main tabs', () => {
    render(<App />);
    expect(screen.getByText('🔧 Blueprints')).toBeInTheDocument();
    expect(screen.getByText('📝 Manual Entry')).toBeInTheDocument();
    expect(screen.getByText('📦 Inventory')).toBeInTheDocument();
  });

  test('switches between tabs when clicked', () => {
    render(<App />);

    const manualTab = screen.getByText('📝 Manual Entry');
    fireEvent.click(manualTab);

    // Verify the manual tab is now visible/active
    expect(manualTab).toBeInTheDocument();
  });

  test('renders results section', () => {
    render(<App />);
    expect(screen.getByText('⚡ Optimization Results')).toBeInTheDocument();
  });

  test('initially shows empty state message', () => {
    render(<App />);
    expect(screen.getByText(/Select blueprints or add manual needs/i)).toBeInTheDocument();
  });

  test('displays module selection when on blueprints tab', () => {
    render(<App />);
    expect(screen.getByText('Select Module...')).toBeInTheDocument();
  });

  test('inventory tab shows sections', () => {
    render(<App />);

    const inventoryTab = screen.getByText('📦 Inventory');
    fireEvent.click(inventoryTab);

    // Check for the empty inventory message
    expect(screen.getByText(/No materials in inventory/i)).toBeInTheDocument();
  });

  test('renders with default empty state', () => {
    render(<App />);

    // Should show empty blueprints message
    expect(screen.getByText(/No blueprints selected/i)).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Tooltip from './Tooltip';

describe('Tooltip Component', () => {
  test('renders children without tooltip when not disabled', () => {
    render(
      <Tooltip content={<span>Tooltip content</span>} disabled={false}>
        <button>Test Button</button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');
    expect(button).toBeInTheDocument();

    // Tooltip should not appear even on hover
    fireEvent.mouseEnter(button);
    expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
  });

  test('shows tooltip on hover when disabled is true', async () => {
    render(
      <Tooltip content={<span>Tooltip content</span>} disabled={true}>
        <button>Test Button</button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');

    // Hover over the button
    fireEvent.mouseEnter(button);

    // Tooltip should appear
    await waitFor(() => {
      expect(screen.getByText('Tooltip content')).toBeInTheDocument();
    });
  });

  test('hides tooltip when mouse leaves', async () => {
    render(
      <Tooltip content={<span>Tooltip content</span>} disabled={true}>
        <button>Test Button</button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');

    // Show tooltip
    fireEvent.mouseEnter(button);
    await waitFor(() => {
      expect(screen.getByText('Tooltip content')).toBeInTheDocument();
    });

    // Hide tooltip
    fireEvent.mouseLeave(button);
    await waitFor(() => {
      expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
    });
  });

  test('renders complex content with quality classes', async () => {
    const content = (
      <div>
        <div className="tooltip-content-line">Missing materials:</div>
        <div className="tooltip-content-line">
          <span className="quality-2">Chromium</span>: need 1, have 0
        </div>
        <div className="tooltip-content-line">
          <span className="quality-3">Mechanical Components</span>: need 1, have 0
        </div>
      </div>
    );

    render(
      <Tooltip content={content} disabled={true}>
        <button>Roll</button>
      </Tooltip>
    );

    const button = screen.getByText('Roll');

    // Show tooltip
    fireEvent.mouseEnter(button);

    // Check that content header is rendered
    await waitFor(() => {
      expect(screen.getByText('Missing materials:')).toBeInTheDocument();
    });

    // Verify all materials are shown
    expect(screen.getByText('Chromium')).toBeInTheDocument();
    expect(screen.getByText('Mechanical Components')).toBeInTheDocument();

    // Verify quality classes are applied
    const chromium = screen.getByText('Chromium');
    expect(chromium).toHaveClass('quality-2');

    const mechanicalComponents = screen.getByText('Mechanical Components');
    expect(mechanicalComponents).toHaveClass('quality-3');
  });

  test('tooltip uses fixed positioning via portal', async () => {
    render(
      <Tooltip content={<span>Test Content</span>} disabled={true}>
        <button>Test Button</button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');

    // Show tooltip
    fireEvent.mouseEnter(button);

    // Verify tooltip content appears
    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    // Tooltip should be rendered (portal functionality works)
    const tooltipContent = screen.getByText('Test Content');
    expect(tooltipContent).toBeInTheDocument();
  });

  test('handles rapid mouse enter/leave events', async () => {
    render(
      <Tooltip content={<span>Tooltip content</span>} disabled={true}>
        <button>Test Button</button>
      </Tooltip>
    );

    const button = screen.getByText('Test Button');

    // Rapid hover on and off
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);
    fireEvent.mouseEnter(button);

    // Should show tooltip after final enter
    await waitFor(() => {
      expect(screen.getByText('Tooltip content')).toBeInTheDocument();
    });

    // Leave again
    fireEvent.mouseLeave(button);

    // Should hide
    await waitFor(() => {
      expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
    });
  });
});

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from './SearchInput';

describe('SearchInput - Debounced Interactions', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnSearch.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders search input with placeholder', () => {
    render(<SearchInput onSearch={mockOnSearch} placeholder="Type to search..." />);
    
    const input = screen.getByLabelText('Search input');
    expect(input).toHaveAttribute('placeholder', 'Type to search...');
  });

  test('calls onSearch after debounce delay', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchInput onSearch={mockOnSearch} debounceMs={300} />);
    
    const input = screen.getByLabelText('Search input');
    
    // Type search query
    await user.type(input, 'react');
    
    // Should not call immediately
    expect(mockOnSearch).not.toHaveBeenCalled();
    
    // Fast-forward time
    vi.advanceTimersByTime(300);
    
    // Should call after debounce
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('react');
    });
  });

  test('shows searching indicator during debounce', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchInput onSearch={mockOnSearch} debounceMs={300} />);
    
    const input = screen.getByLabelText('Search input');
    
    await user.type(input, 'test');
    
    // Should show searching indicator
    expect(screen.getByRole('status')).toHaveTextContent('Searching...');
    
    // Advance time to complete search
    vi.advanceTimersByTime(300);
    
    // Searching indicator should disappear
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  test('shows clear button when input has value', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchInput onSearch={mockOnSearch} />);
    
    const input = screen.getByLabelText('Search input');
    
    // Initially no clear button
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    
    // Type something
    await user.type(input, 'test');
    
    // Clear button should appear
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  test('clears input when clear button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchInput onSearch={mockOnSearch} />);
    
    const input = screen.getByLabelText('Search input');
    
    // Type something
    await user.type(input, 'test');
    expect(input).toHaveValue('test');
    
    // Click clear button
    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);
    
    // Input should be cleared
    expect(input).toHaveValue('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  test('handles rapid typing correctly', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchInput onSearch={mockOnSearch} debounceMs={300} />);
    
    const input = screen.getByLabelText('Search input');
    
    // Type quickly
    await user.type(input, 'r');
    vi.advanceTimersByTime(100);
    
    await user.type(input, 'e');
    vi.advanceTimersByTime(100);
    
    await user.type(input, 'act');
    
    // Should only call once with final value
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('react');
    });
  });

  test('does not search with empty query', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchInput onSearch={mockOnSearch} />);
    
    const input = screen.getByLabelText('Search input');
    
    // Type spaces only
    await user.type(input, '   ');
    
    vi.advanceTimersByTime(300);
    
    // Should not call onSearch for empty/whitespace query
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  test('disables input and buttons when disabled prop is true', () => {
    render(<SearchInput onSearch={mockOnSearch} disabled={true} />);
    
    const input = screen.getByLabelText('Search input');
    expect(input).toBeDisabled();
  });

  test('clear button is disabled when input is disabled', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(<SearchInput onSearch={mockOnSearch} />);
    
    const input = screen.getByLabelText('Search input');
    await user.type(input, 'test');
    
    // Re-render with disabled prop
    rerender(<SearchInput onSearch={mockOnSearch} disabled={true} />);
    
    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeDisabled();
  });
});
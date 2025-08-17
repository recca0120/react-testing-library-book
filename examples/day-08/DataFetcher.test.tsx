import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataFetcher } from './DataFetcher';

// Mock Math.random to control random failures
const mockMath = vi.spyOn(Math, 'random');

describe('DataFetcher - Async Testing', () => {
  const mockOnUserLoaded = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnUserLoaded.mockClear();
    mockOnError.mockClear();
    mockMath.mockReturnValue(0.5); // Ensure no random failures
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    mockMath.mockRestore();
  });

  test('shows loading state initially', () => {
    render(<DataFetcher userId={1} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading user data...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  test('displays user data after successful fetch', async () => {
    render(<DataFetcher userId={1} onUserLoaded={mockOnUserLoaded} />);

    // Fast-forward past the loading delay
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-data')).toBeInTheDocument();
    });

    expect(screen.getByTestId('user-id')).toHaveTextContent('1');
    expect(screen.getByTestId('user-name')).toHaveTextContent('User 1');
    expect(screen.getByTestId('user-email')).toHaveTextContent('user1@example.com');
    expect(screen.getByTestId('user-username')).toHaveTextContent('user1');

    expect(mockOnUserLoaded).toHaveBeenCalledWith({
      id: 1,
      name: 'User 1',
      email: 'user1@example.com',
      username: 'user1'
    });
  });

  test('handles different user IDs', async () => {
    render(<DataFetcher userId={5} />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('5');
      expect(screen.getByTestId('user-name')).toHaveTextContent('User 5');
      expect(screen.getByTestId('user-email')).toHaveTextContent('user5@example.com');
    });
  });

  test('shows error state when fetch fails', async () => {
    // Mock random to always fail on first attempt
    mockMath.mockReturnValue(0.1);

    render(<DataFetcher userId={1} onError={mockOnError} />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toHaveTextContent('Retry (0 attempts)');
    expect(mockOnError).toHaveBeenCalledWith('Network error');
  });

  test('retry functionality works correctly', async () => {
    // First attempt fails, subsequent succeed
    mockMath.mockReturnValueOnce(0.1).mockReturnValue(0.5);

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<DataFetcher userId={1} />);

    // Initial load fails
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByTestId('retry-button');
    await user.click(retryButton);

    // Should show loading again
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Advance time for retry
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should now show user data
    await waitFor(() => {
      expect(screen.getByTestId('user-data')).toBeInTheDocument();
    });
  });

  test('refresh functionality resets retry count', async () => {
    mockMath.mockReturnValue(0.1); // Always fail initially

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<DataFetcher userId={1} />);

    // Initial load fails
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toHaveTextContent('Retry (0 attempts)');
    });

    // Retry once
    await user.click(screen.getByTestId('retry-button'));
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toHaveTextContent('Retry (1 attempts)');
    });

    // Click refresh
    mockMath.mockReturnValue(0.5); // Next attempt will succeed
    await user.click(screen.getByTestId('refresh-button'));
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should show user data
    await waitFor(() => {
      expect(screen.getByTestId('user-data')).toBeInTheDocument();
    });
  });

  test('refresh button works in success state', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<DataFetcher userId={1} />);

    // Initial successful load
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await waitFor(() => {
      expect(screen.getByTestId('user-data')).toBeInTheDocument();
    });

    // Click refresh
    await user.click(screen.getByTestId('refresh-data'));

    // Should show loading
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Complete loading
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await waitFor(() => {
      expect(screen.getByTestId('user-data')).toBeInTheDocument();
    });
  });

  test('updates when userId prop changes', async () => {
    const { rerender } = render(<DataFetcher userId={1} />);

    // Initial load
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('1');
    });

    // Change userId
    rerender(<DataFetcher userId={3} />);

    // Should show loading again
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Complete new load
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('3');
      expect(screen.getByTestId('user-name')).toHaveTextContent('User 3');
    });
  });

  test('handles rapid prop changes correctly', async () => {
    const { rerender } = render(<DataFetcher userId={1} />);

    // Change userId rapidly
    rerender(<DataFetcher userId={2} />);
    rerender(<DataFetcher userId={3} />);

    // Advance time once
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should show the latest user (3)
    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('3');
    });
  });

  test('accessibility attributes are correct', async () => {
    render(<DataFetcher userId={1} />);

    // Loading state
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toHaveAttribute('aria-live', 'polite');

    // Complete loading
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user-data')).toBeInTheDocument();
    });
  });

  test('error state has correct accessibility attributes', async () => {
    mockMath.mockReturnValue(0.1);
    render(<DataFetcher userId={1} />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
    });
  });
});
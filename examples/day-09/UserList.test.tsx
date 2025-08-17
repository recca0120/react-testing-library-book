import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserList } from './UserList';
import { UserService, User } from './UserService';

// Mock the window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(),
});

describe('UserList - Mock Functions', () => {
  let mockUserService: UserService;
  let mockOnUserSelect: ReturnType<typeof vi.fn>;
  let mockOnUserDelete: ReturnType<typeof vi.fn>;

  const mockUsers: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com' },
  ];

  beforeEach(() => {
    mockOnUserSelect = vi.fn();
    mockOnUserDelete = vi.fn();
    
    // Create mock user service
    mockUserService = {
      getAllUsers: vi.fn().mockResolvedValue(mockUsers),
      getUserById: vi.fn(),
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn().mockResolvedValue(true),
      reset: vi.fn(),
    } as any;

    // Reset window.confirm mock
    (window.confirm as any).mockReturnValue(true);
  });

  test('loads and displays users on mount', async () => {
    render(
      <UserList 
        userService={mockUserService}
        onUserSelect={mockOnUserSelect}
        onUserDelete={mockOnUserDelete}
      />
    );

    // Should show loading initially
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
    });

    // Verify service was called
    expect(mockUserService.getAllUsers).toHaveBeenCalledOnce();

    // Verify users are displayed
    expect(screen.getByText('Users (3)')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  test('handles service error', async () => {
    const errorMessage = 'Network error';
    mockUserService.getAllUsers = vi.fn().mockRejectedValue(new Error(errorMessage));

    render(<UserList userService={mockUserService} />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  test('retries loading on error', async () => {
    // First call fails, second succeeds
    mockUserService.getAllUsers = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockUsers);

    const user = userEvent.setup();
    render(<UserList userService={mockUserService} />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    // Click retry
    await user.click(screen.getByTestId('retry-button'));

    // Should show loading again
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for success
    await waitFor(() => {
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
    });

    expect(mockUserService.getAllUsers).toHaveBeenCalledTimes(2);
  });

  test('displays empty state when no users', async () => {
    mockUserService.getAllUsers = vi.fn().mockResolvedValue([]);

    render(<UserList userService={mockUserService} />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    expect(screen.getByText('No users found')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
  });

  test('calls onUserSelect when select button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <UserList 
        userService={mockUserService}
        onUserSelect={mockOnUserSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
    });

    // Click select button for first user
    await user.click(screen.getByTestId('select-user-1'));

    expect(mockOnUserSelect).toHaveBeenCalledWith(mockUsers[0]);
    expect(mockOnUserSelect).toHaveBeenCalledTimes(1);
  });

  test('deletes user when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    render(
      <UserList 
        userService={mockUserService}
        onUserDelete={mockOnUserDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
    });

    // Click delete button for first user
    await user.click(screen.getByTestId('delete-user-1'));

    // Verify confirm was called
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete John Doe?');

    // Wait for delete to complete
    await waitFor(() => {
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(1);
    });

    expect(mockOnUserDelete).toHaveBeenCalledWith(mockUsers[0]);
  });

  test('does not delete user when delete is cancelled', async () => {
    (window.confirm as any).mockReturnValue(false);
    
    const user = userEvent.setup();
    render(
      <UserList 
        userService={mockUserService}
        onUserDelete={mockOnUserDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('delete-user-1'));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockUserService.deleteUser).not.toHaveBeenCalled();
    expect(mockOnUserDelete).not.toHaveBeenCalled();
  });

  test('shows loading state during delete', async () => {
    let resolveDelete: (value: boolean) => void;
    const deletePromise = new Promise<boolean>(resolve => {
      resolveDelete = resolve;
    });
    
    mockUserService.deleteUser = vi.fn().mockReturnValue(deletePromise);

    const user = userEvent.setup();
    render(<UserList userService={mockUserService} />);

    await waitFor(() => {
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
    });

    // Start delete
    await user.click(screen.getByTestId('delete-user-1'));

    // Should show loading state
    expect(screen.getByText('Deleting...')).toBeInTheDocument();

    // Complete delete
    resolveDelete!(true);

    await waitFor(() => {
      expect(screen.queryByText('Deleting...')).not.toBeInTheDocument();
    });
  });

  test('handles delete service error', async () => {
    mockUserService.deleteUser = vi.fn().mockRejectedValue(new Error('Delete failed'));

    const user = userEvent.setup();
    render(<UserList userService={mockUserService} />);

    await waitFor(() => {
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('delete-user-1'));

    await waitFor(() => {
      expect(screen.getByText('Error: Delete failed')).toBeInTheDocument();
    });
  });

  test('refreshes user list when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<UserList userService={mockUserService} />);

    await waitFor(() => {
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
    });

    // Clear previous calls
    mockUserService.getAllUsers = vi.fn().mockResolvedValue(mockUsers);

    // Click refresh
    await user.click(screen.getByTestId('refresh-users'));

    expect(mockUserService.getAllUsers).toHaveBeenCalledOnce();
  });

  test('updates user count after deletion', async () => {
    const user = userEvent.setup();
    render(<UserList userService={mockUserService} />);

    await waitFor(() => {
      expect(screen.getByText('Users (3)')).toBeInTheDocument();
    });

    // Delete a user
    await user.click(screen.getByTestId('delete-user-1'));

    await waitFor(() => {
      expect(screen.getByText('Users (2)')).toBeInTheDocument();
    });

    // Verify user is removed from list
    expect(screen.queryByTestId('user-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('user-2')).toBeInTheDocument();
    expect(screen.getByTestId('user-3')).toBeInTheDocument();
  });

  test('maintains accessibility attributes', async () => {
    render(<UserList userService={mockUserService} />);

    // Loading state
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');

    await waitFor(() => {
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
    });

    // List should have proper role
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
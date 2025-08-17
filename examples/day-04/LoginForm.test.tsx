import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm - User Interactions', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  test('renders login form with all fields', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username:')).toBeInTheDocument();
    expect(screen.getByLabelText('Password:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('allows typing in username and password fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const usernameInput = screen.getByLabelText('Username:');
    const passwordInput = screen.getByLabelText('Password:');
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  test('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText('Password:');
    const toggleButton = screen.getByLabelText('Show password');
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click to show password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
    
    // Click to hide password again
    await user.click(screen.getByLabelText('Hide password'));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('submit button is disabled when fields are empty', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: 'Login' });
    expect(submitButton).toBeDisabled();
  });

  test('submit button is enabled when both fields have values', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const usernameInput = screen.getByLabelText('Username:');
    const passwordInput = screen.getByLabelText('Password:');
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    
    expect(submitButton).toBeEnabled();
  });

  test('calls onSubmit with correct credentials', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const usernameInput = screen.getByLabelText('Username:');
    const passwordInput = screen.getByLabelText('Password:');
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123'
    });
  });

  test('shows loading state', () => {
    render(<LoginForm onSubmit={mockOnSubmit} loading={true} />);
    
    expect(screen.getByRole('button', { name: 'Logging in...' })).toBeDisabled();
    expect(screen.getByLabelText('Username:')).toBeDisabled();
    expect(screen.getByLabelText('Password:')).toBeDisabled();
  });

  test('displays error message', () => {
    render(<LoginForm onSubmit={mockOnSubmit} error="Invalid credentials" />);
    
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toHaveTextContent('Invalid credentials');
  });

  test('can clear and retype in fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const usernameInput = screen.getByLabelText('Username:');
    
    // Type initial value
    await user.type(usernameInput, 'firstuser');
    expect(usernameInput).toHaveValue('firstuser');
    
    // Clear and type new value
    await user.clear(usernameInput);
    await user.type(usernameInput, 'seconduser');
    expect(usernameInput).toHaveValue('seconduser');
  });
});
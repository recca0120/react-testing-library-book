import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Counter from './Counter';

describe('Counter Component', () => {
  test('renders with default initial count', () => {
    render(<Counter />);
    
    expect(screen.getByText('Counter: 0')).toBeInTheDocument();
  });

  test('renders with custom initial count', () => {
    render(<Counter initialCount={5} />);
    
    expect(screen.getByText('Counter: 5')).toBeInTheDocument();
  });

  test('increments count when + button is clicked', async () => {
    const user = userEvent.setup();
    render(<Counter />);
    
    const incrementButton = screen.getByLabelText('Increment');
    await user.click(incrementButton);
    
    expect(screen.getByText('Counter: 1')).toBeInTheDocument();
  });

  test('decrements count when - button is clicked', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={5} />);
    
    const decrementButton = screen.getByLabelText('Decrement');
    await user.click(decrementButton);
    
    expect(screen.getByText('Counter: 4')).toBeInTheDocument();
  });

  test('resets count when Reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={5} />);
    
    const incrementButton = screen.getByLabelText('Increment');
    await user.click(incrementButton);
    await user.click(incrementButton);
    
    expect(screen.getByText('Counter: 7')).toBeInTheDocument();
    
    const resetButton = screen.getByLabelText('Reset');
    await user.click(resetButton);
    
    expect(screen.getByText('Counter: 5')).toBeInTheDocument();
  });

  test('respects max value', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={9} max={10} />);
    
    const incrementButton = screen.getByLabelText('Increment');
    await user.click(incrementButton);
    
    expect(screen.getByText('Counter: 10')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Maximum value reached');
    expect(incrementButton).toBeDisabled();
  });

  test('respects min value', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={1} min={0} />);
    
    const decrementButton = screen.getByLabelText('Decrement');
    await user.click(decrementButton);
    
    expect(screen.getByText('Counter: 0')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Minimum value reached');
    expect(decrementButton).toBeDisabled();
  });

  test('uses custom step value', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={0} step={5} />);
    
    const incrementButton = screen.getByLabelText('Increment');
    await user.click(incrementButton);
    
    expect(screen.getByText('Counter: 5')).toBeInTheDocument();
    
    const decrementButton = screen.getByLabelText('Decrement');
    await user.click(decrementButton);
    
    expect(screen.getByText('Counter: 0')).toBeInTheDocument();
  });
});
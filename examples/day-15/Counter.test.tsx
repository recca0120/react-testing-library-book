import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { createAppStore, RootState } from './store';
import { ReduxCounter } from './Counter';

// Test Utilities
const renderWithStore = (
  component: React.ReactElement,
  initialState?: Partial<RootState>
) => {
  const store = createAppStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store
  };
};

describe('Redux Counter Integration', () => {
  test('displays initial count from store', () => {
    renderWithStore(<ReduxCounter />, {
      counter: { count: 10 }
    });

    expect(screen.getByTestId('count-value')).toHaveTextContent('10');
  });

  test('increments count when increment button is clicked', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<ReduxCounter />, {
      counter: { count: 5 }
    });

    await user.click(screen.getByTestId('increment-btn'));

    expect(screen.getByTestId('count-value')).toHaveTextContent('6');
    expect(store.getState().counter.count).toBe(6);
  });

  test('decrements count when decrement button is clicked', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<ReduxCounter />, {
      counter: { count: 5 }
    });

    await user.click(screen.getByTestId('decrement-btn'));

    expect(screen.getByTestId('count-value')).toHaveTextContent('4');
    expect(store.getState().counter.count).toBe(4);
  });

  test('resets count to zero when reset button is clicked', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<ReduxCounter />, {
      counter: { count: 42 }
    });

    await user.click(screen.getByTestId('reset-btn'));

    expect(screen.getByTestId('count-value')).toHaveTextContent('0');
    expect(store.getState().counter.count).toBe(0);
  });

  test('sets specific value when input changes', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<ReduxCounter />);

    const input = screen.getByLabelText('Set Value:');
    await user.type(input, '25');

    expect(screen.getByTestId('count-value')).toHaveTextContent('25');
    expect(store.getState().counter.count).toBe(25);
  });

  test('handles negative numbers correctly', async () => {
    const user = userEvent.setup();
    renderWithStore(<ReduxCounter />, {
      counter: { count: -5 }
    });

    expect(screen.getByTestId('count-value')).toHaveTextContent('-5');
    expect(screen.getByText('Count is negative')).toBeInTheDocument();

    await user.click(screen.getByTestId('increment-btn'));
    expect(screen.getByTestId('count-value')).toHaveTextContent('-4');
  });

  test('displays correct positive/negative status', () => {
    const { rerender } = renderWithStore(<ReduxCounter />, {
      counter: { count: 5 }
    });

    expect(screen.getByText('Count is positive')).toBeInTheDocument();

    rerender(
      <Provider store={createAppStore({ counter: { count: -3 } })}>
        <ReduxCounter />
      </Provider>
    );

    expect(screen.getByText('Count is negative')).toBeInTheDocument();
  });

  test('displays correct even/odd status', () => {
    const { rerender } = renderWithStore(<ReduxCounter />, {
      counter: { count: 4 }
    });

    expect(screen.getByText('Count is even')).toBeInTheDocument();

    rerender(
      <Provider store={createAppStore({ counter: { count: 3 } })}>
        <ReduxCounter />
      </Provider>
    );

    expect(screen.getByText('Count is odd')).toBeInTheDocument();
  });

  test('handles multiple rapid clicks correctly', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<ReduxCounter />, {
      counter: { count: 0 }
    });

    const incrementBtn = screen.getByTestId('increment-btn');

    // Rapid clicks
    await user.click(incrementBtn);
    await user.click(incrementBtn);
    await user.click(incrementBtn);

    expect(screen.getByTestId('count-value')).toHaveTextContent('3');
    expect(store.getState().counter.count).toBe(3);
  });

  test('input only accepts valid numbers', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<ReduxCounter />);

    const input = screen.getByLabelText('Set Value:');
    
    // Try typing invalid input
    await user.type(input, 'abc');
    // Count should remain unchanged
    expect(store.getState().counter.count).toBe(0);

    // Clear and type valid number
    await user.clear(input);
    await user.type(input, '123');
    expect(store.getState().counter.count).toBe(123);
  });
});
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, increment, decrement, setCount } from './store';

export const ReduxCounter: React.FC = () => {
  const count = useSelector((state: RootState) => state.counter.count);
  const dispatch = useDispatch();

  const handleIncrement = () => dispatch(increment());
  const handleDecrement = () => dispatch(decrement());
  const handleReset = () => dispatch(setCount(0));
  const handleSetValue = (value: number) => dispatch(setCount(value));

  return (
    <div className="redux-counter" data-testid="redux-counter">
      <h2>Redux Counter</h2>
      
      <div className="counter-display">
        <span data-testid="count-value">{count}</span>
      </div>
      
      <div className="counter-controls">
        <button onClick={handleDecrement} data-testid="decrement-btn">
          -
        </button>
        <button onClick={handleIncrement} data-testid="increment-btn">
          +
        </button>
        <button onClick={handleReset} data-testid="reset-btn">
          Reset
        </button>
      </div>
      
      <div className="set-value-controls">
        <label htmlFor="set-value">Set Value:</label>
        <input
          id="set-value"
          type="number"
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value)) {
              handleSetValue(value);
            }
          }}
          placeholder="Enter number"
        />
      </div>
      
      <div className="counter-info">
        <p>Count is {count >= 0 ? 'positive' : 'negative'}</p>
        <p>Count is {count % 2 === 0 ? 'even' : 'odd'}</p>
      </div>
    </div>
  );
};
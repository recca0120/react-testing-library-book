import React, { useState } from 'react';

interface CounterProps {
  initialCount?: number;
  min?: number;
  max?: number;
  step?: number;
}

const Counter: React.FC<CounterProps> = ({
  initialCount = 0,
  min = -Infinity,
  max = Infinity,
  step = 1,
}) => {
  const [count, setCount] = useState(initialCount);

  const increment = () => {
    setCount((prev) => {
      const newValue = prev + step;
      return newValue <= max ? newValue : prev;
    });
  };

  const decrement = () => {
    setCount((prev) => {
      const newValue = prev - step;
      return newValue >= min ? newValue : prev;
    });
  };

  const reset = () => {
    setCount(initialCount);
  };

  return (
    <div className="counter">
      <h2>Counter: {count}</h2>
      <div className="counter-controls">
        <button onClick={decrement} disabled={count <= min} aria-label="Decrement">
          -
        </button>
        <button onClick={increment} disabled={count >= max} aria-label="Increment">
          +
        </button>
        <button onClick={reset} aria-label="Reset">
          Reset
        </button>
      </div>
      {count === max && <p role="alert">Maximum value reached</p>}
      {count === min && <p role="alert">Minimum value reached</p>}
    </div>
  );
};

export default Counter;
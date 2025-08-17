import { useState, useCallback } from 'react';

interface UseCounterOptions {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

interface UseCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setCount: (value: number) => void;
  isAtMin: boolean;
  isAtMax: boolean;
}

export const useCounter = ({
  initialValue = 0,
  min = -Infinity,
  max = Infinity,
  step = 1,
}: UseCounterOptions = {}): UseCounterReturn => {
  const [count, setCountState] = useState(initialValue);

  const increment = useCallback(() => {
    setCountState((prev) => {
      const newValue = prev + step;
      return newValue <= max ? newValue : prev;
    });
  }, [max, step]);

  const decrement = useCallback(() => {
    setCountState((prev) => {
      const newValue = prev - step;
      return newValue >= min ? newValue : prev;
    });
  }, [min, step]);

  const reset = useCallback(() => {
    setCountState(initialValue);
  }, [initialValue]);

  const setCount = useCallback(
    (value: number) => {
      if (value >= min && value <= max) {
        setCountState(value);
      }
    },
    [min, max]
  );

  return {
    count,
    increment,
    decrement,
    reset,
    setCount,
    isAtMin: count <= min,
    isAtMax: count >= max,
  };
};
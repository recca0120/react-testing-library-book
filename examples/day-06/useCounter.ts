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
  set: (value: number) => void;
  canIncrement: boolean;
  canDecrement: boolean;
}

export const useCounter = ({
  initialValue = 0,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1
}: UseCounterOptions = {}): UseCounterReturn => {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(current => {
      const newValue = current + step;
      return newValue <= max ? newValue : current;
    });
  }, [step, max]);

  const decrement = useCallback(() => {
    setCount(current => {
      const newValue = current - step;
      return newValue >= min ? newValue : current;
    });
  }, [step, min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  const set = useCallback((value: number) => {
    if (value >= min && value <= max) {
      setCount(value);
    }
  }, [min, max]);

  const canIncrement = count + step <= max;
  const canDecrement = count - step >= min;

  return {
    count,
    increment,
    decrement,
    reset,
    set,
    canIncrement,
    canDecrement
  };
};
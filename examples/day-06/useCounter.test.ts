import { describe, test, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter Hook', () => {
  test('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    
    expect(result.current.count).toBe(0);
    expect(result.current.canIncrement).toBe(true);
    expect(result.current.canDecrement).toBe(true);
  });

  test('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 10 }));
    
    expect(result.current.count).toBe(10);
  });

  test('increments count', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(6);
  });

  test('decrements count', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });

  test('respects custom step value', () => {
    const { result } = renderHook(() => useCounter({ 
      initialValue: 10, 
      step: 5 
    }));
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(15);
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(10);
  });

  test('respects maximum limit', () => {
    const { result } = renderHook(() => useCounter({ 
      initialValue: 8, 
      max: 10 
    }));
    
    // Should increment normally
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(9);
    
    // Should increment to max
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(10);
    
    // Should not increment beyond max
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(10);
  });

  test('respects minimum limit', () => {
    const { result } = renderHook(() => useCounter({ 
      initialValue: 2, 
      min: 0 
    }));
    
    // Should decrement normally
    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(1);
    
    // Should decrement to min
    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(0);
    
    // Should not decrement below min
    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(0);
  });

  test('provides correct canIncrement and canDecrement values', () => {
    const { result } = renderHook(() => useCounter({ 
      initialValue: 9, 
      min: 0, 
      max: 10 
    }));
    
    expect(result.current.canIncrement).toBe(true);
    expect(result.current.canDecrement).toBe(true);
    
    // At maximum
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(10);
    expect(result.current.canIncrement).toBe(false);
    expect(result.current.canDecrement).toBe(true);
    
    // At minimum
    act(() => {
      result.current.set(0);
    });
    expect(result.current.count).toBe(0);
    expect(result.current.canIncrement).toBe(true);
    expect(result.current.canDecrement).toBe(false);
  });

  test('resets to initial value', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));
    
    // Change the count
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    expect(result.current.count).toBe(7);
    
    // Reset
    act(() => {
      result.current.reset();
    });
    expect(result.current.count).toBe(5);
  });

  test('sets specific value within limits', () => {
    const { result } = renderHook(() => useCounter({ 
      min: 0, 
      max: 100 
    }));
    
    // Set valid value
    act(() => {
      result.current.set(50);
    });
    expect(result.current.count).toBe(50);
    
    // Try to set value above max
    act(() => {
      result.current.set(150);
    });
    expect(result.current.count).toBe(50); // Should not change
    
    // Try to set value below min
    act(() => {
      result.current.set(-10);
    });
    expect(result.current.count).toBe(50); // Should not change
  });

  test('handles edge cases with step values', () => {
    const { result } = renderHook(() => useCounter({ 
      initialValue: 5,
      min: 0, 
      max: 10,
      step: 3
    }));
    
    // canIncrement should consider step
    expect(result.current.canIncrement).toBe(true); // 5 + 3 = 8 <= 10
    
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(8);
    expect(result.current.canIncrement).toBe(false); // 8 + 3 = 11 > 10
    
    // canDecrement should consider step
    expect(result.current.canDecrement).toBe(true); // 8 - 3 = 5 >= 0
    
    act(() => {
      result.current.decrement();
      result.current.decrement();
    });
    expect(result.current.count).toBe(2);
    expect(result.current.canDecrement).toBe(false); // 2 - 3 = -1 < 0
  });

  test('maintains function reference stability', () => {
    const { result, rerender } = renderHook(() => useCounter({ initialValue: 0 }));
    
    const firstIncrement = result.current.increment;
    const firstDecrement = result.current.decrement;
    const firstReset = result.current.reset;
    const firstSet = result.current.set;
    
    // Trigger re-render
    rerender();
    
    expect(result.current.increment).toBe(firstIncrement);
    expect(result.current.decrement).toBe(firstDecrement);
    expect(result.current.reset).toBe(firstReset);
    expect(result.current.set).toBe(firstSet);
  });
});
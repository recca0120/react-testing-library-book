import { describe, test, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter Hook', () => {
  test('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    
    expect(result.current.count).toBe(0);
    expect(result.current.isAtMin).toBe(false);
    expect(result.current.isAtMax).toBe(false);
  });

  test('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 10 }));
    
    expect(result.current.count).toBe(10);
  });

  test('increments counter', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  test('decrements counter', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });

  test('resets counter to initial value', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));
    
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    
    expect(result.current.count).toBe(7);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.count).toBe(5);
  });

  test('sets count directly', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.setCount(42);
    });
    
    expect(result.current.count).toBe(42);
  });

  test('respects maximum value', () => {
    const { result } = renderHook(() => 
      useCounter({ initialValue: 9, max: 10 })
    );
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(10);
    expect(result.current.isAtMax).toBe(true);
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(10);
  });

  test('respects minimum value', () => {
    const { result } = renderHook(() => 
      useCounter({ initialValue: 1, min: 0 })
    );
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(0);
    expect(result.current.isAtMin).toBe(true);
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(0);
  });

  test('uses custom step value', () => {
    const { result } = renderHook(() => 
      useCounter({ initialValue: 0, step: 5 })
    );
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(5);
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(0);
  });

  test('setCount respects min and max boundaries', () => {
    const { result } = renderHook(() => 
      useCounter({ initialValue: 5, min: 0, max: 10 })
    );
    
    act(() => {
      result.current.setCount(15);
    });
    
    expect(result.current.count).toBe(5);
    
    act(() => {
      result.current.setCount(-5);
    });
    
    expect(result.current.count).toBe(5);
    
    act(() => {
      result.current.setCount(7);
    });
    
    expect(result.current.count).toBe(7);
  });
});
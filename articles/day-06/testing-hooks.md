# Day 6: 測試 Hooks - 使用 renderHook

## 學習目標

- 學會使用 `renderHook` 測試自定義 Hooks
- 掌握測試 `useState`、`useEffect` 等常見 Hooks
- 了解如何測試 Hook 的依賴和副作用
- 學習測試 Hook 之間的組合使用

## 概念說明

React Hooks 讓我們能夠在函數元件中使用狀態和其他 React 功能。測試 Hooks 時，我們需要：

1. **隔離測試** - 單獨測試 Hook 的邏輯，不依賴特定元件
2. **模擬 React 環境** - Hooks 只能在 React 元件中運行
3. **測試副作用** - useEffect、API 呼叫等異步操作
4. **狀態管理** - 測試狀態變化和更新邏輯

`@testing-library/react` 提供的 `renderHook` 工具能夠創建一個測試用的 React 環境來運行 Hooks。

## 實作範例

### 基本 useState Hook 測試

首先創建一個簡單的計數器 Hook：

```typescript
// examples/hooks/useCounter.ts
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
  setValue: (value: number) => void;
  canIncrement: boolean;
  canDecrement: boolean;
}

export const useCounter = (options: UseCounterOptions = {}): UseCounterReturn => {
  const {
    initialValue = 0,
    min = -Infinity,
    max = Infinity,
    step = 1
  } = options;

  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(prev => Math.min(prev + step, max));
  }, [step, max]);

  const decrement = useCallback(() => {
    setCount(prev => Math.max(prev - step, min));
  }, [step, min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  const setValue = useCallback((value: number) => {
    const clampedValue = Math.max(min, Math.min(max, value));
    setCount(clampedValue);
  }, [min, max]);

  const canIncrement = count + step <= max;
  const canDecrement = count - step >= min;

  return {
    count,
    increment,
    decrement,
    reset,
    setValue,
    canIncrement,
    canDecrement
  };
};
```

測試這個 Hook：

```typescript
// examples/hooks/useCounter.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  describe('初始化', () => {
    it('should initialize with default value 0', () => {
      const { result } = renderHook(() => useCounter());
      
      expect(result.current.count).toBe(0);
      expect(result.current.canIncrement).toBe(true);
      expect(result.current.canDecrement).toBe(true);
    });

    it('should initialize with custom initial value', () => {
      const { result } = renderHook(() => useCounter({ initialValue: 5 }));
      
      expect(result.current.count).toBe(5);
    });

    it('should respect min and max constraints', () => {
      const { result } = renderHook(() => 
        useCounter({ initialValue: 5, min: 0, max: 10 })
      );
      
      expect(result.current.count).toBe(5);
      expect(result.current.canIncrement).toBe(true);
      expect(result.current.canDecrement).toBe(true);
    });
  });

  describe('increment 功能', () => {
    it('should increment count by default step (1)', () => {
      const { result } = renderHook(() => useCounter());
      
      act(() => {
        result.current.increment();
      });
      
      expect(result.current.count).toBe(1);
    });

    it('should increment by custom step', () => {
      const { result } = renderHook(() => useCounter({ step: 5 }));
      
      act(() => {
        result.current.increment();
      });
      
      expect(result.current.count).toBe(5);
    });

    it('should not exceed max value', () => {
      const { result } = renderHook(() => 
        useCounter({ initialValue: 9, max: 10 })
      );
      
      act(() => {
        result.current.increment();
      });
      expect(result.current.count).toBe(10);
      expect(result.current.canIncrement).toBe(false);
      
      // 再次嘗試增加應該保持在最大值
      act(() => {
        result.current.increment();
      });
      expect(result.current.count).toBe(10);
    });
  });

  describe('decrement 功能', () => {
    it('should decrement count by default step (1)', () => {
      const { result } = renderHook(() => useCounter({ initialValue: 5 }));
      
      act(() => {
        result.current.decrement();
      });
      
      expect(result.current.count).toBe(4);
    });

    it('should not go below min value', () => {
      const { result } = renderHook(() => 
        useCounter({ initialValue: 1, min: 0 })
      );
      
      act(() => {
        result.current.decrement();
      });
      expect(result.current.count).toBe(0);
      expect(result.current.canDecrement).toBe(false);
      
      // 再次嘗試減少應該保持在最小值
      act(() => {
        result.current.decrement();
      });
      expect(result.current.count).toBe(0);
    });
  });

  describe('reset 功能', () => {
    it('should reset to initial value', () => {
      const { result } = renderHook(() => useCounter({ initialValue: 3 }));
      
      // 改變值
      act(() => {
        result.current.increment();
        result.current.increment();
      });
      expect(result.current.count).toBe(5);
      
      // 重置
      act(() => {
        result.current.reset();
      });
      expect(result.current.count).toBe(3);
    });
  });

  describe('setValue 功能', () => {
    it('should set specific value', () => {
      const { result } = renderHook(() => useCounter());
      
      act(() => {
        result.current.setValue(42);
      });
      
      expect(result.current.count).toBe(42);
    });

    it('should clamp value to min/max range', () => {
      const { result } = renderHook(() => 
        useCounter({ min: 0, max: 10 })
      );
      
      // 設定超過最大值
      act(() => {
        result.current.setValue(15);
      });
      expect(result.current.count).toBe(10);
      
      // 設定低於最小值
      act(() => {
        result.current.setValue(-5);
      });
      expect(result.current.count).toBe(0);
    });
  });

  describe('邊界狀態', () => {
    it('should correctly update canIncrement and canDecrement flags', () => {
      const { result } = renderHook(() => 
        useCounter({ initialValue: 9, min: 0, max: 10, step: 2 })
      );
      
      expect(result.current.canIncrement).toBe(false); // 9 + 2 > 10
      expect(result.current.canDecrement).toBe(true);  // 9 - 2 >= 0
      
      act(() => {
        result.current.setValue(1);
      });
      
      expect(result.current.canIncrement).toBe(true);  // 1 + 2 <= 10
      expect(result.current.canDecrement).toBe(false); // 1 - 2 < 0
    });
  });
});
```

### 測試 useEffect Hook

創建一個使用 useEffect 的 Hook：

```typescript
// examples/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react';

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, () => void] => {
  // 從 localStorage 讀取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 更新 localStorage 的函數
  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  // 清除 localStorage 的函數
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // 監聽 storage 事件（其他分頁的變化）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : initialValue;
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};
```

測試這個 Hook：

```typescript
// examples/hooks/useLocalStorage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console.error to avoid noise in tests
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('should use initial value when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'default-value')
      );
      
      expect(result.current[0]).toBe('default-value');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should use stored value when available', () => {
      localStorageMock.getItem.mockReturnValue('"stored-value"');
      
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'default-value')
      );
      
      expect(result.current[0]).toBe('stored-value');
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'default-value')
      );
      
      expect(result.current[0]).toBe('default-value');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error reading localStorage key "test-key"'),
        expect.any(Error)
      );
    });

    it('should work with complex objects', () => {
      const complexObject = { name: 'John', age: 30, hobbies: ['reading'] };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(complexObject));
      
      const { result } = renderHook(() => 
        useLocalStorage('user', { name: '', age: 0, hobbies: [] })
      );
      
      expect(result.current[0]).toEqual(complexObject);
    });
  });

  describe('setValue 功能', () => {
    it('should update state and localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'initial')
      );
      
      act(() => {
        result.current[1]('new-value');
      });
      
      expect(result.current[0]).toBe('new-value');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        '"new-value"'
      );
    });

    it('should handle localStorage setItem errors', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'initial')
      );
      
      act(() => {
        result.current[1]('new-value');
      });
      
      expect(result.current[0]).toBe('new-value'); // State should still update
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error setting localStorage key "test-key"'),
        expect.any(Error)
      );
    });
  });

  describe('removeValue 功能', () => {
    it('should reset to initial value and remove from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('"stored-value"');
      
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'initial')
      );
      
      act(() => {
        result.current[2](); // removeValue
      });
      
      expect(result.current[0]).toBe('initial');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('storage 事件監聽', () => {
    it('should update state when storage event is fired', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'initial')
      );
      
      // 模擬其他分頁修改 localStorage
      act(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'test-key',
          newValue: '"external-change"'
        }));
      });
      
      expect(result.current[0]).toBe('external-change');
    });

    it('should ignore storage events for different keys', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'initial')
      );
      
      act(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'other-key',
          newValue: '"should-be-ignored"'
        }));
      });
      
      expect(result.current[0]).toBe('initial');
    });

    it('should handle storage event with null newValue', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'initial')
      );
      
      act(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'test-key',
          newValue: null
        }));
      });
      
      expect(result.current[0]).toBe('initial');
    });
  });
});
```

### 測試異步 Hook

創建一個處理 API 請求的 Hook：

```typescript
// examples/hooks/useFetch.ts
import { useState, useEffect, useCallback } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseFetchOptions {
  immediate?: boolean;
}

export const useFetch = <T>(
  url: string,
  options: UseFetchOptions = {}
) => {
  const { immediate = true } = options;
  
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  }, [url]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  return {
    ...state,
    refetch: fetchData,
    reset
  };
};
```

測試異步 Hook：

```typescript
// examples/hooks/useFetch.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFetch } from './useFetch';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初始狀態', () => {
    it('should start with initial state', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Test' })
      });
      
      const { result } = renderHook(() => 
        useFetch('/api/test', { immediate: false })
      );
      
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should start loading immediately by default', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Test' })
      });
      
      const { result } = renderHook(() => useFetch('/api/test'));
      
      expect(result.current.loading).toBe(true);
    });
  });

  describe('成功請求', () => {
    it('should fetch data successfully', async () => {
      const mockData = { id: 1, name: 'Test User' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });
      
      const { result } = renderHook(() => useFetch('/api/users/1'));
      
      expect(result.current.loading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/users/1');
    });
  });

  describe('錯誤處理', () => {
    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404
      });
      
      const { result } = renderHook(() => useFetch('/api/not-found'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useFetch('/api/test'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Network error');
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValue('Unknown error');
      
      const { result } = renderHook(() => useFetch('/api/test'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.error).toBe('An error occurred');
    });
  });

  describe('refetch 功能', () => {
    it('should refetch data when refetch is called', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });
      
      const { result } = renderHook(() => 
        useFetch('/api/test', { immediate: false })
      );
      
      expect(result.current.loading).toBe(false);
      
      // 手動觸發請求
      result.current.refetch();
      
      expect(result.current.loading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('reset 功能', () => {
    it('should reset state to initial values', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });
      
      const { result } = renderHook(() => useFetch('/api/test'));
      
      // 等待資料載入
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });
      
      // 重置狀態
      result.current.reset();
      
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('URL 變化', () => {
    it('should refetch when URL changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });
      
      const { result, rerender } = renderHook(
        ({ url }) => useFetch(url),
        { initialProps: { url: '/api/test1' } }
      );
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/test1');
      
      // 改變 URL
      rerender({ url: '/api/test2' });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/test2');
      });
    });
  });
});
```

## 常見問題

### Q1: 什麼時候使用 `act`？
A: 當你的操作會導致狀態更新時，需要使用 `act` 包裝：

```typescript
// 需要 act
act(() => {
  result.current.increment();
});

// 不需要 act（只是讀取值）
expect(result.current.count).toBe(1);
```

### Q2: 如何測試依賴其他 Hook 的自定義 Hook？
A: 可以 mock 依賴的 Hook 或提供測試用的實現：

```typescript
// Mock useEffect
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useEffect: vi.fn()
  };
});
```

### Q3: 如何測試 Hook 的清理函數？
A: 使用 `unmount` 方法：

```typescript
const { result, unmount } = renderHook(() => useMyHook());

// 測試清理
unmount();
```

### Q4: 如何測試條件性的 Hook 調用？
A: 使用 `rerender` 來改變 Hook 的條件：

```typescript
const { result, rerender } = renderHook(
  ({ shouldUse }) => shouldUse ? useMyHook() : null,
  { initialProps: { shouldUse: false } }
);

rerender({ shouldUse: true });
```

## 練習題

### 練習 1: useToggle Hook
創建一個切換布林值的 Hook，包含：
- 初始值設定
- toggle 功能
- setTrue/setFalse 功能

### 練習 2: useDebounce Hook
創建一個防抖 Hook，包含：
- 延遲更新值
- 可配置延遲時間
- 清理函數

### 練習 3: useApi Hook
創建一個通用 API Hook，包含：
- GET/POST/PUT/DELETE 方法
- 載入狀態管理
- 錯誤處理
- 快取功能

## 延伸閱讀

- [React Testing Library renderHook](https://testing-library.com/docs/react-testing-library/api#renderhook)
- [Testing Custom Hooks](https://kentcdodds.com/blog/how-to-test-custom-react-hooks)
- [React Hooks Testing Guide](https://react-hooks-testing-library.com/)
- [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html)

## 本日重點回顧

1. **renderHook** - 提供獨立的 Hook 測試環境
2. **act** - 包裝會引起狀態更新的操作
3. **async/await** - 處理異步 Hook 的測試
4. **mock** - 模擬外部依賴（API、localStorage 等）
5. **rerender/unmount** - 測試 Hook 的生命週期
6. **測試行為而非實現** - 關注 Hook 的輸入輸出，不關注內部實現

明天我們將學習更多關於斷言和匹配器的知識，讓我們的測試更加精確和表達力更強！
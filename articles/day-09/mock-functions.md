# Day 9: Mock 技巧 - Vitest Mock Functions

## 學習目標
- 掌握 Vitest Mock Functions 的基本用法
- 學會模擬外部 API 和第三方套件
- 了解不同的 Mock 策略和最佳實踐
- 能夠有效測試複雜的依賴關係

## 概念說明

Mock 是測試中的重要概念，它允許我們：
1. **隔離測試單位**：專注於測試特定功能而不受外部依賴影響
2. **控制測試環境**：模擬各種情況，包括錯誤狀態
3. **提高測試速度**：避免真實的 API 呼叫或複雜運算
4. **增加測試穩定性**：消除網路或外部服務的不確定性

### Vitest Mock 類型

1. **Function Mocks** - `vi.fn()`
2. **Module Mocks** - `vi.mock()`
3. **Timer Mocks** - `vi.useFakeTimers()`
4. **Implementation Mocks** - `vi.mocked()`

## 實作範例

### 基礎 Mock Functions

```typescript
// utils/calculator.ts
export const calculator = {
  add: (a: number, b: number): number => a + b,
  subtract: (a: number, b: number): number => a - b,
  multiply: (a: number, b: number): number => a * b,
  divide: (a: number, b: number): number => {
    if (b === 0) throw new Error('Division by zero');
    return a / b;
  }
};

export const asyncCalculate = async (
  operation: keyof typeof calculator,
  a: number,
  b: number
): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return calculator[operation](a, b);
};
```

```typescript
// utils/__tests__/calculator.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculator, asyncCalculate } from '../calculator';

describe('Calculator Mock Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should mock individual functions', () => {
    // 建立 Mock function
    const mockAdd = vi.fn();
    mockAdd.mockReturnValue(10);

    // 替換原始函數
    calculator.add = mockAdd;

    const result = calculator.add(5, 3);

    expect(result).toBe(10);
    expect(mockAdd).toHaveBeenCalledWith(5, 3);
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });

  it('should mock function with different return values', () => {
    const mockDivide = vi.fn();
    
    // 設定不同呼叫的返回值
    mockDivide
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(5)
      .mockReturnValue(0);

    expect(mockDivide()).toBe(2);
    expect(mockDivide()).toBe(5);
    expect(mockDivide()).toBe(0);
    expect(mockDivide()).toBe(0);
  });

  it('should mock function with implementation', () => {
    const mockMultiply = vi.fn().mockImplementation((a, b) => {
      console.log(`Multiplying ${a} * ${b}`);
      return a * b * 2; // 修改實現
    });

    const result = mockMultiply(3, 4);
    
    expect(result).toBe(24);
    expect(mockMultiply).toHaveBeenCalledWith(3, 4);
  });

  it('should mock async functions', async () => {
    // Mock 整個模組
    vi.spyOn(calculator, 'add').mockReturnValue(15);

    const result = await asyncCalculate('add', 10, 5);
    
    expect(result).toBe(15);
    expect(calculator.add).toHaveBeenCalledWith(10, 5);
  });
});
```

### 模擬 API 服務

```typescript
// services/userService.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export class UserService {
  private baseUrl = 'https://api.example.com';

  async getUser(id: number): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    
    return response.json();
  }

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
  }
}
```

```typescript
// services/__tests__/userService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../userService';

// Mock global fetch
global.fetch = vi.fn();

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    vi.resetAllMocks();
  });

  describe('getUser', () => {
    it('should fetch user successfully', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      };

      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockUser),
      });

      const user = await userService.getUser(1);

      expect(user).toEqual(mockUser);
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users/1');
    });

    it('should throw error when fetch fails', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(userService.getUser(999))
        .rejects.toThrow('HTTP error! status: 404');
    });

    it('should throw error when network fails', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(userService.getUser(1))
        .rejects.toThrow('Network error');
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };

      const createdUser = {
        id: 2,
        ...userData
      };

      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(createdUser),
      });

      const user = await userService.createUser(userData);

      expect(user).toEqual(createdUser);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        }
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      (fetch as any).mockResolvedValue({ ok: true });

      await expect(userService.deleteUser(1)).resolves.not.toThrow();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        { method: 'DELETE' }
      );
    });
  });
});
```

### 模擬第三方套件

```typescript
// components/NotificationComponent.tsx
import React from 'react';
import { toast } from 'react-toastify';
import { UserService } from '../services/userService';

interface NotificationComponentProps {
  userId: number;
}

export const NotificationComponent: React.FC<NotificationComponentProps> = ({ userId }) => {
  const userService = new UserService();

  const handleDeleteUser = async () => {
    try {
      await userService.deleteUser(userId);
      toast.success('User deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleShowInfo = () => {
    toast.info('This is an info message', {
      position: 'top-right',
      autoClose: 3000,
    });
  };

  return (
    <div>
      <button onClick={handleDeleteUser} data-testid="delete-button">
        Delete User
      </button>
      <button onClick={handleShowInfo} data-testid="info-button">
        Show Info
      </button>
    </div>
  );
};
```

```typescript
// components/__tests__/NotificationComponent.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationComponent } from '../NotificationComponent';
import { UserService } from '../../services/userService';

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock UserService
vi.mock('../../services/userService');

describe('NotificationComponent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should show success toast when user is deleted successfully', async () => {
    const mockDeleteUser = vi.fn().mockResolvedValue(undefined);
    
    // Mock UserService instance
    (UserService as any).mockImplementation(() => ({
      deleteUser: mockDeleteUser,
    }));

    const user = userEvent.setup();
    render(<NotificationComponent userId={1} />);

    const deleteButton = screen.getByTestId('delete-button');
    await user.click(deleteButton);

    expect(mockDeleteUser).toHaveBeenCalledWith(1);
    
    // 動態 import toast 來檢查調用
    const { toast } = await import('react-toastify');
    expect(toast.success).toHaveBeenCalledWith('User deleted successfully!');
  });

  it('should show error toast when delete fails', async () => {
    const mockDeleteUser = vi.fn().mockRejectedValue(new Error('Delete failed'));
    
    (UserService as any).mockImplementation(() => ({
      deleteUser: mockDeleteUser,
    }));

    const user = userEvent.setup();
    render(<NotificationComponent userId={1} />);

    const deleteButton = screen.getByTestId('delete-button');
    await user.click(deleteButton);

    const { toast } = await import('react-toastify');
    expect(toast.error).toHaveBeenCalledWith('Failed to delete user');
  });

  it('should show info toast with correct options', async () => {
    const user = userEvent.setup();
    render(<NotificationComponent userId={1} />);

    const infoButton = screen.getByTestId('info-button');
    await user.click(infoButton);

    const { toast } = await import('react-toastify');
    expect(toast.info).toHaveBeenCalledWith(
      'This is an info message',
      {
        position: 'top-right',
        autoClose: 3000,
      }
    );
  });
});
```

### 進階 Mock 技巧

```typescript
// hooks/useCounter.ts
import { useState, useCallback } from 'react';

export const useCounter = (initialValue: number = 0) => {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(prev => prev - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return {
    count,
    increment,
    decrement,
    reset,
  };
};
```

```typescript
// hooks/__tests__/useCounter.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    
    expect(result.current.count).toBe(0);
  });

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    
    expect(result.current.count).toBe(10);
  });

  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter(0));
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useCounter(5));
    
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

  it('should maintain function references with useCallback', () => {
    const { result, rerender } = renderHook(
      ({ initialValue }) => useCounter(initialValue),
      { initialProps: { initialValue: 0 } }
    );

    const firstIncrement = result.current.increment;
    const firstDecrement = result.current.decrement;

    rerender({ initialValue: 0 });

    // useCallback 確保函數引用穩定
    expect(result.current.increment).toBe(firstIncrement);
    expect(result.current.decrement).toBe(firstDecrement);
  });

  it('should create new reset function when initialValue changes', () => {
    const { result, rerender } = renderHook(
      ({ initialValue }) => useCounter(initialValue),
      { initialProps: { initialValue: 0 } }
    );

    const firstReset = result.current.reset;

    rerender({ initialValue: 10 });

    // initialValue 改變時，reset 函數應該更新
    expect(result.current.reset).not.toBe(firstReset);
  });
});
```

### Mock 時間相關功能

```typescript
// utils/timeUtils.ts
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const getCurrentTimestamp = (): number => {
  return Date.now();
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toISOString();
};
```

```typescript
// utils/__tests__/timeUtils.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { delay, getCurrentTimestamp, formatDate } from '../timeUtils';

describe('Time Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle delay with fake timers', async () => {
    const mockCallback = vi.fn();

    // 開始異步操作
    delay(1000).then(mockCallback);

    // 快進時間
    await vi.advanceTimersByTimeAsync(1000);

    expect(mockCallback).toHaveBeenCalled();
  });

  it('should mock current timestamp', () => {
    const mockDate = new Date('2023-01-01T00:00:00.000Z');
    vi.setSystemTime(mockDate);

    const timestamp = getCurrentTimestamp();
    
    expect(timestamp).toBe(mockDate.getTime());
  });

  it('should format date consistently', () => {
    const fixedTimestamp = 1672531200000; // 2023-01-01T00:00:00.000Z
    
    const formatted = formatDate(fixedTimestamp);
    
    expect(formatted).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should test multiple timer operations', async () => {
    const results: number[] = [];
    
    // 設定多個定時器
    setTimeout(() => results.push(1), 100);
    setTimeout(() => results.push(2), 200);
    setTimeout(() => results.push(3), 300);

    // 分步快進時間
    await vi.advanceTimersByTimeAsync(150);
    expect(results).toEqual([1]);

    await vi.advanceTimersByTimeAsync(100);
    expect(results).toEqual([1, 2]);

    await vi.advanceTimersByTimeAsync(100);
    expect(results).toEqual([1, 2, 3]);
  });
});
```

## 常見問題

### Q: 何時應該使用 Mock？

**A:** 
1. 測試外部依賴（API、資料庫、檔案系統）
2. 模擬難以重現的情況（錯誤狀態、網路問題）
3. 隔離測試單位，專注於特定邏輯
4. 加速測試執行

### Q: Mock 和 Spy 有什麼區別？

**A:**
- **Mock**：完全替換原始函數的實現
- **Spy**：監視原始函數的調用，但保留原始實現

```typescript
// Mock - 替換實現
const mockFn = vi.fn().mockReturnValue(42);

// Spy - 監視原始函數
const spyFn = vi.spyOn(obj, 'method');
```

### Q: 如何避免過度 Mocking？

**A:**
1. 只 Mock 必要的外部依賴
2. 優先測試真實的實現
3. 避免 Mock 複雜的業務邏輯
4. 定期檢查 Mock 是否還需要

## 練習題

### 練習 1：Mock HTTP Client
創建一個 HTTP 客戶端類，並撰寫測試：
- Mock axios 或 fetch
- 測試不同的 HTTP 方法
- 處理各種錯誤情況

### 練習 2：Mock 瀏覽器 API
測試使用瀏覽器 API 的功能：
- LocalStorage
- Geolocation
- Notification API

### 練習 3：Mock 複雜依賴
創建一個依賴多個服務的業務邏輯，練習：
- 部分 Mock
- 依賴注入
- Mock 鏈式調用

## 延伸閱讀

- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Testing with Mocks](https://martinfowler.com/articles/mocksArentStubs.html)
- [Mock Functions Best Practices](https://jestjs.io/docs/mock-function-api)
- [When to Mock](https://kentcdodds.com/blog/the-merits-of-mocking)

## 本日重點回顧

1. **Mock 的目的**：隔離、控制、加速測試
2. **Vitest Mock 類型**：函數、模組、時間 Mock
3. **最佳實踐**：適度使用、清理 Mock、測試真實場景
4. **進階技巧**：Spy、假時間、複雜依賴處理
5. **測試策略**：平衡 Mock 使用與真實測試

明天我們將學習 Context API 測試，了解如何測試 React 的狀態管理機制。
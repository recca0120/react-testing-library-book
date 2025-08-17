# Day 8: 非同步測試 - waitFor 與 findBy

## 學習目標
- 理解非同步測試的必要性和挑戰
- 掌握 waitFor 和 findBy 的使用方法
- 學會測試 API 呼叫和 loading 狀態
- 了解如何處理不同的非同步場景

## 概念說明

在現代 React 應用程式中，非同步操作無處不在：API 呼叫、使用者互動後的狀態更新、動態載入內容等。這些非同步操作使得測試變得複雜，因為我們需要等待某些變化發生。

### 非同步測試的挑戰

1. **時間不確定性**：不知道非同步操作何時完成
2. **狀態變化**：元件狀態可能在多個時間點發生變化
3. **錯誤處理**：需要測試成功和失敗的情況

### waitFor vs findBy

- **waitFor**：等待條件滿足，適合複雜的等待邏輯
- **findBy**：等待元素出現，適合簡單的元素查詢

## 實作範例

### 基礎非同步元件

```typescript
// components/AsyncUserProfile.tsx
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AsyncUserProfileProps {
  userId: number;
}

export const AsyncUserProfile: React.FC<AsyncUserProfileProps> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }

  if (error) {
    return <div data-testid="error">Error: {error}</div>;
  }

  return (
    <div data-testid="user-profile">
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
    </div>
  );
};
```

### 測試非同步元件

```typescript
// components/__tests__/AsyncUserProfile.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AsyncUserProfile } from '../AsyncUserProfile';

// Mock fetch
global.fetch = vi.fn();

describe('AsyncUserProfile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should show loading state initially', () => {
    // Mock pending promise
    (fetch as any).mockImplementation(() => new Promise(() => {}));

    render(<AsyncUserProfile userId={1} />);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should display user data when fetch succeeds', async () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com'
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });

    render(<AsyncUserProfile userId={1} />);

    // 使用 findBy - 自動等待元素出現
    const userProfile = await screen.findByTestId('user-profile');
    expect(userProfile).toBeInTheDocument();
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should display error when fetch fails', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    render(<AsyncUserProfile userId={1} />);

    // 使用 waitFor 等待錯誤狀態
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    expect(screen.getByText(/Error: Network error/)).toBeInTheDocument();
  });

  it('should handle HTTP error responses', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    });

    render(<AsyncUserProfile userId={999} />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    expect(screen.getByText(/Error: Failed to fetch user/)).toBeInTheDocument();
  });
});
```

### 測試搜尋功能

```typescript
// components/SearchUsers.tsx
import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';

interface User {
  id: number;
  name: string;
  email: string;
}

export const SearchUsers: React.FC = () => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError('Search failed');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce(searchUsers, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={handleInputChange}
        data-testid="search-input"
      />
      
      {loading && <div data-testid="search-loading">Searching...</div>}
      
      {error && <div data-testid="search-error">{error}</div>}
      
      <div data-testid="search-results">
        {users.map(user => (
          <div key={user.id} data-testid={`user-${user.id}`}>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 測試搜尋功能

```typescript
// components/__tests__/SearchUsers.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchUsers } from '../SearchUsers';

// Mock fetch 和 lodash debounce
global.fetch = vi.fn();
vi.mock('lodash', () => ({
  debounce: (fn: Function) => fn, // 測試時不使用 debounce
}));

describe('SearchUsers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should search users when typing in input', async () => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Doe', email: 'jane@example.com' }
    ];

    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockUsers,
    });

    const user = userEvent.setup();
    render(<SearchUsers />);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'doe');

    // 等待搜尋結果出現
    await waitFor(() => {
      expect(screen.getByTestId('user-1')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/users/search?q=doe');
  });

  it('should show loading state during search', async () => {
    // Mock slow response
    (fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    const user = userEvent.setup();
    render(<SearchUsers />);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'test');

    // 檢查 loading 狀態
    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
  });

  it('should handle search errors', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    const user = userEvent.setup();
    render(<SearchUsers />);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'test');

    await waitFor(() => {
      expect(screen.getByTestId('search-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Search failed')).toBeInTheDocument();
  });

  it('should not search with empty query', async () => {
    const user = userEvent.setup();
    render(<SearchUsers />);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, '   '); // 只有空格

    await waitFor(() => {
      expect(fetch).not.toHaveBeenCalled();
    });

    const results = screen.getByTestId('search-results');
    expect(results).toBeEmptyDOMElement();
  });
});
```

### waitFor 進階用法

```typescript
// components/__tests__/AdvancedAsyncTest.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Advanced waitFor usage', () => {
  it('should use waitFor with custom timeout', async () => {
    // Mock 慢速 API
    global.fetch = vi.fn().mockImplementation(() =>
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ data: 'slow response' })
        }), 2000)
      )
    );

    render(<AsyncComponent />);

    // 自定義超時時間
    await waitFor(
      () => {
        expect(screen.getByText('slow response')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should use waitFor with custom interval', async () => {
    let callCount = 0;
    const mockCheck = vi.fn(() => {
      callCount++;
      return callCount >= 3;
    });

    render(<TestComponent />);

    await waitFor(
      () => {
        expect(mockCheck()).toBe(true);
      },
      { 
        interval: 100, // 每 100ms 檢查一次
        timeout: 1000 
      }
    );

    expect(callCount).toBeGreaterThanOrEqual(3);
  });

  it('should wait for multiple conditions', async () => {
    render(<ComplexComponent />);

    await waitFor(() => {
      // 等待多個條件同時滿足
      expect(screen.getByTestId('condition-1')).toBeInTheDocument();
      expect(screen.getByTestId('condition-2')).toBeInTheDocument();
      expect(screen.getByTestId('condition-3')).toHaveClass('active');
    });
  });

  it('should use waitForElementToBeRemoved', async () => {
    render(<ComponentWithRemoval />);
    
    const elementToRemove = screen.getByTestId('temporary-element');
    
    // 觸發移除操作
    const removeButton = screen.getByRole('button', { name: /remove/i });
    await userEvent.click(removeButton);

    // 等待元素被移除
    await waitForElementToBeRemoved(elementToRemove);
  });
});
```

## 常見問題

### Q: 什麼時候使用 findBy，什麼時候使用 waitFor？

**A:** 
- 使用 `findBy` 當你等待單一元素出現時
- 使用 `waitFor` 當你需要等待複雜條件或多個斷言時

```typescript
// 適合使用 findBy
const element = await screen.findByText('Success message');

// 適合使用 waitFor
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
  expect(screen.getByTestId('icon')).toHaveClass('success');
});
```

### Q: 如何處理不穩定的非同步測試？

**A:** 
1. 適當設置 timeout
2. 使用正確的查詢方法
3. Mock 外部依賴
4. 避免使用固定的延遲時間

```typescript
// ❌ 不穩定
await new Promise(resolve => setTimeout(resolve, 100));

// ✅ 穩定
await waitFor(() => {
  expect(screen.getByTestId('result')).toBeInTheDocument();
});
```

### Q: 如何測試載入狀態的消失？

**A:** 使用 `waitForElementToBeRemoved` 或在 `waitFor` 中檢查元素不存在：

```typescript
// 方法 1
await waitForElementToBeRemoved(screen.queryByTestId('loading'));

// 方法 2
await waitFor(() => {
  expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
});
```

## 練習題

### 練習 1：測試分頁載入
創建一個支援分頁的用戶列表元件，並撰寫測試驗證：
- 初始載入第一頁數據
- 點擊下一頁按鈕載入新數據
- 載入過程中顯示 loading 狀態

### 練習 2：測試無限捲動
實現一個無限捲動的新聞列表，測試：
- 捲動到底部時載入更多內容
- 載入失敗時的錯誤處理
- 沒有更多內容時的提示

### 練習 3：測試實時更新
創建一個聊天室元件，測試：
- 新訊息的即時顯示
- 連線狀態的變化
- 重連機制

## 延伸閱讀

- [Testing Library Async Utilities](https://testing-library.com/docs/dom-testing-library/api-async/)
- [Common mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Fix the "not wrapped in act(...)" warning](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning)
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)

## 本日重點回顧

1. **非同步測試的重要性**：現代應用中非同步操作無處不在
2. **waitFor vs findBy**：選擇合適的等待方法
3. **Mock 的運用**：模擬 API 回應和外部依賴
4. **錯誤處理測試**：確保應用在失敗情況下的正確行為
5. **載入狀態測試**：驗證使用者體驗的完整性

明天我們將學習 Mock 技巧，深入了解如何在測試中模擬各種依賴和外部服務。
# Day 5: 測試元件狀態與 Props

## 學習目標

- 學會測試元件的 Props 傳遞和處理
- 掌握元件內部狀態變化的測試方法
- 了解條件渲染的測試技巧
- 學習測試元件間的資料傳遞

## 概念說明

在 React 應用中，元件的行為主要由兩個因素決定：
1. **Props** - 從父元件傳入的資料
2. **State** - 元件內部管理的狀態

測試這兩個方面有助於確保：
- 元件能正確接收和處理外部資料
- 元件內部狀態管理邏輯正確
- 元件在不同狀態下的渲染行為符合預期
- 父子元件間的資料流正常運作

## 實作範例

### Props 測試基礎

首先創建一個使用者資訊卡片元件：

```typescript
// examples/state-props/UserCard.tsx
import React from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
}

interface UserCardProps {
  user: User;
  showEmail?: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (userId: number) => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  showEmail = true,
  onEdit,
  onDelete,
  className
}) => {
  return (
    <div className={`user-card ${className || ''}`} data-testid="user-card">
      <div className="user-avatar">
        {user.avatar ? (
          <img src={user.avatar} alt={`${user.name}'s avatar`} />
        ) : (
          <div className="avatar-placeholder" data-testid="avatar-placeholder">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        {user.isOnline && (
          <span className="online-indicator" data-testid="online-indicator">
            🟢
          </span>
        )}
      </div>
      
      <div className="user-info">
        <h3 data-testid="user-name">{user.name}</h3>
        {showEmail && (
          <p data-testid="user-email">{user.email}</p>
        )}
      </div>
      
      <div className="user-actions">
        {onEdit && (
          <button 
            onClick={() => onEdit(user)}
            data-testid="edit-button"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button 
            onClick={() => onDelete(user.id)}
            data-testid="delete-button"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
```

測試 Props 的各種情況：

```typescript
// examples/state-props/UserCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserCard } from './UserCard';

const mockUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://example.com/avatar.jpg',
  isOnline: true
};

describe('UserCard', () => {
  describe('Props 渲染測試', () => {
    it('should render user name and email', () => {
      render(<UserCard user={mockUser} />);
      
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('user-email')).toHaveTextContent('john@example.com');
    });

    it('should render user avatar when provided', () => {
      render(<UserCard user={mockUser} />);
      
      const avatar = screen.getByAltText("John Doe's avatar");
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should render avatar placeholder when no avatar provided', () => {
      const userWithoutAvatar = { ...mockUser, avatar: undefined };
      render(<UserCard user={userWithoutAvatar} />);
      
      const placeholder = screen.getByTestId('avatar-placeholder');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveTextContent('J'); // First letter of name
      
      // 確認沒有 img 元素
      expect(screen.queryByAltText("John Doe's avatar")).not.toBeInTheDocument();
    });

    it('should show online indicator when user is online', () => {
      render(<UserCard user={mockUser} />);
      
      expect(screen.getByTestId('online-indicator')).toBeInTheDocument();
    });

    it('should not show online indicator when user is offline', () => {
      const offlineUser = { ...mockUser, isOnline: false };
      render(<UserCard user={offlineUser} />);
      
      expect(screen.queryByTestId('online-indicator')).not.toBeInTheDocument();
    });

    it('should hide email when showEmail is false', () => {
      render(<UserCard user={mockUser} showEmail={false} />);
      
      expect(screen.getByTestId('user-name')).toBeInTheDocument();
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<UserCard user={mockUser} className="custom-style" />);
      
      const card = screen.getByTestId('user-card');
      expect(card).toHaveClass('user-card');
      expect(card).toHaveClass('custom-style');
    });
  });

  describe('回調函數測試', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<UserCard user={mockUser} onEdit={onEdit} />);
      
      const editButton = screen.getByTestId('edit-button');
      await user.click(editButton);
      
      expect(onEdit).toHaveBeenCalledWith(mockUser);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<UserCard user={mockUser} onDelete={onDelete} />);
      
      const deleteButton = screen.getByTestId('delete-button');
      await user.click(deleteButton);
      
      expect(onDelete).toHaveBeenCalledWith(mockUser.id);
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('should not render action buttons when callbacks are not provided', () => {
      render(<UserCard user={mockUser} />);
      
      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
    });
  });
});
```

### 狀態測試範例

創建一個有複雜狀態管理的計數器元件：

```typescript
// examples/state-props/AdvancedCounter.tsx
import React, { useState, useEffect } from 'react';

interface AdvancedCounterProps {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  autoIncrement?: boolean;
  autoIncrementInterval?: number;
}

export const AdvancedCounter: React.FC<AdvancedCounterProps> = ({
  initialValue = 0,
  min = -Infinity,
  max = Infinity,
  step = 1,
  onValueChange,
  autoIncrement = false,
  autoIncrementInterval = 1000
}) => {
  const [count, setCount] = useState(initialValue);
  const [isRunning, setIsRunning] = useState(autoIncrement);
  const [history, setHistory] = useState<number[]>([initialValue]);

  useEffect(() => {
    onValueChange?.(count);
  }, [count, onValueChange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setCount(prevCount => {
          const newValue = prevCount + step;
          if (newValue <= max) {
            setHistory(prev => [...prev, newValue]);
            return newValue;
          }
          setIsRunning(false);
          return prevCount;
        });
      }, autoIncrementInterval);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, step, max, autoIncrementInterval]);

  const handleIncrement = () => {
    if (count + step <= max) {
      const newValue = count + step;
      setCount(newValue);
      setHistory(prev => [...prev, newValue]);
    }
  };

  const handleDecrement = () => {
    if (count - step >= min) {
      const newValue = count - step;
      setCount(newValue);
      setHistory(prev => [...prev, newValue]);
    }
  };

  const handleReset = () => {
    setCount(initialValue);
    setHistory([initialValue]);
    setIsRunning(false);
  };

  const toggleAutoIncrement = () => {
    setIsRunning(!isRunning);
  };

  const canIncrement = count + step <= max;
  const canDecrement = count - step >= min;

  return (
    <div data-testid="advanced-counter">
      <div>
        <span data-testid="count-value">Count: {count}</span>
        <span data-testid="count-status">
          {count === max ? ' (MAX)' : count === min ? ' (MIN)' : ''}
        </span>
      </div>
      
      <div>
        <button 
          onClick={handleDecrement} 
          disabled={!canDecrement}
          data-testid="decrement-button"
        >
          -
        </button>
        <button 
          onClick={handleIncrement} 
          disabled={!canIncrement}
          data-testid="increment-button"
        >
          +
        </button>
        <button onClick={handleReset} data-testid="reset-button">
          Reset
        </button>
      </div>
      
      <div>
        <button 
          onClick={toggleAutoIncrement}
          data-testid="toggle-auto-button"
        >
          {isRunning ? 'Stop' : 'Start'} Auto
        </button>
        {isRunning && <span data-testid="running-indicator">⏱️</span>}
      </div>
      
      <div>
        <p data-testid="history-count">History: {history.length} changes</p>
        <details>
          <summary>View History</summary>
          <ul data-testid="history-list">
            {history.map((value, index) => (
              <li key={index}>{value}</li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
};
```

測試狀態變化：

```typescript
// examples/state-props/AdvancedCounter.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvancedCounter } from './AdvancedCounter';

describe('AdvancedCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('初始狀態測試', () => {
    it('should render with default initial value', () => {
      render(<AdvancedCounter />);
      
      expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 0');
      expect(screen.getByTestId('history-count')).toHaveTextContent('History: 1 changes');
    });

    it('should render with custom initial value', () => {
      render(<AdvancedCounter initialValue={5} />);
      
      expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 5');
    });

    it('should call onValueChange with initial value', () => {
      const onValueChange = vi.fn();
      render(<AdvancedCounter initialValue={3} onValueChange={onValueChange} />);
      
      expect(onValueChange).toHaveBeenCalledWith(3);
    });
  });

  describe('基本操作測試', () => {
    it('should increment count when increment button is clicked', async () => {
      const user = userEvent.setup();
      render(<AdvancedCounter />);
      
      const incrementButton = screen.getByTestId('increment-button');
      await user.click(incrementButton);
      
      expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 1');
      expect(screen.getByTestId('history-count')).toHaveTextContent('History: 2 changes');
    });

    it('should decrement count when decrement button is clicked', async () => {
      const user = userEvent.setup();
      render(<AdvancedCounter initialValue={5} />);
      
      const decrementButton = screen.getByTestId('decrement-button');
      await user.click(decrementButton);
      
      expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 4');
    });

    it('should reset count to initial value', async () => {
      const user = userEvent.setup();
      render(<AdvancedCounter initialValue={3} />);
      
      // 先改變值
      await user.click(screen.getByTestId('increment-button'));
      await user.click(screen.getByTestId('increment-button'));
      expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 5');
      
      // 重置
      await user.click(screen.getByTestId('reset-button'));
      expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 3');
      expect(screen.getByTestId('history-count')).toHaveTextContent('History: 1 changes');
    });
  });

  describe('邊界條件測試', () => {
    it('should respect max value limit', async () => {
      const user = userEvent.setup();
      render(<AdvancedCounter initialValue={9} max={10} />);
      
      const incrementButton = screen.getByTestId('increment-button');
      
      // 增加到最大值
      await user.click(incrementButton);
      expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 10');
      expect(screen.getByTestId('count-status')).toHaveTextContent(' (MAX)');
      
      // 按鈕應該被禁用
      expect(incrementButton).toBeDisabled();
      
      // 再次點擊不應該增加
      await user.click(incrementButton);
      expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 10');
    });

    it('should respect min value limit', async () => {
      const user = userEvent.setup();
      render(<AdvancedCounter initialValue={1} min={0} />);
      
      const decrementButton = screen.getByTestId('decrement-button');
      
      // 減少到最小值
      await user.click(decrementButton);
      expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 0');
      expect(screen.getByTestId('count-status')).toHaveTextContent(' (MIN)');
      
      // 按鈕應該被禁用
      expect(decrementButton).toBeDisabled();
    });

    it('should use custom step value', async () => {
      const user = userEvent.setup();
      render(<AdvancedCounter step={5} />);
      
      await user.click(screen.getByTestId('increment-button'));
      expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 5');
      
      await user.click(screen.getByTestId('decrement-button'));
      expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 0');
    });
  });

  describe('自動增加功能測試', () => {
    it('should start auto increment when enabled', async () => {
      const user = userEvent.setup();
      render(<AdvancedCounter autoIncrementInterval={100} />);
      
      const toggleButton = screen.getByTestId('toggle-auto-button');
      
      // 開始自動增加
      await user.click(toggleButton);
      expect(screen.getByTestId('running-indicator')).toBeInTheDocument();
      expect(toggleButton).toHaveTextContent('Stop Auto');
      
      // 等待自動增加
      vi.advanceTimersByTime(100);
      await waitFor(() => {
        expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 1');
      });
      
      vi.advanceTimersByTime(100);
      await waitFor(() => {
        expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 2');
      });
    });

    it('should stop auto increment when reaching max value', async () => {
      const user = userEvent.setup();
      render(<AdvancedCounter initialValue={9} max={10} autoIncrementInterval={100} />);
      
      const toggleButton = screen.getByTestId('toggle-auto-button');
      
      await user.click(toggleButton);
      
      // 應該增加到最大值然後停止
      vi.advanceTimersByTime(100);
      await waitFor(() => {
        expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 10');
      });
      
      await waitFor(() => {
        expect(toggleButton).toHaveTextContent('Start Auto');
        expect(screen.queryByTestId('running-indicator')).not.toBeInTheDocument();
      });
    });

    it('should start with auto increment when autoIncrement prop is true', () => {
      render(<AdvancedCounter autoIncrement={true} />);
      
      expect(screen.getByTestId('running-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-auto-button')).toHaveTextContent('Stop Auto');
    });
  });

  describe('歷史記錄測試', () => {
    it('should track value changes in history', async () => {
      const user = userEvent.setup();
      render(<AdvancedCounter />);
      
      // 進行一些操作
      await user.click(screen.getByTestId('increment-button'));
      await user.click(screen.getByTestId('increment-button'));
      await user.click(screen.getByTestId('decrement-button'));
      
      expect(screen.getByTestId('history-count')).toHaveTextContent('History: 4 changes');
      
      // 檢查歷史列表
      const historyList = screen.getByTestId('history-list');
      const historyItems = historyList.querySelectorAll('li');
      
      expect(historyItems).toHaveLength(4);
      expect(historyItems[0]).toHaveTextContent('0'); // 初始值
      expect(historyItems[1]).toHaveTextContent('1'); // +1
      expect(historyItems[2]).toHaveTextContent('2'); // +1
      expect(historyItems[3]).toHaveTextContent('1'); // -1
    });
  });

  describe('回調函數測試', () => {
    it('should call onValueChange when value changes', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<AdvancedCounter onValueChange={onValueChange} />);
      
      await user.click(screen.getByTestId('increment-button'));
      
      expect(onValueChange).toHaveBeenCalledWith(1);
      expect(onValueChange).toHaveBeenCalledTimes(2); // 初始值 + 改變後的值
    });
  });
});
```

### 條件渲染測試

創建一個展示不同狀態的元件：

```typescript
// examples/state-props/StatusDisplay.tsx
import React from 'react';

type Status = 'loading' | 'success' | 'error' | 'empty';

interface StatusDisplayProps {
  status: Status;
  data?: any[];
  error?: string;
  onRetry?: () => void;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
  status,
  data,
  error,
  onRetry
}) => {
  if (status === 'loading') {
    return (
      <div data-testid="loading-state">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div data-testid="error-state">
        <h3>Something went wrong</h3>
        <p data-testid="error-message">{error || 'An unknown error occurred'}</p>
        {onRetry && (
          <button onClick={onRetry} data-testid="retry-button">
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (status === 'empty' || !data || data.length === 0) {
    return (
      <div data-testid="empty-state">
        <p>No data available</p>
      </div>
    );
  }

  // status === 'success' 且有資料
  return (
    <div data-testid="success-state">
      <h3>Data loaded successfully</h3>
      <ul data-testid="data-list">
        {data.map((item, index) => (
          <li key={index} data-testid={`data-item-${index}`}>
            {typeof item === 'string' ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
      <p data-testid="data-count">Total items: {data.length}</p>
    </div>
  );
};
```

```typescript
// examples/state-props/StatusDisplay.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusDisplay } from './StatusDisplay';

describe('StatusDisplay', () => {
  describe('載入狀態', () => {
    it('should show loading state', () => {
      render(<StatusDisplay status="loading" />);
      
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // 其他狀態不應該出現
      expect(screen.queryByTestId('success-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  describe('錯誤狀態', () => {
    it('should show error state with default message', () => {
      render(<StatusDisplay status="error" />);
      
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('An unknown error occurred');
    });

    it('should show error state with custom message', () => {
      render(<StatusDisplay status="error" error="Network connection failed" />);
      
      expect(screen.getByTestId('error-message')).toHaveTextContent('Network connection failed');
    });

    it('should show retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<StatusDisplay status="error" onRetry={onRetry} />);
      
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('should not show retry button when onRetry is not provided', () => {
      render(<StatusDisplay status="error" />);
      
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      render(<StatusDisplay status="error" onRetry={onRetry} />);
      
      await user.click(screen.getByTestId('retry-button'));
      
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('空資料狀態', () => {
    it('should show empty state when status is empty', () => {
      render(<StatusDisplay status="empty" />);
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should show empty state when data is undefined', () => {
      render(<StatusDisplay status="success" data={undefined} />);
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should show empty state when data is empty array', () => {
      render(<StatusDisplay status="success" data={[]} />);
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  describe('成功狀態', () => {
    it('should show success state with data', () => {
      const mockData = ['Item 1', 'Item 2', 'Item 3'];
      render(<StatusDisplay status="success" data={mockData} />);
      
      expect(screen.getByTestId('success-state')).toBeInTheDocument();
      expect(screen.getByText('Data loaded successfully')).toBeInTheDocument();
      expect(screen.getByTestId('data-count')).toHaveTextContent('Total items: 3');
    });

    it('should render all data items', () => {
      const mockData = ['Apple', 'Banana', 'Cherry'];
      render(<StatusDisplay status="success" data={mockData} />);
      
      const dataList = screen.getByTestId('data-list');
      expect(dataList).toBeInTheDocument();
      
      mockData.forEach((item, index) => {
        expect(screen.getByTestId(`data-item-${index}`)).toHaveTextContent(item);
      });
    });

    it('should handle object data', () => {
      const mockData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ];
      render(<StatusDisplay status="success" data={mockData} />);
      
      expect(screen.getByTestId('data-item-0')).toHaveTextContent('{"id":1,"name":"John"}');
      expect(screen.getByTestId('data-item-1')).toHaveTextContent('{"id":2,"name":"Jane"}');
    });
  });
});
```

## 常見問題

### Q1: 如何測試複雜的 Props 物件？
A: 可以分別測試物件的各個屬性，或使用自定義匹配器：

```typescript
// 分別測試屬性
expect(screen.getByTestId('user-name')).toHaveTextContent(user.name);
expect(screen.getByTestId('user-email')).toHaveTextContent(user.email);

// 使用 toHaveBeenCalledWith 測試整個物件
expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({
  id: 1,
  name: 'John Doe'
}));
```

### Q2: 如何測試元件的內部狀態而不暴露實現細節？
A: 通過測試輸出結果而非內部狀態：

```typescript
// 好的做法：測試輸出
await user.click(incrementButton);
expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 1');

// 避免：測試內部狀態實現
// 不要嘗試直接訪問元件的 state
```

### Q3: 如何測試條件渲染？
A: 分別測試每個條件分支：

```typescript
// 測試存在
expect(screen.getByTestId('loading-state')).toBeInTheDocument();

// 測試不存在
expect(screen.queryByTestId('success-state')).not.toBeInTheDocument();
```

### Q4: 如何測試異步狀態變化？
A: 使用 `waitFor` 或 `findBy` 等異步查詢：

```typescript
await waitFor(() => {
  expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 1');
});
```

## 練習題

### 練習 1: 購物車元件
創建一個購物車元件，包含：
- 商品列表顯示
- 數量增減功能
- 總價計算
- 清空購物車功能

測試各種 Props 和狀態變化。

### 練習 2: 分頁元件
創建一個分頁元件，包含：
- 當前頁數顯示
- 上一頁/下一頁按鈕
- 頁數跳轉
- 禁用狀態處理

### 練習 3: 搜尋結果元件
創建一個搜尋結果元件，需要處理：
- 載入狀態
- 搜尋結果顯示
- 無結果狀態
- 錯誤處理

## 延伸閱讀

- [React Testing Library 查詢指南](https://testing-library.com/docs/queries/about)
- [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
- [Common mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Props vs State in React](https://reactjs.org/docs/components-and-props.html)

## 本日重點回顧

1. **Props 測試** - 驗證元件能正確接收和處理外部資料
2. **條件渲染** - 測試不同 Props 值下的渲染結果
3. **狀態變化** - 通過使用者互動測試內部狀態變化
4. **邊界條件** - 測試最大值、最小值等邊界情況
5. **回調函數** - 使用 mock 函數驗證事件處理
6. **測試輸出而非實現** - 關注元件的行為而非內部實現細節

明天我們將學習如何測試自定義 Hooks，進一步深入 React 的測試技巧！
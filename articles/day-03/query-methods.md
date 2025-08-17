# Day 3: 基本查詢方法 - getBy, queryBy, findBy

## 學習目標

- 理解三種查詢方法的差異與使用時機
- 掌握各種查詢器的優先順序
- 學會處理多個元素的查詢
- 了解自定義查詢的方法

## 查詢方法概覽

React Testing Library 提供三種主要的查詢方法系列：

| 查詢類型 | 找不到元素 | 找到 1 個 | 找到多個 | 使用時機 |
|---------|-----------|----------|---------|---------|
| getBy... | 拋出錯誤 | 返回元素 | 拋出錯誤 | 元素應該存在 |
| queryBy... | 返回 null | 返回元素 | 拋出錯誤 | 元素可能不存在 |
| findBy... | 拋出錯誤 | 返回 Promise | 拋出錯誤 | 非同步元素 |

## getBy 查詢方法

### 使用時機
當你確定元素應該在 DOM 中時使用 `getBy`。如果找不到元素，測試會立即失敗。

### 範例元件

```typescript
// src/components/UserProfile.tsx
import React from 'react';

interface UserProfileProps {
  user: {
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
    isVerified: boolean;
  };
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p className="email">{user.email}</p>
      <span role="status" aria-label="user role">
        {user.role}
      </span>
      {user.isVerified && (
        <span className="badge" data-testid="verified-badge">
          ✓ Verified
        </span>
      )}
    </div>
  );
};
```

### 測試範例

```typescript
// src/components/UserProfile.test.tsx
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile - getBy queries', () => {
  const mockUser = {
    name: 'Alice Chen',
    email: 'alice@example.com',
    role: 'admin' as const,
    isVerified: true,
  };

  test('getByRole - 查詢語義化元素', () => {
    render(<UserProfile user={mockUser} />);
    
    // 查詢標題
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Alice Chen');
    
    // 查詢狀態元素
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('admin');
  });

  test('getByText - 查詢文字內容', () => {
    render(<UserProfile user={mockUser} />);
    
    // 完全匹配
    const email = screen.getByText('alice@example.com');
    expect(email).toHaveClass('email');
    
    // 部分匹配（使用正則）
    const name = screen.getByText(/alice chen/i);
    expect(name).toBeInTheDocument();
  });

  test('getByLabelText - 查詢表單相關元素', () => {
    render(<UserProfile user={mockUser} />);
    
    const roleStatus = screen.getByLabelText('user role');
    expect(roleStatus).toHaveTextContent('admin');
  });

  test('getByTestId - 最後手段', () => {
    render(<UserProfile user={mockUser} />);
    
    // 只在沒有更好選擇時使用
    const badge = screen.getByTestId('verified-badge');
    expect(badge).toHaveTextContent('✓ Verified');
  });
});
```

## queryBy 查詢方法

### 使用時機
當元素可能不存在，且你需要斷言其不存在時使用 `queryBy`。

### 範例元件

```typescript
// src/components/ConditionalContent.tsx
import React, { useState } from 'react';

export const ConditionalContent: React.FC = () => {
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleContent = () => {
    setShowContent(!showContent);
    setError(null);
  };

  const triggerError = () => {
    setError('Something went wrong!');
    setShowContent(false);
  };

  return (
    <div>
      <button onClick={toggleContent}>Toggle Content</button>
      <button onClick={triggerError}>Trigger Error</button>
      
      {showContent && (
        <div className="content">
          <h3>Dynamic Content</h3>
          <p>This content can be toggled on and off.</p>
        </div>
      )}
      
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
    </div>
  );
};
```

### 測試範例

```typescript
// src/components/ConditionalContent.test.tsx
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConditionalContent } from './ConditionalContent';

describe('ConditionalContent - queryBy queries', () => {
  test('queryBy 用於斷言元素不存在', () => {
    render(<ConditionalContent />);
    
    // 初始狀態：內容不應該存在
    const content = screen.queryByText('Dynamic Content');
    expect(content).not.toBeInTheDocument();
    
    // 錯誤訊息也不應該存在
    const error = screen.queryByRole('alert');
    expect(error).not.toBeInTheDocument();
  });

  test('元素出現後可以查詢到', async () => {
    const user = userEvent.setup();
    render(<ConditionalContent />);
    
    // 點擊前確認不存在
    expect(screen.queryByText('Dynamic Content')).not.toBeInTheDocument();
    
    // 點擊顯示內容
    await user.click(screen.getByText('Toggle Content'));
    
    // 現在應該存在
    expect(screen.queryByText('Dynamic Content')).toBeInTheDocument();
  });

  test('切換狀態時正確顯示/隱藏', async () => {
    const user = userEvent.setup();
    render(<ConditionalContent />);
    
    const toggleButton = screen.getByText('Toggle Content');
    
    // 顯示內容
    await user.click(toggleButton);
    expect(screen.queryByText('Dynamic Content')).toBeInTheDocument();
    
    // 隱藏內容
    await user.click(toggleButton);
    expect(screen.queryByText('Dynamic Content')).not.toBeInTheDocument();
  });
});
```

## findBy 查詢方法

### 使用時機
當元素會非同步出現在 DOM 中時使用 `findBy`。它返回一個 Promise，會等待元素出現。

### 範例元件

```typescript
// src/components/AsyncDataLoader.tsx
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

export const AsyncDataLoader: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模擬資料
      const mockUsers: User[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ];
      
      setUsers(mockUsers);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchUsers}>Load Users</button>
      
      {loading && <p role="status">Loading...</p>}
      
      {error && <p role="alert">{error}</p>}
      
      {users.length > 0 && (
        <ul aria-label="users list">
          {users.map(user => (
            <li key={user.id}>
              <strong>{user.name}</strong> - {user.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### 測試範例

```typescript
// src/components/AsyncDataLoader.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AsyncDataLoader } from './AsyncDataLoader';

describe('AsyncDataLoader - findBy queries', () => {
  test('findBy 等待非同步元素出現', async () => {
    const user = userEvent.setup();
    render(<AsyncDataLoader />);
    
    // 點擊載入按鈕
    await user.click(screen.getByText('Load Users'));
    
    // findBy 會等待元素出現（預設 timeout 1000ms）
    const usersList = await screen.findByLabelText('users list');
    expect(usersList).toBeInTheDocument();
    
    // 驗證使用者資料
    expect(await screen.findByText(/John Doe/)).toBeInTheDocument();
    expect(await screen.findByText(/Jane Smith/)).toBeInTheDocument();
  });

  test('findBy 可設定自定義 timeout', async () => {
    const user = userEvent.setup();
    render(<AsyncDataLoader />);
    
    await user.click(screen.getByText('Load Users'));
    
    // 設定較長的 timeout
    const usersList = await screen.findByLabelText('users list', {}, {
      timeout: 3000
    });
    expect(usersList).toBeInTheDocument();
  });

  test('組合使用不同查詢方法', async () => {
    const user = userEvent.setup();
    render(<AsyncDataLoader />);
    
    // 初始狀態 - 使用 queryBy
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('users list')).not.toBeInTheDocument();
    
    // 點擊載入
    await user.click(screen.getByText('Load Users'));
    
    // Loading 狀態 - 使用 getBy
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
    
    // 等待資料載入 - 使用 findBy
    await screen.findByLabelText('users list');
    
    // Loading 消失 - 使用 queryBy
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
```

## 查詢多個元素

每種查詢方法都有對應的複數形式：

| 單一元素 | 多個元素 | 使用場景 |
|---------|---------|---------|
| getBy | getAllBy | 多個相同類型元素必須存在 |
| queryBy | queryAllBy | 多個元素可能不存在 |
| findBy | findAllBy | 多個元素非同步出現 |

### 範例

```typescript
// src/components/TodoList.tsx
import React from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoListProps {
  todos: Todo[];
}

export const TodoList: React.FC<TodoListProps> = ({ todos }) => {
  const activeTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  return (
    <div>
      <section>
        <h3>Active Tasks ({activeTodos.length})</h3>
        <ul>
          {activeTodos.map(todo => (
            <li key={todo.id} className="todo-item active">
              {todo.text}
            </li>
          ))}
        </ul>
      </section>
      
      <section>
        <h3>Completed Tasks ({completedTodos.length})</h3>
        <ul>
          {completedTodos.map(todo => (
            <li key={todo.id} className="todo-item completed">
              <s>{todo.text}</s>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
```

### 測試多個元素

```typescript
// src/components/TodoList.test.tsx
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodoList } from './TodoList';

describe('TodoList - 查詢多個元素', () => {
  const mockTodos = [
    { id: 1, text: 'Learn React', completed: false },
    { id: 2, text: 'Learn Testing', completed: false },
    { id: 3, text: 'Build App', completed: true },
  ];

  test('getAllBy 查詢多個元素', () => {
    render(<TodoList todos={mockTodos} />);
    
    // 獲取所有 todo 項目
    const allItems = screen.getAllByClassName('todo-item');
    expect(allItems).toHaveLength(3);
    
    // 獲取所有標題
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent('Active Tasks (2)');
    expect(headings[1]).toHaveTextContent('Completed Tasks (1)');
  });

  test('queryAllBy 當元素可能不存在', () => {
    render(<TodoList todos={[]} />);
    
    // 沒有 todo 項目時
    const items = screen.queryAllByClassName('todo-item');
    expect(items).toHaveLength(0);
  });

  test('使用 within 限定查詢範圍', () => {
    const { container } = render(<TodoList todos={mockTodos} />);
    
    // 限定在特定 section 內查詢
    const sections = container.querySelectorAll('section');
    
    // 在第一個 section（Active Tasks）內查詢
    const activeSection = sections[0];
    const activeTodos = screen.getAllByText(/Learn/, {
      container: activeSection
    });
    expect(activeTodos).toHaveLength(2);
  });
});
```

## 查詢優先順序

React Testing Library 推薦的查詢優先順序：

### 1. 每個人都能訪問的查詢

```typescript
// 最優先：語義化 HTML
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Username')
screen.getByPlaceholderText('Enter your email')
screen.getByText('Welcome')
screen.getByDisplayValue('current value')
```

### 2. 語義化查詢

```typescript
// 次優先：HTML5 和 ARIA
screen.getByAltText('Profile picture')
screen.getByTitle('Close dialog')
```

### 3. Test IDs

```typescript
// 最後手段
screen.getByTestId('custom-element')
```

## 自定義查詢

### 建立自定義查詢函數

```typescript
// src/test/customQueries.ts
import { queryHelpers, buildQueries } from '@testing-library/react';

// 自定義查詢：透過 data-cy 屬性查詢（Cypress 風格）
const queryAllByCy = (container: HTMLElement, id: string) =>
  container.querySelectorAll(`[data-cy="${id}"]`);

const getMultipleError = (c: Element, dataCyValue: string) =>
  `Found multiple elements with data-cy="${dataCyValue}"`;

const getMissingError = (c: Element, dataCyValue: string) =>
  `Unable to find element with data-cy="${dataCyValue}"`;

const [
  queryByCy,
  getAllByCy,
  getByCy,
  findAllByCy,
  findByCy,
] = buildQueries(queryAllByCy, getMultipleError, getMissingError);

export { queryByCy, getAllByCy, getByCy, findAllByCy, findByCy };
```

### 使用自定義查詢

```typescript
import { render } from '@testing-library/react';
import { getByCy } from '@/test/customQueries';

test('使用自定義查詢', () => {
  const { container } = render(
    <div data-cy="custom-element">Custom Content</div>
  );
  
  const element = getByCy(container, 'custom-element');
  expect(element).toHaveTextContent('Custom Content');
});
```

## 實用技巧

### 1. 使用 screen.debug()

```typescript
test('除錯 DOM 結構', () => {
  render(<UserProfile user={mockUser} />);
  
  // 印出整個 DOM
  screen.debug();
  
  // 印出特定元素
  screen.debug(screen.getByRole('heading'));
});
```

### 2. 使用 logRoles

```typescript
import { logRoles } from '@testing-library/react';

test('查看可用的 roles', () => {
  const { container } = render(<UserProfile user={mockUser} />);
  
  // 印出所有可用的 role
  logRoles(container);
});
```

### 3. 文字匹配選項

```typescript
// 精確匹配
screen.getByText('Hello World', { exact: true });

// 忽略大小寫
screen.getByText('hello world', { exact: false });

// 使用函數匹配
screen.getByText((content, element) => {
  return content.startsWith('Hello') && element?.tagName === 'H1';
});

// 正則表達式
screen.getByText(/hello.*world/i);
```

## 常見問題

**Q: 什麼時候該用 getBy vs queryBy？**
A: 
- 使用 `getBy`：當你期望元素一定存在時
- 使用 `queryBy`：當你要斷言元素不存在時

**Q: findBy 的預設 timeout 是多久？**
A: 預設是 1000ms，可以透過選項自定義。

**Q: 如何查詢沒有明顯特徵的元素？**
A: 優先順序：
1. 加入適當的 ARIA 屬性
2. 改善 HTML 語義
3. 最後才使用 data-testid

## 練習題

1. **基礎練習**：建立搜尋元件
   - 輸入框、搜尋按鈕、結果列表
   - 測試各種查詢方法

2. **進階練習**：建立標籤頁元件
   - 多個標籤、內容切換
   - 使用 getAllBy 測試多個標籤

3. **挑戰練習**：建立自動完成元件
   - 輸入觸發建議列表
   - 使用 findBy 測試非同步建議

## 延伸閱讀

- [查詢優先順序指南](https://testing-library.com/docs/queries/about#priority)
- [查詢速查表](https://testing-library.com/docs/react-testing-library/cheatsheet#queries)
- [常見查詢錯誤](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [自定義查詢](https://testing-library.com/docs/react-testing-library/setup#custom-queries)

## 本日重點回顧

✅ 理解 getBy、queryBy、findBy 的差異
✅ 掌握查詢方法的使用時機
✅ 學會查詢多個元素
✅ 了解查詢優先順序
✅ 能夠建立自定義查詢

明天我們將學習如何測試使用者互動，包括 fireEvent 和 userEvent 的使用！
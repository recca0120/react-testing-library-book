# Day 27: 實戰專案 - Todo App 完整測試

## 學習目標
- 建立一個完整的 Todo App 並編寫全面的測試
- 整合前面學過的所有測試技巧
- 實踐測試驅動開發 (TDD) 流程
- 學會組織大型專案的測試結構

## 專案概覽

我們將建立一個功能完整的 Todo App，包含：
- 新增、編輯、刪除任務
- 任務狀態切換（完成/未完成）
- 任務篩選（全部/已完成/未完成）
- 批量操作（全選/全部清除）
- 資料持久化（localStorage）
- 響應式設計

## 專案架構

```
src/
├── components/
│   ├── TodoApp.tsx
│   ├── TodoHeader.tsx
│   ├── TodoInput.tsx
│   ├── TodoList.tsx
│   ├── TodoItem.tsx
│   ├── TodoFilter.tsx
│   └── TodoFooter.tsx
├── hooks/
│   ├── useTodos.ts
│   └── useLocalStorage.ts
├── types/
│   └── todo.ts
├── utils/
│   └── todoUtils.ts
└── __tests__/
    ├── components/
    ├── hooks/
    └── utils/
```

## 核心類型定義

```typescript
// src/types/todo.ts
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type FilterType = 'all' | 'active' | 'completed';

export interface TodoState {
  todos: Todo[];
  filter: FilterType;
}
```

## 工具函數與測試

```typescript
// src/utils/todoUtils.ts
import { Todo, FilterType } from '../types/todo';

export const createTodo = (text: string): Todo => ({
  id: crypto.randomUUID(),
  text: text.trim(),
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const filterTodos = (todos: Todo[], filter: FilterType): Todo[] => {
  switch (filter) {
    case 'active':
      return todos.filter(todo => !todo.completed);
    case 'completed':
      return todos.filter(todo => todo.completed);
    default:
      return todos;
  }
};

export const getActiveTodoCount = (todos: Todo[]): number => {
  return todos.filter(todo => !todo.completed).length;
};

export const getAllCompletedTodos = (todos: Todo[]): Todo[] => {
  return todos.filter(todo => todo.completed);
};

export const toggleAllTodos = (todos: Todo[], completed: boolean): Todo[] => {
  return todos.map(todo => ({
    ...todo,
    completed,
    updatedAt: new Date(),
  }));
};
```

### 工具函數測試

```typescript
// src/utils/__tests__/todoUtils.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTodo,
  filterTodos,
  getActiveTodoCount,
  getAllCompletedTodos,
  toggleAllTodos,
} from '../todoUtils';
import { Todo } from '../../types/todo';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid'),
  },
});

describe('todoUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createTodo', () => {
    it('should create todo with correct properties', () => {
      const text = 'Test todo';
      const todo = createTodo(text);

      expect(todo).toEqual({
        id: 'mock-uuid',
        text: 'Test todo',
        completed: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      });
    });

    it('should trim whitespace from text', () => {
      const todo = createTodo('  Test todo  ');
      expect(todo.text).toBe('Test todo');
    });
  });

  describe('filterTodos', () => {
    const mockTodos: Todo[] = [
      {
        id: '1',
        text: 'Active todo',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        text: 'Completed todo',
        completed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all todos when filter is "all"', () => {
      const result = filterTodos(mockTodos, 'all');
      expect(result).toHaveLength(2);
    });

    it('should return only active todos when filter is "active"', () => {
      const result = filterTodos(mockTodos, 'active');
      expect(result).toHaveLength(1);
      expect(result[0].completed).toBe(false);
    });

    it('should return only completed todos when filter is "completed"', () => {
      const result = filterTodos(mockTodos, 'completed');
      expect(result).toHaveLength(1);
      expect(result[0].completed).toBe(true);
    });
  });

  describe('getActiveTodoCount', () => {
    it('should return correct count of active todos', () => {
      const todos: Todo[] = [
        { id: '1', text: 'Active 1', completed: false } as Todo,
        { id: '2', text: 'Completed', completed: true } as Todo,
        { id: '3', text: 'Active 2', completed: false } as Todo,
      ];

      expect(getActiveTodoCount(todos)).toBe(2);
    });

    it('should return 0 for empty array', () => {
      expect(getActiveTodoCount([])).toBe(0);
    });
  });

  describe('toggleAllTodos', () => {
    it('should mark all todos as completed', () => {
      const todos: Todo[] = [
        { id: '1', text: 'Todo 1', completed: false, updatedAt: new Date('2022-01-01') } as Todo,
        { id: '2', text: 'Todo 2', completed: false, updatedAt: new Date('2022-01-01') } as Todo,
      ];

      const result = toggleAllTodos(todos, true);
      
      result.forEach(todo => {
        expect(todo.completed).toBe(true);
        expect(todo.updatedAt).toEqual(new Date('2023-01-01'));
      });
    });
  });
});
```

## 自定義 Hooks

```typescript
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
```

### LocalStorage Hook 測試

```typescript
// src/hooks/__tests__/useLocalStorage.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.warn = vi.fn();
  });

  it('should return initial value when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    expect(result.current[0]).toBe('initial');
  });

  it('should return stored value when localStorage has data', () => {
    localStorageMock.getItem.mockReturnValue('"stored value"');
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    expect(result.current[0]).toBe('stored value');
  });

  it('should update localStorage when value changes', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('new value');
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      '"new value"'
    );
    expect(result.current[0]).toBe('new value');
  });

  it('should handle function updates', () => {
    localStorageMock.getItem.mockReturnValue('5');
    
    const { result } = renderHook(() => useLocalStorage('counter', 0));
    
    act(() => {
      result.current[1](prev => prev + 1);
    });
    
    expect(result.current[0]).toBe(6);
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    
    expect(result.current[0]).toBe('fallback');
    expect(console.warn).toHaveBeenCalled();
  });

  it('should handle setItem errors gracefully', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage full');
    });
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('new value');
    });
    
    expect(console.warn).toHaveBeenCalled();
  });
});
```

## Todos Hook

```typescript
// src/hooks/useTodos.ts
import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Todo, FilterType, TodoState } from '../types/todo';
import { createTodo, filterTodos, toggleAllTodos } from '../utils/todoUtils';

const INITIAL_STATE: TodoState = {
  todos: [],
  filter: 'all',
};

export function useTodos() {
  const [state, setState] = useLocalStorage('todos-state', INITIAL_STATE);

  const addTodo = useCallback((text: string) => {
    if (!text.trim()) return;
    
    const newTodo = createTodo(text);
    setState(prev => ({
      ...prev,
      todos: [...prev.todos, newTodo],
    }));
  }, [setState]);

  const toggleTodo = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      todos: prev.todos.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed, updatedAt: new Date() }
          : todo
      ),
    }));
  }, [setState]);

  const deleteTodo = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      todos: prev.todos.filter(todo => todo.id !== id),
    }));
  }, [setState]);

  const editTodo = useCallback((id: string, text: string) => {
    if (!text.trim()) {
      deleteTodo(id);
      return;
    }
    
    setState(prev => ({
      ...prev,
      todos: prev.todos.map(todo =>
        todo.id === id
          ? { ...todo, text: text.trim(), updatedAt: new Date() }
          : todo
      ),
    }));
  }, [setState, deleteTodo]);

  const setFilter = useCallback((filter: FilterType) => {
    setState(prev => ({ ...prev, filter }));
  }, [setState]);

  const toggleAllTodos = useCallback(() => {
    const hasActiveTodos = state.todos.some(todo => !todo.completed);
    setState(prev => ({
      ...prev,
      todos: toggleAllTodos(prev.todos, hasActiveTodos),
    }));
  }, [state.todos, setState]);

  const clearCompleted = useCallback(() => {
    setState(prev => ({
      ...prev,
      todos: prev.todos.filter(todo => !todo.completed),
    }));
  }, [setState]);

  const filteredTodos = filterTodos(state.todos, state.filter);
  const activeTodoCount = state.todos.filter(todo => !todo.completed).length;
  const hasCompletedTodos = state.todos.some(todo => todo.completed);

  return {
    todos: filteredTodos,
    allTodos: state.todos,
    filter: state.filter,
    activeTodoCount,
    hasCompletedTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    setFilter,
    toggleAllTodos,
    clearCompleted,
  };
}
```

## 主要元件

```typescript
// src/components/TodoApp.tsx
import React from 'react';
import { useTodos } from '../hooks/useTodos';
import { TodoHeader } from './TodoHeader';
import { TodoInput } from './TodoInput';
import { TodoList } from './TodoList';
import { TodoFooter } from './TodoFooter';

export const TodoApp: React.FC = () => {
  const {
    todos,
    allTodos,
    filter,
    activeTodoCount,
    hasCompletedTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    setFilter,
    toggleAllTodos,
    clearCompleted,
  } = useTodos();

  const hasAnyTodos = allTodos.length > 0;
  const hasActiveTodos = activeTodoCount > 0;

  return (
    <div className="todoapp" data-testid="todo-app">
      <TodoHeader />
      
      <section className="main">
        {hasAnyTodos && (
          <input
            id="toggle-all"
            className="toggle-all"
            type="checkbox"
            onChange={toggleAllTodos}
            checked={!hasActiveTodos}
            data-testid="toggle-all"
          />
        )}
        
        {hasAnyTodos && (
          <label htmlFor="toggle-all">Mark all as complete</label>
        )}
        
        <TodoInput onAddTodo={addTodo} />
        
        {hasAnyTodos && (
          <TodoList
            todos={todos}
            onToggleTodo={toggleTodo}
            onDeleteTodo={deleteTodo}
            onEditTodo={editTodo}
          />
        )}
      </section>

      {hasAnyTodos && (
        <TodoFooter
          activeTodoCount={activeTodoCount}
          hasCompletedTodos={hasCompletedTodos}
          filter={filter}
          onFilterChange={setFilter}
          onClearCompleted={clearCompleted}
        />
      )}
    </div>
  );
};
```

## 完整整合測試

```typescript
// src/components/__tests__/TodoApp.integration.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoApp } from '../TodoApp';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('TodoApp Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should handle complete todo workflow', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    // 1. 新增第一個任務
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    await user.type(input, 'First todo{enter}');

    expect(screen.getByDisplayValue('First todo')).toBeInTheDocument();
    expect(screen.getByText('1 item left')).toBeInTheDocument();

    // 2. 新增第二個任務
    await user.type(input, 'Second todo{enter}');
    expect(screen.getByText('2 items left')).toBeInTheDocument();

    // 3. 完成第一個任務
    const firstTodoCheckbox = screen.getByDisplayValue('First todo')
      .closest('li')
      ?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    
    await user.click(firstTodoCheckbox);
    expect(screen.getByText('1 item left')).toBeInTheDocument();

    // 4. 測試篩選功能
    await user.click(screen.getByText('Completed'));
    expect(screen.getByDisplayValue('First todo')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Second todo')).not.toBeInTheDocument();

    await user.click(screen.getByText('Active'));
    expect(screen.queryByDisplayValue('First todo')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Second todo')).toBeInTheDocument();

    await user.click(screen.getByText('All'));
    expect(screen.getByDisplayValue('First todo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Second todo')).toBeInTheDocument();

    // 5. 編輯任務
    const secondTodoInput = screen.getByDisplayValue('Second todo');
    await user.dblClick(secondTodoInput);
    await user.clear(secondTodoInput);
    await user.type(secondTodoInput, 'Updated second todo{enter}');

    expect(screen.getByDisplayValue('Updated second todo')).toBeInTheDocument();

    // 6. 刪除任務
    const deleteButton = screen.getByDisplayValue('Updated second todo')
      .closest('li')
      ?.querySelector('.destroy') as HTMLButtonElement;
    
    await user.click(deleteButton);
    expect(screen.queryByDisplayValue('Updated second todo')).not.toBeInTheDocument();
    expect(screen.getByText('0 items left')).toBeInTheDocument();

    // 7. 清除已完成的任務
    await user.click(screen.getByText('Clear completed'));
    expect(screen.queryByDisplayValue('First todo')).not.toBeInTheDocument();
  });

  it('should persist data in localStorage', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    await user.type(screen.getByPlaceholderText(/what needs to be done/i), 'Test todo{enter}');

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'todos-state',
      expect.stringContaining('Test todo')
    );
  });

  it('should handle toggle all functionality', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    // 新增多個任務
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    await user.type(input, 'Todo 1{enter}');
    await user.type(input, 'Todo 2{enter}');
    await user.type(input, 'Todo 3{enter}');

    expect(screen.getByText('3 items left')).toBeInTheDocument();

    // 全選
    await user.click(screen.getByTestId('toggle-all'));
    expect(screen.getByText('0 items left')).toBeInTheDocument();

    // 取消全選
    await user.click(screen.getByTestId('toggle-all'));
    expect(screen.getByText('3 items left')).toBeInTheDocument();
  });

  it('should handle edge cases', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText(/what needs to be done/i);

    // 測試空白輸入
    await user.type(input, '   {enter}');
    expect(screen.queryByText('items left')).not.toBeInTheDocument();

    // 測試編輯為空字串（應該刪除）
    await user.type(input, 'Test todo{enter}');
    const todoInput = screen.getByDisplayValue('Test todo');
    await user.dblClick(todoInput);
    await user.clear(todoInput);
    await user.type(todoInput, '{enter}');

    expect(screen.queryByDisplayValue('Test todo')).not.toBeInTheDocument();
    expect(screen.queryByText('items left')).not.toBeInTheDocument();
  });
});
```

## 測試策略總結

### 1. 測試層級
- **單元測試**：工具函數、Hooks
- **元件測試**：個別元件功能
- **整合測試**：完整的使用者流程

### 2. 測試覆蓋
- ✅ 所有核心功能
- ✅ 邊界條件和錯誤處理
- ✅ 使用者互動流程
- ✅ 資料持久化
- ✅ 狀態管理

### 3. 最佳實踐
- 使用描述性的測試名稱
- 遵循 AAA 模式（Arrange, Act, Assert）
- Mock 外部依賴
- 測試使用者行為而非實現細節

## 延伸練習

1. **添加更多功能**：標籤、截止日期、優先級
2. **改進測試**：添加視覺迴歸測試
3. **效能優化**：添加效能測試
4. **可訪問性**：添加 a11y 測試

## 本日重點回顧

1. **完整的測試策略**：從單元到整合測試的完整覆蓋
2. **實際專案經驗**：處理真實世界的測試挑戰
3. **測試組織**：合理的測試結構和命名
4. **TDD 實踐**：測試驅動的開發流程
5. **最佳實踐應用**：整合所有學習的測試技巧

這個 Todo App 範例展示了如何在實際專案中應用測試技能，為您的測試之旅提供了完整的參考實現。
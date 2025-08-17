# Day 15: Redux 測試策略

## 學習目標

- 理解 Redux 測試的三個層面：Action、Reducer、Selector
- 學會測試非同步 Action
- 掌握 Redux Store 的整合測試
- 了解測試的最佳實踐與常見陷阱

## Redux 測試概述

Redux 的可預測性和純函數特性使其非常適合測試。Redux 測試主要分為三個層面：

1. **Action Creators 測試** - 驗證動作物件的正確性
2. **Reducers 測試** - 驗證狀態變更邏輯
3. **Selectors 測試** - 驗證資料查詢邏輯

### Redux 測試策略

```
Store Integration Tests (整合測試)
    ↓
Selector Tests (選擇器測試)
    ↓
Reducer Tests (歸納器測試)
    ↓
Action Creator Tests (動作創建器測試)
```

## Action Creators 測試

### 同步 Action 測試

```typescript
// actions/counterActions.ts
export const INCREMENT = 'counter/increment';
export const DECREMENT = 'counter/decrement';
export const SET_VALUE = 'counter/setValue';

export const increment = () => ({
  type: INCREMENT,
} as const);

export const decrement = () => ({
  type: DECREMENT,
} as const);

export const setValue = (value: number) => ({
  type: SET_VALUE,
  payload: value,
} as const);

export type CounterAction = 
  | ReturnType<typeof increment>
  | ReturnType<typeof decrement>
  | ReturnType<typeof setValue>;
```

```typescript
// actions/counterActions.test.ts
import { describe, test, expect } from 'vitest';
import { increment, decrement, setValue, INCREMENT, DECREMENT, SET_VALUE } from './counterActions';

describe('Counter Actions', () => {
  test('increment should create increment action', () => {
    const expectedAction = {
      type: INCREMENT,
    };
    
    expect(increment()).toEqual(expectedAction);
  });

  test('decrement should create decrement action', () => {
    const expectedAction = {
      type: DECREMENT,
    };
    
    expect(decrement()).toEqual(expectedAction);
  });

  test('setValue should create setValue action with payload', () => {
    const value = 42;
    const expectedAction = {
      type: SET_VALUE,
      payload: value,
    };
    
    expect(setValue(value)).toEqual(expectedAction);
  });
});
```

### 非同步 Action 測試 (Redux Thunk)

```typescript
// actions/userActions.ts
import { Dispatch } from 'redux';

export const FETCH_USER_REQUEST = 'user/fetchRequest';
export const FETCH_USER_SUCCESS = 'user/fetchSuccess';
export const FETCH_USER_FAILURE = 'user/fetchFailure';

export const fetchUserRequest = () => ({
  type: FETCH_USER_REQUEST,
} as const);

export const fetchUserSuccess = (user: User) => ({
  type: FETCH_USER_SUCCESS,
  payload: user,
} as const);

export const fetchUserFailure = (error: string) => ({
  type: FETCH_USER_FAILURE,
  payload: error,
} as const);

export interface User {
  id: number;
  name: string;
  email: string;
}

// Thunk action creator
export const fetchUser = (userId: number) => {
  return async (dispatch: Dispatch) => {
    dispatch(fetchUserRequest());
    
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      const user = await response.json();
      dispatch(fetchUserSuccess(user));
    } catch (error) {
      dispatch(fetchUserFailure(error instanceof Error ? error.message : 'Unknown error'));
    }
  };
};
```

```typescript
// actions/userActions.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchUser, fetchUserRequest, fetchUserSuccess, fetchUserFailure } from './userActions';

// Mock fetch
global.fetch = vi.fn();

describe('User Actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('fetchUser should dispatch success action when API call succeeds', async () => {
    const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    const mockDispatch = vi.fn();
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const thunk = fetchUser(1);
    await thunk(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenNthCalledWith(1, fetchUserRequest());
    expect(mockDispatch).toHaveBeenNthCalledWith(2, fetchUserSuccess(mockUser));
  });

  test('fetchUser should dispatch failure action when API call fails', async () => {
    const mockDispatch = vi.fn();
    const errorMessage = 'Failed to fetch user';
    
    (fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const thunk = fetchUser(1);
    await thunk(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenNthCalledWith(1, fetchUserRequest());
    expect(mockDispatch).toHaveBeenNthCalledWith(2, fetchUserFailure(errorMessage));
  });

  test('fetchUser should dispatch failure action when network error occurs', async () => {
    const mockDispatch = vi.fn();
    const errorMessage = 'Network error';
    
    (fetch as any).mockRejectedValueOnce(new Error(errorMessage));

    const thunk = fetchUser(1);
    await thunk(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenNthCalledWith(1, fetchUserRequest());
    expect(mockDispatch).toHaveBeenNthCalledWith(2, fetchUserFailure(errorMessage));
  });
});
```

## Reducers 測試

```typescript
// reducers/counterReducer.ts
import { CounterAction, INCREMENT, DECREMENT, SET_VALUE } from '../actions/counterActions';

export interface CounterState {
  value: number;
  lastAction: string | null;
}

const initialState: CounterState = {
  value: 0,
  lastAction: null,
};

export const counterReducer = (
  state = initialState, 
  action: CounterAction
): CounterState => {
  switch (action.type) {
    case INCREMENT:
      return {
        ...state,
        value: state.value + 1,
        lastAction: 'increment',
      };
    
    case DECREMENT:
      return {
        ...state,
        value: state.value - 1,
        lastAction: 'decrement',
      };
    
    case SET_VALUE:
      return {
        ...state,
        value: action.payload,
        lastAction: 'setValue',
      };
    
    default:
      return state;
  }
};
```

```typescript
// reducers/counterReducer.test.ts
import { describe, test, expect } from 'vitest';
import { counterReducer, CounterState } from './counterReducer';
import { increment, decrement, setValue } from '../actions/counterActions';

describe('Counter Reducer', () => {
  const initialState: CounterState = {
    value: 0,
    lastAction: null,
  };

  test('should return initial state when no action is provided', () => {
    expect(counterReducer(undefined, {} as any)).toEqual(initialState);
  });

  test('should handle increment action', () => {
    const action = increment();
    const expectedState = {
      value: 1,
      lastAction: 'increment',
    };
    
    expect(counterReducer(initialState, action)).toEqual(expectedState);
  });

  test('should handle decrement action', () => {
    const action = decrement();
    const expectedState = {
      value: -1,
      lastAction: 'decrement',
    };
    
    expect(counterReducer(initialState, action)).toEqual(expectedState);
  });

  test('should handle setValue action', () => {
    const action = setValue(42);
    const expectedState = {
      value: 42,
      lastAction: 'setValue',
    };
    
    expect(counterReducer(initialState, action)).toEqual(expectedState);
  });

  test('should handle multiple actions in sequence', () => {
    let state = initialState;
    
    state = counterReducer(state, increment());
    expect(state.value).toBe(1);
    
    state = counterReducer(state, increment());
    expect(state.value).toBe(2);
    
    state = counterReducer(state, decrement());
    expect(state.value).toBe(1);
    
    state = counterReducer(state, setValue(10));
    expect(state.value).toBe(10);
  });

  test('should not mutate original state', () => {
    const action = increment();
    const originalState = { ...initialState };
    
    counterReducer(initialState, action);
    
    expect(initialState).toEqual(originalState);
  });
});
```

## Selectors 測試

```typescript
// selectors/counterSelectors.ts
import { RootState } from '../store';

export const selectCounterValue = (state: RootState) => state.counter.value;
export const selectLastAction = (state: RootState) => state.counter.lastAction;
export const selectIsPositive = (state: RootState) => state.counter.value > 0;
export const selectIsNegative = (state: RootState) => state.counter.value < 0;
export const selectAbsoluteValue = (state: RootState) => Math.abs(state.counter.value);

// 複雜的 selector 範例
export const selectCounterInfo = (state: RootState) => {
  const value = selectCounterValue(state);
  const lastAction = selectLastAction(state);
  
  return {
    value,
    lastAction,
    isPositive: value > 0,
    isNegative: value < 0,
    absoluteValue: Math.abs(value),
    description: `Counter is ${value} (last action: ${lastAction || 'none'})`,
  };
};
```

```typescript
// selectors/counterSelectors.test.ts
import { describe, test, expect } from 'vitest';
import {
  selectCounterValue,
  selectLastAction,
  selectIsPositive,
  selectIsNegative,
  selectAbsoluteValue,
  selectCounterInfo,
} from './counterSelectors';
import { RootState } from '../store';

describe('Counter Selectors', () => {
  const createMockState = (counterState: any): RootState => ({
    counter: counterState,
    // 其他 state...
  } as RootState);

  describe('selectCounterValue', () => {
    test('should return counter value', () => {
      const state = createMockState({ value: 42, lastAction: null });
      expect(selectCounterValue(state)).toBe(42);
    });
  });

  describe('selectLastAction', () => {
    test('should return last action', () => {
      const state = createMockState({ value: 5, lastAction: 'increment' });
      expect(selectLastAction(state)).toBe('increment');
    });

    test('should return null when no action performed', () => {
      const state = createMockState({ value: 0, lastAction: null });
      expect(selectLastAction(state)).toBeNull();
    });
  });

  describe('selectIsPositive', () => {
    test('should return true for positive values', () => {
      const state = createMockState({ value: 5, lastAction: null });
      expect(selectIsPositive(state)).toBe(true);
    });

    test('should return false for zero', () => {
      const state = createMockState({ value: 0, lastAction: null });
      expect(selectIsPositive(state)).toBe(false);
    });

    test('should return false for negative values', () => {
      const state = createMockState({ value: -5, lastAction: null });
      expect(selectIsPositive(state)).toBe(false);
    });
  });

  describe('selectIsNegative', () => {
    test('should return true for negative values', () => {
      const state = createMockState({ value: -5, lastAction: null });
      expect(selectIsNegative(state)).toBe(true);
    });

    test('should return false for positive values', () => {
      const state = createMockState({ value: 5, lastAction: null });
      expect(selectIsNegative(state)).toBe(false);
    });
  });

  describe('selectAbsoluteValue', () => {
    test('should return absolute value for positive numbers', () => {
      const state = createMockState({ value: 5, lastAction: null });
      expect(selectAbsoluteValue(state)).toBe(5);
    });

    test('should return absolute value for negative numbers', () => {
      const state = createMockState({ value: -5, lastAction: null });
      expect(selectAbsoluteValue(state)).toBe(5);
    });
  });

  describe('selectCounterInfo', () => {
    test('should return complete counter information', () => {
      const state = createMockState({ value: -3, lastAction: 'decrement' });
      const result = selectCounterInfo(state);
      
      expect(result).toEqual({
        value: -3,
        lastAction: 'decrement',
        isPositive: false,
        isNegative: true,
        absoluteValue: 3,
        description: 'Counter is -3 (last action: decrement)',
      });
    });

    test('should handle no previous action', () => {
      const state = createMockState({ value: 0, lastAction: null });
      const result = selectCounterInfo(state);
      
      expect(result.description).toBe('Counter is 0 (last action: none)');
    });
  });
});
```

## Store 整合測試

```typescript
// store/store.ts
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { counterReducer } from '../reducers/counterReducer';

const rootReducer = combineReducers({
  counter: counterReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const createTestStore = (initialState?: Partial<RootState>) => {
  return createStore(
    rootReducer,
    initialState as RootState,
    applyMiddleware(thunk)
  );
};

export const store = createTestStore();
```

```typescript
// store/store.test.ts
import { describe, test, expect } from 'vitest';
import { createTestStore } from './store';
import { increment, decrement, setValue } from '../actions/counterActions';

describe('Store Integration', () => {
  test('should handle a series of actions correctly', () => {
    const store = createTestStore();
    
    // 初始狀態
    expect(store.getState().counter.value).toBe(0);
    expect(store.getState().counter.lastAction).toBeNull();
    
    // 執行 increment
    store.dispatch(increment());
    expect(store.getState().counter.value).toBe(1);
    expect(store.getState().counter.lastAction).toBe('increment');
    
    // 執行 decrement
    store.dispatch(decrement());
    expect(store.getState().counter.value).toBe(0);
    expect(store.getState().counter.lastAction).toBe('decrement');
    
    // 執行 setValue
    store.dispatch(setValue(10));
    expect(store.getState().counter.value).toBe(10);
    expect(store.getState().counter.lastAction).toBe('setValue');
  });

  test('should work with custom initial state', () => {
    const initialState = {
      counter: {
        value: 5,
        lastAction: 'custom' as any,
      },
    };
    
    const store = createTestStore(initialState);
    
    expect(store.getState().counter.value).toBe(5);
    expect(store.getState().counter.lastAction).toBe('custom');
    
    store.dispatch(increment());
    expect(store.getState().counter.value).toBe(6);
  });

  test('should maintain immutability', () => {
    const store = createTestStore();
    const initialState = store.getState();
    
    store.dispatch(increment());
    const newState = store.getState();
    
    // 確保沒有直接修改原始狀態
    expect(initialState).not.toBe(newState);
    expect(initialState.counter.value).toBe(0);
    expect(newState.counter.value).toBe(1);
  });
});
```

## 測試工具函數

```typescript
// test-utils/redux-utils.ts
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createTestStore } from '../store/store';
import { RootState } from '../store/store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: Partial<RootState>;
  store?: ReturnType<typeof createTestStore>;
}

export function renderWithRedux(
  ui: ReactElement,
  {
    initialState,
    store = createTestStore(initialState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// 建立測試狀態的輔助函數
export const createCounterState = (
  value: number = 0,
  lastAction: string | null = null
) => ({
  counter: {
    value,
    lastAction,
  },
});

// 斷言狀態的輔助函數
export const expectCounterState = (
  store: ReturnType<typeof createTestStore>,
  expectedValue: number,
  expectedLastAction?: string | null
) => {
  const state = store.getState();
  expect(state.counter.value).toBe(expectedValue);
  if (expectedLastAction !== undefined) {
    expect(state.counter.lastAction).toBe(expectedLastAction);
  }
};
```

## React 元件與 Redux 整合測試

```typescript
// components/Counter.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { increment, decrement, setValue } from '../actions/counterActions';

export const Counter: React.FC = () => {
  const value = useSelector((state: RootState) => state.counter.value);
  const lastAction = useSelector((state: RootState) => state.counter.lastAction);
  const dispatch = useDispatch();

  const handleIncrement = () => dispatch(increment());
  const handleDecrement = () => dispatch(decrement());
  const handleReset = () => dispatch(setValue(0));

  return (
    <div>
      <h2>Counter: {value}</h2>
      {lastAction && <p>Last action: {lastAction}</p>}
      
      <button onClick={handleIncrement}>+</button>
      <button onClick={handleDecrement}>-</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  );
};
```

```typescript
// components/Counter.test.tsx
import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRedux, createCounterState, expectCounterState } from '../test-utils/redux-utils';
import { Counter } from './Counter';

describe('Counter Component', () => {
  test('should display initial counter value', () => {
    renderWithRedux(<Counter />);
    
    expect(screen.getByText('Counter: 0')).toBeInTheDocument();
  });

  test('should display custom initial value', () => {
    const initialState = createCounterState(5, 'custom');
    renderWithRedux(<Counter />, { initialState });
    
    expect(screen.getByText('Counter: 5')).toBeInTheDocument();
    expect(screen.getByText('Last action: custom')).toBeInTheDocument();
  });

  test('should increment counter when + button is clicked', async () => {
    const user = userEvent.setup();
    const { store } = renderWithRedux(<Counter />);
    
    const incrementButton = screen.getByText('+');
    await user.click(incrementButton);
    
    expect(screen.getByText('Counter: 1')).toBeInTheDocument();
    expect(screen.getByText('Last action: increment')).toBeInTheDocument();
    expectCounterState(store, 1, 'increment');
  });

  test('should decrement counter when - button is clicked', async () => {
    const user = userEvent.setup();
    const initialState = createCounterState(2);
    const { store } = renderWithRedux(<Counter />, { initialState });
    
    const decrementButton = screen.getByText('-');
    await user.click(decrementButton);
    
    expect(screen.getByText('Counter: 1')).toBeInTheDocument();
    expectCounterState(store, 1, 'decrement');
  });

  test('should reset counter when Reset button is clicked', async () => {
    const user = userEvent.setup();
    const initialState = createCounterState(10);
    const { store } = renderWithRedux(<Counter />, { initialState });
    
    const resetButton = screen.getByText('Reset');
    await user.click(resetButton);
    
    expect(screen.getByText('Counter: 0')).toBeInTheDocument();
    expectCounterState(store, 0, 'setValue');
  });

  test('should handle multiple actions in sequence', async () => {
    const user = userEvent.setup();
    const { store } = renderWithRedux(<Counter />);
    
    // 多次點擊增加
    await user.click(screen.getByText('+'));
    await user.click(screen.getByText('+'));
    await user.click(screen.getByText('+'));
    
    expectCounterState(store, 3, 'increment');
    expect(screen.getByText('Counter: 3')).toBeInTheDocument();
    
    // 減少一次
    await user.click(screen.getByText('-'));
    
    expectCounterState(store, 2, 'decrement');
    expect(screen.getByText('Counter: 2')).toBeInTheDocument();
    
    // 重置
    await user.click(screen.getByText('Reset'));
    
    expectCounterState(store, 0, 'setValue');
    expect(screen.getByText('Counter: 0')).toBeInTheDocument();
  });

  test('should not show last action initially', () => {
    renderWithRedux(<Counter />);
    
    expect(screen.queryByText(/Last action:/)).not.toBeInTheDocument();
  });
});
```

## 常見問題

**Q: 是否需要測試 Redux 的內建功能？**
A: 不需要。Redux 已經經過充分測試，我們只需要測試自己的 action creators、reducers 和 selectors。

**Q: 應該如何測試複雜的 reducer 邏輯？**
A: 將複雜的邏輯拆分成多個小的 test case，每個 test case 專注測試一個特定的場景或邊緣情況。

**Q: 非同步 action 測試為什麼要 mock fetch？**
A: 為了讓測試快速、可靠且不依賴外部服務。Mock 讓我們能夠測試各種情況，包括成功和失敗的場景。

**Q: Store 整合測試和單元測試的差異？**
A: 單元測試專注測試個別函數，整合測試驗證多個部分的協作，能發現單元測試遺漏的問題。

**Q: 如何測試 middleware 的功能？**
A: 創建真實的 store 實例包含 middleware，然後驗證 action 的執行流程和副作用。

## 練習題

1. **擴展 Counter 功能**
   ```typescript
   // 新增以下功能並撰寫測試：
   // - 步長設定（每次增減的數值）
   // - 最大值/最小值限制
   // - 歷史記錄（最近 5 次操作）
   ```

2. **Todo List Redux**
   ```typescript
   // 實作 Todo List 的 Redux 邏輯並撰寫完整測試：
   interface Todo {
     id: string;
     text: string;
     completed: boolean;
     createdAt: Date;
   }
   
   // Actions: ADD_TODO, TOGGLE_TODO, DELETE_TODO, CLEAR_COMPLETED
   // Selectors: getAllTodos, getActiveTodos, getCompletedTodos, getTodoById
   ```

3. **非同步資料載入**
   ```typescript
   // 實作使用者清單的非同步載入，包括：
   // - 載入狀態管理
   // - 錯誤處理
   // - 分頁支援
   // - 搜尋功能
   ```

## 延伸閱讀

- [Redux 官方測試指南](https://redux.js.org/usage/writing-tests)
- [Redux Toolkit Testing](https://redux-toolkit.js.org/usage/usage-guide#testing)
- [Testing Redux Thunks](https://redux.js.org/usage/writing-tests#testing-async-logic)
- [Jest 非同步測試](https://jestjs.io/docs/asynchronous)
- [React Testing Library with Redux](https://testing-library.com/docs/example-react-redux/)

## 本日重點回顧

✅ 了解 Redux 測試的三個層面
✅ 學會測試 Action Creators (同步與非同步)
✅ 掌握 Reducer 純函數測試
✅ 熟悉 Selector 測試技巧
✅ 實作 Store 整合測試
✅ 建立 Redux 測試工具函數
✅ 完成 React + Redux 元件測試

明天我們將學習 Redux Toolkit 的測試策略，了解如何簡化 Redux 的測試流程！
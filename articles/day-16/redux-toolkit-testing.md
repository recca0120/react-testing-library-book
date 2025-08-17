# Day 16: Redux Toolkit 測試

## 學習目標

- 理解 Redux Toolkit 的測試優勢
- 學會測試 createSlice 建立的 slice
- 掌握 createAsyncThunk 的測試策略
- 了解 RTK Query 的測試方法
- 熟悉 Redux Toolkit 的測試最佳實踐

## Redux Toolkit 測試概述

Redux Toolkit (RTK) 簡化了 Redux 的使用，同樣也簡化了測試。相較於傳統 Redux，RTK 提供：

- **更簡潔的測試代碼** - createSlice 減少樣板代碼
- **內建 Immer** - 不需要擔心狀態變更的測試
- **標準化結構** - 測試模式更一致
- **型別安全** - TypeScript 支援更完整

### RTK 測試架構

```
RTK Query Tests (API 層測試)
    ↓
Async Thunk Tests (非同步動作測試)
    ↓
Slice Tests (切片測試)
    ↓
Store Tests (Store 整合測試)
```

## 安裝 Redux Toolkit

```bash
npm install @reduxjs/toolkit react-redux
npm install -D @redux-devtools/extension
```

## Slice 測試

### 基本 Slice 測試

```typescript
// features/counter/counterSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
  step: number;
  history: number[];
}

const initialState: CounterState = {
  value: 0,
  step: 1,
  history: [],
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.history.push(state.value);
      state.value += state.step;
    },
    decrement: (state) => {
      state.history.push(state.value);
      state.value -= state.step;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.history.push(state.value);
      state.value += action.payload;
    },
    setStep: (state, action: PayloadAction<number>) => {
      state.step = action.payload;
    },
    reset: (state) => {
      state.value = 0;
      state.step = 1;
      state.history = [];
    },
    undo: (state) => {
      if (state.history.length > 0) {
        state.value = state.history.pop()!;
      }
    },
  },
});

export const { increment, decrement, incrementByAmount, setStep, reset, undo } = counterSlice.actions;
export default counterSlice.reducer;
```

```typescript
// features/counter/counterSlice.test.ts
import { describe, test, expect } from 'vitest';
import counterReducer, {
  increment,
  decrement,
  incrementByAmount,
  setStep,
  reset,
  undo,
  CounterState,
} from './counterSlice';

describe('counter slice', () => {
  const initialState: CounterState = {
    value: 0,
    step: 1,
    history: [],
  };

  test('should return the initial state', () => {
    expect(counterReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  test('should handle increment', () => {
    const actual = counterReducer(initialState, increment());
    expect(actual.value).toEqual(1);
    expect(actual.history).toEqual([0]);
  });

  test('should handle decrement', () => {
    const actual = counterReducer(initialState, decrement());
    expect(actual.value).toEqual(-1);
    expect(actual.history).toEqual([0]);
  });

  test('should handle incrementByAmount', () => {
    const actual = counterReducer(initialState, incrementByAmount(2));
    expect(actual.value).toEqual(2);
    expect(actual.history).toEqual([0]);
  });

  test('should use custom step for increment', () => {
    const state = { ...initialState, step: 5 };
    const actual = counterReducer(state, increment());
    expect(actual.value).toEqual(5);
  });

  test('should handle setStep', () => {
    const actual = counterReducer(initialState, setStep(3));
    expect(actual.step).toEqual(3);
    expect(actual.value).toEqual(0); // value should remain unchanged
  });

  test('should handle reset', () => {
    const state: CounterState = {
      value: 10,
      step: 5,
      history: [0, 1, 2],
    };
    const actual = counterReducer(state, reset());
    expect(actual).toEqual(initialState);
  });

  test('should handle undo when history exists', () => {
    const state: CounterState = {
      value: 10,
      step: 1,
      history: [0, 5],
    };
    const actual = counterReducer(state, undo());
    expect(actual.value).toEqual(5);
    expect(actual.history).toEqual([0]);
  });

  test('should not change value when undo with empty history', () => {
    const actual = counterReducer(initialState, undo());
    expect(actual.value).toEqual(0);
    expect(actual.history).toEqual([]);
  });

  test('should maintain history correctly with multiple actions', () => {
    let state = initialState;
    
    state = counterReducer(state, increment()); // 0 -> 1
    expect(state.history).toEqual([0]);
    
    state = counterReducer(state, increment()); // 1 -> 2
    expect(state.history).toEqual([0, 1]);
    
    state = counterReducer(state, incrementByAmount(3)); // 2 -> 5
    expect(state.history).toEqual([0, 1, 2]);
    
    state = counterReducer(state, undo()); // 5 -> 2
    expect(state.value).toEqual(2);
    expect(state.history).toEqual([0, 1]);
  });

  // 測試 Immer 不變性
  test('should not mutate the original state', () => {
    const originalState = { ...initialState };
    counterReducer(initialState, increment());
    expect(initialState).toEqual(originalState);
  });
});
```

## createAsyncThunk 測試

### 非同步 Thunk 實作

```typescript
// features/posts/postsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  publishedAt: string;
}

interface PostsState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  currentPost: Post | null;
}

const initialState: PostsState = {
  posts: [],
  loading: false,
  error: null,
  currentPost: null,
};

// 異步 thunk - 獲取所有文章
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data as Post[];
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);

// 異步 thunk - 獲取單個文章
export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/posts/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data as Post;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);

// 異步 thunk - 創建文章
export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData: Omit<Post, 'id' | 'publishedAt'>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data as Post;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);

export const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
    updatePostLocally: (state, action: PayloadAction<Post>) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // fetchPosts
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchPostById
    builder
      .addCase(fetchPostById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // createPost
    builder
      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts.push(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentPost, updatePostLocally } = postsSlice.actions;
export default postsSlice.reducer;
```

### createAsyncThunk 測試

```typescript
// features/posts/postsSlice.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import postsReducer, {
  fetchPosts,
  fetchPostById,
  createPost,
  clearError,
  clearCurrentPost,
  updatePostLocally,
  Post,
  PostsState,
} from './postsSlice';

// Mock fetch
global.fetch = vi.fn();

describe('posts slice', () => {
  let store: ReturnType<typeof configureStore>;
  
  beforeEach(() => {
    vi.resetAllMocks();
    store = configureStore({
      reducer: {
        posts: postsReducer,
      },
    });
  });

  const mockPosts: Post[] = [
    {
      id: 1,
      title: 'Test Post 1',
      content: 'Content 1',
      author: 'Author 1',
      publishedAt: '2023-01-01',
    },
    {
      id: 2,
      title: 'Test Post 2',
      content: 'Content 2',
      author: 'Author 2',
      publishedAt: '2023-01-02',
    },
  ];

  const initialState: PostsState = {
    posts: [],
    loading: false,
    error: null,
    currentPost: null,
  };

  describe('reducers', () => {
    test('should return the initial state', () => {
      expect(postsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    test('should handle clearError', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const actual = postsReducer(stateWithError, clearError());
      expect(actual.error).toBeNull();
    });

    test('should handle clearCurrentPost', () => {
      const stateWithCurrentPost = { ...initialState, currentPost: mockPosts[0] };
      const actual = postsReducer(stateWithCurrentPost, clearCurrentPost());
      expect(actual.currentPost).toBeNull();
    });

    test('should handle updatePostLocally', () => {
      const stateWithPosts = { ...initialState, posts: mockPosts };
      const updatedPost = { ...mockPosts[0], title: 'Updated Title' };
      const actual = postsReducer(stateWithPosts, updatePostLocally(updatedPost));
      
      expect(actual.posts[0].title).toBe('Updated Title');
      expect(actual.posts[1]).toEqual(mockPosts[1]); // 其他文章不變
    });
  });

  describe('fetchPosts async thunk', () => {
    test('should handle fetchPosts.pending', () => {
      const action = { type: fetchPosts.pending.type };
      const state = postsReducer(initialState, action);
      
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle fetchPosts.fulfilled', () => {
      const action = { type: fetchPosts.fulfilled.type, payload: mockPosts };
      const state = postsReducer(initialState, action);
      
      expect(state.loading).toBe(false);
      expect(state.posts).toEqual(mockPosts);
      expect(state.error).toBeNull();
    });

    test('should handle fetchPosts.rejected', () => {
      const errorMessage = 'Failed to fetch posts';
      const action = { type: fetchPosts.rejected.type, payload: errorMessage };
      const state = postsReducer(initialState, action);
      
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.posts).toEqual([]);
    });

    test('should fetch posts successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      });

      await store.dispatch(fetchPosts());
      
      const state = store.getState().posts;
      expect(state.loading).toBe(false);
      expect(state.posts).toEqual(mockPosts);
      expect(state.error).toBeNull();
    });

    test('should handle fetch posts error', async () => {
      const errorMessage = 'HTTP error! status: 500';
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await store.dispatch(fetchPosts());
      
      const state = store.getState().posts;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.posts).toEqual([]);
    });

    test('should handle network error', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await store.dispatch(fetchPosts());
      
      const state = store.getState().posts;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('fetchPostById async thunk', () => {
    test('should fetch single post successfully', async () => {
      const mockPost = mockPosts[0];
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPost,
      });

      await store.dispatch(fetchPostById(1));
      
      const state = store.getState().posts;
      expect(state.loading).toBe(false);
      expect(state.currentPost).toEqual(mockPost);
      expect(state.error).toBeNull();
    });

    test('should handle fetchPostById error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await store.dispatch(fetchPostById(999));
      
      const state = store.getState().posts;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('HTTP error! status: 404');
      expect(state.currentPost).toBeNull();
    });
  });

  describe('createPost async thunk', () => {
    test('should create post successfully', async () => {
      const newPostData = {
        title: 'New Post',
        content: 'New Content',
        author: 'New Author',
      };
      
      const createdPost: Post = {
        ...newPostData,
        id: 3,
        publishedAt: '2023-01-03',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => createdPost,
      });

      await store.dispatch(createPost(newPostData));
      
      const state = store.getState().posts;
      expect(state.loading).toBe(false);
      expect(state.posts).toContain(createdPost);
      expect(state.error).toBeNull();
    });

    test('should handle createPost error', async () => {
      const newPostData = {
        title: 'New Post',
        content: 'New Content',
        author: 'New Author',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await store.dispatch(createPost(newPostData));
      
      const state = store.getState().posts;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('HTTP error! status: 400');
    });
  });

  describe('integration tests', () => {
    test('should handle multiple async actions in sequence', async () => {
      // 1. 載入文章列表
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      });

      await store.dispatch(fetchPosts());
      let state = store.getState().posts;
      expect(state.posts).toHaveLength(2);

      // 2. 載入特定文章
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts[0],
      });

      await store.dispatch(fetchPostById(1));
      state = store.getState().posts;
      expect(state.currentPost).toEqual(mockPosts[0]);

      // 3. 創建新文章
      const newPost: Post = {
        id: 3,
        title: 'New Post',
        content: 'New Content',
        author: 'New Author',
        publishedAt: '2023-01-03',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => newPost,
      });

      await store.dispatch(createPost({
        title: 'New Post',
        content: 'New Content',
        author: 'New Author',
      }));

      state = store.getState().posts;
      expect(state.posts).toHaveLength(3);
      expect(state.posts).toContain(newPost);
    });
  });
});
```

## Store 設定與測試工具

```typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counterSlice';
import postsReducer from '../features/posts/postsSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    posts: postsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 測試用的 store 工廠函數
export const createTestStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      counter: counterReducer,
      posts: postsReducer,
    },
    preloadedState: preloadedState as RootState,
  });
};
```

```typescript
// test-utils/rtk-test-utils.tsx
import React from 'react';
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createTestStore, RootState } from '../store/store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof createTestStore>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// 輔助函數：建立測試狀態
export const createMockState = (overrides: Partial<RootState> = {}): Partial<RootState> => {
  return {
    counter: {
      value: 0,
      step: 1,
      history: [],
    },
    posts: {
      posts: [],
      loading: false,
      error: null,
      currentPost: null,
    },
    ...overrides,
  };
};

// 輔助函數：等待異步 action 完成
export const waitForAsyncAction = async (store: ReturnType<typeof createTestStore>) => {
  // 等待所有 pending 的 promise 完成
  await new Promise(resolve => setTimeout(resolve, 0));
};
```

## React 元件整合測試

```typescript
// components/PostsList.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchPosts, clearError } from '../features/posts/postsSlice';

export const PostsList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { posts, loading, error } = useSelector((state: RootState) => state.posts);

  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);

  const handleRetry = () => {
    dispatch(clearError());
    dispatch(fetchPosts());
  };

  if (loading) {
    return <div role="status" aria-label="Loading posts">Loading...</div>;
  }

  if (error) {
    return (
      <div role="alert">
        <p>Error: {error}</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  if (posts.length === 0) {
    return <div>No posts available</div>;
  }

  return (
    <div>
      <h2>Posts</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h3>{post.title}</h3>
            <p>By: {post.author}</p>
            <p>{post.content}</p>
            <small>Published: {post.publishedAt}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

```typescript
// components/PostsList.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockState } from '../test-utils/rtk-test-utils';
import { PostsList } from './PostsList';
import { Post } from '../features/posts/postsSlice';

// Mock fetch
global.fetch = vi.fn();

describe('PostsList Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockPosts: Post[] = [
    {
      id: 1,
      title: 'First Post',
      content: 'This is the first post',
      author: 'Alice',
      publishedAt: '2023-01-01',
    },
    {
      id: 2,
      title: 'Second Post',
      content: 'This is the second post',
      author: 'Bob',
      publishedAt: '2023-01-02',
    },
  ];

  test('should show loading state initially', () => {
    (fetch as any).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<PostsList />);
    
    expect(screen.getByRole('status', { name: /loading posts/i })).toBeInTheDocument();
  });

  test('should display posts when loaded successfully', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosts,
    });

    renderWithProviders(<PostsList />);

    await waitFor(() => {
      expect(screen.getByText('Posts')).toBeInTheDocument();
    });

    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
    expect(screen.getByText('By: Alice')).toBeInTheDocument();
    expect(screen.getByText('By: Bob')).toBeInTheDocument();
  });

  test('should display error message when fetch fails', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    renderWithProviders(<PostsList />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/Error: HTTP error! status: 500/)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  test('should retry loading posts when retry button is clicked', async () => {
    const user = userEvent.setup();
    
    // 第一次請求失敗
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { store } = renderWithProviders(<PostsList />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // 第二次請求成功
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosts,
    });

    const retryButton = screen.getByText('Retry');
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Posts')).toBeInTheDocument();
    });

    expect(screen.getByText('First Post')).toBeInTheDocument();
  });

  test('should display no posts message when posts array is empty', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderWithProviders(<PostsList />);

    await waitFor(() => {
      expect(screen.getByText('No posts available')).toBeInTheDocument();
    });
  });

  test('should work with preloaded state', () => {
    const preloadedState = createMockState({
      posts: {
        posts: mockPosts,
        loading: false,
        error: null,
        currentPost: null,
      },
    });

    renderWithProviders(<PostsList />, { preloadedState });

    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
  });

  test('should handle error state from preloaded state', () => {
    const preloadedState = createMockState({
      posts: {
        posts: [],
        loading: false,
        error: 'Connection failed',
        currentPost: null,
      },
    });

    renderWithProviders(<PostsList />, { preloadedState });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Error: Connection failed/)).toBeInTheDocument();
  });
});
```

## RTK Query 基礎測試

```typescript
// api/postsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Post } from '../features/posts/postsSlice';

export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Post'],
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], void>({
      query: () => 'posts',
      providesTags: ['Post'],
    }),
    getPost: builder.query<Post, number>({
      query: (id) => `posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    createPost: builder.mutation<Post, Omit<Post, 'id' | 'publishedAt'>>({
      query: (newPost) => ({
        url: 'posts',
        method: 'POST',
        body: newPost,
      }),
      invalidatesTags: ['Post'],
    }),
    updatePost: builder.mutation<Post, Partial<Post> & Pick<Post, 'id'>>({
      query: ({ id, ...patch }) => ({
        url: `posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
    }),
    deletePost: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = postsApi;
```

```typescript
// api/postsApi.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { postsApi } from './postsApi';
import { Post } from '../features/posts/postsSlice';

const mockPosts: Post[] = [
  {
    id: 1,
    title: 'Test Post',
    content: 'Test Content',
    author: 'Test Author',
    publishedAt: '2023-01-01',
  },
];

// MSW server setup
const server = setupServer(
  rest.get('/api/posts', (req, res, ctx) => {
    return res(ctx.json(mockPosts));
  }),
  rest.get('/api/posts/:id', (req, res, ctx) => {
    const id = parseInt(req.params.id as string);
    const post = mockPosts.find(p => p.id === id);
    if (post) {
      return res(ctx.json(post));
    }
    return res(ctx.status(404));
  }),
  rest.post('/api/posts', async (req, res, ctx) => {
    const newPost = await req.json() as Omit<Post, 'id' | 'publishedAt'>;
    const post: Post = {
      ...newPost,
      id: mockPosts.length + 1,
      publishedAt: new Date().toISOString(),
    };
    return res(ctx.json(post));
  })
);

describe('Posts API', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        postsApi: postsApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(postsApi.middleware),
    });
    setupListeners(store.dispatch);
  });

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('should fetch posts successfully', async () => {
    const promise = store.dispatch(postsApi.endpoints.getPosts.initiate());
    const result = await promise;

    expect(result.data).toEqual(mockPosts);
    expect(result.isSuccess).toBe(true);
  });

  test('should fetch single post successfully', async () => {
    const promise = store.dispatch(postsApi.endpoints.getPost.initiate(1));
    const result = await promise;

    expect(result.data).toEqual(mockPosts[0]);
    expect(result.isSuccess).toBe(true);
  });

  test('should handle post not found', async () => {
    const promise = store.dispatch(postsApi.endpoints.getPost.initiate(999));
    const result = await promise;

    expect(result.isError).toBe(true);
    expect(result.error).toMatchObject({
      status: 404,
    });
  });

  test('should create post successfully', async () => {
    const newPostData = {
      title: 'New Post',
      content: 'New Content',
      author: 'New Author',
    };

    const promise = store.dispatch(
      postsApi.endpoints.createPost.initiate(newPostData)
    );
    const result = await promise;

    expect(result.isSuccess).toBe(true);
    expect(result.data).toMatchObject(newPostData);
    expect(result.data?.id).toBeDefined();
  });
});
```

## 常見問題

**Q: Redux Toolkit 的測試和傳統 Redux 有什麼區別？**
A: RTK 的測試更簡潔，因為 createSlice 自動生成 action creators 和 action types，而且內建 Immer 處理不可變更新。

**Q: 如何測試 createAsyncThunk 的條件邏輯？**
A: 可以使用 thunk 的 condition 選項，或者在測試中模擬不同的狀態和參數來驗證條件邏輯。

**Q: RTK Query 的快取機制如何測試？**
A: 可以觸發相同的查詢多次，驗證只有第一次真正發送網路請求，或使用 MSW 來計算請求次數。

**Q: 如何測試 RTK 的中間件？**
A: 創建包含中間件的測試 store，然後驗證中間件的副作用，如日誌記錄或錯誤處理。

## 練習題

1. **購物車 Slice 擴展**
   ```typescript
   // 擴展購物車功能並撰寫完整測試：
   interface CartItem {
     id: string;
     name: string;
     price: number;
     quantity: number;
     imageUrl: string;
   }
   
   // Actions: addItem, removeItem, updateQuantity, clearCart, applyDiscount
   // AsyncThunks: validateCoupon, submitOrder
   ```

2. **使用者認證系統**
   ```typescript
   // 實作使用者認證的完整流程：
   interface AuthState {
     user: User | null;
     token: string | null;
     isLoading: boolean;
     error: string | null;
   }
   
   // AsyncThunks: login, logout, refreshToken, updateProfile
   // 包含錯誤處理和 token 過期機制
   ```

3. **RTK Query 進階功能**
   ```typescript
   // 實作包含以下功能的 API：
   // - 分頁查詢
   // - 搜尋過濾
   // - 樂觀更新
   // - 錯誤重試機制
   // - 快取失效策略
   ```

## 延伸閱讀

- [Redux Toolkit 官方文件](https://redux-toolkit.js.org/)
- [RTK Query 測試指南](https://redux-toolkit.js.org/rtk-query/usage/testing)
- [createAsyncThunk 詳細說明](https://redux-toolkit.js.org/api/createAsyncThunk)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Redux Toolkit 測試範例](https://github.com/reduxjs/redux-toolkit/tree/master/examples)

## 本日重點回顧

✅ 理解 Redux Toolkit 的測試優勢
✅ 學會測試 createSlice 建立的 slice
✅ 掌握 createAsyncThunk 的完整測試策略
✅ 了解 RTK Query 的基礎測試方法
✅ 建立 RTK 專用的測試工具函數
✅ 完成元件與 RTK 的整合測試
✅ 熟悉 MSW 在 API 測試中的應用

明天我們將學習 GraphQL 與 Apollo Client 的測試策略！
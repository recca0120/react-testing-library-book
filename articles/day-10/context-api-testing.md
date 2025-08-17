# Day 10: Context API 測試

## 學習目標
- 理解如何測試 React Context API
- 掌握自定義 render 函數的建立和使用
- 學會測試 Context Provider 和 Consumer
- 了解多重 Context 的測試策略

## 概念說明

React Context API 是 React 提供的狀態管理解決方案，允許我們在元件樹中共享數據而無需逐層傳遞 props。測試 Context 涉及以下挑戰：

1. **Provider 包裝**：需要在測試中提供適當的 Context 值
2. **值的變化**：測試 Context 值變化時元件的反應
3. **多重 Context**：處理多個 Context 的組合
4. **自定義 Hooks**：測試使用 Context 的自定義 Hooks

### 測試策略

1. **包裝 Provider**：為測試元件提供必要的 Context
2. **自定義 render**：創建可重用的測試工具函數
3. **Mock Context**：必要時模擬 Context 值
4. **整合測試**：測試 Provider 和 Consumer 的完整交互

## 實作範例

### 基礎 Theme Context

```typescript
// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  initialTheme = 'light' 
}) => {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Theme Context 測試

```typescript
// contexts/__tests__/ThemeContext.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../ThemeContext';

// 測試元件
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-button">
        Toggle Theme
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  it('should provide default theme value', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('should use initial theme value', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('should toggle theme when button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeElement = screen.getByTestId('theme');
    const toggleButton = screen.getByTestId('toggle-button');

    expect(themeElement).toHaveTextContent('light');

    await user.click(toggleButton);
    expect(themeElement).toHaveTextContent('dark');

    await user.click(toggleButton);
    expect(themeElement).toHaveTextContent('light');
  });

  it('should throw error when useTheme is used outside provider', () => {
    // 使用 console.error mock 來避免測試中的錯誤輸出
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleError.mockRestore();
  });
});
```

### 複雜的用戶認證 Context

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
  authService?: {
    login: (email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
    getCurrentUser: () => Promise<User | null>;
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  authService 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (authService) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [authService]);

  const login = async (email: string, password: string) => {
    if (!authService) throw new Error('Auth service not provided');
    
    setIsLoading(true);
    try {
      const loggedInUser = await authService.login(email, password);
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!authService) return;
    
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Auth Context 測試

```typescript
// contexts/__tests__/AuthContext.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';

// 測試元件
const AuthTestComponent = () => {
  const { user, isLoading, login, logout } = useAuth();

  if (isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }

  return (
    <div>
      {user ? (
        <div>
          <span data-testid="user-name">{user.name}</span>
          <button onClick={logout} data-testid="logout-button">
            Logout
          </button>
        </div>
      ) : (
        <button 
          onClick={() => login('test@example.com', 'password')} 
          data-testid="login-button"
        >
          Login
        </button>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  const mockAuthService = {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should show loading initially', () => {
    mockAuthService.getCurrentUser.mockImplementation(
      () => new Promise(() => {}) // 永不解決的 Promise
    );

    render(
      <AuthProvider authService={mockAuthService}>
        <AuthTestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should show login button when no user is authenticated', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null);

    render(
      <AuthProvider authService={mockAuthService}>
        <AuthTestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });
  });

  it('should show user info when authenticated', async () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com'
    };

    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    render(
      <AuthProvider authService={mockAuthService}>
        <AuthTestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    });
  });

  it('should handle login flow', async () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com'
    };

    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.login.mockResolvedValue(mockUser);

    const user = userEvent.setup();

    render(
      <AuthProvider authService={mockAuthService}>
        <AuthTestComponent />
      </AuthProvider>
    );

    // 等待初始載入完成
    await waitFor(() => {
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });

    // 點擊登入
    await user.click(screen.getByTestId('login-button'));

    // 驗證登入方法被調用
    expect(mockAuthService.login).toHaveBeenCalledWith(
      'test@example.com', 
      'password'
    );

    // 等待登入完成
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    });
  });

  it('should handle logout flow', async () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com'
    };

    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.logout.mockResolvedValue(undefined);

    const user = userEvent.setup();

    render(
      <AuthProvider authService={mockAuthService}>
        <AuthTestComponent />
      </AuthProvider>
    );

    // 等待用戶資訊顯示
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toBeInTheDocument();
    });

    // 點擊登出
    await user.click(screen.getByTestId('logout-button'));

    // 驗證登出方法被調用
    expect(mockAuthService.logout).toHaveBeenCalled();

    // 等待登出完成
    await waitFor(() => {
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });
  });
});
```

### 自定義 Render 函數

```typescript
// test-utils/render.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: 'light' | 'dark';
  authService?: any;
  user?: any;
}

const AllProviders: React.FC<{
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  authService?: any;
}> = ({ children, theme = 'light', authService }) => {
  return (
    <ThemeProvider initialTheme={theme}>
      <AuthProvider authService={authService}>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { theme, authService, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders theme={theme} authService={authService}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
};

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
```

### 使用自定義 Render 函數

```typescript
// components/__tests__/UserProfile.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../test-utils/render'; // 使用自定義 render
import { UserProfile } from '../UserProfile';

const UserProfile = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  if (!user) {
    return <div data-testid="no-user">Please login</div>;
  }

  return (
    <div 
      data-testid="user-profile" 
      className={`profile-${theme}`}
    >
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};

describe('UserProfile with Custom Render', () => {
  const mockAuthService = {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  };

  it('should show login message when no user', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null);

    render(<UserProfile />, {
      authService: mockAuthService,
    });

    await screen.findByTestId('no-user');
    expect(screen.getByText('Please login')).toBeInTheDocument();
  });

  it('should show user profile with dark theme', async () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com'
    };

    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    render(<UserProfile />, {
      authService: mockAuthService,
      theme: 'dark',
    });

    await screen.findByTestId('user-profile');
    
    const profile = screen.getByTestId('user-profile');
    expect(profile).toHaveClass('profile-dark');
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### 測試 Context Hooks

```typescript
// hooks/__tests__/useAuth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

const wrapper = ({ children, authService }: any) => (
  <AuthProvider authService={authService}>
    {children}
  </AuthProvider>
);

describe('useAuth Hook', () => {
  const mockAuthService = {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return initial auth state', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => wrapper({ children, authService: mockAuthService }),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBe(null);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should login successfully', async () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com'
    };

    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.login.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => wrapper({ children, authService: mockAuthService }),
    });

    // 等待初始載入完成
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 執行登入
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(mockAuthService.login).toHaveBeenCalledWith(
      'test@example.com',
      'password'
    );
  });
});
```

## 常見問題

### Q: 如何測試 Context 值為 undefined 的情況？

**A:** 直接在沒有 Provider 的情況下渲染使用 Context 的元件：

```typescript
it('should throw error when used outside provider', () => {
  expect(() => {
    render(<ComponentUsingContext />);
  }).toThrow('must be used within a Provider');
});
```

### Q: 如何測試多個 Context 的組合？

**A:** 創建包含多個 Provider 的包裝元件：

```typescript
const MultipleProviders = ({ children }) => (
  <ThemeProvider>
    <AuthProvider>
      <LocaleProvider>
        {children}
      </LocaleProvider>
    </AuthProvider>
  </ThemeProvider>
);
```

### Q: 如何避免在每個測試中重複設置 Provider？

**A:** 使用自定義 render 函數或 setup 函數：

```typescript
const renderWithProviders = (component, options = {}) => {
  return render(
    <AllProviders {...options}>
      {component}
    </AllProviders>
  );
};
```

## 練習題

### 練習 1：購物車 Context
創建一個購物車 Context，包含：
- 添加/移除商品功能
- 計算總價
- 清空購物車
撰寫完整的測試套件。

### 練習 2：多語言 Context
實現國際化 Context：
- 語言切換
- 翻譯函數
- 語言偏好持久化
測試各種語言切換場景。

### 練習 3：通知系統 Context
建立通知管理系統：
- 顯示/隱藏通知
- 不同類型的通知
- 自動消失機制
測試通知的生命周期。

## 延伸閱讀

- [React Context Testing Patterns](https://kentcdodds.com/blog/how-to-test-react-context)
- [Testing Library Provider Patterns](https://testing-library.com/docs/react-testing-library/setup/#custom-render)
- [React Context Best Practices](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
- [Advanced Context Patterns](https://kentcdodds.com/blog/application-state-management-with-react)

## 本日重點回顧

1. **Context 測試重點**：Provider 包裝、值傳遞、狀態變化
2. **自定義 render**：創建可重用的測試工具
3. **Mock Context**：模擬依賴服務和外部狀態
4. **Hook 測試**：使用 renderHook 測試 Context Hooks
5. **測試組織**：合理的測試結構和輔助函數

明天我們將學習 Router 測試，探討如何測試 React Router 的路由功能。
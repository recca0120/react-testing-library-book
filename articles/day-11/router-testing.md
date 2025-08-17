# Day 11: Router 測試 - React Router

## 學習目標
- 理解 React Router 測試的核心概念
- 掌握 MemoryRouter 的使用方法
- 學會測試路由導航和參數傳遞
- 了解如何測試路由守衛和保護路由

## 概念說明

React Router 是 React 應用程式中最常用的路由解決方案。測試路由功能涉及以下方面：

1. **路由渲染**：驗證正確的元件在對應路由下渲染
2. **導航測試**：測試程式化導航和使用者導航
3. **參數傳遞**：測試 URL 參數、查詢參數的處理
4. **路由保護**：測試認證和授權相關的路由邏輯

### 測試工具

1. **MemoryRouter**：在記憶體中模擬路由，不依賴瀏覽器歷史記錄
2. **createMemoryHistory**：創建可控制的歷史記錄物件
3. **Router + history**：完全控制路由狀態

## 實作範例

### 基礎路由設置

```typescript
// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from './components/Home';
import { About } from './components/About';
import { UserProfile } from './components/UserProfile';
import { NotFound } from './components/NotFound';

export const App: React.FC = () => {
  return (
    <Router>
      <nav>
        <Link to="/" data-testid="home-link">Home</Link>
        <Link to="/about" data-testid="about-link">About</Link>
        <Link to="/user/123" data-testid="user-link">User Profile</Link>
      </nav>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};
```

### 基礎元件

```typescript
// components/Home.tsx
import React from 'react';

export const Home: React.FC = () => {
  return (
    <div data-testid="home-page">
      <h1>Home Page</h1>
      <p>Welcome to the home page</p>
    </div>
  );
};

// components/About.tsx
import React from 'react';

export const About: React.FC = () => {
  return (
    <div data-testid="about-page">
      <h1>About Page</h1>
      <p>This is the about page</p>
    </div>
  );
};

// components/UserProfile.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div data-testid="user-profile-page">
      <h1>User Profile</h1>
      <p data-testid="user-id">User ID: {id}</p>
      <button onClick={handleGoBack} data-testid="go-back-button">
        Go Back
      </button>
      <button onClick={handleGoHome} data-testid="go-home-button">
        Go Home
      </button>
    </div>
  );
};

// components/NotFound.tsx
import React from 'react';

export const NotFound: React.FC = () => {
  return (
    <div data-testid="not-found-page">
      <h1>404 - Page Not Found</h1>
    </div>
  );
};
```

### 基礎路由測試

```typescript
// __tests__/App.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';

// 輔助函數：使用 MemoryRouter 渲染
const renderWithRouter = (initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
};

describe('App Routing', () => {
  it('should render home page by default', () => {
    renderWithRouter();
    
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('should render about page when navigating to /about', () => {
    renderWithRouter(['/about']);
    
    expect(screen.getByTestId('about-page')).toBeInTheDocument();
    expect(screen.getByText('About Page')).toBeInTheDocument();
  });

  it('should render user profile page with correct ID', () => {
    renderWithRouter(['/user/123']);
    
    expect(screen.getByTestId('user-profile-page')).toBeInTheDocument();
    expect(screen.getByTestId('user-id')).toHaveTextContent('User ID: 123');
  });

  it('should render not found page for invalid routes', () => {
    renderWithRouter(['/invalid-route']);
    
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument();
  });

  it('should navigate using links', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    // 初始在首頁
    expect(screen.getByTestId('home-page')).toBeInTheDocument();

    // 點擊 About 連結
    await user.click(screen.getByTestId('about-link'));
    expect(screen.getByTestId('about-page')).toBeInTheDocument();

    // 點擊 User 連結
    await user.click(screen.getByTestId('user-link'));
    expect(screen.getByTestId('user-profile-page')).toBeInTheDocument();
    expect(screen.getByText('User ID: 123')).toBeInTheDocument();
  });
});
```

### 程式化導航測試

```typescript
// __tests__/UserProfile.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { UserProfile } from '../components/UserProfile';

const renderWithHistory = (initialPath: string) => {
  const history = createMemoryHistory({ initialEntries: [initialPath] });
  
  return {
    history,
    ...render(
      <Router location={history.location} navigator={history}>
        <UserProfile />
      </Router>
    ),
  };
};

describe('UserProfile Navigation', () => {
  it('should navigate back when go back button is clicked', async () => {
    const user = userEvent.setup();
    const { history } = renderWithHistory('/user/456');
    
    // 模擬有歷史記錄
    history.push('/some-other-page');
    history.push('/user/456');
    
    expect(screen.getByText('User ID: 456')).toBeInTheDocument();

    await user.click(screen.getByTestId('go-back-button'));
    
    // 檢查是否回到上一頁
    expect(history.location.pathname).toBe('/some-other-page');
  });

  it('should navigate to home when go home button is clicked', async () => {
    const user = userEvent.setup();
    const { history } = renderWithHistory('/user/789');

    await user.click(screen.getByTestId('go-home-button'));
    
    expect(history.location.pathname).toBe('/');
  });
});
```

### 路由保護測試

```typescript
// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactElement;
  isAuthenticated: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  isAuthenticated 
}) => {
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  return children;
};
```

```typescript
// components/Dashboard.tsx
import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div data-testid="dashboard">
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  );
};

// components/Login.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = () => {
    // 模擬登入邏輯
    navigate(from, { replace: true });
  };

  return (
    <div data-testid="login-page">
      <h1>Login</h1>
      <button onClick={handleLogin} data-testid="login-button">
        Login
      </button>
    </div>
  );
};
```

```typescript
// __tests__/ProtectedRoute.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Dashboard } from '../components/Dashboard';
import { Login } from '../components/Login';

const renderProtectedRoute = (isAuthenticated: boolean, initialPath: string = '/dashboard') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/login" element={<Login />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  it('should render protected component when authenticated', () => {
    renderProtectedRoute(true);
    
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome to your dashboard!')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    renderProtectedRoute(false);
    
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  it('should preserve original location for redirect after login', async () => {
    const user = userEvent.setup();
    renderProtectedRoute(false, '/dashboard');

    // 應該被重定向到登入頁面
    expect(screen.getByTestId('login-page')).toBeInTheDocument();

    // 點擊登入應該回到原始頁面
    await user.click(screen.getByTestId('login-button'));
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });
});
```

### 查詢參數測試

```typescript
// components/SearchResults.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

interface SearchResult {
  id: number;
  title: string;
}

export const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    if (!query) return;

    setLoading(true);
    // 模擬 API 調用
    setTimeout(() => {
      const mockResults = Array.from({ length: 5 }, (_, i) => ({
        id: (page - 1) * 5 + i + 1,
        title: `Result ${(page - 1) * 5 + i + 1} for "${query}"`
      }));
      setResults(mockResults);
      setLoading(false);
    }, 100);
  }, [query, page]);

  const handleNextPage = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', (page + 1).toString());
    setSearchParams(newParams);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', (page - 1).toString());
      setSearchParams(newParams);
    }
  };

  if (!query) {
    return <div data-testid="no-query">Please enter a search query</div>;
  }

  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }

  return (
    <div data-testid="search-results">
      <h2>Search Results for: "{query}"</h2>
      <p data-testid="page-info">Page {page}</p>
      
      <ul>
        {results.map(result => (
          <li key={result.id} data-testid={`result-${result.id}`}>
            {result.title}
          </li>
        ))}
      </ul>

      <div>
        <button 
          onClick={handlePrevPage} 
          disabled={page <= 1}
          data-testid="prev-button"
        >
          Previous
        </button>
        <button 
          onClick={handleNextPage}
          data-testid="next-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};
```

```typescript
// __tests__/SearchResults.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SearchResults } from '../components/SearchResults';

const renderWithQuery = (query: string, page?: number) => {
  const searchParams = new URLSearchParams({ q: query });
  if (page) {
    searchParams.set('page', page.toString());
  }
  
  return render(
    <MemoryRouter initialEntries={[`/search?${searchParams.toString()}`]}>
      <SearchResults />
    </MemoryRouter>
  );
};

describe('SearchResults', () => {
  it('should show message when no query provided', () => {
    render(
      <MemoryRouter initialEntries={['/search']}>
        <SearchResults />
      </MemoryRouter>
    );

    expect(screen.getByTestId('no-query')).toBeInTheDocument();
  });

  it('should display search results for query', async () => {
    renderWithQuery('react');

    expect(screen.getByTestId('loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });

    expect(screen.getByText('Search Results for: "react"')).toBeInTheDocument();
    expect(screen.getByText('Result 1 for "react"')).toBeInTheDocument();
  });

  it('should handle pagination', async () => {
    const user = userEvent.setup();
    renderWithQuery('javascript');

    // 等待結果載入
    await waitFor(() => {
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });

    expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1');

    // 點擊下一頁
    await user.click(screen.getByTestId('next-button'));

    await waitFor(() => {
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 2');
    });

    expect(screen.getByText('Result 6 for "javascript"')).toBeInTheDocument();
  });

  it('should disable previous button on first page', async () => {
    renderWithQuery('typescript');

    await waitFor(() => {
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });

    const prevButton = screen.getByTestId('prev-button');
    expect(prevButton).toBeDisabled();
  });

  it('should render specific page from URL', async () => {
    renderWithQuery('vue', 3);

    await waitFor(() => {
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });

    expect(screen.getByTestId('page-info')).toHaveTextContent('Page 3');
    expect(screen.getByText('Result 11 for "vue"')).toBeInTheDocument();
  });
});
```

## 常見問題

### Q: 什麼時候使用 MemoryRouter vs BrowserRouter 測試？

**A:** 
- **MemoryRouter**：單元測試和整合測試，完全控制路由狀態
- **BrowserRouter**：E2E 測試，模擬真實瀏覽器環境

### Q: 如何測試巢狀路由？

**A:** 使用完整的路由配置：

```typescript
render(
  <MemoryRouter initialEntries={['/parent/child']}>
    <Routes>
      <Route path="/parent/*" element={<ParentComponent />} />
    </Routes>
  </MemoryRouter>
);
```

### Q: 如何測試路由轉場和載入狀態？

**A:** 結合 React.Suspense 和非同步元件測試：

```typescript
const LazyComponent = React.lazy(() => import('./LazyComponent'));

render(
  <MemoryRouter>
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  </MemoryRouter>
);
```

## 練習題

### 練習 1：多步驟表單路由
創建一個包含多個步驟的表單，每個步驟都有獨立的路由：
- 測試步驟間的導航
- 測試表單數據的保存和恢復
- 測試驗證失敗時的行為

### 練習 2：權限系統
實現基於角色的路由保護：
- 不同角色看到不同的路由
- 測試權限升級和降級
- 測試未授權訪問的重定向

### 練習 3：動態路由
創建動態生成的路由系統：
- 基於配置動態生成路由
- 測試路由參數驗證
- 測試路由沒有找到的情況

## 延伸閱讀

- [Testing React Router](https://reactrouter.com/en/main/start/faq#how-do-i-test-with-react-router)
- [React Router Testing Strategies](https://kentcdodds.com/blog/testing-react-router)
- [Memory Router vs Browser Router](https://reactrouter.com/en/main/router-components/memory-router)
- [Advanced Router Testing Patterns](https://testing-library.com/docs/example-react-router/)

## 本日重點回顧

1. **MemoryRouter**：測試中的首選路由器
2. **路由測試策略**：從基本渲染到複雜導航
3. **程式化導航**：測試 navigate 和 history 操作
4. **路由保護**：認證和授權邏輯測試
5. **查詢參數**：URL 狀態管理測試

明天我們將學習表單驗證測試，探討如何全面測試表單的各種驗證場景。
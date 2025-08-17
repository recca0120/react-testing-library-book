# Day 24: 錯誤邊界測試

## 學習目標

- 了解 React Error Boundary 的概念和用途
- 學會建立和測試錯誤邊界元件
- 掌握錯誤捕捉和處理的測試方法
- 測試錯誤恢復和重試機制
- 處理非同步錯誤和網路錯誤
- 實作完整的錯誤處理測試策略

## Error Boundary 概念

### 什麼是 Error Boundary？

Error Boundary 是 React 元件，可以捕捉其子元件樹中的 JavaScript 錯誤，記錄錯誤並顯示備用 UI，而不會讓整個元件樹崩潰。

### Error Boundary 的限制

Error Boundary **無法** 捕捉以下錯誤：
- 事件處理中的錯誤
- 非同步程式碼中的錯誤
- 伺服器端渲染中的錯誤
- Error Boundary 自身的錯誤

## 基本 Error Boundary 實作

### 簡單的 Error Boundary

```typescript
// src/components/ErrorBoundary/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // 呼叫錯誤處理回調
    this.props.onError?.(error, errorInfo);

    // 記錄錯誤到監控服務
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 自定義錯誤 UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 預設錯誤 UI
      return (
        <div className="error-boundary" data-testid="error-boundary">
          <h2>出現錯誤了</h2>
          <p>很抱歉，發生了未預期的錯誤。</p>
          {process.env.NODE_ENV === 'development' && (
            <details data-testid="error-details">
              <summary>錯誤詳情（開發模式）</summary>
              <pre>{this.state.error?.stack}</pre>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 進階 Error Boundary

```typescript
// src/components/ErrorBoundary/AdvancedErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface AdvancedErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

interface AdvancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export class AdvancedErrorBoundary extends Component<
  AdvancedErrorBoundaryProps,
  AdvancedErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: AdvancedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AdvancedErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  static getDerivedStateFromProps(
    props: AdvancedErrorBoundaryProps,
    state: AdvancedErrorBoundaryState
  ): Partial<AdvancedErrorBoundaryState> | null {
    const { resetOnPropsChange, resetKeys } = props;
    
    if (resetOnPropsChange && state.hasError) {
      return {
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: 0,
      };
    }

    return null;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleRetry = (): void => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: retryCount + 1,
      });
    }
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
    });
  };

  render(): ReactNode {
    const { children, fallback, maxRetries = 3 } = this.props;
    const { hasError, error, retryCount } = this.state;

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      return (
        <div className="advanced-error-boundary" data-testid="advanced-error-boundary">
          <div className="error-content">
            <h2>出現錯誤了</h2>
            <p>很抱歉，發生了未預期的錯誤。</p>
            
            <div className="error-actions">
              {retryCount < maxRetries && (
                <button 
                  onClick={this.handleRetry}
                  data-testid="retry-button"
                >
                  重試 ({retryCount + 1}/{maxRetries + 1})
                </button>
              )}
              
              <button 
                onClick={this.handleReset}
                data-testid="reset-button"
              >
                重設
              </button>
            </div>

            {retryCount >= maxRetries && (
              <div className="max-retries-message" data-testid="max-retries-message">
                已達到最大重試次數，請重新載入頁面或聯繫支援。
              </div>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}
```

## 錯誤邊界測試

### 測試用的錯誤元件

```typescript
// src/__tests__/helpers/ErrorComponents.tsx
import React from 'react';

// 會拋出錯誤的測試元件
export const ThrowingComponent: React.FC<{ shouldThrow?: boolean; message?: string }> = ({
  shouldThrow = true,
  message = 'Test error',
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>正常元件</div>;
};

// 非同步錯誤元件（Error Boundary 無法捕捉）
export const AsyncThrowingComponent: React.FC<{ shouldThrow?: boolean }> = ({
  shouldThrow = true,
}) => {
  React.useEffect(() => {
    if (shouldThrow) {
      setTimeout(() => {
        throw new Error('Async error');
      }, 0);
    }
  }, [shouldThrow]);

  return <div>非同步元件</div>;
};

// 事件處理錯誤元件（Error Boundary 無法捕捉）
export const EventThrowingComponent: React.FC = () => {
  const handleClick = () => {
    throw new Error('Event handler error');
  };

  return (
    <button onClick={handleClick} data-testid="event-error-button">
      點擊觸發錯誤
    </button>
  );
};

// 條件性錯誤元件
export const ConditionalErrorComponent: React.FC<{ errorCondition?: boolean }> = ({
  errorCondition = false,
}) => {
  if (errorCondition) {
    throw new Error('Conditional error');
  }
  return <div data-testid="conditional-content">條件性內容</div>;
};
```

### 基本 Error Boundary 測試

```typescript
// src/components/ErrorBoundary/ErrorBoundary.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { ThrowingComponent } from '../../__tests__/helpers/ErrorComponents';

// 抑制 console.error 在測試中的輸出
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe('ErrorBoundary Component', () => {
  describe('Normal Operation', () => {
    test('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-component">正常內容</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child-component')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('catches and displays error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByText('出現錯誤了')).toBeInTheDocument();
      expect(screen.getByText('很抱歉，發生了未預期的錯誤。')).toBeInTheDocument();
    });

    test('shows error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowingComponent message="Test error message" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-details')).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    test('hides error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByTestId('error-details')).not.toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    test('calls onError callback when error occurs', () => {
      const mockOnError = vi.fn();

      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowingComponent message="Callback test error" />
        </ErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalledTimes(1);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe('Custom Fallback', () => {
    test('renders custom fallback UI when provided', () => {
      const customFallback = (
        <div data-testid="custom-fallback">自定義錯誤頁面</div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('自定義錯誤頁面')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Errors', () => {
    test('handles multiple child errors correctly', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} message="First error" />
          <ThrowingComponent shouldThrow={true} message="Second error" />
        </ErrorBoundary>
      );

      // ErrorBoundary 應該捕捉第一個錯誤並顯示錯誤 UI
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });
});
```

### 進階 Error Boundary 測試

```typescript
// src/components/ErrorBoundary/AdvancedErrorBoundary.test.tsx
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvancedErrorBoundary } from './AdvancedErrorBoundary';
import { ThrowingComponent, ConditionalErrorComponent } from '../../__tests__/helpers/ErrorComponents';

const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe('AdvancedErrorBoundary Component', () => {
  describe('Basic Error Handling', () => {
    test('renders error UI with retry functionality', () => {
      render(
        <AdvancedErrorBoundary maxRetries={2}>
          <ThrowingComponent />
        </AdvancedErrorBoundary>
      );

      expect(screen.getByTestId('advanced-error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
      expect(screen.getByText('重試 (1/3)')).toBeInTheDocument();
    });

    test('handles retry attempts correctly', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const TestComponent = () => {
        return <ThrowingComponent shouldThrow={shouldThrow} />;
      };

      render(
        <AdvancedErrorBoundary maxRetries={2}>
          <TestComponent />
        </AdvancedErrorBoundary>
      );

      // 初始錯誤狀態
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      expect(screen.getByText('重試 (1/3)')).toBeInTheDocument();

      // 第一次重試（仍會失敗）
      await user.click(screen.getByTestId('retry-button'));
      
      await waitFor(() => {
        expect(screen.getByText('重試 (2/3)')).toBeInTheDocument();
      });

      // 第二次重試（仍會失敗）
      await user.click(screen.getByTestId('retry-button'));
      
      await waitFor(() => {
        expect(screen.getByText('重試 (3/3)')).toBeInTheDocument();
      });

      // 達到最大重試次數
      await user.click(screen.getByTestId('retry-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('max-retries-message')).toBeInTheDocument();
        expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
      });
    });

    test('successful retry recovers from error', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const TestComponent = () => {
        return <ThrowingComponent shouldThrow={shouldThrow} />;
      };

      const { rerender } = render(
        <AdvancedErrorBoundary>
          <TestComponent />
        </AdvancedErrorBoundary>
      );

      // 確認錯誤狀態
      expect(screen.getByTestId('advanced-error-boundary')).toBeInTheDocument();

      // 修復錯誤條件
      shouldThrow = false;
      
      // 重試
      await user.click(screen.getByTestId('retry-button'));
      
      // 重新渲染以反映狀態變化
      rerender(
        <AdvancedErrorBoundary>
          <TestComponent />
        </AdvancedErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('advanced-error-boundary')).not.toBeInTheDocument();
        expect(screen.getByText('正常元件')).toBeInTheDocument();
      });
    });

    test('reset functionality works correctly', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const TestComponent = () => {
        return <ThrowingComponent shouldThrow={shouldThrow} />;
      };

      render(
        <AdvancedErrorBoundary>
          <TestComponent />
        </AdvancedErrorBoundary>
      );

      // 確認錯誤狀態
      expect(screen.getByTestId('advanced-error-boundary')).toBeInTheDocument();

      // 修復錯誤條件並重設
      shouldThrow = false;
      await user.click(screen.getByTestId('reset-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('advanced-error-boundary')).not.toBeInTheDocument();
        expect(screen.getByText('正常元件')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Fallback', () => {
    test('renders custom fallback with retry function', () => {
      const customFallback = (error: Error, retry: () => void) => (
        <div data-testid="custom-advanced-fallback">
          <p>自定義錯誤: {error.message}</p>
          <button onClick={retry} data-testid="custom-retry">
            自定義重試
          </button>
        </div>
      );

      render(
        <AdvancedErrorBoundary fallback={customFallback}>
          <ThrowingComponent message="自定義錯誤訊息" />
        </AdvancedErrorBoundary>
      );

      expect(screen.getByTestId('custom-advanced-fallback')).toBeInTheDocument();
      expect(screen.getByText('自定義錯誤: 自定義錯誤訊息')).toBeInTheDocument();
      expect(screen.getByTestId('custom-retry')).toBeInTheDocument();
    });
  });

  describe('Props-based Reset', () => {
    test('resets error state when resetOnPropsChange is true', async () => {
      let errorCondition = true;

      const TestWrapper = ({ condition }: { condition: boolean }) => (
        <AdvancedErrorBoundary resetOnPropsChange={true}>
          <ConditionalErrorComponent errorCondition={condition} />
        </AdvancedErrorBoundary>
      );

      const { rerender } = render(<TestWrapper condition={errorCondition} />);

      // 確認錯誤狀態
      expect(screen.getByTestId('advanced-error-boundary')).toBeInTheDocument();

      // 改變 props 以觸發重設
      errorCondition = false;
      rerender(<TestWrapper condition={errorCondition} />);

      await waitFor(() => {
        expect(screen.queryByTestId('advanced-error-boundary')).not.toBeInTheDocument();
        expect(screen.getByTestId('conditional-content')).toBeInTheDocument();
      });
    });
  });

  describe('Error Callback', () => {
    test('calls onError callback with correct parameters', () => {
      const mockOnError = vi.fn();

      render(
        <AdvancedErrorBoundary onError={mockOnError}>
          <ThrowingComponent message="回調測試錯誤" />
        </AdvancedErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalledTimes(1);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '回調測試錯誤',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });
});
```

## 實際應用場景測試

### API 錯誤處理測試

```typescript
// src/components/ProductList/ProductList.tsx
import React from 'react';
import { AdvancedErrorBoundary } from '../ErrorBoundary/AdvancedErrorBoundary';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ProductListProps {
  products: Product[];
}

const ProductItem: React.FC<{ product: Product }> = ({ product }) => {
  // 模擬可能拋出錯誤的情況
  if (!product.name || product.price < 0) {
    throw new Error(`Invalid product data: ${JSON.stringify(product)}`);
  }

  return (
    <div className="product-item" data-testid={`product-${product.id}`}>
      <h3>{product.name}</h3>
      <p>價格: ${product.price}</p>
    </div>
  );
};

export const ProductList: React.FC<ProductListProps> = ({ products }) => {
  return (
    <div className="product-list">
      <h2>商品列表</h2>
      <AdvancedErrorBoundary
        maxRetries={2}
        fallback={(error, retry) => (
          <div className="product-error" data-testid="product-error">
            <p>無法載入商品資料</p>
            <p>錯誤: {error.message}</p>
            <button onClick={retry} data-testid="product-retry">
              重新載入商品
            </button>
          </div>
        )}
      >
        {products.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </AdvancedErrorBoundary>
    </div>
  );
};
```

### 應用場景測試

```typescript
// src/components/ProductList/ProductList.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductList } from './ProductList';

const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe('ProductList Error Handling', () => {
  const validProducts = [
    { id: '1', name: 'Laptop', price: 999 },
    { id: '2', name: 'Phone', price: 599 },
  ];

  const invalidProducts = [
    { id: '1', name: 'Laptop', price: 999 },
    { id: '2', name: '', price: -100 }, // 無效產品資料
  ];

  describe('Normal Operation', () => {
    test('renders product list with valid data', () => {
      render(<ProductList products={validProducts} />);

      expect(screen.getByText('商品列表')).toBeInTheDocument();
      expect(screen.getByTestId('product-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-2')).toBeInTheDocument();
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
    });
  });

  describe('Error Scenarios', () => {
    test('handles invalid product data gracefully', () => {
      render(<ProductList products={invalidProducts} />);

      expect(screen.getByTestId('product-error')).toBeInTheDocument();
      expect(screen.getByText('無法載入商品資料')).toBeInTheDocument();
      expect(screen.getByTestId('product-retry')).toBeInTheDocument();
    });

    test('shows specific error message for invalid data', () => {
      render(<ProductList products={invalidProducts} />);

      const errorMessage = screen.getByText(/錯誤:/);
      expect(errorMessage).toHaveTextContent('Invalid product data');
    });

    test('allows retry on product loading error', async () => {
      const user = userEvent.setup();
      
      render(<ProductList products={invalidProducts} />);

      const retryButton = screen.getByTestId('product-retry');
      expect(retryButton).toBeInTheDocument();

      await user.click(retryButton);

      // 錯誤仍會存在，因為資料沒有修正
      expect(screen.getByTestId('product-error')).toBeInTheDocument();
    });
  });

  describe('Empty Product List', () => {
    test('handles empty product list without error', () => {
      render(<ProductList products={[]} />);

      expect(screen.getByText('商品列表')).toBeInTheDocument();
      expect(screen.queryByTestId('product-error')).not.toBeInTheDocument();
    });
  });
});
```

## 非同步錯誤處理

雖然 Error Boundary 無法直接捕捉非同步錯誤，但我們可以建立機制來處理這些情況：

```typescript
// src/hooks/useErrorHandler.ts
import { useCallback, useState } from 'react';

export const useErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: Error) => {
    setError(error);
  }, []);

  // 強制觸發 Error Boundary
  const throwError = useCallback(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    error,
    handleError,
    clearError,
    throwError,
  };
};
```

```typescript
// src/hooks/useErrorHandler.test.ts
import { describe, test, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from './useErrorHandler';

describe('useErrorHandler Hook', () => {
  test('initializes with no error', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.error).toBeNull();
  });

  test('handles error correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    const testError = new Error('Test error');

    act(() => {
      result.current.handleError(testError);
    });

    expect(result.current.error).toBe(testError);
  });

  test('clears error correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    const testError = new Error('Test error');

    act(() => {
      result.current.handleError(testError);
    });

    expect(result.current.error).toBe(testError);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  test('throws error when throwError is called', () => {
    const { result } = renderHook(() => useErrorHandler());
    const testError = new Error('Test error');

    act(() => {
      result.current.handleError(testError);
    });

    expect(() => {
      result.current.throwError();
    }).toThrow('Test error');
  });
});
```

## 常見問題

**Q: Error Boundary 為什麼無法捕捉事件處理中的錯誤？**
A: 事件處理是在 React 渲染週期之外執行的，需要使用 try-catch 或其他錯誤處理機制。

**Q: 如何測試 Error Boundary 在生產環境中的行為？**
A: 在測試中臨時設定 `process.env.NODE_ENV = 'production'`，測試完成後恢復原值。

**Q: Error Boundary 應該放在元件樹的哪個層級？**
A: 通常在應用的較高層級設置全域 Error Boundary，在特定功能區域設置區域性 Error Boundary。

**Q: 如何處理非同步錯誤？**
A: 使用錯誤處理 hooks 或狀態管理來捕捉非同步錯誤，然後可以選擇性地觸發 Error Boundary。

## 練習題

1. **基礎練習**：建立錯誤邊界系統
   - 實作基本的 Error Boundary 元件
   - 加入自定義錯誤訊息和重試功能
   - 撰寫完整的測試案例

2. **進階練習**：錯誤恢復機制
   - 建立具有重試限制的進階 Error Boundary
   - 實作錯誤報告和監控功能
   - 加入 props 變更時的自動重設機制

3. **挑戰練習**：完整錯誤處理系統
   - 建立階層式錯誤邊界結構
   - 整合非同步錯誤處理機制
   - 實作錯誤統計和分析功能

## 延伸閱讀

- [React Error Boundary 官方文件](https://reactjs.org/docs/error-boundaries.html)
- [Error Handling in React 16](https://reactjs.org/blog/2017/07/26/error-handling-in-react-16.html)
- [React Error Boundary 最佳實踐](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)
- [錯誤監控服務整合](https://blog.sentry.io/2017/09/28/react-16-error-boundaries)

## 本日重點回顧

✅ 了解 React Error Boundary 的概念和限制
✅ 實作基本和進階的錯誤邊界元件
✅ 學會測試錯誤捕捉和處理機制
✅ 掌握重試和恢復功能的測試方法
✅ 處理自定義錯誤 UI 和回調函數
✅ 建立實際應用場景的錯誤處理測試
✅ 了解非同步錯誤的處理策略

明天我們將學習視覺迴歸測試，了解如何確保 UI 外觀的一致性和穩定性！
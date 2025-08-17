# Day 7: 斷言與匹配器 - expect 與 jest-dom

## 學習目標

- 掌握 Vitest 基本斷言方法
- 學會使用 `@testing-library/jest-dom` 專門的 DOM 匹配器
- 了解自定義匹配器的創建和使用
- 學習如何編寫更有表達力和可讀性的測試

## 概念說明

斷言（Assertions）是測試的核心，用來驗證程式碼的行為是否符合預期。好的斷言應該：

1. **明確表達意圖** - 一眼就能看出在測試什麼
2. **提供有用的錯誤訊息** - 失敗時能快速定位問題
3. **易於閱讀和維護** - 測試程式碼本身也是文檔

### Vitest vs Jest DOM
- **Vitest 內建匹配器** - 通用的 JavaScript 斷言
- **jest-dom 匹配器** - 專門針對 DOM 元素的斷言
- **自定義匹配器** - 針對特定需求的客製化斷言

## 實作範例

### Vitest 基本匹配器

```typescript
// examples/assertions/basic-assertions.test.ts
import { describe, it, expect } from 'vitest';

describe('Vitest 基本匹配器', () => {
  describe('相等性比較', () => {
    it('toBe - 嚴格相等 (===)', () => {
      expect(2 + 2).toBe(4);
      expect('hello').toBe('hello');
      expect(true).toBe(true);
      
      const obj = { name: 'test' };
      expect(obj).toBe(obj); // 同一個物件參考
    });

    it('toEqual - 深度相等比較', () => {
      expect({ name: 'John', age: 30 }).toEqual({ name: 'John', age: 30 });
      expect([1, 2, 3]).toEqual([1, 2, 3]);
      
      // 巢狀物件
      expect({
        user: { name: 'John' },
        settings: { theme: 'dark' }
      }).toEqual({
        user: { name: 'John' },
        settings: { theme: 'dark' }
      });
    });

    it('toStrictEqual - 更嚴格的相等比較', () => {
      // 會檢查 undefined 屬性
      expect({ a: 1, b: undefined }).toStrictEqual({ a: 1, b: undefined });
      
      // 不會通過（toEqual 會通過）
      // expect({ a: 1 }).toStrictEqual({ a: 1, b: undefined });
    });
  });

  describe('真假值', () => {
    it('真值檢查', () => {
      expect(true).toBeTruthy();
      expect(1).toBeTruthy();
      expect('non-empty').toBeTruthy();
      expect([] as any).toBeTruthy();
      expect({} as any).toBeTruthy();
    });

    it('假值檢查', () => {
      expect(false).toBeFalsy();
      expect(0).toBeFalsy();
      expect('').toBeFalsy();
      expect(null).toBeFalsy();
      expect(undefined).toBeFalsy();
      expect(NaN).toBeFalsy();
    });

    it('undefined 和 null 檢查', () => {
      expect(undefined).toBeUndefined();
      expect(null).toBeNull();
      
      const value = 'defined';
      expect(value).toBeDefined();
      expect(value).not.toBeNull();
    });
  });

  describe('數字比較', () => {
    it('數字大小比較', () => {
      expect(10).toBeGreaterThan(5);
      expect(10).toBeGreaterThanOrEqual(10);
      expect(5).toBeLessThan(10);
      expect(5).toBeLessThanOrEqual(5);
    });

    it('浮點數比較', () => {
      expect(0.1 + 0.2).toBeCloseTo(0.3);
      expect(Math.PI).toBeCloseTo(3.14159, 5);
    });
  });

  describe('字串匹配', () => {
    it('包含檢查', () => {
      expect('Hello, World!').toContain('World');
      expect('React Testing Library').toContain('Testing');
    });

    it('正則表達式匹配', () => {
      expect('Hello123').toMatch(/\d+/);
      expect('user@example.com').toMatch(/^[\w\.-]+@[\w\.-]+\.\w+$/);
    });

    it('字串長度', () => {
      expect('hello').toHaveLength(5);
    });
  });

  describe('陣列和物件', () => {
    it('陣列內容檢查', () => {
      expect(['apple', 'banana', 'orange']).toContain('banana');
      expect([1, 2, 3, 4, 5]).toHaveLength(5);
      
      // 部分匹配
      expect(['apple', 'banana']).toEqual(
        expect.arrayContaining(['banana'])
      );
    });

    it('物件屬性檢查', () => {
      const user = { name: 'John', age: 30, email: 'john@example.com' };
      
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('name', 'John');
      expect(user).toHaveProperty(['email'], 'john@example.com');
      
      // 部分物件匹配
      expect(user).toEqual(
        expect.objectContaining({
          name: 'John',
          age: expect.any(Number)
        })
      );
    });
  });

  describe('類型檢查', () => {
    it('類型匹配', () => {
      expect('hello').toEqual(expect.any(String));
      expect(42).toEqual(expect.any(Number));
      expect(true).toEqual(expect.any(Boolean));
      expect([]).toEqual(expect.any(Array));
      expect({}).toEqual(expect.any(Object));
      
      class CustomClass {}
      expect(new CustomClass()).toEqual(expect.any(CustomClass));
    });
  });

  describe('異常處理', () => {
    it('檢查函數拋出異常', () => {
      const throwError = () => {
        throw new Error('Something went wrong');
      };
      
      expect(throwError).toThrow();
      expect(throwError).toThrow('Something went wrong');
      expect(throwError).toThrow(/went wrong/);
      expect(throwError).toThrow(Error);
    });

    it('檢查異步函數拋出異常', async () => {
      const asyncThrowError = async () => {
        throw new Error('Async error');
      };
      
      await expect(asyncThrowError).rejects.toThrow('Async error');
    });
  });
});
```

### jest-dom 匹配器實戰

首先確保 jest-dom 已正確設定：

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom';
```

創建測試元件：

```typescript
// examples/assertions/TestComponent.tsx
import React, { useState } from 'react';

interface TestComponentProps {
  initialVisible?: boolean;
  disabled?: boolean;
  className?: string;
}

export const TestComponent: React.FC<TestComponentProps> = ({
  initialVisible = false,
  disabled = false,
  className
}) => {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className={`test-component ${className || ''}`}>
      <h1>Test Component</h1>
      
      <button 
        onClick={() => setIsVisible(!isVisible)}
        disabled={disabled}
        data-testid="toggle-button"
        aria-label="Toggle visibility"
      >
        {isVisible ? 'Hide' : 'Show'} Content
      </button>
      
      {isVisible && (
        <div data-testid="content" role="main">
          <p>This is visible content</p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter some text"
            data-testid="text-input"
            required
          />
          <span data-testid="char-count">{inputValue.length}</span>
        </div>
      )}
      
      <div 
        data-testid="status-indicator"
        className={isVisible ? 'visible' : 'hidden'}
        style={{ 
          display: isVisible ? 'block' : 'none',
          color: inputValue.length > 5 ? 'green' : 'red'
        }}
      >
        Status: {isVisible ? 'Visible' : 'Hidden'}
      </div>
      
      <a 
        href="https://example.com" 
        data-testid="external-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        External Link
      </a>
    </div>
  );
};
```

使用 jest-dom 匹配器測試：

```typescript
// examples/assertions/TestComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestComponent } from './TestComponent';

describe('jest-dom 匹配器範例', () => {
  describe('元素存在性', () => {
    it('toBeInTheDocument - 檢查元素是否存在於 DOM 中', () => {
      render(<TestComponent />);
      
      expect(screen.getByText('Test Component')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
      
      // 預設不可見的內容
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });

  describe('可見性', () => {
    it('toBeVisible - 檢查元素是否可見', () => {
      render(<TestComponent initialVisible={true} />);
      
      const content = screen.getByTestId('content');
      expect(content).toBeVisible();
      
      const statusIndicator = screen.getByTestId('status-indicator');
      expect(statusIndicator).toBeVisible();
    });

    it('not.toBeVisible - 檢查元素不可見', () => {
      render(<TestComponent initialVisible={false} />);
      
      const statusIndicator = screen.getByTestId('status-indicator');
      expect(statusIndicator).not.toBeVisible(); // style={{ display: 'none' }}
    });
  });

  describe('文字內容', () => {
    it('toHaveTextContent - 檢查文字內容', () => {
      render(<TestComponent />);
      
      const button = screen.getByTestId('toggle-button');
      expect(button).toHaveTextContent('Show Content');
      expect(button).toHaveTextContent(/Show/);
      
      // 部分匹配
      expect(button).toHaveTextContent('Show');
    });

    it('toContainHTML - 檢查 HTML 內容', () => {
      render(<TestComponent initialVisible={true} />);
      
      const content = screen.getByTestId('content');
      expect(content).toContainHTML('<p>This is visible content</p>');
    });
  });

  describe('屬性檢查', () => {
    it('toHaveAttribute - 檢查屬性', () => {
      render(<TestComponent disabled={true} />);
      
      const button = screen.getByTestId('toggle-button');
      expect(button).toHaveAttribute('disabled');
      expect(button).toHaveAttribute('aria-label', 'Toggle visibility');
      expect(button).toHaveAttribute('data-testid', 'toggle-button');
    });

    it('toHaveClass - 檢查 CSS 類別', () => {
      render(<TestComponent className="custom-class" />);
      
      const component = screen.getByText('Test Component').closest('div');
      expect(component).toHaveClass('test-component');
      expect(component).toHaveClass('custom-class');
      expect(component).toHaveClass('test-component', 'custom-class');
    });

    it('toHaveStyle - 檢查內聯樣式', () => {
      render(<TestComponent initialVisible={false} />);
      
      const statusIndicator = screen.getByTestId('status-indicator');
      expect(statusIndicator).toHaveStyle({
        display: 'none',
        color: 'red'
      });
    });
  });

  describe('表單元素', () => {
    it('toBeDisabled/toBeEnabled - 檢查啟用/禁用狀態', () => {
      const { rerender } = render(<TestComponent disabled={true} />);
      
      const button = screen.getByTestId('toggle-button');
      expect(button).toBeDisabled();
      
      rerender(<TestComponent disabled={false} />);
      expect(button).toBeEnabled();
    });

    it('toHaveValue - 檢查輸入值', async () => {
      const user = userEvent.setup();
      render(<TestComponent initialVisible={true} />);
      
      const input = screen.getByTestId('text-input');
      expect(input).toHaveValue('');
      
      await user.type(input, 'Hello World');
      expect(input).toHaveValue('Hello World');
    });

    it('toBeRequired - 檢查必填欄位', () => {
      render(<TestComponent initialVisible={true} />);
      
      const input = screen.getByTestId('text-input');
      expect(input).toBeRequired();
    });

    it('toHaveDisplayValue - 檢查顯示值', async () => {
      const user = userEvent.setup();
      render(<TestComponent initialVisible={true} />);
      
      const input = screen.getByTestId('text-input');
      await user.type(input, 'Test Value');
      
      expect(input).toHaveDisplayValue('Test Value');
      expect(input).toHaveDisplayValue(/Test/);
    });
  });

  describe('可訪問性', () => {
    it('toHaveRole - 檢查 ARIA 角色', () => {
      render(<TestComponent initialVisible={true} />);
      
      const content = screen.getByTestId('content');
      expect(content).toHaveRole('main');
    });

    it('toHaveAccessibleName - 檢查可訪問名稱', () => {
      render(<TestComponent />);
      
      const button = screen.getByTestId('toggle-button');
      expect(button).toHaveAccessibleName('Toggle visibility');
    });

    it('toHaveAccessibleDescription - 檢查可訪問描述', () => {
      render(
        <div>
          <button aria-describedby="help-text">Click me</button>
          <div id="help-text">This button does something</div>
        </div>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleDescription('This button does something');
    });
  });

  describe('焦點狀態', () => {
    it('toHaveFocus - 檢查焦點狀態', async () => {
      const user = userEvent.setup();
      render(<TestComponent initialVisible={true} />);
      
      const input = screen.getByTestId('text-input');
      expect(input).not.toHaveFocus();
      
      await user.click(input);
      expect(input).toHaveFocus();
    });
  });

  describe('連結檢查', () => {
    it('檢查連結屬性', () => {
      render(<TestComponent />);
      
      const link = screen.getByTestId('external-link');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
```

### 自定義匹配器

創建專案特定的匹配器：

```typescript
// test-utils/custom-matchers.ts
import { expect } from 'vitest';

// 擴展 Vitest 的匹配器類型
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidEmail(): T;
    toHaveValidationError(message: string): T;
    toBeLoadingState(): T;
  }
}

// 自定義匹配器：檢查有效 email
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    return {
      pass,
      message: () => 
        pass
          ? `Expected "${received}" not to be a valid email`
          : `Expected "${received}" to be a valid email`
    };
  },

  // 檢查驗證錯誤訊息
  toHaveValidationError(element: HTMLElement, expectedMessage: string) {
    const errorElement = element.querySelector('[role="alert"]');
    const pass = errorElement?.textContent === expectedMessage;
    
    return {
      pass,
      message: () =>
        pass
          ? `Expected not to have validation error "${expectedMessage}"`
          : `Expected to have validation error "${expectedMessage}", but got "${errorElement?.textContent || 'none'}"`
    };
  },

  // 檢查載入狀態
  toBeLoadingState(element: HTMLElement) {
    const hasSpinner = element.querySelector('.spinner, [data-testid="loading"]');
    const hasLoadingText = element.textContent?.includes('Loading');
    const pass = !!(hasSpinner || hasLoadingText);
    
    return {
      pass,
      message: () =>
        pass
          ? 'Expected element not to be in loading state'
          : 'Expected element to be in loading state'
    };
  }
});
```

使用自定義匹配器：

```typescript
// examples/assertions/CustomMatchers.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../test-utils/custom-matchers';

// 測試用元件
const EmailForm: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const validateEmail = (value: string) => {
    if (!value) {
      setError('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Please enter a valid email');
    } else {
      setError('');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    // 模擬 API 呼叫
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <form data-testid="email-form">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          validateEmail(e.target.value);
        }}
        data-testid="email-input"
      />
      {error && <div role="alert">{error}</div>}
      {loading && <div data-testid="loading">Loading...</div>}
      <button type="button" onClick={handleSubmit}>
        Submit
      </button>
    </form>
  );
};

describe('自定義匹配器', () => {
  it('toBeValidEmail - 檢查 email 格式', () => {
    expect('user@example.com').toBeValidEmail();
    expect('test.email+tag@domain.co.uk').toBeValidEmail();
    
    expect('invalid-email').not.toBeValidEmail();
    expect('user@').not.toBeValidEmail();
    expect('@domain.com').not.toBeValidEmail();
  });

  it('toHaveValidationError - 檢查驗證錯誤', async () => {
    const user = userEvent.setup();
    render(<EmailForm />);
    
    const form = screen.getByTestId('email-form');
    const input = screen.getByTestId('email-input');
    
    // 測試必填驗證
    await user.type(input, 'a');
    await user.clear(input);
    
    expect(form).toHaveValidationError('Email is required');
    
    // 測試格式驗證
    await user.type(input, 'invalid-email');
    expect(form).toHaveValidationError('Please enter a valid email');
  });

  it('toBeLoadingState - 檢查載入狀態', async () => {
    const user = userEvent.setup();
    render(<EmailForm />);
    
    const form = screen.getByTestId('email-form');
    const submitButton = screen.getByRole('button');
    
    expect(form).not.toBeLoadingState();
    
    await user.click(submitButton);
    expect(form).toBeLoadingState();
  });
});
```

### 錯誤訊息優化

創建有意義的錯誤訊息：

```typescript
// examples/assertions/ErrorMessages.test.ts
import { describe, it, expect } from 'vitest';

describe('錯誤訊息優化', () => {
  it('提供清晰的錯誤訊息', () => {
    const user = { name: 'John', age: 30 };
    
    // 不好的測試：錯誤訊息不明確
    // expect(user.age).toBe(25);
    
    // 好的測試：添加描述性訊息
    expect(user.age, 'User age should match expected value').toBe(30);
    
    // 使用 soft assertions 進行多重檢查
    expect.soft(user.name).toBe('John');
    expect.soft(user.age).toBe(30);
  });

  it('使用 toMatchObject 進行部分匹配', () => {
    const response = {
      data: { id: 1, name: 'John' },
      status: 200,
      timestamp: Date.now()
    };
    
    // 只測試關心的部分
    expect(response).toMatchObject({
      data: { name: 'John' },
      status: 200
    });
  });

  it('使用 expect.objectContaining 處理動態值', () => {
    const user = {
      id: 123,
      name: 'John',
      createdAt: new Date(),
      settings: { theme: 'dark' }
    };
    
    expect(user).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: 'John',
        createdAt: expect.any(Date),
        settings: expect.objectContaining({
          theme: 'dark'
        })
      })
    );
  });
});
```

## 常見問題

### Q1: toBe 和 toEqual 的差別？
A: 
- `toBe` 使用 `===` 比較，檢查物件參考
- `toEqual` 進行深度比較，檢查值的相等性

```typescript
const obj1 = { a: 1 };
const obj2 = { a: 1 };

expect(obj1).not.toBe(obj2);  // 不同參考
expect(obj1).toEqual(obj2);   // 相同值
```

### Q2: 什麼時候使用 toBeInTheDocument？
A: 當你需要確認元素存在於 DOM 中時。注意與 `toBeVisible` 的差別：

```typescript
// 元素存在但不可見
expect(element).toBeInTheDocument();
expect(element).not.toBeVisible();
```

### Q3: 如何測試異步狀態變化？
A: 使用 `waitFor` 等待狀態變化：

```typescript
await waitFor(() => {
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

### Q4: 自定義匹配器的效能考量？
A: 自定義匹配器應該：
- 保持簡單和高效
- 提供清晰的錯誤訊息
- 避免複雜的 DOM 查詢

## 練習題

### 練習 1: 表單驗證匹配器
創建自定義匹配器：
- `toHaveValidPassword` - 檢查密碼強度
- `toHaveMatchingPasswords` - 檢查密碼確認
- `toBeValidPhoneNumber` - 檢查電話號碼格式

### 練習 2: 元件狀態匹配器
創建匹配器檢查：
- `toBeInErrorState` - 元件是否處於錯誤狀態
- `toHaveNotification` - 是否顯示通知
- `toBeInteractive` - 元件是否可互動

### 練習 3: 資料驗證
使用內建匹配器測試：
- API 回應格式
- 陣列排序結果
- 日期格式驗證

## 延伸閱讀

- [Vitest Expect API](https://vitest.dev/api/expect.html)
- [jest-dom 匹配器列表](https://github.com/testing-library/jest-dom)
- [Custom Matchers Guide](https://vitest.dev/guide/extending-matchers.html)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)

## 本日重點回顧

1. **基本匹配器** - 掌握 Vitest 內建的斷言方法
2. **jest-dom 增強** - 使用專門的 DOM 匹配器
3. **自定義匹配器** - 創建專案特定的斷言邏輯
4. **錯誤訊息** - 編寫清晰有用的測試斷言
5. **可讀性優先** - 讓測試程式碼表達清楚的意圖
6. **適當選擇** - 根據測試需求選擇合適的匹配器

明天我們將學習非同步測試的技巧，包括 `waitFor` 和 `findBy` 的使用！
# Day 4: 使用者互動測試 - fireEvent 與 userEvent

## 學習目標

- 了解 `fireEvent` 與 `@testing-library/user-event` 的差異
- 學會測試各種使用者互動（點擊、輸入、選擇等）
- 掌握表單互動測試技巧
- 理解何時選擇適當的互動測試方法

## 概念說明

在測試 React 元件時，我們經常需要模擬使用者與介面的互動。React Testing Library 提供了兩種主要方式：

### fireEvent vs userEvent

#### fireEvent
- 直接觸發 DOM 事件
- 低階的事件觸發方式
- 不會模擬真實的使用者行為序列
- 同步執行

#### @testing-library/user-event
- 模擬真實使用者行為
- 會觸發一系列相關的事件
- 更接近實際使用者操作
- 提供非同步 API
- 是目前推薦的方式

## 實作範例

### 安裝必要套件

```bash
npm install --save-dev @testing-library/user-event
```

### 基本按鈕點擊測試

首先，我們創建一個簡單的計數器元件：

```typescript
// examples/user-interaction/Counter.tsx
import React, { useState } from 'react';

interface CounterProps {
  initialValue?: number;
  onCountChange?: (count: number) => void;
}

export const Counter: React.FC<CounterProps> = ({ 
  initialValue = 0, 
  onCountChange 
}) => {
  const [count, setCount] = useState(initialValue);

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    onCountChange?.(newCount);
  };

  const handleDecrement = () => {
    const newCount = count - 1;
    setCount(newCount);
    onCountChange?.(newCount);
  };

  const handleReset = () => {
    setCount(initialValue);
    onCountChange?.(initialValue);
  };

  return (
    &lt;div&gt;
      &lt;p data-testid="counter-value"&gt;Count: {count}&lt;/p&gt;
      &lt;button onClick={handleIncrement}&gt;Increment&lt;/button&gt;
      &lt;button onClick={handleDecrement}&gt;Decrement&lt;/button&gt;
      &lt;button onClick={handleReset}&gt;Reset&lt;/button&gt;
    &lt;/div&gt;
  );
};
```

接下來測試這個元件：

```typescript
// examples/user-interaction/Counter.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('should increment count when increment button is clicked', async () => {
    const user = userEvent.setup();
    render(&lt;Counter /&gt;);
    
    const incrementButton = screen.getByRole('button', { name: 'Increment' });
    const counterValue = screen.getByTestId('counter-value');
    
    expect(counterValue).toHaveTextContent('Count: 0');
    
    await user.click(incrementButton);
    expect(counterValue).toHaveTextContent('Count: 1');
    
    await user.click(incrementButton);
    expect(counterValue).toHaveTextContent('Count: 2');
  });

  it('should decrement count when decrement button is clicked', async () => {
    const user = userEvent.setup();
    render(&lt;Counter initialValue={5} /&gt;);
    
    const decrementButton = screen.getByRole('button', { name: 'Decrement' });
    const counterValue = screen.getByTestId('counter-value');
    
    expect(counterValue).toHaveTextContent('Count: 5');
    
    await user.click(decrementButton);
    expect(counterValue).toHaveTextContent('Count: 4');
  });

  it('should reset count to initial value', async () => {
    const user = userEvent.setup();
    render(&lt;Counter initialValue={10} /&gt;);
    
    const incrementButton = screen.getByRole('button', { name: 'Increment' });
    const resetButton = screen.getByRole('button', { name: 'Reset' });
    const counterValue = screen.getByTestId('counter-value');
    
    // 增加計數
    await user.click(incrementButton);
    await user.click(incrementButton);
    expect(counterValue).toHaveTextContent('Count: 12');
    
    // 重置
    await user.click(resetButton);
    expect(counterValue).toHaveTextContent('Count: 10');
  });

  it('should call onCountChange when count changes', async () => {
    const user = userEvent.setup();
    const onCountChange = vi.fn();
    render(&lt;Counter onCountChange={onCountChange} /&gt;);
    
    const incrementButton = screen.getByRole('button', { name: 'Increment' });
    
    await user.click(incrementButton);
    
    expect(onCountChange).toHaveBeenCalledWith(1);
    expect(onCountChange).toHaveBeenCalledTimes(1);
  });
});
```

### 表單輸入測試

創建一個登入表單元件：

```typescript
// examples/user-interaction/LoginForm.tsx
import React, { useState } from 'react';

interface LoginFormProps {
  onSubmit: (credentials: { username: string; password: string }) =&gt; void;
}

export const LoginForm: React.FC&lt;LoginFormProps&gt; = ({ onSubmit }) =&gt; {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState&lt;{ username?: string; password?: string }&gt;({});

  const validate = () =&gt; {
    const newErrors: { username?: string; password?: string } = {};
    
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length &lt; 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) =&gt; {
    e.preventDefault();
    
    if (validate()) {
      onSubmit({ username, password });
    }
  };

  return (
    &lt;form onSubmit={handleSubmit}&gt;
      &lt;div&gt;
        &lt;label htmlFor="username"&gt;Username&lt;/label&gt;
        &lt;input
          id="username"
          type="text"
          value={username}
          onChange={(e) =&gt; setUsername(e.target.value)}
          aria-describedby={errors.username ? 'username-error' : undefined}
        /&gt;
        {errors.username && (
          &lt;div id="username-error" role="alert"&gt;
            {errors.username}
          &lt;/div&gt;
        )}
      &lt;/div&gt;
      
      &lt;div&gt;
        &lt;label htmlFor="password"&gt;Password&lt;/label&gt;
        &lt;input
          id="password"
          type="password"
          value={password}
          onChange={(e) =&gt; setPassword(e.target.value)}
          aria-describedby={errors.password ? 'password-error' : undefined}
        /&gt;
        {errors.password && (
          &lt;div id="password-error" role="alert"&gt;
            {errors.password}
          &lt;/div&gt;
        )}
      &lt;/div&gt;
      
      &lt;button type="submit"&gt;Login&lt;/button&gt;
    &lt;/form&gt;
  );
};
```

測試表單：

```typescript
// examples/user-interaction/LoginForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should update input values when user types', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(&lt;LoginForm onSubmit={onSubmit} /&gt;);
    
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(&lt;LoginForm onSubmit={onSubmit} /&gt;);
    
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    await user.click(submitButton);
    
    expect(screen.getByRole('alert', { name: 'Username is required' })).toBeInTheDocument();
    expect(screen.getByRole('alert', { name: 'Password is required' })).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should show password length validation error', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(&lt;LoginForm onSubmit={onSubmit} /&gt;);
    
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    
    expect(screen.getByRole('alert', { name: 'Password must be at least 6 characters' })).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(&lt;LoginForm onSubmit={onSubmit} /&gt;);
    
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(onSubmit).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123'
    });
  });

  it('should clear input when user clears it', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(&lt;LoginForm onSubmit={onSubmit} /&gt;);
    
    const usernameInput = screen.getByLabelText('Username');
    
    await user.type(usernameInput, 'testuser');
    expect(usernameInput).toHaveValue('testuser');
    
    await user.clear(usernameInput);
    expect(usernameInput).toHaveValue('');
  });
});
```

### 選擇器測試

創建一個下拉選單元件：

```typescript
// examples/user-interaction/Select.tsx
import React, { useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) =&gt; void;
  placeholder?: string;
}

export const Select: React.FC&lt;SelectProps&gt; = ({
  options,
  value,
  onChange,
  placeholder = 'Please select...'
}) =&gt; {
  return (
    &lt;select
      value={value || ''}
      onChange={(e) =&gt; onChange(e.target.value)}
      aria-label="Select option"
    &gt;
      &lt;option value="" disabled&gt;
        {placeholder}
      &lt;/option&gt;
      {options.map((option) =&gt; (
        &lt;option key={option.value} value={option.value}&gt;
          {option.label}
        &lt;/option&gt;
      ))}
    &lt;/select&gt;
  );
};
```

測試選擇器：

```typescript
// examples/user-interaction/Select.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

const mockOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' }
];

describe('Select', () => {
  it('should show placeholder when no value is selected', () => {
    const onChange = vi.fn();
    render(&lt;Select options={mockOptions} onChange={onChange} /&gt;);
    
    const select = screen.getByLabelText('Select option');
    expect(select).toHaveValue('');
    expect(screen.getByText('Please select...')).toBeInTheDocument();
  });

  it('should show custom placeholder', () => {
    const onChange = vi.fn();
    render(
      &lt;Select 
        options={mockOptions} 
        onChange={onChange} 
        placeholder="Choose a fruit" 
      /&gt;
    );
    
    expect(screen.getByText('Choose a fruit')).toBeInTheDocument();
  });

  it('should display selected value', () => {
    const onChange = vi.fn();
    render(&lt;Select options={mockOptions} value="apple" onChange={onChange} /&gt;);
    
    const select = screen.getByLabelText('Select option');
    expect(select).toHaveValue('apple');
  });

  it('should call onChange when option is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(&lt;Select options={mockOptions} onChange={onChange} /&gt;);
    
    const select = screen.getByLabelText('Select option');
    
    await user.selectOptions(select, 'banana');
    
    expect(onChange).toHaveBeenCalledWith('banana');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should render all options', () => {
    const onChange = vi.fn();
    render(&lt;Select options={mockOptions} onChange={onChange} /&gt;);
    
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Orange')).toBeInTheDocument();
  });
});
```

### 鍵盤互動測試

測試鍵盤事件：

```typescript
// examples/user-interaction/SearchInput.tsx
import React, { useState } from 'react';

interface SearchInputProps {
  onSearch: (query: string) =&gt; void;
  onClear?: () =&gt; void;
}

export const SearchInput: React.FC&lt;SearchInputProps&gt; = ({ onSearch, onClear }) =&gt; {
  const [query, setQuery] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) =&gt; {
    if (e.key === 'Enter') {
      onSearch(query);
    } else if (e.key === 'Escape') {
      setQuery('');
      onClear?.();
    }
  };

  return (
    &lt;div&gt;
      &lt;input
        type="text"
        value={query}
        onChange={(e) =&gt; setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        aria-label="Search input"
      /&gt;
      &lt;p&gt;Press Enter to search, Escape to clear&lt;/p&gt;
    &lt;/div&gt;
  );
};
```

```typescript
// examples/user-interaction/SearchInput.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('should call onSearch when Enter is pressed', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(&lt;SearchInput onSearch={onSearch} /&gt;);
    
    const input = screen.getByLabelText('Search input');
    
    await user.type(input, 'react testing');
    await user.keyboard('{Enter}');
    
    expect(onSearch).toHaveBeenCalledWith('react testing');
  });

  it('should clear input when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onClear = vi.fn();
    render(&lt;SearchInput onSearch={onSearch} onClear={onClear} /&gt;);
    
    const input = screen.getByLabelText('Search input');
    
    await user.type(input, 'some text');
    expect(input).toHaveValue('some text');
    
    await user.keyboard('{Escape}');
    
    expect(input).toHaveValue('');
    expect(onClear).toHaveBeenCalled();
  });

  it('should update input value when typing', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(&lt;SearchInput onSearch={onSearch} /&gt;);
    
    const input = screen.getByLabelText('Search input');
    
    await user.type(input, 'testing');
    
    expect(input).toHaveValue('testing');
  });
});
```

## fireEvent 範例（比較用）

有時候你可能會遇到 fireEvent 的用法，以下是比較：

```typescript
// 使用 fireEvent（不推薦，僅供比較）
import { fireEvent } from '@testing-library/react';

it('should increment with fireEvent', () => {
  render(&lt;Counter /&gt;);
  
  const incrementButton = screen.getByRole('button', { name: 'Increment' });
  const counterValue = screen.getByTestId('counter-value');
  
  fireEvent.click(incrementButton);
  
  expect(counterValue).toHaveTextContent('Count: 1');
});

// 使用 userEvent（推薦）
it('should increment with userEvent', async () => {
  const user = userEvent.setup();
  render(&lt;Counter /&gt;);
  
  const incrementButton = screen.getByRole('button', { name: 'Increment' });
  const counterValue = screen.getByTestId('counter-value');
  
  await user.click(incrementButton);
  
  expect(counterValue).toHaveTextContent('Count: 1');
});
```

## 常見問題

### Q1: 為什麼 userEvent 方法需要 await？
A: userEvent 的方法都是非同步的，因為它們模擬真實的使用者行為，可能需要時間來完成。使用 await 確保操作完成後再進行斷言。

### Q2: 什麼時候應該使用 fireEvent？
A: 現在建議優先使用 userEvent。只有在需要測試特定低階事件或 userEvent 不支援的事件時才使用 fireEvent。

### Q3: 如何測試複雜的鍵盤組合？
A: 使用 `user.keyboard()` 方法：

```typescript
// 測試 Ctrl+A 選擇全部
await user.keyboard('{Control&gt;a&lt;/Control}');

// 測試 Shift+Tab
await user.keyboard('{Shift&gt;}{Tab}{/Shift}');
```

### Q4: 如何測試拖放操作？
A: userEvent 提供了拖放相關的方法：

```typescript
await user.dragAndDrop(sourceElement, targetElement);
```

### Q5: 測試文件上傳怎麼做？
A: 使用 `user.upload()` 方法：

```typescript
const file = new File(['hello'], 'hello.png', { type: 'image/png' });
const input = screen.getByLabelText('Upload file');

await user.upload(input, file);
```

## 練習題

### 練習 1: Todo 新增功能
創建一個 Todo 新增元件，包含輸入欄位和新增按鈕。測試：
- 輸入文字後點擊新增按鈕
- 按 Enter 鍵新增
- 新增後清空輸入欄位

### 練習 2: 密碼顯示/隱藏
創建一個密碼輸入元件，有切換顯示/隱藏密碼的按鈕。測試：
- 預設隱藏密碼
- 點擊按鈕切換顯示狀態
- 按鈕文字相應改變

### 練習 3: 多選清單
創建一個有多個 checkbox 的清單，並有全選/取消全選功能。測試：
- 個別選取項目
- 全選功能
- 取消全選功能

## 延伸閱讀

- [user-event 官方文檔](https://testing-library.com/docs/user-event/intro)
- [fireEvent 使用指南](https://testing-library.com/docs/dom-testing-library/api-events)
- [Testing Library 事件優先順序](https://testing-library.com/docs/guide-events)
- [鍵盤事件測試](https://testing-library.com/docs/user-event/keyboard)

## 本日重點回顧

1. **userEvent 是首選** - 提供更真實的使用者互動模擬
2. **非同步操作** - userEvent 方法需要使用 await
3. **測試真實行為** - 關注使用者實際如何與元件互動
4. **鍵盤支援** - 不要忘記測試鍵盤快捷鍵和導航
5. **表單測試** - 包含輸入、驗證、提交的完整流程
6. **事件回調** - 使用 mock 函數驗證事件處理器是否正確呼叫

明天我們將深入學習如何測試元件的狀態與 Props 傳遞，進一步提升測試技能！
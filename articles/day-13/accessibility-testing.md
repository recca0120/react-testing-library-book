# Day 13: 測試可訪問性 (Accessibility)

## 學習目標
- 理解可訪問性測試的重要性
- 掌握 ARIA 屬性和語義化標籤的測試
- 學會使用 jest-axe 進行自動化 a11y 測試
- 了解鍵盤導航和螢幕閱讀器的測試方法

## 概念說明

可訪問性（Accessibility，簡稱 a11y）確保所有使用者，包括殘障人士，都能有效地使用我們的應用程式。測試可訪問性是確保包容性設計的關鍵步驟。

### 可訪問性的重要面向

1. **視覺**：對於視力受損或全盲的使用者
2. **聽覺**：對於聽力受損或全聾的使用者
3. **運動**：對於運動功能受限的使用者
4. **認知**：對於學習障礙或認知障礙的使用者

### 主要測試目標

- **語義化 HTML**：正確的標籤使用
- **ARIA 屬性**：適當的無障礙屬性
- **鍵盤導航**：完全的鍵盤操作支援
- **焦點管理**：邏輯的焦點順序
- **色彩對比**：足夠的視覺對比度

## 實作範例

### 環境設定

```bash
npm install --save-dev jest-axe @axe-core/react
```

```typescript
// src/test/setup.ts
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

// 擴展 expect 以支援 axe 匹配器
expect.extend(toHaveNoViolations);
```

### 基礎可訪問性元件

```typescript
// components/AccessibleButton.tsx
import React from 'react';

interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  ariaLabel,
  ariaDescribedBy,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn--${variant} btn--${size}`}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      data-testid="accessible-button"
    >
      {loading && (
        <span 
          role="status" 
          aria-label="Loading"
          className="loading-spinner"
        />
      )}
      <span className={loading ? 'visually-hidden' : ''}>
        {children}
      </span>
    </button>
  );
};
```

### 可訪問性按鈕測試

```typescript
// components/__tests__/AccessibleButton.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AccessibleButton } from '../AccessibleButton';

expect.extend(toHaveNoViolations);

describe('AccessibleButton', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <AccessibleButton onClick={() => {}}>
        Click me
      </AccessibleButton>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <AccessibleButton 
        onClick={() => {}}
        ariaLabel="Custom aria label"
        ariaDescribedBy="description-id"
      >
        Button Text
      </AccessibleButton>
    );

    const button = screen.getByTestId('accessible-button');
    expect(button).toHaveAttribute('aria-label', 'Custom aria label');
    expect(button).toHaveAttribute('aria-describedby', 'description-id');
  });

  it('should indicate loading state properly', async () => {
    render(
      <AccessibleButton onClick={() => {}} loading={true}>
        Submit
      </AccessibleButton>
    );

    const button = screen.getByTestId('accessible-button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    
    const loadingSpinner = screen.getByRole('status');
    expect(loadingSpinner).toHaveAttribute('aria-label', 'Loading');
    
    // 檢查按鈕文字是否被視覺隱藏但仍可被螢幕閱讀器讀取
    expect(screen.getByText('Submit')).toHaveClass('visually-hidden');
  });

  it('should be keyboard accessible', async () => {
    const mockOnClick = vi.fn();
    const user = userEvent.setup();

    render(
      <AccessibleButton onClick={mockOnClick}>
        Click me
      </AccessibleButton>
    );

    const button = screen.getByTestId('accessible-button');
    
    // 測試焦點
    await user.tab();
    expect(button).toHaveFocus();
    
    // 測試空格鍵和 Enter 鍵
    await user.keyboard(' ');
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    
    await user.keyboard('{Enter}');
    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });

  it('should not be interactive when disabled', async () => {
    const mockOnClick = vi.fn();
    const user = userEvent.setup();

    render(
      <AccessibleButton onClick={mockOnClick} disabled={true}>
        Disabled Button
      </AccessibleButton>
    );

    const button = screen.getByTestId('accessible-button');
    
    // 測試點擊
    await user.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
    
    // 測試鍵盤
    button.focus();
    await user.keyboard(' ');
    await user.keyboard('{Enter}');
    expect(mockOnClick).not.toHaveBeenCalled();
  });
});
```

### 表單可訪問性元件

```typescript
// components/AccessibleForm.tsx
import React, { useState } from 'react';

export const AccessibleForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    newsletter: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string | boolean) => {
    switch (name) {
      case 'name':
        return typeof value === 'string' && value.length < 2 
          ? 'Name must be at least 2 characters' 
          : '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof value === 'string' && !emailRegex.test(value)
          ? 'Please enter a valid email address'
          : '';
      case 'password':
        return typeof value === 'string' && value.length < 6
          ? 'Password must be at least 6 characters'
          : '';
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: inputValue }));
    
    if (name !== 'newsletter') {
      const error = validateField(name, inputValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'newsletter') {
        const error = validateField(key, value);
        if (error) newErrors[key] = error;
      }
    });
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      alert('Form submitted successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Registration form">
      <fieldset>
        <legend>Personal Information</legend>
        
        <div className="form-group">
          <label htmlFor="name">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <div 
              id="name-error" 
              role="alert" 
              aria-live="polite"
              className="error-message"
            >
              {errors.name}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error email-hint' : 'email-hint'}
          />
          <div id="email-hint" className="hint">
            We'll use this to send you important updates
          </div>
          {errors.email && (
            <div 
              id="email-error" 
              role="alert" 
              aria-live="polite"
              className="error-message"
            >
              {errors.email}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error password-requirements' : 'password-requirements'}
          />
          <div id="password-requirements" className="hint">
            Must be at least 6 characters long
          </div>
          {errors.password && (
            <div 
              id="password-error" 
              role="alert" 
              aria-live="polite"
              className="error-message"
            >
              {errors.password}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="newsletter"
              checked={formData.newsletter}
              onChange={handleInputChange}
            />
            Subscribe to newsletter
          </label>
        </div>
      </fieldset>

      <button type="submit" className="submit-button">
        Register
      </button>
    </form>
  );
};
```

### 表單可訪問性測試

```typescript
// components/__tests__/AccessibleForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { AccessibleForm } from '../AccessibleForm';

describe('AccessibleForm', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<AccessibleForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper form structure', () => {
    render(<AccessibleForm />);

    // 檢查表單標籤
    expect(screen.getByRole('form', { name: 'Registration form' })).toBeInTheDocument();
    
    // 檢查 fieldset 和 legend
    expect(screen.getByRole('group', { name: 'Personal Information' })).toBeInTheDocument();
    
    // 檢查所有輸入欄位都有標籤
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subscribe to newsletter/i)).toBeInTheDocument();
  });

  it('should show error messages with proper ARIA attributes', async () => {
    const user = userEvent.setup();
    render(<AccessibleForm />);

    // 觸發驗證錯誤
    const nameInput = screen.getByLabelText(/full name/i);
    await user.type(nameInput, 'a');
    await user.clear(nameInput);

    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Name must be at least 2 characters');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });

    // 檢查 aria-invalid 屬性
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
  });

  it('should have proper aria-describedby relationships', () => {
    render(<AccessibleForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // 檢查提示文字的關聯
    expect(emailInput).toHaveAttribute('aria-describedby', 'email-hint');
    expect(passwordInput).toHaveAttribute('aria-describedby', 'password-requirements');

    // 檢查提示文字存在
    expect(screen.getByText('We\'ll use this to send you important updates')).toHaveAttribute('id', 'email-hint');
    expect(screen.getByText('Must be at least 6 characters long')).toHaveAttribute('id', 'password-requirements');
  });

  it('should be keyboard navigable', async () => {
    const user = userEvent.setup();
    render(<AccessibleForm />);

    // 測試 Tab 順序
    await user.tab();
    expect(screen.getByLabelText(/full name/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/email address/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/password/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/subscribe to newsletter/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /register/i })).toHaveFocus();
  });

  it('should handle form submission with keyboard', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<AccessibleForm />);

    // 填寫有效資料
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // 使用 Enter 鍵提交
    await user.keyboard('{Enter}');

    expect(alertSpy).toHaveBeenCalledWith('Form submitted successfully!');
    alertSpy.mockRestore();
  });
});
```

### 可訪問性模態對話框

```typescript
// components/AccessibleModal.tsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      // 儲存當前焦點
      previousFocusRef.current = document.activeElement;
      
      // 焦點移到模態框
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);

      // 禁用背景滾動
      document.body.style.overflow = 'hidden';
    } else {
      // 恢復焦點
      if (previousFocusRef.current) {
        (previousFocusRef.current as HTMLElement).focus();
      }
      
      // 恢復滾動
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      data-testid="modal-backdrop"
    >
      <div
        ref={modalRef}
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        data-testid="modal"
      >
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close dialog"
            data-testid="modal-close"
          >
            ×
          </button>
        </header>
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
```

### 模態對話框測試

```typescript
// components/__tests__/AccessibleModal.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { AccessibleModal } from '../AccessibleModal';

describe('AccessibleModal', () => {
  beforeEach(() => {
    // 創建一個按鈕來測試焦點管理
    const button = document.createElement('button');
    button.textContent = 'Open Modal';
    document.body.appendChild(button);
    button.focus();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(
      <AccessibleModal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </AccessibleModal>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <AccessibleModal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </AccessibleModal>
    );

    const modal = screen.getByTestId('modal');
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(modal).toHaveAttribute('tabindex', '-1');
  });

  it('should manage focus properly', async () => {
    const { rerender } = render(
      <AccessibleModal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </AccessibleModal>
    );

    // 初始焦點應該在按鈕上
    expect(document.activeElement?.textContent).toBe('Open Modal');

    // 開啟模態框
    rerender(
      <AccessibleModal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </AccessibleModal>
    );

    // 焦點應該移到模態框
    await screen.findByTestId('modal');
    expect(document.activeElement).toBe(screen.getByTestId('modal'));

    // 關閉模態框
    rerender(
      <AccessibleModal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </AccessibleModal>
    );

    // 焦點應該回到原來的按鈕
    expect(document.activeElement?.textContent).toBe('Open Modal');
  });

  it('should close on Escape key', async () => {
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <AccessibleModal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </AccessibleModal>
    );

    await user.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close when clicking backdrop', async () => {
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <AccessibleModal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </AccessibleModal>
    );

    await user.click(screen.getByTestId('modal-backdrop'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close when clicking modal content', async () => {
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <AccessibleModal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </AccessibleModal>
    );

    await user.click(screen.getByTestId('modal'));
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should prevent body scroll when open', () => {
    const { rerender } = render(
      <AccessibleModal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </AccessibleModal>
    );

    expect(document.body.style.overflow).toBe('');

    rerender(
      <AccessibleModal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </AccessibleModal>
    );

    expect(document.body.style.overflow).toBe('hidden');
  });
});
```

## 最佳實踐總結

### 1. 語義化 HTML
```typescript
// ✅ 使用適當的 HTML 元素
<button onClick={handleClick}>Click me</button>
<nav aria-label="Main navigation">...</nav>
<main>...</main>

// ❌ 避免使用非語義化元素
<div onClick={handleClick}>Click me</div>
```

### 2. ARIA 屬性使用
```typescript
// ✅ 適當的 ARIA 屬性
<input 
  aria-label="Search products"
  aria-describedby="search-help"
  aria-invalid={hasError}
/>

// ❌ 過度使用 ARIA
<div role="button" tabIndex={0}>...</div> // 應該使用 <button>
```

### 3. 焦點管理
```typescript
// ✅ 邏輯的焦點順序
const handleModalOpen = () => {
  setIsOpen(true);
  // 焦點會自動管理到模態框
};

// ❌ 破壞性的焦點操作
element.focus(); // 沒有考慮使用者預期
```

## 常見問題

### Q: 何時需要使用 ARIA 屬性？

**A:** 當 HTML 語義不足以表達元件的用途或狀態時：
- 自定義元件（如下拉選單）
- 動態內容更新
- 複雜的互動模式

### Q: 如何測試螢幕閱讀器相容性？

**A:** 
1. 使用自動化工具（jest-axe）
2. 手動測試螢幕閱讀器（NVDA、JAWS、VoiceOver）
3. 檢查 ARIA 標籤的正確性

### Q: 色彩對比度如何測試？

**A:** 
1. 使用工具（WebAIM Contrast Checker）
2. 自動化測試（axe-core 包含對比度檢查）
3. 確保 WCAG AA 級別（4.5:1 對比度）

## 延伸閱讀

- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)
- [Testing Library Accessibility Guide](https://testing-library.com/docs/guide-which-query/#priority)

## 本日重點回顧

1. **可訪問性測試的重要性**：確保所有使用者都能使用應用程式
2. **自動化測試工具**：jest-axe 進行基礎檢測
3. **語義化 HTML**：使用正確的 HTML 元素
4. **ARIA 屬性**：適當的無障礙標記
5. **焦點管理**：邏輯的鍵盤導航
6. **手動測試**：結合自動化和手動測試

可訪問性不是事後添加的功能，而應該從設計階段就開始考慮。通過適當的測試，我們可以確保應用程式對所有使用者都是友善的。
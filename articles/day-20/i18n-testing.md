# Day 20: 國際化 (i18n) 測試

## 學習目標

- 了解國際化應用的測試策略
- 學會測試多語系切換功能
- 掌握翻譯內容的驗證方法
- 測試日期、數字格式化
- 處理語言載入和切換的非同步操作
- 測試 RTL（右至左）語言支援

## 國際化測試概念

國際化 (Internationalization, i18n) 測試確保應用能正確支援多種語言和地區設定：

### 測試重點

1. **文字翻譯**：驗證不同語言的文字顯示正確
2. **語言切換**：測試語言切換功能
3. **格式化**：數字、日期、貨幣格式
4. **佈局適應**：不同語言文字長度的佈局處理
5. **文字方向**：LTR/RTL 文字方向支援

## React i18n 設定

### 安裝 react-i18next

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

### i18n 設定

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 翻譯資源
const resources = {
  en: {
    translation: {
      welcome: 'Welcome',
      login: 'Login',
      email: 'Email',
      password: 'Password',
      submit: 'Submit',
      cancel: 'Cancel',
      loading: 'Loading...',
      error: {
        required: 'This field is required',
        invalid_email: 'Invalid email address',
        login_failed: 'Login failed. Please try again.',
      },
      user: {
        profile: 'User Profile',
        settings: 'Settings',
        logout: 'Logout',
      },
      product: {
        name: 'Product Name',
        price: 'Price',
        description: 'Description',
        add_to_cart: 'Add to Cart',
      },
    },
  },
  'zh-TW': {
    translation: {
      welcome: '歡迎',
      login: '登入',
      email: '電子郵件',
      password: '密碼',
      submit: '提交',
      cancel: '取消',
      loading: '載入中...',
      error: {
        required: '此欄位為必填',
        invalid_email: '無效的電子郵件地址',
        login_failed: '登入失敗，請重試。',
      },
      user: {
        profile: '使用者資料',
        settings: '設定',
        logout: '登出',
      },
      product: {
        name: '產品名稱',
        price: '價格',
        description: '描述',
        add_to_cart: '加入購物車',
      },
    },
  },
  ja: {
    translation: {
      welcome: 'ようこそ',
      login: 'ログイン',
      email: 'メールアドレス',
      password: 'パスワード',
      submit: '送信',
      cancel: 'キャンセル',
      loading: '読み込み中...',
      error: {
        required: 'この項目は必須です',
        invalid_email: '無効なメールアドレス',
        login_failed: 'ログインに失敗しました。再試行してください。',
      },
      user: {
        profile: 'ユーザープロファイル',
        settings: '設定',
        logout: 'ログアウト',
      },
      product: {
        name: '商品名',
        price: '価格',
        description: '説明',
        add_to_cart: 'カートに追加',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

## 基本國際化元件

### 語言切換器元件

```typescript
// src/components/LanguageSwitcher.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface Language {
  code: string;
  name: string;
  flag?: string;
}

export interface LanguageSwitcherProps {
  languages: Language[];
  onLanguageChange?: (language: string) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  languages,
  onLanguageChange,
}) => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    onLanguageChange?.(languageCode);
  };

  return (
    <div className="language-switcher" data-testid="language-switcher">
      <label htmlFor="language-select">Language:</label>
      <select
        id="language-select"
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        data-testid="language-select"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### 多語系表單元件

```typescript
// src/components/LoginForm.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface LoginFormProps {
  onSubmit?: (data: { email: string; password: string }) => Promise<void>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = t('error.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('error.invalid_email');
    }

    if (!formData.password) {
      newErrors.password = t('error.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit?.(formData);
    } catch (error) {
      setErrors({ general: t('error.login_failed') });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <h2>{t('login')}</h2>

      <div className="form-group">
        <label htmlFor="email">{t('email')}</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          data-testid="email-input"
        />
        {errors.email && (
          <span className="error" role="alert" data-testid="email-error">
            {errors.email}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">{t('password')}</label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange('password')}
          data-testid="password-input"
        />
        {errors.password && (
          <span className="error" role="alert" data-testid="password-error">
            {errors.password}
          </span>
        )}
      </div>

      {errors.general && (
        <div className="error general" role="alert" data-testid="general-error">
          {errors.general}
        </div>
      )}

      <div className="form-actions">
        <button 
          type="submit" 
          disabled={loading}
          data-testid="submit-button"
        >
          {loading ? t('loading') : t('submit')}
        </button>
        <button 
          type="button"
          data-testid="cancel-button"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
};
```

### 產品卡片元件

```typescript
// src/components/ProductCard.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  currency?: string;
}

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  locale?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  locale = 'en-US',
}) => {
  const { t } = useTranslation();

  const formatPrice = (price: number, currency = 'USD'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(price);
  };

  const handleAddToCart = () => {
    onAddToCart?.(product);
  };

  return (
    <div className="product-card" data-testid="product-card">
      <h3 data-testid="product-name">{product.name}</h3>
      
      <div className="product-price" data-testid="product-price">
        {t('product.price')}: {formatPrice(product.price, product.currency)}
      </div>

      <p className="product-description" data-testid="product-description">
        <strong>{t('product.description')}:</strong> {product.description}
      </p>

      <button 
        onClick={handleAddToCart}
        data-testid="add-to-cart-button"
      >
        {t('product.add_to_cart')}
      </button>
    </div>
  );
};
```

## 測試設定和工具

### 測試工具函數

```typescript
// src/test/i18n-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

// 創建測試用的 i18n 實例
export const createTestI18n = (language = 'en') => {
  const testI18n = i18n.cloneInstance();
  testI18n.changeLanguage(language);
  return testI18n;
};

// 支援 i18n 的 render 函數
interface RenderWithI18nOptions extends Omit<RenderOptions, 'wrapper'> {
  language?: string;
  i18nInstance?: typeof i18n;
}

export const renderWithI18n = (
  ui: ReactElement,
  options: RenderWithI18nOptions = {}
) => {
  const { language = 'en', i18nInstance = createTestI18n(language), ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <I18nextProvider i18n={i18nInstance}>
      {children}
    </I18nextProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// 語言切換測試工具
export const changeLanguageAndWait = async (
  i18nInstance: typeof i18n,
  language: string
): Promise<void> => {
  return new Promise((resolve) => {
    i18nInstance.changeLanguage(language, () => {
      // 等待語言切換完成
      resolve();
    });
  });
};
```

## 國際化元件測試

### 語言切換器測試

```typescript
// src/components/LanguageSwitcher.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSwitcher, Language } from './LanguageSwitcher';
import { renderWithI18n } from '../test/i18n-utils';

const mockLanguages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

describe('LanguageSwitcher Component', () => {
  const mockOnLanguageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders language selector with options', () => {
      renderWithI18n(
        <LanguageSwitcher 
          languages={mockLanguages}
          onLanguageChange={mockOnLanguageChange}
        />
      );

      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
      expect(screen.getByTestId('language-select')).toBeInTheDocument();
      expect(screen.getByLabelText('Language:')).toBeInTheDocument();

      // 檢查所有語言選項
      mockLanguages.forEach(lang => {
        expect(screen.getByText(`${lang.flag} ${lang.name}`)).toBeInTheDocument();
      });
    });

    test('displays current language as selected', () => {
      renderWithI18n(
        <LanguageSwitcher languages={mockLanguages} />,
        { language: 'zh-TW' }
      );

      const select = screen.getByTestId('language-select') as HTMLSelectElement;
      expect(select.value).toBe('zh-TW');
    });
  });

  describe('Language Switching', () => {
    test('changes language when option is selected', async () => {
      const user = userEvent.setup();
      const { i18nInstance } = renderWithI18n(
        <LanguageSwitcher 
          languages={mockLanguages}
          onLanguageChange={mockOnLanguageChange}
        />,
        { language: 'en' }
      );

      const select = screen.getByTestId('language-select');
      
      await user.selectOptions(select, 'zh-TW');

      expect(mockOnLanguageChange).toHaveBeenCalledWith('zh-TW');
      
      await waitFor(() => {
        expect(i18nInstance?.language).toBe('zh-TW');
      });
    });

    test('handles language change without callback', async () => {
      const user = userEvent.setup();
      renderWithI18n(
        <LanguageSwitcher languages={mockLanguages} />,
        { language: 'en' }
      );

      const select = screen.getByTestId('language-select');
      
      // 應該不會拋出錯誤
      await user.selectOptions(select, 'ja');
      
      const updatedSelect = screen.getByTestId('language-select') as HTMLSelectElement;
      expect(updatedSelect.value).toBe('ja');
    });
  });
});
```

### 多語系表單測試

```typescript
// src/components/LoginForm.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { renderWithI18n } from '../test/i18n-utils';

describe('LoginForm Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('English Translation', () => {
    test('renders form in English', () => {
      renderWithI18n(<LoginForm onSubmit={mockOnSubmit} />, { language: 'en' });

      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('shows English validation messages', async () => {
      const user = userEvent.setup();
      renderWithI18n(<LoginForm onSubmit={mockOnSubmit} />, { language: 'en' });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('This field is required');
        expect(screen.getByTestId('password-error')).toHaveTextContent('This field is required');
      });
    });

    test('shows English invalid email message', async () => {
      const user = userEvent.setup();
      renderWithI18n(<LoginForm onSubmit={mockOnSubmit} />, { language: 'en' });

      await user.type(screen.getByTestId('email-input'), 'invalid-email');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email address');
      });
    });
  });

  describe('Chinese Translation', () => {
    test('renders form in Chinese', () => {
      renderWithI18n(<LoginForm onSubmit={mockOnSubmit} />, { language: 'zh-TW' });

      expect(screen.getByText('登入')).toBeInTheDocument();
      expect(screen.getByLabelText('電子郵件')).toBeInTheDocument();
      expect(screen.getByLabelText('密碼')).toBeInTheDocument();
      expect(screen.getByText('提交')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    test('shows Chinese validation messages', async () => {
      const user = userEvent.setup();
      renderWithI18n(<LoginForm onSubmit={mockOnSubmit} />, { language: 'zh-TW' });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('此欄位為必填');
        expect(screen.getByTestId('password-error')).toHaveTextContent('此欄位為必填');
      });
    });

    test('shows Chinese invalid email message', async () => {
      const user = userEvent.setup();
      renderWithI18n(<LoginForm onSubmit={mockOnSubmit} />, { language: 'zh-TW' });

      await user.type(screen.getByTestId('email-input'), 'invalid-email');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('無效的電子郵件地址');
      });
    });
  });

  describe('Japanese Translation', () => {
    test('renders form in Japanese', () => {
      renderWithI18n(<LoginForm onSubmit={mockOnSubmit} />, { language: 'ja' });

      expect(screen.getByText('ログイン')).toBeInTheDocument();
      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
      expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
      expect(screen.getByText('送信')).toBeInTheDocument();
      expect(screen.getByText('キャンセル')).toBeInTheDocument();
    });

    test('shows loading text in Japanese', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderWithI18n(<LoginForm onSubmit={mockOnSubmit} />, { language: 'ja' });

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('submit-button'));

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });
  });

  describe('Form Functionality', () => {
    test('handles successful form submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      
      renderWithI18n(<LoginForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('submit-button'));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    test('handles form submission error', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue(new Error('Network error'));
      
      renderWithI18n(<LoginForm onSubmit={mockOnSubmit} />, { language: 'en' });

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('general-error')).toHaveTextContent('Login failed. Please try again.');
      });
    });
  });
});
```

### 產品卡片和格式化測試

```typescript
// src/components/ProductCard.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard, Product } from './ProductCard';
import { renderWithI18n } from '../test/i18n-utils';

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  price: 29.99,
  description: 'A great test product',
  currency: 'USD',
};

describe('ProductCard Component', () => {
  const mockOnAddToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Localization', () => {
    test('renders product labels in English', () => {
      renderWithI18n(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockOnAddToCart}
          locale="en-US" 
        />,
        { language: 'en' }
      );

      expect(screen.getByText('Price:')).toBeInTheDocument();
      expect(screen.getByText('Description:')).toBeInTheDocument();
      expect(screen.getByText('Add to Cart')).toBeInTheDocument();
    });

    test('renders product labels in Chinese', () => {
      renderWithI18n(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockOnAddToCart}
          locale="zh-TW" 
        />,
        { language: 'zh-TW' }
      );

      expect(screen.getByText('價格:')).toBeInTheDocument();
      expect(screen.getByText('描述:')).toBeInTheDocument();
      expect(screen.getByText('加入購物車')).toBeInTheDocument();
    });

    test('renders product labels in Japanese', () => {
      renderWithI18n(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockOnAddToCart}
          locale="ja-JP" 
        />,
        { language: 'ja' }
      );

      expect(screen.getByText('価格:')).toBeInTheDocument();
      expect(screen.getByText('説明:')).toBeInTheDocument();
      expect(screen.getByText('カートに追加')).toBeInTheDocument();
    });
  });

  describe('Price Formatting', () => {
    test('formats price in USD for US locale', () => {
      renderWithI18n(
        <ProductCard 
          product={mockProduct} 
          locale="en-US" 
        />
      );

      expect(screen.getByTestId('product-price')).toHaveTextContent('$29.99');
    });

    test('formats price in EUR for German locale', () => {
      const euroProduct = { ...mockProduct, currency: 'EUR' };
      renderWithI18n(
        <ProductCard 
          product={euroProduct} 
          locale="de-DE" 
        />
      );

      expect(screen.getByTestId('product-price')).toHaveTextContent('29,99');
    });

    test('formats price in JPY for Japanese locale', () => {
      const yenProduct = { ...mockProduct, price: 3000, currency: 'JPY' };
      renderWithI18n(
        <ProductCard 
          product={yenProduct} 
          locale="ja-JP" 
        />
      );

      expect(screen.getByTestId('product-price')).toHaveTextContent('￥3,000');
    });

    test('formats price in TWD for Taiwan locale', () => {
      const twdProduct = { ...mockProduct, price: 899, currency: 'TWD' };
      renderWithI18n(
        <ProductCard 
          product={twdProduct} 
          locale="zh-TW" 
        />
      );

      expect(screen.getByTestId('product-price')).toHaveTextContent('NT$899');
    });
  });

  describe('Functionality', () => {
    test('calls onAddToCart when button is clicked', async () => {
      const user = userEvent.setup();
      renderWithI18n(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockOnAddToCart}
        />
      );

      await user.click(screen.getByTestId('add-to-cart-button'));

      expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct);
    });

    test('displays product information', () => {
      renderWithI18n(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(screen.getByTestId('product-name')).toHaveTextContent('Test Product');
      expect(screen.getByTestId('product-description')).toHaveTextContent('A great test product');
    });
  });
});
```

## 進階國際化測試

### 動態語言載入測試

```typescript
// src/hooks/useLanguageLoader.ts
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface UseLanguageLoaderOptions {
  supportedLanguages: string[];
  loadLanguageResources?: (language: string) => Promise<any>;
}

export const useLanguageLoader = (options: UseLanguageLoaderOptions) => {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeLanguage = async (language: string): Promise<void> => {
    if (!options.supportedLanguages.includes(language)) {
      throw new Error(`Language ${language} is not supported`);
    }

    setLoading(true);
    setError(null);

    try {
      // 如果有自定義載入器，先載入資源
      if (options.loadLanguageResources) {
        const resources = await options.loadLanguageResources(language);
        i18n.addResourceBundle(language, 'translation', resources);
      }

      await i18n.changeLanguage(language);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load language';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    currentLanguage: i18n.language,
    loading,
    error,
    changeLanguage,
  };
};
```

```typescript
// src/hooks/useLanguageLoader.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLanguageLoader } from './useLanguageLoader';
import { renderWithI18n } from '../test/i18n-utils';

describe('useLanguageLoader Hook', () => {
  const mockLoadLanguageResources = vi.fn();
  const supportedLanguages = ['en', 'zh-TW', 'ja'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('initializes with current language', () => {
    const { result } = renderHook(
      () => useLanguageLoader({ supportedLanguages }),
      {
        wrapper: ({ children }) => renderWithI18n(children as any, { language: 'en' }).container,
      }
    );

    expect(result.current.currentLanguage).toBe('en');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  test('changes language successfully', async () => {
    const { result } = renderHook(
      () => useLanguageLoader({ supportedLanguages }),
      {
        wrapper: ({ children }) => renderWithI18n(children as any, { language: 'en' }).container,
      }
    );

    await result.current.changeLanguage('zh-TW');

    await waitFor(() => {
      expect(result.current.currentLanguage).toBe('zh-TW');
      expect(result.current.loading).toBe(false);
    });
  });

  test('handles loading state during language change', async () => {
    mockLoadLanguageResources.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { result } = renderHook(
      () => useLanguageLoader({ 
        supportedLanguages,
        loadLanguageResources: mockLoadLanguageResources 
      }),
      {
        wrapper: ({ children }) => renderWithI18n(children as any, { language: 'en' }).container,
      }
    );

    const changePromise = result.current.changeLanguage('ja');

    // 檢查 loading 狀態
    expect(result.current.loading).toBe(true);

    await changePromise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockLoadLanguageResources).toHaveBeenCalledWith('ja');
  });

  test('handles unsupported language error', async () => {
    const { result } = renderHook(
      () => useLanguageLoader({ supportedLanguages })
    );

    await expect(result.current.changeLanguage('fr')).rejects.toThrow(
      'Language fr is not supported'
    );

    expect(result.current.error).toBe('Language fr is not supported');
    expect(result.current.loading).toBe(false);
  });

  test('handles resource loading error', async () => {
    mockLoadLanguageResources.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useLanguageLoader({ 
        supportedLanguages,
        loadLanguageResources: mockLoadLanguageResources 
      })
    );

    await expect(result.current.changeLanguage('ja')).rejects.toThrow('Network error');

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });
});
```

## 常見問題

**Q: 如何測試翻譯資源未載入的情況？**
A: 可以創建沒有翻譯資源的 i18n 實例，測試 fallback 機制和錯誤處理。

**Q: 如何測試複數規則（Pluralization）？**
A: react-i18next 支援複數規則，可以使用 `t('key', { count: n })` 並測試不同數量的顯示結果。

**Q: 如何測試 RTL（右至左）語言的佈局？**
A: 檢查元素是否有正確的 `dir` 屬性，並測試佈局相關的 CSS 類別。

**Q: 如何模擬網路錯誤導致的語言資源載入失敗？**
A: Mock 語言載入函數，讓它拋出錯誤或返回被拒絕的 Promise。

## 練習題

1. **基礎練習**：建立一個 `WelcomeMessage` 元件
   - 根據時間顯示不同的問候語
   - 支援英文、中文、日文
   - 測試不同語言的顯示

2. **進階練習**：建立一個 `DateTimePicker` 元件
   - 支援不同地區的日期格式
   - 包含時區選擇功能
   - 測試各種地區設定

3. **挑戰練習**：建立一個 `ShoppingCart` 元件
   - 支援多幣別價格顯示
   - 包含稅率計算（依地區）
   - 支援 RTL 語言佈局
   - 測試複雜的計算邏輯

## 延伸閱讀

- [react-i18next 官方文件](https://react.i18next.com/)
- [i18next 測試指南](https://www.i18next.com/misc/testing)
- [Intl API - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [Web 國際化最佳實踐 - W3C](https://www.w3.org/International/)

## 本日重點回顧

✅ 了解國際化應用的測試策略和重點
✅ 學會設定 react-i18next 和測試環境
✅ 掌握多語系元件的測試方法
✅ 實作語言切換功能的測試
✅ 測試數字、貨幣、日期格式化
✅ 處理動態語言載入和錯誤情況
✅ 建立可重複使用的國際化測試工具

明天我們將學習測試組織與命名，了解如何建立清晰、可維護的測試結構！
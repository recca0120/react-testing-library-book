# Day 22: 測試組織與命名

## 學習目標

- 學習測試組織的最佳實踐
- 掌握清晰的測試命名規範
- 了解測試分層和分類策略
- 建立可維護的測試結構
- 使用 describe 和 test 建立階層結構
- 實作測試套件的標準化模板

## 測試組織原則

### 核心原則

1. **清晰性**：測試意圖一目了然
2. **一致性**：遵循統一的命名和組織模式
3. **可維護性**：易於修改和擴展
4. **可讀性**：像文件一樣容易理解
5. **可尋找性**：能快速找到特定功能的測試

### AAA 模式（Arrange, Act, Assert）

```typescript
test('should calculate total price with discount', () => {
  // Arrange - 準備測試資料
  const products = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 },
  ];
  const discountRate = 0.1;

  // Act - 執行被測試的行為
  const result = calculateTotalWithDiscount(products, discountRate);

  // Assert - 驗證結果
  expect(result).toBe(225); // (100*2 + 50*1) * 0.9
});
```

## 檔案和資料夾組織

### 專案結構範例

```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   └── Modal/
│   │       ├── Modal.tsx
│   │       ├── Modal.test.tsx
│   │       └── index.ts
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginForm/
│   │   │   ├── RegisterForm/
│   │   │   └── __tests__/
│   │   │       ├── auth-integration.test.tsx
│   │   │       └── auth-utils.test.ts
│   │   └── shopping/
│   │       ├── ProductCard/
│   │       ├── ShoppingCart/
│   │       └── __tests__/
├── hooks/
│   ├── useAuth.ts
│   ├── useAuth.test.ts
│   ├── useLocalStorage.ts
│   └── useLocalStorage.test.ts
├── utils/
│   ├── calculations.ts
│   ├── calculations.test.ts
│   ├── formatters.ts
│   └── formatters.test.ts
└── __tests__/
    ├── setup.ts
    ├── helpers/
    │   ├── test-utils.tsx
    │   ├── mock-data.ts
    │   └── custom-matchers.ts
    └── integration/
        ├── user-journey.test.tsx
        └── api-integration.test.tsx
```

### 檔案命名規範

```typescript
// ✅ 好的命名
Button.test.tsx
useAuth.test.ts
user-journey.test.tsx
auth-integration.test.tsx

// ✅ 也可以接受
Button.spec.tsx
useAuth.spec.ts

// ❌ 避免的命名
ButtonTests.tsx
test-Button.tsx
Button_test.tsx
```

## 測試命名策略

### 測試檔案描述命名

```typescript
// ✅ 好的描述 - 描述被測試的對象
describe('Button Component', () => {});
describe('useAuth Hook', () => {});
describe('calculateTotal Function', () => {});
describe('User Registration Flow', () => {});

// ❌ 避免的描述
describe('Button', () => {}); // 太簡潔
describe('Test Button Component', () => {}); // 冗餘
describe('Button.tsx', () => {}); // 使用檔案名
```

### 測試案例命名模式

#### 模式 1: should + 動作 + 條件

```typescript
describe('Button Component', () => {
  test('should render button with correct text', () => {});
  test('should call onClick when button is clicked', () => {});
  test('should be disabled when loading prop is true', () => {});
  test('should apply correct CSS class when variant is primary', () => {});
});
```

#### 模式 2: 行為描述式

```typescript
describe('ShoppingCart', () => {
  test('adds item to cart when add button is clicked', () => {});
  test('removes item from cart when remove button is clicked', () => {});
  test('calculates total price correctly with multiple items', () => {});
  test('shows empty state when cart has no items', () => {});
});
```

#### 模式 3: Given-When-Then 格式

```typescript
describe('UserAuthentication', () => {
  test('given valid credentials when user logs in then should redirect to dashboard', () => {});
  test('given invalid credentials when user logs in then should show error message', () => {});
  test('given expired session when user accesses protected route then should redirect to login', () => {});
});
```

## 測試結構組織

### 基本結構模板

```typescript
// src/components/SearchInput/SearchInput.test.tsx
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from './SearchInput';

describe('SearchInput Component', () => {
  // Setup 和 teardown
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 分組 1: 渲染和基本功能
  describe('Rendering', () => {
    test('renders search input with placeholder', () => {
      render(<SearchInput placeholder="搜尋產品..." />);
      
      expect(screen.getByPlaceholderText('搜尋產品...')).toBeInTheDocument();
    });

    test('renders with custom className', () => {
      const { container } = render(<SearchInput className="custom-search" />);
      
      expect(container.firstChild).toHaveClass('custom-search');
    });
  });

  // 分組 2: 使用者互動
  describe('User Interactions', () => {
    test('calls onChange when user types in input', async () => {
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      
      render(<SearchInput onChange={mockOnChange} />);
      const input = screen.getByRole('searchbox');
      
      await user.type(input, 'test query');
      
      expect(mockOnChange).toHaveBeenCalledWith('test query');
    });

    test('calls onSearch when search button is clicked', async () => {
      const mockOnSearch = vi.fn();
      const user = userEvent.setup();
      
      render(<SearchInput onSearch={mockOnSearch} />);
      const button = screen.getByRole('button', { name: /搜尋/i });
      
      await user.click(button);
      
      expect(mockOnSearch).toHaveBeenCalled();
    });
  });

  // 分組 3: Props 驗證
  describe('Props Handling', () => {
    test('uses default props when not provided', () => {
      render(<SearchInput />);
      
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('placeholder', '請輸入搜尋關鍵字');
    });

    test('applies disabled state correctly', () => {
      render(<SearchInput disabled={true} />);
      
      const input = screen.getByRole('searchbox');
      const button = screen.getByRole('button');
      
      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });
  });

  // 分組 4: 邊界情況和錯誤處理
  describe('Edge Cases', () => {
    test('handles empty search query gracefully', async () => {
      const mockOnSearch = vi.fn();
      const user = userEvent.setup();
      
      render(<SearchInput onSearch={mockOnSearch} />);
      const button = screen.getByRole('button', { name: /搜尋/i });
      
      await user.click(button);
      
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    test('trims whitespace from search query', async () => {
      const mockOnSearch = vi.fn();
      const user = userEvent.setup();
      
      render(<SearchInput onSearch={mockOnSearch} />);
      const input = screen.getByRole('searchbox');
      const button = screen.getByRole('button', { name: /搜尋/i });
      
      await user.type(input, '  test query  ');
      await user.click(button);
      
      expect(mockOnSearch).toHaveBeenCalledWith('test query');
    });
  });
});
```

### 複雜元件的分層結構

```typescript
// src/features/shopping/ShoppingCart/ShoppingCart.test.tsx
describe('ShoppingCart Component', () => {
  // Test data setup
  const mockProducts = [
    { id: '1', name: 'Product 1', price: 100, quantity: 2 },
    { id: '2', name: 'Product 2', price: 50, quantity: 1 },
  ];

  describe('Initial State', () => {
    describe('Empty Cart', () => {
      test('displays empty cart message', () => {});
      test('hides checkout button', () => {});
      test('shows correct empty state illustration', () => {});
    });

    describe('Cart with Items', () => {
      test('displays all cart items', () => {});
      test('shows correct total price', () => {});
      test('enables checkout button', () => {});
    });
  });

  describe('Item Management', () => {
    describe('Adding Items', () => {
      test('adds new item to empty cart', () => {});
      test('increases quantity of existing item', () => {});
      test('updates total price after adding item', () => {});
    });

    describe('Removing Items', () => {
      test('removes item completely when quantity becomes zero', () => {});
      test('decreases quantity when remove button clicked', () => {});
      test('updates total price after removing item', () => {});
    });

    describe('Quantity Updates', () => {
      test('increases quantity when plus button clicked', () => {});
      test('decreases quantity when minus button clicked', () => {});
      test('validates maximum quantity limits', () => {});
      test('validates minimum quantity limits', () => {});
    });
  });

  describe('Checkout Process', () => {
    describe('Validation', () => {
      test('prevents checkout with empty cart', () => {});
      test('validates item availability before checkout', () => {});
      test('checks stock levels for all items', () => {});
    });

    describe('Payment Flow', () => {
      test('opens payment modal when checkout clicked', () => {});
      test('calculates final total with tax and shipping', () => {});
      test('handles payment success scenario', () => {});
      test('handles payment failure scenario', () => {});
    });
  });

  describe('Data Persistence', () => {
    test('saves cart to localStorage on changes', () => {});
    test('loads cart from localStorage on mount', () => {});
    test('clears cart after successful checkout', () => {});
  });

  describe('Error Handling', () => {
    test('handles network errors gracefully', () => {});
    test('shows appropriate error messages', () => {});
    test('allows retry after errors', () => {});
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {});
    test('supports keyboard navigation', () => {});
    test('provides screen reader friendly content', () => {});
  });

  describe('Performance', () => {
    test('renders efficiently with large number of items', () => {});
    test('debounces quantity changes', () => {});
    test('memoizes expensive calculations', () => {});
  });
});
```

## 測試分類和標籤

### 使用 describe 進行分類

```typescript
describe('ProductCard Component', () => {
  describe('Visual Appearance', () => {
    test('matches snapshot for default state', () => {});
    test('applies correct styling for different variants', () => {});
  });

  describe('Data Display', () => {
    test('formats price correctly', () => {});
    test('truncates long product descriptions', () => {});
  });

  describe('User Actions', () => {
    test('handles add to cart action', () => {});
    test('handles product detail navigation', () => {});
  });

  describe('Responsive Behavior', () => {
    test('adapts layout for mobile screens', () => {});
    test('shows abbreviated content on small screens', () => {});
  });
});
```

### 使用 test.skip 和 test.only 進行控制

```typescript
describe('FeatureInDevelopment', () => {
  test('basic functionality works', () => {
    // 正常測試
  });

  test.skip('advanced feature not yet implemented', () => {
    // 暫時跳過的測試
  });

  test.only('debugging this specific case', () => {
    // 只執行這個測試（開發時使用）
  });
});
```

### 自定義測試分類工具

```typescript
// src/__tests__/helpers/test-categories.ts
export const categories = {
  unit: (name: string, fn: () => void) => describe(`[UNIT] ${name}`, fn),
  integration: (name: string, fn: () => void) => describe(`[INTEGRATION] ${name}`, fn),
  e2e: (name: string, fn: () => void) => describe(`[E2E] ${name}`, fn),
  smoke: (name: string, fn: () => void) => describe(`[SMOKE] ${name}`, fn),
  regression: (name: string, fn: () => void) => describe(`[REGRESSION] ${name}`, fn),
};

// 使用範例
import { categories } from '../helpers/test-categories';

categories.unit('Button Component', () => {
  test('renders correctly', () => {});
});

categories.integration('Authentication Flow', () => {
  test('login and redirect works', () => {});
});
```

## 測試資料組織

### 集中管理測試資料

```typescript
// src/__tests__/helpers/mock-data.ts
export const mockUsers = {
  validUser: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  },
  adminUser: {
    id: '2',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
  },
  invalidUser: {
    id: '',
    email: 'invalid-email',
    name: '',
  },
};

export const mockProducts = {
  electronics: [
    { id: '1', name: 'Laptop', price: 999, category: 'electronics' },
    { id: '2', name: 'Phone', price: 599, category: 'electronics' },
  ],
  books: [
    { id: '3', name: 'JavaScript Guide', price: 39, category: 'books' },
    { id: '4', name: 'React Handbook', price: 49, category: 'books' },
  ],
};

export const mockApiResponses = {
  success: {
    status: 200,
    data: { message: 'Success' },
  },
  error: {
    status: 500,
    error: { message: 'Internal Server Error' },
  },
  notFound: {
    status: 404,
    error: { message: 'Not Found' },
  },
};
```

### 測試工廠函數

```typescript
// src/__tests__/helpers/factories.ts
import { faker } from '@faker-js/faker';

interface UserFactoryOptions {
  email?: string;
  name?: string;
  role?: 'user' | 'admin';
  verified?: boolean;
}

export const createMockUser = (options: UserFactoryOptions = {}) => ({
  id: faker.string.uuid(),
  email: options.email || faker.internet.email(),
  name: options.name || faker.person.fullName(),
  role: options.role || 'user',
  verified: options.verified ?? true,
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
});

export const createMockProduct = (options: Partial<Product> = {}): Product => ({
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  price: parseFloat(faker.commerce.price()),
  description: faker.commerce.productDescription(),
  category: faker.commerce.department(),
  inStock: faker.datatype.boolean(),
  ...options,
});

// 使用範例
test('handles multiple users', () => {
  const users = [
    createMockUser({ role: 'admin' }),
    createMockUser({ role: 'user', verified: false }),
    createMockUser(),
  ];
  
  // 測試邏輯
});
```

## 測試文件化

### 自描述的測試

```typescript
describe('Price Calculator', () => {
  describe('when calculating total with discount', () => {
    describe('and discount is percentage based', () => {
      test('applies 10% discount to order total of $100 resulting in $90', () => {
        const orderTotal = 100;
        const discountPercentage = 10;
        
        const result = calculateTotalWithDiscount(orderTotal, discountPercentage);
        
        expect(result).toBe(90);
      });
    });

    describe('and discount is fixed amount', () => {
      test('applies $15 discount to order total of $100 resulting in $85', () => {
        const orderTotal = 100;
        const discountAmount = 15;
        
        const result = calculateTotalWithFixedDiscount(orderTotal, discountAmount);
        
        expect(result).toBe(85);
      });
    });
  });
});
```

### 測試註解和文件

```typescript
describe('ComplexBusinessLogic', () => {
  /**
   * 測試商業邏輯：會員等級折扣計算
   * 
   * 規則：
   * - Bronze: 5% 折扣
   * - Silver: 10% 折扣  
   * - Gold: 15% 折扣
   * - Platinum: 20% 折扣
   * 
   * 最低消費限制：
   * - 折扣僅適用於訂單金額 >= $50
   */
  describe('Member Tier Discount Calculation', () => {
    test.each([
      ['Bronze', 100, 95],
      ['Silver', 100, 90], 
      ['Gold', 100, 85],
      ['Platinum', 100, 80],
    ])('applies correct discount for %s member with $%d order', (tier, amount, expected) => {
      const result = calculateMemberDiscount(tier, amount);
      expect(result).toBe(expected);
    });

    test('does not apply discount for orders under $50', () => {
      const result = calculateMemberDiscount('Gold', 30);
      expect(result).toBe(30); // No discount applied
    });
  });
});
```

## 常見問題

**Q: 測試檔案應該和源碼檔案放在同一個資料夾嗎？**
A: 兩種方式都可以。放在同一資料夾便於維護，放在 `__tests__` 資料夾便於管理。選擇一種並保持一致。

**Q: 如何處理非常長的測試名稱？**
A: 優先保持描述性，可以使用 describe 分層來避免重複。如果還是太長，可以考慮拆分測試。

**Q: 應該為每個函數都寫測試嗎？**
A: 專注於公開 API 和重要的業務邏輯。私有函數通常通過公開函數的測試間接覆蓋。

**Q: 如何平衡測試的詳細程度和維護成本？**
A: 遵循測試金字塔原則，重點測試核心邏輯，適當使用整合測試覆蓋互動場景。

## 練習題

1. **基礎練習**：重構現有測試檔案
   - 選擇一個現有的測試檔案
   - 應用本日學習的命名和組織原則
   - 使用 describe 建立清晰的分層結構

2. **進階練習**：建立測試模板
   - 為你的專案建立標準化的測試模板
   - 包含常用的 setup/teardown 邏輯
   - 建立測試資料工廠函數

3. **挑戰練習**：完整測試套件設計
   - 為一個複雜的功能模組設計完整測試套件
   - 包含單元測試、整合測試、邊界測試
   - 應用所有最佳實踐原則

## 延伸閱讀

- [Jest/Vitest 測試組織最佳實踐](https://jestjs.io/docs/test-structure)
- [測試命名慣例指南](https://testingjavascript.com/)
- [BDD 和 TDD 測試方法論](https://cucumber.io/docs/bdd/)
- [Test Doubles - Martin Fowler](https://martinfowler.com/bliki/TestDouble.html)

## 本日重點回顧

✅ 學會測試組織的核心原則和最佳實踐
✅ 掌握清晰的測試命名規範和模式
✅ 了解如何使用 describe 建立測試階層結構
✅ 建立可維護的測試檔案和資料夾組織方式
✅ 實作測試資料管理和工廠函數
✅ 學會測試分類和標籤化技巧
✅ 建立自描述和可讀性高的測試程式碼

明天我們將學習測試資料管理，深入探討如何有效準備和管理測試資料！
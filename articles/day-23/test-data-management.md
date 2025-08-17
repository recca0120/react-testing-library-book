# Day 23: 測試資料管理

## 學習目標

- 了解測試資料管理的重要性和策略
- 學會建立可重複使用的測試資料
- 掌握測試資料的生成和維護方法
- 實作測試資料工廠和建構器模式
- 處理複雜的測試場景和邊界條件
- 管理測試資料的生命週期

## 測試資料管理概念

### 為什麼需要測試資料管理？

1. **一致性**：確保測試使用標準化的資料格式
2. **可維護性**：集中管理避免重複和不一致
3. **可讀性**：清晰的資料結構讓測試更容易理解
4. **可靠性**：穩定的測試資料減少因資料變化導致的測試失敗
5. **效率**：重複使用資料定義提高開發效率

### 測試資料類型

1. **靜態資料**：固定不變的測試資料
2. **動態資料**：每次測試動態生成的資料  
3. **邊界資料**：測試邊界條件的特殊資料
4. **錯誤資料**：用於測試錯誤處理的無效資料

## 基本測試資料管理

### 靜態測試資料

```typescript
// src/__tests__/fixtures/static-data.ts

// 使用者測試資料
export const testUsers = {
  validUser: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    verified: true,
    createdAt: '2023-01-01T00:00:00Z',
  },
  adminUser: {
    id: 'admin-1',
    email: 'admin@example.com', 
    name: 'Admin User',
    role: 'admin',
    verified: true,
    createdAt: '2023-01-01T00:00:00Z',
  },
  unverifiedUser: {
    id: 'user-2',
    email: 'unverified@example.com',
    name: 'Unverified User', 
    role: 'user',
    verified: false,
    createdAt: '2023-01-15T00:00:00Z',
  },
} as const;

// 產品測試資料
export const testProducts = {
  laptop: {
    id: 'product-1',
    name: 'MacBook Pro',
    price: 2999,
    category: 'electronics',
    description: 'High-performance laptop',
    inStock: true,
    stockCount: 10,
    tags: ['computer', 'laptop', 'apple'],
  },
  book: {
    id: 'product-2',
    name: 'JavaScript: The Good Parts',
    price: 29.99,
    category: 'books',
    description: 'Essential JavaScript concepts',
    inStock: true,
    stockCount: 50,
    tags: ['programming', 'javascript', 'web'],
  },
  outOfStock: {
    id: 'product-3',
    name: 'Rare Collectible',
    price: 999.99,
    category: 'collectibles',
    description: 'Limited edition item',
    inStock: false,
    stockCount: 0,
    tags: ['rare', 'collectible'],
  },
} as const;

// API 回應測試資料
export const testApiResponses = {
  success: {
    status: 200,
    data: { message: 'Success', timestamp: '2023-01-01T00:00:00Z' },
  },
  unauthorized: {
    status: 401,
    error: { message: 'Unauthorized', code: 'AUTH_REQUIRED' },
  },
  notFound: {
    status: 404,
    error: { message: 'Resource not found', code: 'NOT_FOUND' },
  },
  serverError: {
    status: 500,
    error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
  },
} as const;
```

### 測試資料工廠模式

```typescript
// src/__tests__/helpers/factories.ts
import { faker } from '@faker-js/faker';

// 基礎介面定義
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'moderator';
  verified: boolean;
  createdAt: string;
  profile?: UserProfile;
}

export interface UserProfile {
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  inStock: boolean;
  stockCount: number;
  tags: string[];
  images?: string[];
}

// 使用者工廠
export class UserFactory {
  private static sequence = 0;

  static create(overrides: Partial<User> = {}): User {
    this.sequence++;
    
    return {
      id: `user-${this.sequence}`,
      email: faker.internet.email(),
      name: faker.person.fullName(),
      role: 'user',
      verified: true,
      createdAt: faker.date.past().toISOString(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static admin(overrides: Partial<User> = {}): User {
    return this.create({
      role: 'admin',
      name: faker.person.fullName() + ' (Admin)',
      ...overrides,
    });
  }

  static unverified(overrides: Partial<User> = {}): User {
    return this.create({
      verified: false,
      ...overrides,
    });
  }

  static withProfile(profileData: Partial<UserProfile> = {}): User {
    const profile: UserProfile = {
      avatar: faker.image.avatar(),
      bio: faker.lorem.sentences(2),
      location: faker.location.city(),
      website: faker.internet.url(),
      ...profileData,
    };

    return this.create({ profile });
  }
}

// 產品工廠
export class ProductFactory {
  private static sequence = 0;

  static create(overrides: Partial<Product> = {}): Product {
    this.sequence++;
    
    return {
      id: `product-${this.sequence}`,
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      category: faker.commerce.department(),
      description: faker.commerce.productDescription(),
      inStock: true,
      stockCount: faker.number.int({ min: 0, max: 100 }),
      tags: faker.helpers.arrayElements([
        'popular', 'sale', 'new', 'featured', 'premium',
      ], { min: 1, max: 3 }),
      ...overrides,
    };
  }

  static createMany(count: number, overrides: Partial<Product> = {}): Product[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static electronics(overrides: Partial<Product> = {}): Product {
    return this.create({
      category: 'electronics',
      price: parseFloat(faker.commerce.price({ min: 100, max: 2000 })),
      tags: ['electronics', 'tech', 'gadget'],
      ...overrides,
    });
  }

  static outOfStock(overrides: Partial<Product> = {}): Product {
    return this.create({
      inStock: false,
      stockCount: 0,
      ...overrides,
    });
  }

  static expensive(overrides: Partial<Product> = {}): Product {
    return this.create({
      price: parseFloat(faker.commerce.price({ min: 1000, max: 10000 })),
      tags: ['premium', 'luxury'],
      ...overrides,
    });
  }

  static withImages(imageCount = 3): Product {
    return this.create({
      images: Array.from({ length: imageCount }, () => 
        faker.image.url({ width: 400, height: 400 })
      ),
    });
  }
}

// 訂單工廠
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingAddress: Address;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export class OrderFactory {
  private static sequence = 0;

  static create(overrides: Partial<Order> = {}): Order {
    this.sequence++;
    const items = overrides.items || this.createOrderItems();
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      id: `order-${this.sequence}`,
      userId: `user-${faker.number.int({ min: 1, max: 100 })}`,
      items,
      total,
      status: 'pending',
      createdAt: faker.date.past().toISOString(),
      shippingAddress: this.createAddress(),
      ...overrides,
    };
  }

  static createOrderItems(count = 2): OrderItem[] {
    return Array.from({ length: count }, (_, index) => ({
      productId: `product-${index + 1}`,
      quantity: faker.number.int({ min: 1, max: 5 }),
      price: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
    }));
  }

  static createAddress(): Address {
    return {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
    };
  }

  static pending(): Order {
    return this.create({ status: 'pending' });
  }

  static completed(): Order {
    return this.create({ status: 'delivered' });
  }

  static cancelled(): Order {
    return this.create({ status: 'cancelled' });
  }

  static largeOrder(): Order {
    const items = this.createOrderItems(10);
    return this.create({ items });
  }
}
```

## 建構器模式 (Builder Pattern)

```typescript
// src/__tests__/helpers/builders.ts

export class UserBuilder {
  private user: Partial<User> = {};

  static create(): UserBuilder {
    return new UserBuilder();
  }

  withId(id: string): this {
    this.user.id = id;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withName(name: string): this {
    this.user.name = name;
    return this;
  }

  withRole(role: User['role']): this {
    this.user.role = role;
    return this;
  }

  asAdmin(): this {
    this.user.role = 'admin';
    return this;
  }

  asUnverified(): this {
    this.user.verified = false;
    return this;
  }

  withProfile(profile: UserProfile): this {
    this.user.profile = profile;
    return this;
  }

  createdAt(date: string | Date): this {
    this.user.createdAt = typeof date === 'string' ? date : date.toISOString();
    return this;
  }

  build(): User {
    return {
      id: this.user.id || `user-${Date.now()}`,
      email: this.user.email || faker.internet.email(),
      name: this.user.name || faker.person.fullName(),
      role: this.user.role || 'user',
      verified: this.user.verified ?? true,
      createdAt: this.user.createdAt || new Date().toISOString(),
      ...this.user,
    } as User;
  }
}

export class ProductBuilder {
  private product: Partial<Product> = {};

  static create(): ProductBuilder {
    return new ProductBuilder();
  }

  withId(id: string): this {
    this.product.id = id;
    return this;
  }

  withName(name: string): this {
    this.product.name = name;
    return this;
  }

  withPrice(price: number): this {
    this.product.price = price;
    return this;
  }

  withCategory(category: string): this {
    this.product.category = category;
    return this;
  }

  withDescription(description: string): this {
    this.product.description = description;
    return this;
  }

  outOfStock(): this {
    this.product.inStock = false;
    this.product.stockCount = 0;
    return this;
  }

  withStock(count: number): this {
    this.product.inStock = count > 0;
    this.product.stockCount = count;
    return this;
  }

  withTags(tags: string[]): this {
    this.product.tags = tags;
    return this;
  }

  asPremium(): this {
    this.product.tags = [...(this.product.tags || []), 'premium'];
    this.product.price = (this.product.price || 100) * 2;
    return this;
  }

  build(): Product {
    return {
      id: this.product.id || `product-${Date.now()}`,
      name: this.product.name || faker.commerce.productName(),
      price: this.product.price || parseFloat(faker.commerce.price()),
      category: this.product.category || faker.commerce.department(),
      description: this.product.description || faker.commerce.productDescription(),
      inStock: this.product.inStock ?? true,
      stockCount: this.product.stockCount ?? faker.number.int({ min: 1, max: 100 }),
      tags: this.product.tags || ['new'],
      ...this.product,
    } as Product;
  }
}

// 使用範例
const testUser = UserBuilder
  .create()
  .withEmail('test@example.com')
  .withName('Test User')
  .asAdmin()
  .build();

const testProduct = ProductBuilder
  .create()
  .withName('Premium Laptop')
  .withPrice(1999)
  .withCategory('electronics')
  .asPremium()
  .build();
```

## 測試資料情境管理

```typescript
// src/__tests__/helpers/scenarios.ts

export class TestScenarios {
  // 電商情境
  static ecommerceScenarios = {
    emptyCart: () => ({
      user: UserFactory.create(),
      cart: { items: [], total: 0 },
      products: ProductFactory.createMany(5),
    }),

    cartWithItems: () => {
      const products = ProductFactory.createMany(3);
      const cartItems = products.map(product => ({
        productId: product.id,
        quantity: faker.number.int({ min: 1, max: 3 }),
        price: product.price,
      }));
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      return {
        user: UserFactory.create(),
        cart: { items: cartItems, total },
        products,
      };
    },

    checkoutReady: () => {
      const scenario = TestScenarios.ecommerceScenarios.cartWithItems();
      return {
        ...scenario,
        user: UserFactory.withProfile(),
        shippingAddress: OrderFactory.createAddress(),
        paymentMethod: {
          type: 'credit_card',
          lastFour: '1234',
          expiry: '12/25',
        },
      };
    },

    outOfStockScenario: () => ({
      user: UserFactory.create(),
      product: ProductFactory.outOfStock(),
      similarProducts: ProductFactory.createMany(4),
    }),
  };

  // 使用者權限情境
  static authScenarios = {
    guestUser: () => ({ user: null, isAuthenticated: false }),
    
    regularUser: () => ({
      user: UserFactory.create(),
      isAuthenticated: true,
      permissions: ['read', 'write'],
    }),

    adminUser: () => ({
      user: UserFactory.admin(),
      isAuthenticated: true,
      permissions: ['read', 'write', 'delete', 'admin'],
    }),

    unverifiedUser: () => ({
      user: UserFactory.unverified(),
      isAuthenticated: true,
      permissions: ['read'],
    }),

    expiredSession: () => ({
      user: UserFactory.create(),
      isAuthenticated: false,
      sessionExpired: true,
    }),
  };

  // 錯誤情境
  static errorScenarios = {
    networkError: () => ({
      error: new Error('Network request failed'),
      status: 0,
      message: 'Unable to connect to server',
    }),

    validationError: () => ({
      error: {
        status: 400,
        message: 'Validation failed',
        details: {
          email: ['Email is required'],
          password: ['Password must be at least 8 characters'],
        },
      },
    }),

    permissionError: () => ({
      error: {
        status: 403,
        message: 'Access forbidden',
        code: 'INSUFFICIENT_PERMISSIONS',
      },
    }),

    serverError: () => ({
      error: {
        status: 500,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    }),
  };
}
```

## 測試資料的生命週期管理

```typescript
// src/__tests__/helpers/data-lifecycle.ts

export class TestDataManager {
  private static instances: Map<string, any> = new Map();
  private static cleanup: (() => void)[] = [];

  // 註冊清理函數
  static registerCleanup(cleanupFn: () => void): void {
    this.cleanup.push(cleanupFn);
  }

  // 創建並註冊測試資料
  static create<T>(key: string, factory: () => T): T {
    if (this.instances.has(key)) {
      return this.instances.get(key);
    }

    const instance = factory();
    this.instances.set(key, instance);
    
    // 自動清理
    this.registerCleanup(() => {
      this.instances.delete(key);
    });

    return instance;
  }

  // 重設所有資料
  static reset(): void {
    this.instances.clear();
    UserFactory['sequence'] = 0;
    ProductFactory['sequence'] = 0;
    OrderFactory['sequence'] = 0;
  }

  // 執行所有清理
  static cleanup(): void {
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];
    this.reset();
  }

  // 獲取快照（用於測試驗證）
  static getSnapshot(): Record<string, any> {
    return Object.fromEntries(this.instances);
  }
}

// 測試設定和清理
export const setupTestData = () => {
  beforeEach(() => {
    TestDataManager.reset();
  });

  afterEach(() => {
    TestDataManager.cleanup();
  });
};
```

## 實際應用範例

### 購物車元件測試

```typescript
// src/components/ShoppingCart/ShoppingCart.test.tsx
import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShoppingCart } from './ShoppingCart';
import { TestScenarios } from '../../__tests__/helpers/scenarios';
import { TestDataManager, setupTestData } from '../../__tests__/helpers/data-lifecycle';

describe('ShoppingCart Component', () => {
  setupTestData();

  describe('Empty Cart Scenario', () => {
    test('displays empty cart message', () => {
      const scenario = TestScenarios.ecommerceScenarios.emptyCart();
      
      render(<ShoppingCart cart={scenario.cart} products={scenario.products} />);
      
      expect(screen.getByText(/購物車是空的/)).toBeInTheDocument();
      expect(screen.getByText(/開始購物/)).toBeInTheDocument();
    });
  });

  describe('Cart with Items Scenario', () => {
    test('displays all cart items with correct information', () => {
      const scenario = TestScenarios.ecommerceScenarios.cartWithItems();
      
      render(<ShoppingCart cart={scenario.cart} products={scenario.products} />);
      
      // 驗證商品顯示
      scenario.cart.items.forEach((item) => {
        const product = scenario.products.find(p => p.id === item.productId);
        expect(screen.getByText(product!.name)).toBeInTheDocument();
        expect(screen.getByText(`數量: ${item.quantity}`)).toBeInTheDocument();
      });

      // 驗證總金額
      expect(screen.getByText(`總計: $${scenario.cart.total.toFixed(2)}`)).toBeInTheDocument();
    });

    test('allows quantity updates', async () => {
      const user = userEvent.setup();
      const scenario = TestScenarios.ecommerceScenarios.cartWithItems();
      
      render(<ShoppingCart cart={scenario.cart} products={scenario.products} />);
      
      const firstItem = scenario.cart.items[0];
      const increaseButton = screen.getByTestId(`increase-${firstItem.productId}`);
      
      await user.click(increaseButton);
      
      expect(screen.getByText(`數量: ${firstItem.quantity + 1}`)).toBeInTheDocument();
    });
  });

  describe('Checkout Ready Scenario', () => {
    test('enables checkout when all conditions are met', () => {
      const scenario = TestScenarios.ecommerceScenarios.checkoutReady();
      
      render(
        <ShoppingCart 
          cart={scenario.cart} 
          products={scenario.products}
          user={scenario.user}
          shippingAddress={scenario.shippingAddress}
          paymentMethod={scenario.paymentMethod}
        />
      );
      
      const checkoutButton = screen.getByText('結帳');
      expect(checkoutButton).toBeEnabled();
    });
  });

  describe('Out of Stock Scenario', () => {
    test('handles out of stock items appropriately', () => {
      const scenario = TestScenarios.ecommerceScenarios.outOfStockScenario();
      const cart = {
        items: [{
          productId: scenario.product.id,
          quantity: 1,
          price: scenario.product.price,
        }],
        total: scenario.product.price,
      };
      
      render(<ShoppingCart cart={cart} products={[scenario.product]} />);
      
      expect(screen.getByText(/暫時缺貨/)).toBeInTheDocument();
      expect(screen.getByText('結帳')).toBeDisabled();
    });
  });
});
```

### 使用者認證測試

```typescript
// src/hooks/useAuth.test.ts
import { describe, test, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { TestScenarios } from '../__tests__/helpers/scenarios';
import { UserFactory } from '../__tests__/helpers/factories';

describe('useAuth Hook', () => {
  describe('Authentication Scenarios', () => {
    test('handles guest user scenario', () => {
      const scenario = TestScenarios.authScenarios.guestUser();
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider initialState={scenario}>
            {children}
          </AuthProvider>
        ),
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.permissions).toEqual([]);
    });

    test('handles regular user scenario', () => {
      const scenario = TestScenarios.authScenarios.regularUser();
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider initialState={scenario}>
            {children}
          </AuthProvider>
        ),
      });

      expect(result.current.user).toEqual(scenario.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.permissions).toEqual(['read', 'write']);
    });

    test('handles admin user scenario', () => {
      const scenario = TestScenarios.authScenarios.adminUser();
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider initialState={scenario}>
            {children}
          </AuthProvider>
        ),
      });

      expect(result.current.user?.role).toBe('admin');
      expect(result.current.hasPermission('admin')).toBe(true);
      expect(result.current.hasPermission('delete')).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    test('handles expired session scenario', async () => {
      const scenario = TestScenarios.authScenarios.expiredSession();
      const mockApi = vi.fn().mockRejectedValue({ status: 401 });
      
      const { result } = renderHook(() => useAuth({ api: mockApi }), {
        wrapper: ({ children }) => (
          <AuthProvider initialState={scenario}>
            {children}
          </AuthProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toMatch(/session expired/i);
      });
    });
  });
});
```

## 常見問題

**Q: 測試資料應該多詳細？**
A: 包含測試所需的所有必要資訊，避免過度複雜。專注於測試場景的關鍵資料。

**Q: 如何處理測試資料之間的依賴關係？**
A: 使用工廠函數建立相關資料，或使用建構器模式鏈式建立複雜的資料結構。

**Q: 什麼時候使用靜態資料 vs 動態生成資料？**
A: 靜態資料用於穩定的測試場景，動態資料用於需要變化或隨機性的測試。

**Q: 如何確保測試資料不會影響其他測試？**
A: 使用 beforeEach/afterEach 清理資料，使用獨立的資料實例，避免共享可變狀態。

## 練習題

1. **基礎練習**：建立測試資料工廠
   - 為你的專案建立 User 和 Product 工廠
   - 包含各種變化和邊界情況
   - 使用 Faker.js 生成真實感的測試資料

2. **進階練習**：實作建構器模式
   - 為複雜的資料結構建立建構器類別
   - 支援鏈式操作和方法組合
   - 加入驗證和預設值處理

3. **挑戰練習**：建立情境管理系統
   - 設計完整的測試情境庫
   - 包含正常、邊界和錯誤情況
   - 實作資料生命週期管理和清理機制

## 延伸閱讀

- [Faker.js 文件](https://fakerjs.dev/)
- [Test Data Builder Pattern](https://natpryce.com/articles/000714.html)
- [Factory Pattern in Testing](https://martinfowler.com/bliki/ObjectMother.html)
- [Test Data Management Best Practices](https://testautomationu.applitools.com/test-data-management/)

## 本日重點回顧

✅ 了解測試資料管理的重要性和策略
✅ 學會建立靜態和動態測試資料
✅ 實作工廠模式和建構器模式
✅ 掌握複雜測試情境的資料準備
✅ 建立測試資料的生命週期管理機制
✅ 實際應用到購物車和使用者認證測試
✅ 學會處理測試資料的依賴關係和清理

明天我們將學習錯誤邊界測試，了解如何測試 React 應用的錯誤處理機制！
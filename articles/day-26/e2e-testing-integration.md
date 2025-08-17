# Day 26: E2E 測試整合

## 學習目標

- 了解端對端 (E2E) 測試的概念和重要性
- 學會設定和使用 Playwright 進行 E2E 測試
- 掌握使用者流程和場景測試方法
- 建立可維護的 E2E 測試架構
- 整合 E2E 測試到 CI/CD 流程
- 處理測試資料和環境管理

## E2E 測試概念

### 什麼是 E2E 測試？

端對端測試模擬真實使用者操作，從開始到結束測試完整的使用者流程，確保整個應用系統正常運作。

### E2E 測試的價值

1. **真實使用者體驗**：模擬實際使用者操作
2. **整合驗證**：測試所有系統元件的協作
3. **業務流程驗證**：確保核心業務功能正常
4. **回歸預防**：捕捉跨元件的回歸問題
5. **信心保證**：對部署提供最高信心等級

### 測試金字塔中的定位

```
        /\
       /  \    E2E Tests (5-10%)
      /____\   Higher cost, slower
     /      \  Integration Tests (20-30%)
    /________\ 
   /          \ Unit Tests (70-80%)
  /____________\ Lower cost, faster
```

## Playwright E2E 測試設定

### 專案初始化

```bash
# 安裝 Playwright
npm init playwright@latest

# 或手動安裝
npm install -D @playwright/test
npx playwright install
```

### Playwright 設定檔

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: process.env.CI ? true : false,
  },
  
  projects: [
    // 桌面瀏覽器
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // 自定義視窗大小
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // 行動裝置
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 開發伺服器設定
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },
});
```

## Page Object Model (POM)

### 基礎 Page Object

```typescript
// tests/e2e/pages/BasePage.ts
import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  readonly url: string;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  async expectUrl(expectedUrl: string) {
    await expect(this.page).toHaveURL(expectedUrl);
  }

  async expectTitle(expectedTitle: string | RegExp) {
    await expect(this.page).toHaveTitle(expectedTitle);
  }
}
```

### 登入頁面 Page Object

```typescript
// tests/e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    super(page, '/login');
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]');
    this.registerLink = page.locator('[data-testid="register-link"]');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toHaveText(message);
  }

  async expectLoginButtonDisabled() {
    await expect(this.loginButton).toBeDisabled();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async clickRegisterLink() {
    await this.registerLink.click();
  }
}
```

### 產品頁面 Page Object

```typescript
// tests/e2e/pages/ProductsPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductsPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly productGrid: Locator;
  readonly productCards: Locator;
  readonly categoryFilter: Locator;
  readonly priceFilter: Locator;
  readonly sortDropdown: Locator;
  readonly loadingSpinner: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    super(page, '/products');
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.searchButton = page.locator('[data-testid="search-button"]');
    this.productGrid = page.locator('[data-testid="product-grid"]');
    this.productCards = page.locator('[data-testid^="product-card-"]');
    this.categoryFilter = page.locator('[data-testid="category-filter"]');
    this.priceFilter = page.locator('[data-testid="price-filter"]');
    this.sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.noResultsMessage = page.locator('[data-testid="no-results"]');
  }

  async searchProducts(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.waitForSearchResults();
  }

  async waitForSearchResults() {
    // 等待載入完成
    await this.loadingSpinner.waitFor({ state: 'hidden' });
  }

  async selectCategory(category: string) {
    await this.categoryFilter.selectOption(category);
    await this.waitForSearchResults();
  }

  async setPriceRange(min: number, max: number) {
    await this.priceFilter.locator('[data-testid="price-min"]').fill(min.toString());
    await this.priceFilter.locator('[data-testid="price-max"]').fill(max.toString());
    await this.priceFilter.locator('[data-testid="apply-price-filter"]').click();
    await this.waitForSearchResults();
  }

  async sortBy(option: string) {
    await this.sortDropdown.selectOption(option);
    await this.waitForSearchResults();
  }

  async getProductCount(): Promise<number> {
    return await this.productCards.count();
  }

  async clickProductCard(index: number) {
    await this.productCards.nth(index).click();
    await this.page.waitForLoadState('networkidle');
  }

  async addToCart(productIndex: number) {
    const productCard = this.productCards.nth(productIndex);
    await productCard.locator('[data-testid="add-to-cart"]').click();
  }

  async expectNoResults() {
    await expect(this.noResultsMessage).toBeVisible();
  }

  async expectProductCount(count: number) {
    await expect(this.productCards).toHaveCount(count);
  }
}
```

### 購物車 Page Object

```typescript
// tests/e2e/pages/ShoppingCartPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ShoppingCartPage extends BasePage {
  readonly cartItems: Locator;
  readonly emptyCartMessage: Locator;
  readonly subtotalAmount: Locator;
  readonly taxAmount: Locator;
  readonly totalAmount: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly promoCodeInput: Locator;
  readonly applyPromoButton: Locator;

  constructor(page: Page) {
    super(page, '/cart');
    this.cartItems = page.locator('[data-testid^="cart-item-"]');
    this.emptyCartMessage = page.locator('[data-testid="empty-cart"]');
    this.subtotalAmount = page.locator('[data-testid="subtotal-amount"]');
    this.taxAmount = page.locator('[data-testid="tax-amount"]');
    this.totalAmount = page.locator('[data-testid="total-amount"]');
    this.checkoutButton = page.locator('[data-testid="checkout-button"]');
    this.continueShoppingButton = page.locator('[data-testid="continue-shopping"]');
    this.promoCodeInput = page.locator('[data-testid="promo-code-input"]');
    this.applyPromoButton = page.locator('[data-testid="apply-promo-button"]');
  }

  async updateItemQuantity(itemIndex: number, quantity: number) {
    const item = this.cartItems.nth(itemIndex);
    const quantityInput = item.locator('[data-testid="quantity-input"]');
    await quantityInput.fill(quantity.toString());
    await quantityInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async removeItem(itemIndex: number) {
    const item = this.cartItems.nth(itemIndex);
    await item.locator('[data-testid="remove-button"]').click();
    await this.page.waitForLoadState('networkidle');
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async applyPromoCode(code: string) {
    await this.promoCodeInput.fill(code);
    await this.applyPromoButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getCartItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  async expectEmptyCart() {
    await expect(this.emptyCartMessage).toBeVisible();
  }

  async expectTotalAmount(amount: string) {
    await expect(this.totalAmount).toHaveText(amount);
  }
}
```

## E2E 測試案例實作

### 使用者註冊和登入流程

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';

test.describe('使用者認證流程', () => {
  test('成功註冊新使用者', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);
    
    // 生成測試用戶資料
    const testUser = {
      name: `Test User ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
    };

    await registerPage.goto();
    await registerPage.register(testUser.name, testUser.email, testUser.password);
    
    // 驗證註冊成功後跳轉到登入頁面
    await expect(page).toHaveURL('/login');
    await expect(page.locator('[data-testid="success-message"]')).toHaveText('註冊成功，請登入');
  });

  test('使用有效憑證登入', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);

    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    
    // 驗證成功登入
    await expect(page).toHaveURL('/dashboard');
    await homePage.expectWelcomeMessage('歡迎回來');
  });

  test('使用無效憑證登入失敗', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    // 驗證錯誤訊息
    await loginPage.expectErrorMessage('電子郵件或密碼錯誤');
    await expect(page).toHaveURL('/login');
  });

  test('登出功能', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);

    // 先登入
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    await expect(page).toHaveURL('/dashboard');

    // 登出
    await homePage.logout();
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="login-link"]')).toBeVisible();
  });
});
```

### 電商購物流程

```typescript
// tests/e2e/shopping.spec.ts
import { test, expect } from '@playwright/test';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ShoppingCartPage } from './pages/ShoppingCartPage';
import { CheckoutPage } from './pages/CheckoutPage';

test.describe('電商購物流程', () => {
  test('完整購物流程：瀏覽 -> 加購物車 -> 結帳', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new ShoppingCartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // 1. 瀏覽產品
    await productsPage.goto();
    await productsPage.searchProducts('laptop');
    await expect(productsPage.productCards.first()).toBeVisible();

    // 2. 查看產品詳情
    await productsPage.clickProductCard(0);
    await expect(page).toHaveURL(/\/products\/\w+/);
    
    // 3. 加入購物車
    await productDetailPage.selectQuantity(2);
    await productDetailPage.addToCart();
    await productDetailPage.expectAddToCartSuccess();

    // 4. 查看購物車
    await cartPage.goto();
    await expect(cartPage.cartItems).toHaveCount(1);
    
    // 5. 修改數量
    await cartPage.updateItemQuantity(0, 3);
    
    // 6. 進入結帳
    await cartPage.proceedToCheckout();
    
    // 7. 填寫結帳資訊（假設已登入）
    await checkoutPage.fillShippingInfo({
      address: '123 Test St',
      city: 'Test City',
      zipCode: '12345',
      phone: '555-1234',
    });
    
    await checkoutPage.selectPaymentMethod('credit_card');
    await checkoutPage.fillPaymentInfo({
      cardNumber: '4111111111111111',
      expiry: '12/25',
      cvv: '123',
    });
    
    // 8. 完成訂單
    await checkoutPage.placeOrder();
    await checkoutPage.expectOrderSuccess();
  });

  test('產品搜尋和篩選功能', async ({ page }) => {
    const productsPage = new ProductsPage(page);

    await productsPage.goto();

    // 測試搜尋功能
    await productsPage.searchProducts('phone');
    const initialCount = await productsPage.getProductCount();
    expect(initialCount).toBeGreaterThan(0);

    // 測試分類篩選
    await productsPage.selectCategory('electronics');
    await expect(productsPage.productCards.first()).toBeVisible();

    // 測試價格篩選
    await productsPage.setPriceRange(100, 500);
    const filteredCount = await productsPage.getProductCount();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // 測試排序
    await productsPage.sortBy('price_low_to_high');
    // 驗證排序結果
    const firstProductPrice = await productsPage.productCards.first()
      .locator('[data-testid="product-price"]').textContent();
    const secondProductPrice = await productsPage.productCards.nth(1)
      .locator('[data-testid="product-price"]').textContent();
    
    expect(parseFloat(firstProductPrice || '0')).toBeLessThanOrEqual(
      parseFloat(secondProductPrice || '0')
    );
  });

  test('購物車管理功能', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const cartPage = new ShoppingCartPage(page);

    // 添加多個商品到購物車
    await productsPage.goto();
    await productsPage.addToCart(0);
    await productsPage.addToCart(1);

    // 查看購物車
    await cartPage.goto();
    await expect(cartPage.cartItems).toHaveCount(2);

    // 更新商品數量
    await cartPage.updateItemQuantity(0, 5);

    // 移除商品
    await cartPage.removeItem(1);
    await expect(cartPage.cartItems).toHaveCount(1);

    // 應用促銷代碼
    await cartPage.applyPromoCode('SAVE10');
    
    // 清空購物車
    await cartPage.removeItem(0);
    await cartPage.expectEmptyCart();
  });
});
```

### 響應式設計測試

```typescript
// tests/e2e/responsive.spec.ts
import { test, expect, devices } from '@playwright/test';
import { ProductsPage } from './pages/ProductsPage';

const mobileDevice = devices['iPhone 12'];
const tabletDevice = devices['iPad Pro'];

test.describe('響應式設計測試', () => {
  test('手機版產品瀏覽', async ({ browser }) => {
    const context = await browser.newContext({
      ...mobileDevice,
    });
    const page = await context.newPage();
    const productsPage = new ProductsPage(page);

    await productsPage.goto();

    // 驗證手機版佈局
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-navbar"]')).toBeHidden();

    // 測試手機版搜尋功能
    await productsPage.searchProducts('laptop');
    
    // 驗證產品卡片在手機版的顯示
    const productCard = productsPage.productCards.first();
    const cardBounds = await productCard.boundingBox();
    const viewportSize = page.viewportSize();
    
    expect(cardBounds?.width).toBeLessThan(viewportSize?.width || 0);

    await context.close();
  });

  test('平板版介面測試', async ({ browser }) => {
    const context = await browser.newContext({
      ...tabletDevice,
    });
    const page = await context.newPage();

    await page.goto('/');

    // 驗證平板版導航
    await expect(page.locator('[data-testid="tablet-navbar"]')).toBeVisible();
    
    // 測試橫向滑動功能
    await page.locator('[data-testid="product-carousel"]').hover();
    await page.mouse.wheel(100, 0);

    await context.close();
  });

  test('桌面版到手機版的響應式轉換', async ({ page }) => {
    // 開始於桌面版
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/products');

    await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeHidden();

    // 切換到手機版
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // 等待 CSS 轉換

    await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeHidden();
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    // 測試手機版選單
    await page.locator('[data-testid="mobile-menu-button"]').click();
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });
});
```

## 測試資料和環境管理

### 測試資料庫設定

```typescript
// tests/e2e/helpers/database.ts
import { Pool } from 'pg';

export class TestDatabase {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      database: process.env.TEST_DB_NAME || 'test_db',
      user: process.env.TEST_DB_USER || 'test_user',
      password: process.env.TEST_DB_PASSWORD || 'test_password',
    });
  }

  async seedTestData() {
    const client = await this.pool.connect();
    
    try {
      // 清理現有資料
      await client.query('TRUNCATE users, products, orders CASCADE');
      
      // 插入測試用戶
      await client.query(`
        INSERT INTO users (email, password, name, verified) VALUES 
        ('test@example.com', '$2b$10$...', 'Test User', true),
        ('admin@example.com', '$2b$10$...', 'Admin User', true)
      `);
      
      // 插入測試產品
      await client.query(`
        INSERT INTO products (name, price, category, stock_count) VALUES 
        ('Laptop', 999.99, 'electronics', 10),
        ('Phone', 599.99, 'electronics', 25),
        ('Book', 29.99, 'books', 100)
      `);
      
    } finally {
      client.release();
    }
  }

  async cleanup() {
    const client = await this.pool.connect();
    
    try {
      await client.query('TRUNCATE users, products, orders CASCADE');
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}
```

### 全域設定和清理

```typescript
// tests/e2e/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';
import { TestDatabase } from './helpers/database';

async function globalSetup(config: FullConfig) {
  // 設定測試資料庫
  const db = new TestDatabase();
  await db.seedTestData();
  
  // 預先載入認證狀態
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 登入並儲存認證狀態
  await page.goto('/login');
  await page.locator('[data-testid="email-input"]').fill('test@example.com');
  await page.locator('[data-testid="password-input"]').fill('password123');
  await page.locator('[data-testid="login-button"]').click();
  await page.waitForURL('/dashboard');
  
  // 儲存認證狀態
  await context.storageState({ path: 'auth-state.json' });
  
  await browser.close();
  await db.close();
}

export default globalSetup;
```

```typescript
// tests/e2e/global-teardown.ts
import { TestDatabase } from './helpers/database';

async function globalTeardown() {
  const db = new TestDatabase();
  await db.cleanup();
  await db.close();
}

export default globalTeardown;
```

## CI/CD 整合

### GitHub Actions 設定

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
          TEST_DB_HOST: localhost
          TEST_DB_PORT: 5432
          TEST_DB_NAME: test_db
          TEST_DB_USER: postgres
          TEST_DB_PASSWORD: postgres

      - name: Upload Playwright Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload Test Videos
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-videos
          path: test-results/
          retention-days: 7
```

## 常見問題

**Q: E2E 測試執行時間太長，如何優化？**
A: 使用並行執行、合理的 retries 設定、優化等待策略、使用測試資料快照。

**Q: 如何處理測試環境的不穩定性？**
A: 使用適當的等待策略、增加重試次數、隔離測試資料、監控測試失敗率。

**Q: 如何平衡 E2E 測試的覆蓋度和維護成本？**
A: 專注於核心使用者流程、避免測試太多細節、使用 Page Object Model、定期審查和更新測試。

**Q: 測試資料如何管理？**
A: 使用專用測試資料庫、自動化資料準備和清理、使用工廠函數生成測試資料。

## 練習題

1. **基礎練習**：建立簡單 E2E 測試
   - 設定 Playwright 測試環境
   - 建立基本的 Page Object
   - 撰寫登入流程測試

2. **進階練習**：完整購物流程測試
   - 建立完整的電商 Page Object 架構
   - 實作端對端購物流程測試
   - 加入響應式設計驗證

3. **挑戰練習**：企業級 E2E 測試系統
   - 建立測試資料管理系統
   - 整合 CI/CD 自動化流程
   - 實作測試報告和通知機制

## 延伸閱讀

- [Playwright 官方文件](https://playwright.dev/)
- [Page Object Model 最佳實踐](https://playwright.dev/docs/pom)
- [E2E Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices#section-5-e2e-testing)
- [Test Automation Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

## 本日重點回顧

✅ 了解 E2E 測試的概念和價值
✅ 掌握 Playwright 設定和基本使用
✅ 學會 Page Object Model 設計模式
✅ 實作完整的使用者流程測試
✅ 建立響應式設計測試策略
✅ 整合測試資料和環境管理
✅ 設定 CI/CD E2E 測試流程

明天我們將進入實戰專案，建立完整的電商購物車測試系統！
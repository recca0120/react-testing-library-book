# Day 25: 視覺迴歸測試

## 學習目標

- 了解視覺迴歸測試的概念和重要性
- 學會設定和使用視覺測試工具
- 掌握快照測試和視覺比對方法
- 建立自動化視覺測試流程
- 處理視覺差異和更新策略
- 整合視覺測試到 CI/CD 流程

## 視覺迴歸測試概念

### 什麼是視覺迴歸測試？

視覺迴歸測試是確保 UI 外觀在程式碼變更後保持一致的自動化測試方法。它通過比較螢幕截圖來檢測意外的視覺變化。

### 視覺測試的價值

1. **防止視覺錯誤**：捕捉 CSS 變更導致的佈局問題
2. **跨瀏覽器一致性**：確保在不同瀏覽器中的顯示一致
3. **響應式設計驗證**：檢查不同螢幕尺寸下的顯示
4. **品牌一致性**：維護設計系統的一致性
5. **回歸預防**：防止新功能影響現有 UI

## 快照測試基礎

### Jest/Vitest 快照測試

```typescript
// src/components/Button/Button.test.tsx
import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from './Button';

describe('Button Snapshots', () => {
  test('matches snapshot for primary button', () => {
    const { container } = render(
      <Button variant="primary">主要按鈕</Button>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for secondary button', () => {
    const { container } = render(
      <Button variant="secondary">次要按鈕</Button>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for disabled button', () => {
    const { container } = render(
      <Button disabled>停用按鈕</Button>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for loading button', () => {
    const { container } = render(
      <Button loading>載入中</Button>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for button with icon', () => {
    const { container } = render(
      <Button icon="plus">新增</Button>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

### 快照測試最佳實踐

```typescript
// src/components/ProductCard/ProductCard.test.tsx
import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import { mockProducts } from '../../__tests__/fixtures/products';

describe('ProductCard Visual Snapshots', () => {
  // 使用一致的測試資料
  const baseProduct = mockProducts.laptop;

  test('standard product card layout', () => {
    const { container } = render(<ProductCard product={baseProduct} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('product card with sale badge', () => {
    const saleProduct = { ...baseProduct, onSale: true, originalPrice: 3999 };
    const { container } = render(<ProductCard product={saleProduct} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('out of stock product card', () => {
    const outOfStockProduct = { ...baseProduct, inStock: false };
    const { container } = render(<ProductCard product={outOfStockProduct} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('product card in compact mode', () => {
    const { container } = render(
      <ProductCard product={baseProduct} compact={true} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  // 測試不同的視窗大小（需要額外設定）
  test('product card on mobile viewport', () => {
    // 模擬行動裝置視窗
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = render(<ProductCard product={baseProduct} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## Playwright 視覺測試

### 安裝和設定 Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### Playwright 設定檔

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Playwright 視覺測試範例

```typescript
// tests/visual/components.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Component Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Button component variants', async ({ page }) => {
    await page.goto('/storybook-static/iframe.html?id=button--all-variants');
    
    // 等待元件載入
    await page.waitForSelector('[data-testid="button-showcase"]');
    
    // 隱藏動態內容（時間戳、隨機數等）
    await page.addStyleTag({
      content: `
        .timestamp { visibility: hidden !important; }
        .random-id { visibility: hidden !important; }
      `
    });

    await expect(page).toHaveScreenshot('button-variants.png');
  });

  test('ProductCard responsive layout', async ({ page }) => {
    await page.goto('/products/1');
    
    // 桌面版本
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[data-testid="product-card"]')).toHaveScreenshot('product-card-desktop.png');
    
    // 平板版本
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="product-card"]')).toHaveScreenshot('product-card-tablet.png');
    
    // 手機版本
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="product-card"]')).toHaveScreenshot('product-card-mobile.png');
  });

  test('Modal dialog appearance', async ({ page }) => {
    await page.goto('/');
    
    // 觸發 Modal
    await page.click('[data-testid="open-modal"]');
    await page.waitForSelector('[data-testid="modal"]');
    
    // 確保 Modal 完全載入
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('modal-dialog.png');
  });

  test('Form validation states', async ({ page }) => {
    await page.goto('/contact');
    
    // 觸發驗證錯誤
    await page.click('[data-testid="submit-button"]');
    await page.waitForSelector('[data-testid="form-errors"]');
    
    await expect(page.locator('[data-testid="contact-form"]')).toHaveScreenshot('form-validation-errors.png');
  });

  test('Loading states', async ({ page }) => {
    // 攔截 API 請求來模擬載入狀態
    await page.route('**/api/products', route => {
      // 延遲響應來捕捉載入狀態
      setTimeout(() => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([]),
        });
      }, 2000);
    });

    await page.goto('/products');
    
    // 捕捉載入狀態
    await expect(page.locator('[data-testid="product-list"]')).toHaveScreenshot('products-loading.png');
  });
});
```

## Storybook 視覺測試

### Storybook 設定

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook', // 用於視覺迴歸測試
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
```

### Story 檔案範例

```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    // 視覺測試參數
    chromatic: {
      // 在這些視窗大小下進行快照
      viewports: [320, 768, 1200],
      // 禁用動畫以獲得一致的快照
      disableSnapshot: false,
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本變體
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: '主要按鈕',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '次要按鈕',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: '危險按鈕',
  },
};

// 狀態變體
export const Disabled: Story = {
  args: {
    children: '停用按鈕',
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    children: '載入中',
    loading: true,
  },
  parameters: {
    chromatic: {
      // 載入狀態可能有動畫，暫停快照
      pauseAnimationAtEnd: true,
    },
  },
};

// 尺寸變體
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Button size="small">小按鈕</Button>
      <Button size="medium">中按鈕</Button>
      <Button size="large">大按鈕</Button>
    </div>
  ),
};

// 所有變體展示
export const AllVariants: Story = {
  render: () => (
    <div data-testid="button-showcase" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
      <Button variant="primary">主要</Button>
      <Button variant="secondary">次要</Button>
      <Button variant="danger">危險</Button>
      <Button variant="primary" disabled>停用主要</Button>
      <Button variant="secondary" disabled>停用次要</Button>
      <Button variant="danger" disabled>停用危險</Button>
      <Button variant="primary" loading>載入主要</Button>
      <Button variant="secondary" loading>載入次要</Button>
      <Button variant="danger" loading>載入危險</Button>
    </div>
  ),
  parameters: {
    chromatic: {
      // 重要的組合視圖，確保捕捉
      disableSnapshot: false,
    },
  },
};
```

## 視覺測試工具整合

### Chromatic 設定

```bash
# 安裝 Chromatic
npm install -D chromatic

# 設定 Chromatic token
npx chromatic --project-token=YOUR_PROJECT_TOKEN
```

```json
// package.json
{
  "scripts": {
    "chromatic": "chromatic --exit-zero-on-changes",
    "visual-test": "npm run build-storybook && chromatic --exit-zero-on-changes"
  }
}
```

### GitHub Actions 整合

```yaml
# .github/workflows/visual-tests.yml
name: Visual Tests
on: [push, pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0 # 需要完整歷史記錄

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run Chromatic
        uses: chromaui/action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitZeroOnChanges: true

      - name: Run Playwright visual tests
        run: |
          npm run build
          npm run preview &
          npx playwright test --project=chromium tests/visual/
        env:
          CI: true

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 視覺差異處理

### 差異檢測和批准流程

```typescript
// tests/visual/helpers/visual-test-utils.ts
import { Page, expect } from '@playwright/test';

export class VisualTestHelper {
  constructor(private page: Page) {}

  async prepareForSnapshot() {
    // 隱藏動態內容
    await this.page.addStyleTag({
      content: `
        .timestamp, .random-id, .animation {
          visibility: hidden !important;
        }
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });

    // 等待字體載入
    await this.page.evaluate(() => document.fonts.ready);
    
    // 等待圖片載入
    await this.page.waitForFunction(() => {
      const images = Array.from(document.images);
      return images.every(img => img.complete);
    });
  }

  async takeComponentSnapshot(selector: string, name: string) {
    await this.prepareForSnapshot();
    await expect(this.page.locator(selector)).toHaveScreenshot(`${name}.png`);
  }

  async takeFullPageSnapshot(name: string) {
    await this.prepareForSnapshot();
    await expect(this.page).toHaveScreenshot(`${name}-full.png`);
  }

  async compareWithThreshold(selector: string, name: string, threshold = 0.3) {
    await this.prepareForSnapshot();
    await expect(this.page.locator(selector)).toHaveScreenshot(`${name}.png`, {
      threshold,
    });
  }
}
```

### 自動更新快照腳本

```typescript
// scripts/update-snapshots.ts
import { execSync } from 'child_process';
import inquirer from 'inquirer';

interface UpdateOptions {
  testPath?: string;
  updateAll?: boolean;
  reviewChanges?: boolean;
}

async function updateSnapshots(options: UpdateOptions = {}) {
  const { testPath, updateAll, reviewChanges } = options;

  if (!updateAll) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '確定要更新視覺快照嗎？這將覆蓋現有的參考圖片。',
        default: false,
      },
    ]);

    if (!confirm) {
      console.log('取消更新快照。');
      return;
    }
  }

  try {
    // 更新 Jest/Vitest 快照
    console.log('更新 Jest/Vitest 快照...');
    execSync('npm test -- --update-snapshots', { stdio: 'inherit' });

    // 更新 Playwright 快照
    console.log('更新 Playwright 快照...');
    const playwrightCmd = testPath 
      ? `npx playwright test ${testPath} --update-snapshots`
      : 'npx playwright test tests/visual/ --update-snapshots';
    
    execSync(playwrightCmd, { stdio: 'inherit' });

    // 更新 Chromatic 快照（如果使用）
    if (reviewChanges) {
      console.log('推送到 Chromatic 進行審查...');
      execSync('npm run chromatic', { stdio: 'inherit' });
    }

    console.log('✅ 快照更新完成！');
    console.log('請檢查更新的快照並提交變更。');

  } catch (error) {
    console.error('❌ 更新快照時發生錯誤：', error);
    process.exit(1);
  }
}

// CLI 使用
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: UpdateOptions = {};

  if (args.includes('--all')) options.updateAll = true;
  if (args.includes('--review')) options.reviewChanges = true;
  
  const pathIndex = args.findIndex(arg => arg === '--path');
  if (pathIndex !== -1 && args[pathIndex + 1]) {
    options.testPath = args[pathIndex + 1];
  }

  updateSnapshots(options);
}
```

## 常見問題

**Q: 快照測試經常失敗，如何處理？**
A: 確保測試環境一致，隱藏動態內容，使用固定的測試資料，並考慮設定合適的差異閾值。

**Q: 如何處理字體載入導致的視覺差異？**
A: 在快照前等待字體載入完成，或使用系統字體來確保一致性。

**Q: 跨瀏覽器視覺測試有哪些注意事項？**
A: 不同瀏覽器的渲染可能略有差異，需要為每個瀏覽器維護獨立的基準快照。

**Q: 如何平衡視覺測試的覆蓋度和維護成本？**
A: 專注於重要的 UI 元件和頁面，使用自動化工具減少手動維護，建立清晰的更新流程。

## 練習題

1. **基礎練習**：設定快照測試
   - 為主要 UI 元件建立快照測試
   - 設定 Playwright 視覺測試環境
   - 建立不同狀態的視覺測試案例

2. **進階練習**：響應式視覺測試
   - 建立多視窗大小的視覺測試
   - 設定跨瀏覽器測試流程
   - 實作自動快照更新機制

3. **挑戰練習**：完整視覺測試系統
   - 整合 Storybook 和 Chromatic
   - 建立 CI/CD 視覺測試流程
   - 實作視覺回歸警報系統

## 延伸閱讀

- [Playwright Visual Testing](https://playwright.dev/docs/test-screenshots)
- [Storybook Visual Testing](https://storybook.js.org/docs/react/writing-tests/visual-testing)
- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Visual Regression Testing Best Practices](https://docs.percy.io/docs/visual-regression-testing-best-practices)

## 本日重點回顧

✅ 了解視覺迴歸測試的概念和價值
✅ 掌握 Jest/Vitest 快照測試方法
✅ 學會 Playwright 視覺測試實作
✅ 整合 Storybook 進行元件視覺測試
✅ 建立自動化視覺測試流程
✅ 處理視覺差異和快照更新策略
✅ 設定 CI/CD 視覺測試整合

明天我們將學習 E2E 測試整合，了解如何建立端對端測試策略！
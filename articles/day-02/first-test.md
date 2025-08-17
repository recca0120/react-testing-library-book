# Day 2: 第一個測試 - 環境設定與 Hello World

## 學習目標

- 安裝並設定 Vitest 和 React Testing Library
- 了解測試檔案的組織結構
- 撰寫第一個元件測試
- 執行測試並解讀結果

## 環境設定

### 安裝必要套件

```bash
# 核心測試套件
npm install -D vitest @vitest/ui jsdom

# React Testing Library 相關套件
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# TypeScript 類型定義
npm install -D @types/node
```

### 套件說明

- **vitest**: 極速的單元測試框架，原生支援 ESM、TypeScript
- **@vitest/ui**: 提供美觀的測試 UI 介面
- **jsdom**: 在 Node.js 中模擬瀏覽器 DOM 環境
- **@testing-library/react**: React 元件測試工具
- **@testing-library/jest-dom**: 提供額外的 DOM 斷言匹配器
- **@testing-library/user-event**: 模擬真實使用者互動

## Vitest 配置

### 建立 vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // 啟用全域 API (describe, test, expect)
    globals: true,
    // 使用 jsdom 模擬瀏覽器環境
    environment: 'jsdom',
    // 設定檔案路徑
    setupFiles: './src/test/setup.ts',
    // 啟用 CSS
    css: true,
    // 覆蓋率設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '*.config.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 建立測試設定檔

建立 `src/test/setup.ts`：

```typescript
// 匯入 jest-dom 的自定義匹配器
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 每個測試後自動清理
afterEach(() => {
  cleanup();
});

// 全域設定
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### 更新 TypeScript 設定

更新 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 第一個元件測試

### 建立 HelloWorld 元件

建立 `src/components/HelloWorld.tsx`：

```typescript
import React from 'react';

interface HelloWorldProps {
  name?: string;
  showTime?: boolean;
}

export const HelloWorld: React.FC<HelloWorldProps> = ({ 
  name = 'World',
  showTime = false 
}) => {
  const currentTime = new Date().toLocaleTimeString();
  
  return (
    <div className="hello-container">
      <h1>Hello, {name}!</h1>
      <p>Welcome to React Testing Library with Vitest</p>
      {showTime && (
        <p className="time">Current time: {currentTime}</p>
      )}
    </div>
  );
};
```

### 撰寫測試

建立 `src/components/HelloWorld.test.tsx`：

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelloWorld } from './HelloWorld';

describe('HelloWorld Component', () => {
  // 測試預設 props
  test('renders with default props', () => {
    render(<HelloWorld />);
    
    // 使用 getByRole 查詢標題
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Hello, World!');
    
    // 使用 getByText 查詢文字
    const welcome = screen.getByText(/welcome to react testing library/i);
    expect(welcome).toBeInTheDocument();
  });

  // 測試自定義 name
  test('renders with custom name', () => {
    render(<HelloWorld name="Alice" />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Hello, Alice!');
  });

  // 測試條件渲染
  test('shows time when showTime is true', () => {
    render(<HelloWorld showTime={true} />);
    
    const timeElement = screen.getByText(/current time:/i);
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveClass('time');
  });

  // 測試條件渲染 - 不顯示
  test('does not show time when showTime is false', () => {
    render(<HelloWorld showTime={false} />);
    
    // 使用 queryBy 當元素可能不存在時
    const timeElement = screen.queryByText(/current time:/i);
    expect(timeElement).not.toBeInTheDocument();
  });

  // 測試 DOM 結構
  test('has correct DOM structure', () => {
    const { container } = render(<HelloWorld name="Test" />);
    
    // 檢查容器類別
    const helloContainer = container.querySelector('.hello-container');
    expect(helloContainer).toBeInTheDocument();
    
    // 檢查子元素
    expect(helloContainer?.children).toHaveLength(2);
  });

  // 快照測試
  test('matches snapshot', () => {
    const { container } = render(<HelloWorld name="Snapshot" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## 執行測試

### package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### 執行命令

```bash
# 監聽模式（開發時使用）
npm test

# 單次執行（CI/CD 使用）
npm run test:run

# 使用 UI 介面
npm run test:ui

# 產生覆蓋率報告
npm run test:coverage
```

## 測試輸出解讀

成功的測試輸出：
```
 ✓ src/components/HelloWorld.test.tsx (6)
   ✓ HelloWorld Component (6)
     ✓ renders with default props
     ✓ renders with custom name
     ✓ shows time when showTime is true
     ✓ does not show time when showTime is false
     ✓ has correct DOM structure
     ✓ matches snapshot

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  10:30:00
   Duration  523ms
```

## 測試組織最佳實踐

### 1. 檔案結構

```
src/
├── components/
│   ├── HelloWorld.tsx
│   ├── HelloWorld.test.tsx
│   └── HelloWorld.module.css
├── hooks/
│   ├── useCounter.ts
│   └── useCounter.test.ts
└── test/
    ├── setup.ts
    └── utils.tsx
```

### 2. 測試命名慣例

```typescript
// ❌ 不好的命名
test('test1', () => {});
test('it works', () => {});

// ✅ 好的命名
test('renders welcome message with user name', () => {});
test('displays error when form is invalid', () => {});
test('calls onClick handler when button is clicked', () => {});
```

### 3. describe 區塊組織

```typescript
describe('ComponentName', () => {
  describe('rendering', () => {
    test('renders without crashing', () => {});
    test('displays correct initial values', () => {});
  });

  describe('user interactions', () => {
    test('handles click events', () => {});
    test('updates on input change', () => {});
  });

  describe('props validation', () => {
    test('uses default props when not provided', () => {});
    test('applies custom className', () => {});
  });
});
```

## 常見問題

**Q: 為什麼使用 getByRole 而不是 getByClassName？**
A: getByRole 更貼近使用者的操作方式，並促進無障礙設計。它讓測試更穩定，不受 CSS 類別名稱改變的影響。

**Q: 什麼時候該使用快照測試？**
A: 快照測試適合用於：
- 確保 UI 不會意外改變
- 測試靜態內容
- 記錄元件的預期輸出
但不適合用於經常變動的內容。

**Q: 如何處理非同步元件？**
A: 使用 `findBy` 查詢（明天會詳細介紹）或 `waitFor` 工具來等待非同步操作完成。

## 練習題

1. **基礎練習**：建立一個 `Greeting` 元件
   - 接收 `timeOfDay` prop（morning/afternoon/evening）
   - 根據時間顯示不同問候語
   - 撰寫測試驗證各種情況

2. **進階練習**：建立一個 `UserCard` 元件
   - 顯示使用者資訊（名稱、email、頭像）
   - 包含「顯示詳情」按鈕
   - 測試條件渲染和 props 驗證

3. **挑戰練習**：建立一個 `LoadingButton` 元件
   - 有 loading 狀態
   - loading 時顯示 spinner
   - 測試不同狀態的渲染

## 延伸閱讀

- [Vitest 官方文件](https://vitest.dev/guide/)
- [React Testing Library 設定指南](https://testing-library.com/docs/react-testing-library/setup)
- [常見測試模式](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [測試最佳實踐](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 本日重點回顧

✅ 完成 Vitest 和 React Testing Library 環境設定
✅ 了解測試檔案的組織結構
✅ 學會撰寫基本的元件測試
✅ 掌握測試執行和結果解讀
✅ 認識測試命名和組織的最佳實踐

明天我們將深入學習各種查詢方法（getBy、queryBy、findBy），這是 React Testing Library 的核心功能！
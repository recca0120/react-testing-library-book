# Day 1: 為什麼需要測試？React Testing Library 簡介

## 學習目標

- 理解測試對於軟體開發的重要性
- 認識 React Testing Library 的核心理念
- 了解測試金字塔概念
- 設定基本的開發環境

## 為什麼需要測試？

### 1. 提高程式碼品質
測試能幫助我們：
- 及早發現錯誤
- 確保功能符合預期
- 減少生產環境的 bug

### 2. 增強信心
- 重構時不怕破壞現有功能
- 部署前確保系統穩定
- 新功能不影響舊功能

### 3. 作為文件
- 測試描述了元件的預期行為
- 新成員可透過測試了解程式碼
- 提供使用範例

## React Testing Library 簡介

React Testing Library 是一套用於測試 React 元件的工具，它的核心理念是：

> "The more your tests resemble the way your software is used, the more confidence they can give you."
> 
> 測試越接近軟體實際使用的方式，就越能給你信心。

### 核心原則

1. **測試行為，而非實作細節**
   - 不測試內部狀態
   - 不測試內部方法
   - 專注於使用者看得到的結果

2. **鼓勵可訪問性**
   - 優先使用語義化查詢
   - 促進無障礙設計

3. **簡單直觀的 API**
   - 易於學習和使用
   - 減少測試的維護成本

### React Testing Library vs Enzyme

| 特性 | React Testing Library | Enzyme |
|------|----------------------|---------|
| 測試方法 | 測試使用者行為 | 測試實作細節 |
| 查詢方式 | DOM 查詢 | 元件實例查詢 |
| 維護性 | 高（不依賴內部實作） | 低（重構易破壞測試） |
| 學習曲線 | 平緩 | 陡峭 |
| React 18+ 支援 | 完整支援 | 有限支援 |

## 測試金字塔

```
        /\
       /  \    E2E Tests (10%)
      /____\   
     /      \  Integration Tests (20%)
    /________\ 
   /          \ Unit Tests (70%)
  /____________\
```

### 三層測試策略

1. **單元測試 (Unit Tests) - 70%**
   - 測試獨立的函數和元件
   - 執行快速
   - 容易維護

2. **整合測試 (Integration Tests) - 20%**
   - 測試多個元件的互動
   - 測試與 API 的整合
   - 平衡速度與覆蓋度

3. **端對端測試 (E2E Tests) - 10%**
   - 測試完整的使用者流程
   - 執行較慢
   - 最接近真實使用情境

## 環境設定

### 建立專案

```bash
# 建立新專案
npm create vite@latest my-react-testing-app -- --template react-ts

# 進入專案目錄
cd my-react-testing-app

# 安裝依賴
npm install
```

### 安裝測試相關套件

```bash
# 安裝 Vitest 和 React Testing Library
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 設定 Vitest

建立 `vitest.config.ts`：

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
```

### 建立測試設定檔

建立 `src/test/setup.ts`：

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 每個測試後自動清理
afterEach(() => {
  cleanup();
});
```

### 更新 TypeScript 設定

在 `tsconfig.json` 中加入：

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

### 加入測試腳本

在 `package.json` 中更新 scripts：

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## 第一個簡單測試

建立 `src/components/Welcome.tsx`：

```typescript
interface WelcomeProps {
  name: string;
}

export const Welcome: React.FC<WelcomeProps> = ({ name }) => {
  return <h1>Welcome, {name}!</h1>;
};
```

建立 `src/components/Welcome.test.tsx`：

```typescript
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Welcome } from './Welcome';

describe('Welcome Component', () => {
  test('displays welcome message with name', () => {
    render(<Welcome name="Alice" />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Welcome, Alice!');
  });
});
```

執行測試：

```bash
npm test
```

## 常見問題

**Q: 為什麼選擇 Vitest 而不是 Jest？**
A: Vitest 是為 Vite 專門設計的測試框架，提供更快的執行速度、原生 TypeScript 支援，以及與 Vite 生態系統的完美整合。

**Q: 需要測試所有的元件嗎？**
A: 不需要。專注於測試關鍵功能和複雜邏輯，避免測試瑣碎的實作細節。

**Q: 測試覆蓋率要達到多少才夠？**
A: 一般建議 70-80% 的覆蓋率。但覆蓋率不是唯一指標，測試品質更重要。

## 練習題

1. 建立一個 `Button` 元件，接收 `label` 和 `onClick` props，撰寫測試驗證：
   - 按鈕顯示正確的文字
   - 點擊時觸發 onClick 事件

2. 建立一個 `Counter` 元件，包含增加和減少按鈕，測試：
   - 初始值顯示正確
   - 點擊增加按鈕後數值增加
   - 點擊減少按鈕後數值減少

## 延伸閱讀

- [React Testing Library 官方文件](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest 官方文件](https://vitest.dev/)
- [Testing Library 查詢優先順序](https://testing-library.com/docs/queries/about#priority)
- [Kent C. Dodds - Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)

## 本日重點回顧

✅ 了解測試的重要性和好處
✅ 認識 React Testing Library 的核心理念
✅ 理解測試金字塔的概念
✅ 完成開發環境設定
✅ 撰寫第一個簡單的測試

明天我們將深入探討如何撰寫更多實用的測試，包括查詢元素的各種方法！
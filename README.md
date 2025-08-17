# 30天精通 React Testing Library

<p align="center">
  <a href="https://github.com/recca0120/react-testing-library-book">
    <img src="https://img.shields.io/github/stars/recca0120/react-testing-library-book?style=for-the-badge" alt="GitHub stars">
  </a>
  <a href="https://github.com/recca0120/react-testing-library-book/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
  </a>
</p>

📚 這是一個為期30天的 React Testing Library 完整學習系列，從基礎到進階，使用 TypeScript 和 Vitest，包含大量實戰範例。

## 📚 30天文章目錄

### 第一週：基礎概念
- [Day 01: 為什麼需要測試？](articles/day-01/why-testing.md)
- [Day 02: 第一個測試](articles/day-02/first-test.md)
- [Day 03: 查詢方法深入](articles/day-03/query-methods.md)
- [Day 04: 使用者互動測試](articles/day-04/user-interaction.md)
- [Day 05: 組件狀態與 Props 測試](articles/day-05/component-state-props.md)
- [Day 06: 測試自定義 Hooks](articles/day-06/testing-hooks.md)
- [Day 07: 斷言與匹配器](articles/day-07/assertions-matchers.md)

### 第二週：進階技巧
- [Day 08: 非同步測試](articles/day-08/async-testing.md)
- [Day 09: Mock 函數與模組](articles/day-09/mock-functions.md)
- [Day 10: Context API 測試](articles/day-10/context-api-testing.md)
- [Day 11: 路由測試](articles/day-11/router-testing.md)
- [Day 12: 表單驗證測試](articles/day-12/form-validation-testing.md)
- [Day 13: 無障礙性測試](articles/day-13/accessibility-testing.md)
- [Day 14: 效能測試](articles/day-14/performance-testing.md)

### 第三週：狀態管理與整合
- [Day 15: Redux 測試](articles/day-15/redux-testing.md)
- [Day 16: Redux Toolkit 測試](articles/day-16/redux-toolkit-testing.md)
- [Day 17: GraphQL 與 Apollo 測試](articles/day-17/graphql-apollo-testing.md)
- [Day 18: WebSocket 測試](articles/day-18/websocket-testing.md)
- [Day 19: 檔案上傳測試](articles/day-19/file-upload-testing.md)
- [Day 20: 國際化（i18n）測試](articles/day-20/i18n-testing.md)
- [Day 21: 測試覆蓋率與報告](articles/day-21/test-coverage-reporting.md)

### 第四週：最佳實踐
- [Day 22: 測試組織與命名](articles/day-22/test-organization-naming.md)
- [Day 23: 測試資料管理](articles/day-23/test-data-management.md)
- [Day 24: 錯誤邊界測試](articles/day-24/error-boundary-testing.md)
- [Day 25: 視覺回歸測試](articles/day-25/visual-regression-testing.md)
- [Day 26: E2E 測試整合](articles/day-26/e2e-testing-integration.md)

### 第五週：實戰專案
- [Day 27: Todo App 完整測試](articles/day-27/todo-app-complete-testing.md)
- [Day 28: 電商購物車測試](articles/day-28/ecommerce-cart-testing.md)
- [Day 29: 測試重構與維護](articles/day-29/test-refactoring-maintenance.md)
- [Day 30: 總結與進階資源](articles/day-30/summary-advanced-resources.md)

## 💻 程式碼範例

### 基礎範例
- [Hello World 測試](examples/basic/HelloWorld.test.tsx)
- [計數器組件測試](examples/basic/Counter.test.tsx)

### 各天範例
- [Day 01: Welcome 組件](examples/day-01/Welcome.test.tsx)
- [Day 02: HelloWorld 與快照測試](examples/day-02/HelloWorld.test.tsx)
- [Day 03: 查詢方法範例](examples/day-03/)
- [Day 04: 表單互動](examples/day-04/LoginForm.test.tsx)
- [Day 05: 產品卡片組件](examples/day-05/ProductCard.test.tsx)
- [Day 06: 自定義 Hook](examples/day-06/useCounter.test.ts)
- [Day 08: 非同步資料載入](examples/day-08/DataFetcher.test.tsx)
- [Day 09: Mock 服務](examples/day-09/UserList.test.tsx)
- [Day 15: Redux 計數器](examples/day-15/Counter.test.tsx)
- [Day 27: Todo App 完整實作](examples/day-27/TodoApp.test.tsx)

## 快速開始

### 安裝依賴
```bash
npm install
```

### 執行測試
```bash
npm test          # 監聽模式
npm run test:run  # 單次執行
```

### 查看測試覆蓋率
```bash
npm run test:coverage
```

### 測試 UI 介面
```bash
npm run test:ui
```

## 專案結構

```
.
├── 30-days-react-testing-library.md  # 完整30天大綱
├── articles/                          # 每日文章內容
│   ├── day-01/                       # 第1天文章
│   ├── day-02/                       # 第2天文章
│   └── ...                           # 更多文章
├── examples/                          # 範例程式碼
│   ├── basic/                        # 基礎範例
│   ├── advanced/                     # 進階範例
│   └── projects/                     # 完整專案範例
├── exercises/                         # 練習題與解答
└── resources/                        # 額外學習資源
```

## 學習路線

### Week 1: 基礎概念 (Day 1-7)
- 環境設定與第一個測試
- 查詢方法 (getBy, queryBy, findBy)
- 使用者互動測試
- Hooks 測試

### Week 2: 進階技巧 (Day 8-14)
- 非同步測試
- Mock 技巧
- Context 與 Router 測試
- 可訪問性測試

### Week 3: 整合測試 (Day 15-21)
- Redux/Redux Toolkit 測試
- GraphQL 測試
- WebSocket 測試
- 測試覆蓋率

### Week 4: 最佳實踐與實戰 (Day 22-30)
- 測試組織與命名
- 視覺迴歸測試
- 完整專案實戰
- 測試重構與維護

## 學習建議

1. 每天花 1-2 小時學習當日內容
2. 動手實作範例程式碼
3. 完成每日練習題
4. 在實際專案中應用所學

## 相關資源

- [React Testing Library 官方文件](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest 官方文件](https://jestjs.io/docs/getting-started)
- [Testing Library Playground](https://testing-playground.com/)

## 授權

MIT
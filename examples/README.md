# 30 天 React Testing Library 範例程式碼

這個資料夾包含了 30 天系列文章的所有範例程式碼。

## 📁 結構說明

```
examples/
├── basic/              # 基礎範例
├── advanced/           # 進階範例
├── projects/           # 完整專案範例
├── hooks/              # 自定義 Hooks
├── utils/              # 測試工具函數
└── day-01 ~ day-30/   # 每日範例
```

## 🚀 快速開始

### 執行測試

```bash
# 執行所有測試
npm test

# 執行特定資料夾的測試
npm test -- day-03

# 執行特定檔案的測試
npm test -- Counter.test

# 監聽模式
npm test -- --watch

# 測試覆蓋率
npm run test:coverage
```

### 測試 UI

```bash
npm run test:ui
```

## 📚 每日範例對照表

| Day | 主題 | 主要範例 |
|-----|------|----------|
| Day 1 | 為什麼需要測試 | Welcome.tsx |
| Day 2 | 第一個測試 | HelloWorld.tsx |
| Day 3 | 查詢方法 | UserProfile.tsx, AsyncDataLoader.tsx |
| Day 4 | 使用者互動 | LoginForm.tsx, SearchInput.tsx |
| Day 5 | 元件狀態與 Props | ProductCard.tsx |
| Day 6 | 測試 Hooks | useCounter.ts, useFetch.ts |
| Day 7 | 斷言與匹配器 | 各種匹配器範例 |
| Day 8 | 非同步測試 | DataFetcher.tsx |
| Day 9 | Mock 技巧 | UserService.ts, UserList.tsx |
| Day 10 | Context API | ThemeContext.tsx |
| Day 11 | Router 測試 | Navigation.tsx |
| Day 12 | 表單驗證 | RegistrationForm.tsx |
| Day 13 | 可訪問性測試 | AccessibleForm.tsx |
| Day 14 | 效能測試 | RenderCounter.tsx |
| Day 15 | Redux 測試 | store.ts, Counter.tsx |
| Day 16 | Redux Toolkit | todoSlice.ts |
| Day 17 | GraphQL 測試 | UserQuery.tsx |
| Day 18 | WebSocket 測試 | ChatRoom.tsx |
| Day 19 | 檔案上傳 | FileUpload.tsx |
| Day 20 | 國際化測試 | LanguageSwitcher.tsx |
| Day 21 | 測試覆蓋率 | 設定檔範例 |
| Day 22 | 測試組織 | 組織結構範例 |
| Day 23 | 測試資料管理 | factories/ |
| Day 24 | 錯誤邊界 | ErrorBoundary.tsx |
| Day 25 | 視覺迴歸測試 | Snapshot 範例 |
| Day 26 | E2E 測試 | Page Objects |
| Day 27 | Todo App | TodoApp.tsx (完整專案) |
| Day 28 | 購物車 | ShoppingCart.tsx |
| Day 29 | 測試重構 | 重構範例 |
| Day 30 | 總結 | 綜合範例 |

## 🧪 測試範例類型

### 基礎測試
- 元件渲染測試
- Props 傳遞測試
- 事件處理測試
- 條件渲染測試

### 進階測試
- 非同步操作測試
- Mock 函數測試
- Context 測試
- Router 整合測試

### 整合測試
- Redux 狀態管理
- GraphQL 查詢
- WebSocket 連線
- 國際化功能

### 實戰專案
- Todo 應用程式
- 電商購物車
- 聊天室應用

## 🛠️ 使用的技術

- **框架**: React 18
- **語言**: TypeScript
- **測試框架**: Vitest
- **測試工具**: React Testing Library
- **斷言庫**: @testing-library/jest-dom
- **使用者事件**: @testing-library/user-event
- **狀態管理**: Redux Toolkit
- **路由**: React Router
- **國際化**: react-i18next

## 💡 學習建議

1. **循序漸進**: 建議按照 Day 1 到 Day 30 的順序學習
2. **動手實作**: 執行每個範例，嘗試修改並觀察結果
3. **閱讀測試**: 理解每個測試在驗證什麼
4. **練習題**: 完成每日文章中的練習題
5. **實際應用**: 將學到的技巧應用到自己的專案

## 📖 相關資源

- [30 天系列文章](../articles/)
- [React Testing Library 文件](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest 文件](https://vitest.dev/)
- [TypeScript 文件](https://www.typescriptlang.org/)

## 🤝 貢獻

如果你發現任何問題或有改進建議，歡迎：
1. 開啟 Issue
2. 提交 Pull Request
3. 參與討論

## 📝 授權

MIT License
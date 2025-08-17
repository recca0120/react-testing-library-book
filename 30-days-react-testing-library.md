# 30天 React Testing Library 開發系列

## 第一週：基礎概念 (Day 1-7)

### Day 1: 為什麼需要測試？React Testing Library 簡介
- 測試的重要性
- React Testing Library vs Enzyme
- 測試金字塔概念
- 設定開發環境

### Day 2: 第一個測試 - 環境設定與 Hello World
- 安裝必要套件 (vitest, @testing-library/react, @testing-library/jest-dom)
- 設定 Vitest 配置
- 撰寫第一個簡單測試
- 執行測試與查看結果

### Day 3: 基本查詢方法 - getBy, queryBy, findBy
- getBy* 查詢方法詳解
- queryBy* 何時使用
- findBy* 處理非同步元素
- 優先順序指南

### Day 4: 使用者互動測試 - fireEvent 與 userEvent
- fireEvent 基本用法
- userEvent 更真實的互動模擬
- 點擊、輸入、選擇等操作
- 實作表單測試

### Day 5: 測試元件狀態與 Props
- 測試元件渲染
- Props 傳遞測試
- 狀態變化驗證
- 條件渲染測試

### Day 6: 測試 Hooks - 使用 renderHook
- 測試自定義 Hooks
- useState 測試
- useEffect 測試
- 處理 Hook 依賴

### Day 7: 斷言與匹配器 - expect 與 jest-dom
- Vitest 基本匹配器
- @testing-library/jest-dom 擴充匹配器
- 自定義匹配器
- 最佳實踐

## 第二週：進階技巧 (Day 8-14)

### Day 8: 非同步測試 - waitFor 與 findBy
- 處理 API 呼叫
- waitFor 詳解
- findBy vs async/await
- 測試 loading 狀態

### Day 9: Mock 技巧 - Vitest Mock Functions
- vi.fn() 使用
- vi.mock() 模組模擬
- 模擬 API 回應
- 模擬第三方套件

### Day 10: Context API 測試
- 包裝 Provider
- 測試 Context 值
- 自定義 render 函數
- 多個 Context 測試

### Day 11: Router 測試 - React Router
- MemoryRouter 使用
- 測試路由導航
- 測試路由參數
- 保護路由測試

### Day 12: 表單驗證測試
- 即時驗證測試
- 錯誤訊息顯示
- 提交處理
- 整合 Formik/React Hook Form

### Day 13: 測試可訪問性 (Accessibility)
- ARIA 屬性測試
- 鍵盤導航測試
- 螢幕閱讀器相容性
- axe-core 整合

### Day 14: 效能測試基礎
- 渲染次數測試
- Memo 元件測試
- useMemo/useCallback 測試
- 效能優化驗證

## 第三週：整合測試 (Day 15-21)

### Day 15: Redux 測試策略
- Redux store 模擬
- Action 測試
- Reducer 測試
- Connected Component 測試

### Day 16: Redux Toolkit 測試
- Slice 測試
- RTK Query 測試
- createAsyncThunk 測試
- Store 整合測試

### Day 17: GraphQL 測試 - Apollo Client
- MockedProvider 使用
- Query 測試
- Mutation 測試
- 錯誤處理測試

### Day 18: WebSocket 測試
- Socket.io 模擬
- 即時訊息測試
- 連線狀態測試
- 重連機制測試

### Day 19: 檔案上傳測試
- 模擬檔案選擇
- 拖放測試
- 進度顯示測試
- 錯誤處理

### Day 20: 國際化 (i18n) 測試
- 語言切換測試
- 翻譯鍵測試
- 日期格式測試
- 數字格式測試

### Day 21: 測試覆蓋率與報告
- Coverage 配置
- 覆蓋率指標解讀
- HTML 報告生成
- CI/CD 整合

## 第四週：最佳實踐與實戰 (Day 22-30)

### Day 22: 測試組織與命名
- 測試檔案結構
- describe/it 組織
- 命名慣例
- AAA 模式 (Arrange-Act-Assert)

### Day 23: 測試資料管理
- Factory 模式
- Fixture 使用
- Faker.js 整合
- 測試資料隔離

### Day 24: 錯誤邊界測試
- Error Boundary 元件測試
- 錯誤恢復測試
- 錯誤日誌測試
- Fallback UI 測試

### Day 25: 視覺迴歸測試
- Snapshot 測試
- Percy/Chromatic 整合
- 視覺差異偵測
- CI 整合

### Day 26: E2E 測試整合
- Testing Library vs Cypress/Playwright
- 整合測試策略
- 測試金字塔平衡
- 何時選擇 E2E

### Day 27: 實戰專案 - Todo App 完整測試
- 專案架構
- 元件單元測試
- 整合測試
- 端對端場景

### Day 28: 實戰專案 - 電商購物車測試
- 商品列表測試
- 購物車功能測試
- 結帳流程測試
- 支付整合測試

### Day 29: 測試重構與維護
- 測試程式碼重構
- 共用測試工具
- 測試效能優化
- 技術債管理

### Day 30: 總結與進階資源
- 關鍵概念回顧
- 常見陷阱與解決方案
- 進階學習資源
- 社群與支援

## 每篇文章結構

1. **學習目標** - 本日重點
2. **概念說明** - 理論基礎
3. **實作範例** - 程式碼演示
4. **常見問題** - FAQ
5. **練習題** - 動手練習
6. **延伸閱讀** - 相關資源

## 專案結構建議

```
thirty-days-react-test/
├── articles/          # 每日文章
│   ├── day-01/
│   ├── day-02/
│   └── ...
├── examples/          # 範例程式碼
│   ├── basic/
│   ├── advanced/
│   └── projects/
├── exercises/         # 練習題解答
└── resources/        # 額外資源
```
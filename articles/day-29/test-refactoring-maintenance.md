# Day 29: 測試重構與維護

## 學習目標

- 了解測試程式碼重構的必要性和策略
- 學會識別和改善測試程式碼的品質問題
- 掌握測試維護的最佳實踐
- 建立可持續的測試程式碼基礎
- 處理測試債務和遺留測試問題
- 實作測試程式碼品質監控機制

## 測試重構概念

### 為什麼需要測試重構？

1. **提升可讀性**：讓測試意圖更清晰
2. **減少重複**：消除測試程式碼中的重複邏輯
3. **提高維護性**：降低測試維護成本
4. **增強穩定性**：減少脆弱和不穩定的測試
5. **改善效能**：優化測試執行速度
6. **保持同步**：讓測試與產品程式碼同步演化

### 測試異味 (Test Smells)

常見的測試程式碼問題：

```typescript
// ❌ 測試異味範例

// 1. 測試過於複雜
test('complex test with multiple concerns', async () => {
  // 設定複雜的測試環境
  const mockApi = vi.fn().mockImplementation((url) => {
    if (url.includes('users')) {
      if (url.includes('1')) {
        return Promise.resolve({ id: 1, name: 'User 1' });
      } else if (url.includes('2')) {
        return Promise.resolve({ id: 2, name: 'User 2' });
      }
    } else if (url.includes('products')) {
      return Promise.resolve([{ id: 1, name: 'Product 1' }]);
    }
    return Promise.reject(new Error('Not found'));
  });

  // 複雜的測試邏輯
  const component = render(<ComplexComponent api={mockApi} />);
  
  // 多個不相關的斷言
  await waitFor(() => {
    expect(screen.getByText('User 1')).toBeInTheDocument();
  });
  
  await waitFor(() => {
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });
  
  const button = screen.getByText('Submit');
  await userEvent.click(button);
  
  expect(mockApi).toHaveBeenCalledTimes(3);
  expect(mockApi).toHaveBeenCalledWith(expect.stringContaining('users/1'));
});

// 2. 魔法數字和字串
test('user registration', async () => {
  render(<RegistrationForm />);
  
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'password123');
  await userEvent.type(screen.getByLabelText('Confirm Password'), 'password123');
  
  await userEvent.click(screen.getByText('Register'));
  
  await waitFor(() => {
    expect(screen.getByText('Registration successful')).toBeInTheDocument();
  });
});

// 3. 重複的設定程式碼
test('admin can edit user', async () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
    permissions: ['read', 'write', 'delete'],
  };
  
  const mockApi = vi.fn().mockResolvedValue(mockUser);
  
  render(<UserEditForm userId={1} api={mockApi} />);
  
  // 測試邏輯...
});

test('admin can delete user', async () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
    permissions: ['read', 'write', 'delete'],
  };
  
  const mockApi = vi.fn().mockResolvedValue(mockUser);
  
  render(<UserDeleteForm userId={1} api={mockApi} />);
  
  // 測試邏輯...
});
```

## 測試重構策略

### 1. 提取測試資料和設定

```typescript
// ✅ 重構後：提取共用資料和設定

// tests/helpers/test-data.ts
export const testUsers = {
  admin: {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['read', 'write', 'delete'],
  },
  regular: {
    id: 2,
    name: 'Regular User',
    email: 'user@example.com',
    role: 'user',
    permissions: ['read'],
  },
  unverified: {
    id: 3,
    name: 'Unverified User',
    email: 'unverified@example.com',
    role: 'user',
    verified: false,
    permissions: [],
  },
} as const;

export const testProducts = {
  laptop: {
    id: 1,
    name: 'Gaming Laptop',
    price: 1299.99,
    category: 'Electronics',
    inStock: true,
  },
  book: {
    id: 2,
    name: 'JavaScript Guide',
    price: 39.99,
    category: 'Books',
    inStock: true,
  },
} as const;

export const validCredentials = {
  email: 'user@example.com',
  password: 'SecurePassword123!',
} as const;

// tests/helpers/test-setup.ts
export const createMockApiResponse = <T>(data: T, delay = 0) => {
  return vi.fn().mockImplementation(() => 
    new Promise(resolve => setTimeout(() => resolve(data), delay))
  );
};

export const createMockApiError = (status = 500, message = 'Server Error') => {
  return vi.fn().mockRejectedValue({
    response: { status },
    message,
  });
};

export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderOptions & { 
    initialState?: any,
    user?: any,
    theme?: 'light' | 'dark',
  } = {}
) => {
  const { initialState, user, theme = 'light', ...renderOptions } = options;
  
  const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>
      <UserProvider user={user}>
        <StateProvider initialState={initialState}>
          {children}
        </StateProvider>
      </UserProvider>
    </ThemeProvider>
  );

  return render(ui, { wrapper: AllProviders, ...renderOptions });
};
```

### 2. 重構複雜測試

```typescript
// ✅ 重構後：拆分和簡化複雜測試

describe('User Management', () => {
  let mockApi: MockedFunction<any>;
  
  beforeEach(() => {
    mockApi = vi.fn();
  });

  describe('User Information Display', () => {
    test('displays user name and email', async () => {
      mockApi.mockResolvedValue(testUsers.regular);
      
      renderWithProviders(
        <UserProfile userId={testUsers.regular.id} api={mockApi} />
      );
      
      await waitFor(() => {
        expect(screen.getByText(testUsers.regular.name)).toBeInTheDocument();
        expect(screen.getByText(testUsers.regular.email)).toBeInTheDocument();
      });
    });

    test('displays user permissions for admin', async () => {
      mockApi.mockResolvedValue(testUsers.admin);
      
      renderWithProviders(
        <UserProfile userId={testUsers.admin.id} api={mockApi} />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('permissions-list')).toBeInTheDocument();
        testUsers.admin.permissions.forEach(permission => {
          expect(screen.getByText(permission)).toBeInTheDocument();
        });
      });
    });
  });

  describe('User Actions', () => {
    test('admin can edit user information', async () => {
      mockApi.mockResolvedValue(testUsers.regular);
      
      renderWithProviders(
        <UserEditForm userId={testUsers.regular.id} api={mockApi} />,
        { user: testUsers.admin }
      );
      
      const editButton = await screen.findByText('Edit');
      expect(editButton).toBeInTheDocument();
    });

    test('regular user cannot edit other users', async () => {
      mockApi.mockResolvedValue(testUsers.admin);
      
      renderWithProviders(
        <UserEditForm userId={testUsers.admin.id} api={mockApi} />,
        { user: testUsers.regular }
      );
      
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });
});
```

### 3. 建立測試工具類別

```typescript
// tests/helpers/page-objects/UserManagementPage.ts
export class UserManagementPageObject {
  constructor(private screen: Screen) {}

  async fillUserForm(userData: {
    name?: string;
    email?: string;
    role?: string;
  }) {
    if (userData.name) {
      await userEvent.type(this.screen.getByLabelText('Name'), userData.name);
    }
    
    if (userData.email) {
      await userEvent.type(this.screen.getByLabelText('Email'), userData.email);
    }
    
    if (userData.role) {
      await userEvent.selectOptions(this.screen.getByLabelText('Role'), userData.role);
    }
  }

  async submitForm() {
    await userEvent.click(this.screen.getByText('Save'));
  }

  async expectSuccessMessage(message?: string) {
    const successMessage = message || 'User saved successfully';
    await waitFor(() => {
      expect(this.screen.getByText(successMessage)).toBeInTheDocument();
    });
  }

  async expectValidationError(field: string, message: string) {
    const errorElement = this.screen.getByTestId(`${field}-error`);
    expect(errorElement).toHaveTextContent(message);
  }

  getUserRow(userId: number) {
    return this.screen.getByTestId(`user-row-${userId}`);
  }

  async deleteUser(userId: number) {
    const userRow = this.getUserRow(userId);
    const deleteButton = within(userRow).getByText('Delete');
    await userEvent.click(deleteButton);
    
    // 確認刪除對話框
    const confirmButton = await this.screen.findByText('Confirm Delete');
    await userEvent.click(confirmButton);
  }

  async expectUserNotInList(userId: number) {
    await waitFor(() => {
      expect(this.screen.queryByTestId(`user-row-${userId}`)).not.toBeInTheDocument();
    });
  }
}

// 使用範例
describe('User Management with Page Object', () => {
  let userManagementPage: UserManagementPageObject;
  let mockApi: MockedFunction<any>;

  beforeEach(() => {
    userManagementPage = new UserManagementPageObject(screen);
    mockApi = createMockApiResponse([]);
  });

  test('creates new user successfully', async () => {
    renderWithProviders(<UserCreateForm api={mockApi} />);
    
    await userManagementPage.fillUserForm({
      name: 'New User',
      email: 'newuser@example.com',
      role: 'user',
    });
    
    await userManagementPage.submitForm();
    await userManagementPage.expectSuccessMessage();
  });

  test('shows validation errors for invalid data', async () => {
    renderWithProviders(<UserCreateForm api={mockApi} />);
    
    await userManagementPage.fillUserForm({
      name: '', // Invalid: empty name
      email: 'invalid-email', // Invalid: malformed email
    });
    
    await userManagementPage.submitForm();
    
    await userManagementPage.expectValidationError('name', 'Name is required');
    await userManagementPage.expectValidationError('email', 'Invalid email format');
  });
});
```

### 4. 優化測試效能

```typescript
// tests/helpers/performance-utils.ts
export class TestPerformanceMonitor {
  private startTime: number = 0;
  private measurements: Map<string, number[]> = new Map();

  startMeasurement(name: string) {
    this.startTime = performance.now();
  }

  endMeasurement(name: string) {
    const duration = performance.now() - this.startTime;
    
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    
    this.measurements.get(name)!.push(duration);
    return duration;
  }

  getAverageTime(name: string): number {
    const times = this.measurements.get(name);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  expectPerformance(name: string, maxTime: number) {
    const avgTime = this.getAverageTime(name);
    expect(avgTime).toBeLessThan(maxTime);
  }

  reset() {
    this.measurements.clear();
  }
}

// 使用範例
describe('Component Performance', () => {
  const performanceMonitor = new TestPerformanceMonitor();

  afterEach(() => {
    performanceMonitor.reset();
  });

  test('renders large list efficiently', () => {
    const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    performanceMonitor.startMeasurement('large-list-render');
    
    render(<ItemList items={largeDataSet} />);
    
    const renderTime = performanceMonitor.endMeasurement('large-list-render');
    
    // 期望渲染時間少於 100ms
    expect(renderTime).toBeLessThan(100);
  });
});
```

## 測試維護策略

### 1. 定期審查和清理

```typescript
// scripts/test-maintenance.ts
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

interface TestMetrics {
  totalTests: number;
  skippedTests: number;
  slowTests: number;
  duplicateTests: number;
  unusedMocks: number;
}

class TestMaintenanceTools {
  async analyzeTestSuite(): Promise<TestMetrics> {
    const testFiles = await glob('**/*.test.{ts,tsx}', { ignore: 'node_modules/**' });
    
    let totalTests = 0;
    let skippedTests = 0;
    let slowTests = 0;
    let duplicateTests = 0;
    let unusedMocks = 0;

    for (const file of testFiles) {
      const content = readFileSync(file, 'utf-8');
      
      // 分析測試統計
      totalTests += (content.match(/test\(/g) || []).length;
      skippedTests += (content.match(/test\.skip\(/g) || []).length;
      
      // 檢查慢測試（超過 5 秒）
      const timeoutMatches = content.match(/timeout:\s*(\d+)/g) || [];
      slowTests += timeoutMatches.filter(match => {
        const timeout = parseInt(match.match(/\d+/)![0]);
        return timeout > 5000;
      }).length;
      
      // 檢查重複的測試描述
      const testNames = content.match(/test\(['"`]([^'"`]+)['"`]/g) || [];
      const uniqueNames = new Set(testNames);
      duplicateTests += testNames.length - uniqueNames.size;
      
      // 檢查未使用的 mock
      const mockDeclarations = content.match(/const\s+mock\w+\s*=/g) || [];
      const mockUsages = content.match(/mock\w+/g) || [];
      unusedMocks += Math.max(0, mockDeclarations.length - mockUsages.length / 2);
    }

    return {
      totalTests,
      skippedTests,
      slowTests,
      duplicateTests,
      unusedMocks,
    };
  }

  async findObsoleteTests(): Promise<string[]> {
    const testFiles = await glob('**/*.test.{ts,tsx}', { ignore: 'node_modules/**' });
    const sourceFiles = await glob('**/*.{ts,tsx}', { 
      ignore: ['node_modules/**', '**/*.test.*', '**/*.spec.*'] 
    });
    
    const obsoleteTests: string[] = [];
    
    for (const testFile of testFiles) {
      const testPath = testFile.replace(/\.test\.(ts|tsx)$/, '');
      const possibleSourceFiles = [
        `${testPath}.ts`,
        `${testPath}.tsx`,
        `${testPath}/index.ts`,
        `${testPath}/index.tsx`,
      ];
      
      const hasCorrespondingSource = possibleSourceFiles.some(sourcePath =>
        sourceFiles.includes(sourcePath)
      );
      
      if (!hasCorrespondingSource) {
        obsoleteTests.push(testFile);
      }
    }
    
    return obsoleteTests;
  }

  async optimizeTestImports(): Promise<void> {
    const testFiles = await glob('**/*.test.{ts,tsx}', { ignore: 'node_modules/**' });
    
    for (const file of testFiles) {
      let content = readFileSync(file, 'utf-8');
      
      // 合併重複的導入
      const importLines = content.match(/^import\s+.+from\s+['"].+['"];?$/gm) || [];
      const importMap = new Map<string, string[]>();
      
      importLines.forEach(line => {
        const match = line.match(/^import\s+(.+)\s+from\s+['"](.+)['"];?$/);
        if (match) {
          const [, imports, source] = match;
          if (!importMap.has(source)) {
            importMap.set(source, []);
          }
          importMap.get(source)!.push(imports.trim());
        }
      });
      
      // 重建優化後的導入
      let optimizedImports = '';
      importMap.forEach((imports, source) => {
        if (imports.length === 1) {
          optimizedImports += `import ${imports[0]} from '${source}';\n`;
        } else {
          const combined = imports.join(', ');
          optimizedImports += `import ${combined} from '${source}';\n`;
        }
      });
      
      // 移除原有導入並加入優化後的導入
      const withoutImports = content.replace(/^import\s+.+from\s+['"].+['"];?$/gm, '');
      const optimizedContent = optimizedImports + '\n' + withoutImports.trimStart();
      
      writeFileSync(file, optimizedContent);
    }
  }

  generateMaintenanceReport(metrics: TestMetrics): string {
    return `
# Test Maintenance Report

## Test Suite Metrics
- Total Tests: ${metrics.totalTests}
- Skipped Tests: ${metrics.skippedTests} (${((metrics.skippedTests / metrics.totalTests) * 100).toFixed(1)}%)
- Slow Tests (>5s): ${metrics.slowTests}
- Duplicate Test Names: ${metrics.duplicateTests}
- Unused Mocks: ${metrics.unusedMocks}

## Recommendations
${metrics.skippedTests > 0 ? '- Review and fix skipped tests' : ''}
${metrics.slowTests > 0 ? '- Optimize slow tests for better performance' : ''}
${metrics.duplicateTests > 0 ? '- Rename duplicate test descriptions' : ''}
${metrics.unusedMocks > 0 ? '- Remove unused mock declarations' : ''}

## Health Score
${this.calculateHealthScore(metrics)}/100
    `;
  }

  private calculateHealthScore(metrics: TestMetrics): number {
    let score = 100;
    
    // 扣分規則
    score -= (metrics.skippedTests / metrics.totalTests) * 30; // 最多扣 30 分
    score -= Math.min(metrics.slowTests * 5, 20); // 每個慢測試扣 5 分，最多 20 分
    score -= Math.min(metrics.duplicateTests * 2, 15); // 每個重複測試扣 2 分，最多 15 分
    score -= Math.min(metrics.unusedMocks * 1, 10); // 每個未使用 mock 扣 1 分，最多 10 分
    
    return Math.max(0, Math.round(score));
  }
}

// CLI 使用
async function runMaintenance() {
  const tools = new TestMaintenanceTools();
  
  console.log('🔍 Analyzing test suite...');
  const metrics = await tools.analyzeTestSuite();
  
  console.log('🗑️  Finding obsolete tests...');
  const obsoleteTests = await tools.findObsoleteTests();
  
  console.log('⚡ Optimizing test imports...');
  await tools.optimizeTestImports();
  
  console.log('📊 Generating report...');
  const report = tools.generateMaintenanceReport(metrics);
  
  writeFileSync('test-maintenance-report.md', report);
  
  console.log('✅ Maintenance completed!');
  console.log(`Found ${obsoleteTests.length} potentially obsolete test files.`);
  console.log('Report saved to test-maintenance-report.md');
}

if (require.main === module) {
  runMaintenance().catch(console.error);
}
```

### 2. 自動化測試品質檢查

```typescript
// .github/workflows/test-quality.yml
name: Test Quality Check

on:
  pull_request:
    branches: [main]

jobs:
  test-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run test quality analysis
        run: npm run test:quality-check

      - name: Check test coverage
        run: npm run test:coverage
        
      - name: Validate test performance
        run: npm run test:performance

      - name: Comment PR with quality report
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('test-maintenance-report.md', 'utf8');
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Test Quality Report\n\n${report}`
            });
```

### 3. 測試債務追蹤

```typescript
// tests/helpers/test-debt-tracker.ts
interface TestDebt {
  file: string;
  line: number;
  type: 'TODO' | 'FIXME' | 'SKIP' | 'SLOW';
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignee?: string;
  dateAdded: string;
}

export class TestDebtTracker {
  private debts: TestDebt[] = [];

  addDebt(debt: Omit<TestDebt, 'dateAdded'>) {
    this.debts.push({
      ...debt,
      dateAdded: new Date().toISOString(),
    });
  }

  getDebtsByPriority(priority: TestDebt['priority']): TestDebt[] {
    return this.debts.filter(debt => debt.priority === priority);
  }

  getOverdueDebts(daysSince = 30): TestDebt[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSince);

    return this.debts.filter(debt => 
      new Date(debt.dateAdded) < cutoffDate
    );
  }

  generateDebtReport(): string {
    const highPriorityDebts = this.getDebtsByPriority('HIGH');
    const overdueDebts = this.getOverdueDebts();

    return `
# Test Debt Report

## Summary
- Total Test Debts: ${this.debts.length}
- High Priority: ${highPriorityDebts.length}
- Overdue (30+ days): ${overdueDebts.length}

## High Priority Items
${highPriorityDebts.map(debt => 
  `- **${debt.file}:${debt.line}** - ${debt.description} (${debt.type})`
).join('\n')}

## Overdue Items
${overdueDebts.map(debt => 
  `- **${debt.file}:${debt.line}** - ${debt.description} (Added: ${debt.dateAdded})`
).join('\n')}
    `;
  }
}

// 使用範例
const debtTracker = new TestDebtTracker();

// 在測試中標記債務
test.skip('complex integration test', () => {
  // TODO: 重構這個測試，太複雜了
  debtTracker.addDebt({
    file: __filename,
    line: 123,
    type: 'SKIP',
    description: 'Integration test needs refactoring due to complexity',
    priority: 'HIGH',
    assignee: 'john.doe',
  });
});
```

## 持續改進策略

### 1. 測試程式碼審查檢查清單

```markdown
# Test Code Review Checklist

## ✅ 測試結構
- [ ] 測試名稱清楚描述測試意圖
- [ ] 使用 AAA 模式（Arrange, Act, Assert）
- [ ] 每個測試只專注一個行為
- [ ] 測試獨立且可重複執行

## ✅ 測試資料
- [ ] 使用有意義的測試資料
- [ ] 避免魔法數字和字串
- [ ] 適當使用工廠函數和建構器
- [ ] 測試資料與測試意圖相關

## ✅ 斷言
- [ ] 使用適當的斷言方法
- [ ] 斷言清楚且具體
- [ ] 避免過多或過少的斷言
- [ ] 錯誤訊息有助於除錯

## ✅ 模擬和設定
- [ ] Mock 使用合理且必要
- [ ] Mock 行為符合真實情況
- [ ] 適當的 setup 和 teardown
- [ ] 避免過度模擬

## ✅ 效能
- [ ] 測試執行速度合理
- [ ] 適當使用非同步測試模式
- [ ] 避免不必要的等待
- [ ] 資源清理完整

## ✅ 可維護性
- [ ] 程式碼重複最小化
- [ ] 適當的抽象和重用
- [ ] 註解和文件充足
- [ ] 與產品程式碼保持同步
```

### 2. 測試品質指標監控

```typescript
// tests/helpers/quality-metrics.ts
export interface TestQualityMetrics {
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  performance: {
    averageTestDuration: number;
    slowTests: number;
    totalExecutionTime: number;
  };
  maintainability: {
    duplicateCode: number;
    complexityScore: number;
    techDebt: number;
  };
  reliability: {
    flakyTests: number;
    failureRate: number;
    stabilityScore: number;
  };
}

export class TestQualityAnalyzer {
  async calculateQualityScore(metrics: TestQualityMetrics): Promise<number> {
    const weights = {
      coverage: 0.3,
      performance: 0.2,
      maintainability: 0.25,
      reliability: 0.25,
    };

    const coverageScore = this.calculateCoverageScore(metrics.coverage);
    const performanceScore = this.calculatePerformanceScore(metrics.performance);
    const maintainabilityScore = this.calculateMaintainabilityScore(metrics.maintainability);
    const reliabilityScore = this.calculateReliabilityScore(metrics.reliability);

    const totalScore = 
      coverageScore * weights.coverage +
      performanceScore * weights.performance +
      maintainabilityScore * weights.maintainability +
      reliabilityScore * weights.reliability;

    return Math.round(totalScore);
  }

  private calculateCoverageScore(coverage: TestQualityMetrics['coverage']): number {
    const avg = (coverage.lines + coverage.functions + coverage.branches + coverage.statements) / 4;
    return Math.min(100, avg);
  }

  private calculatePerformanceScore(performance: TestQualityMetrics['performance']): number {
    let score = 100;
    
    if (performance.averageTestDuration > 1000) score -= 20;
    if (performance.slowTests > 5) score -= performance.slowTests * 2;
    if (performance.totalExecutionTime > 60000) score -= 30;

    return Math.max(0, score);
  }

  private calculateMaintainabilityScore(maintainability: TestQualityMetrics['maintainability']): number {
    let score = 100;
    
    score -= maintainability.duplicateCode * 0.5;
    score -= maintainability.complexityScore * 2;
    score -= maintainability.techDebt * 1;

    return Math.max(0, score);
  }

  private calculateReliabilityScore(reliability: TestQualityMetrics['reliability']): number {
    let score = 100;
    
    score -= reliability.flakyTests * 10;
    score -= reliability.failureRate * 50;
    
    return Math.max(0, score);
  }
}
```

### 3. 自動化重構建議

```typescript
// tests/helpers/refactoring-advisor.ts
interface RefactoringOpportunity {
  file: string;
  line: number;
  type: 'EXTRACT_METHOD' | 'REMOVE_DUPLICATION' | 'SIMPLIFY_ASSERTION' | 'OPTIMIZE_PERFORMANCE';
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  effort: 'SMALL' | 'MEDIUM' | 'LARGE';
}

export class TestRefactoringAdvisor {
  analyzeTestFile(filePath: string, content: string): RefactoringOpportunity[] {
    const opportunities: RefactoringOpportunity[] = [];

    // 檢查重複的程式碼
    const duplications = this.findDuplicatedCode(content);
    duplications.forEach(dup => {
      opportunities.push({
        file: filePath,
        line: dup.line,
        type: 'REMOVE_DUPLICATION',
        description: `Duplicated code pattern found: ${dup.pattern}`,
        impact: 'MEDIUM',
        effort: 'MEDIUM',
      });
    });

    // 檢查複雜的斷言
    const complexAssertions = this.findComplexAssertions(content);
    complexAssertions.forEach(assertion => {
      opportunities.push({
        file: filePath,
        line: assertion.line,
        type: 'SIMPLIFY_ASSERTION',
        description: `Complex assertion can be simplified: ${assertion.description}`,
        impact: 'LOW',
        effort: 'SMALL',
      });
    });

    // 檢查效能問題
    const performanceIssues = this.findPerformanceIssues(content);
    performanceIssues.forEach(issue => {
      opportunities.push({
        file: filePath,
        line: issue.line,
        type: 'OPTIMIZE_PERFORMANCE',
        description: `Performance issue detected: ${issue.description}`,
        impact: 'HIGH',
        effort: 'MEDIUM',
      });
    });

    return opportunities;
  }

  private findDuplicatedCode(content: string): Array<{line: number, pattern: string}> {
    // 簡化的重複程式碼檢測邏輯
    const lines = content.split('\n');
    const duplications: Array<{line: number, pattern: string}> = [];
    const seenPatterns = new Map<string, number>();

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length > 20 && !trimmed.startsWith('//')) {
        if (seenPatterns.has(trimmed)) {
          duplications.push({
            line: index + 1,
            pattern: trimmed.substring(0, 50) + '...',
          });
        } else {
          seenPatterns.set(trimmed, index + 1);
        }
      }
    });

    return duplications;
  }

  private findComplexAssertions(content: string): Array<{line: number, description: string}> {
    const lines = content.split('\n');
    const complexAssertions: Array<{line: number, description: string}> = [];

    lines.forEach((line, index) => {
      // 檢查複雜的 expect 鏈
      if (line.includes('expect') && line.split('.').length > 4) {
        complexAssertions.push({
          line: index + 1,
          description: 'Long assertion chain detected',
        });
      }

      // 檢查多個條件的斷言
      if (line.includes('expect') && (line.includes('&&') || line.includes('||'))) {
        complexAssertions.push({
          line: index + 1,
          description: 'Multiple conditions in single assertion',
        });
      }
    });

    return complexAssertions;
  }

  private findPerformanceIssues(content: string): Array<{line: number, description: string}> {
    const lines = content.split('\n');
    const performanceIssues: Array<{line: number, description: string}> = [];

    lines.forEach((line, index) => {
      // 檢查同步等待
      if (line.includes('setTimeout') && line.includes('await')) {
        performanceIssues.push({
          line: index + 1,
          description: 'Using setTimeout for waiting - consider using waitFor',
        });
      }

      // 檢查過長的等待時間
      const timeoutMatch = line.match(/timeout:\s*(\d+)/);
      if (timeoutMatch && parseInt(timeoutMatch[1]) > 10000) {
        performanceIssues.push({
          line: index + 1,
          description: `Long timeout detected: ${timeoutMatch[1]}ms`,
        });
      }
    });

    return performanceIssues;
  }
}
```

## 常見問題

**Q: 什麼時候應該重構測試程式碼？**
A: 當測試難以理解、維護成本高、執行緩慢、經常失敗或與產品程式碼不同步時。

**Q: 如何平衡測試覆蓋率和維護成本？**
A: 專注於高價值的測試，定期審查和清理測試，使用自動化工具監控品質指標。

**Q: 重構測試時如何保證不破壞現有功能？**
A: 逐步重構、保持測試通過、使用版本控制追蹤變更、與團隊成員協作審查。

**Q: 如何處理遺留測試系統？**
A: 制定遷移計劃、逐步現代化、建立新舊系統的過渡期策略、培訓團隊新的最佳實踐。

## 練習題

1. **基礎練習**：測試重構實踐
   - 找出現有測試中的異味
   - 重構複雜的測試案例
   - 提取共用的測試工具和資料

2. **進階練習**：建立維護工具
   - 實作測試品質分析工具
   - 建立自動化重構建議系統
   - 設定持續監控機制

3. **挑戰練習**：完整維護策略
   - 制定測試債務管理計劃
   - 建立團隊測試品質標準
   - 實作自動化品質閘道

## 延伸閱讀

- [Refactoring Test Code](https://martinfowler.com/articles/refactoring-test-code.html)
- [xUnit Test Patterns](http://xunitpatterns.com/)
- [Test Smells and Fragrances](https://testsmells.org/)
- [Continuous Testing Best Practices](https://www.thoughtworks.com/insights/blog/continuous-testing)

## 本日重點回顧

✅ 了解測試重構的必要性和策略
✅ 學會識別和處理測試程式碼異味
✅ 掌握測試維護的最佳實踐
✅ 建立自動化品質監控機制
✅ 實作測試債務追蹤系統
✅ 制定持續改進的維護策略
✅ 建立可持續的測試程式碼基礎

明天我們將迎來系列的最終章，回顧整個學習旅程並展望進階測試技能的發展方向！
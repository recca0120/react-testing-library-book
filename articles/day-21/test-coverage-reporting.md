# Day 21: 測試覆蓋率與報告

## 學習目標
- 理解測試覆蓋率的概念和重要性
- 掌握 Vitest 覆蓋率配置與使用
- 學會分析和改善測試覆蓋率
- 了解如何在 CI/CD 中整合覆蓋率報告

## 概念說明

測試覆蓋率是衡量測試品質的重要指標，它告訴我們程式碼中有多少部分被測試覆蓋。然而，高覆蓋率並不等於高品質的測試。

### 覆蓋率類型

1. **行覆蓋率 (Line Coverage)**：被執行的程式碼行數百分比
2. **函數覆蓋率 (Function Coverage)**：被調用的函數百分比
3. **分支覆蓋率 (Branch Coverage)**：被執行的分支百分比
4. **語句覆蓋率 (Statement Coverage)**：被執行的語句百分比

### 覆蓋率的意義

- **品質指標**：幫助發現未測試的程式碼區域
- **重構信心**：高覆蓋率提供重構的信心
- **團隊標準**：建立團隊的測試標準
- **持續改進**：追蹤測試品質的改善

## 實作範例

### Vitest 覆蓋率配置

```typescript
// vite.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8', // 或 'c8', 'istanbul'
      reporter: [
        'text',        // 控制台輸出
        'html',        // HTML 報告
        'json',        // JSON 格式
        'lcov',        // LCOV 格式（用於 CI）
        'json-summary' // JSON 摘要
      ],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      include: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/*.stories.{ts,tsx}'
      ],
      // 覆蓋率閾值
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // 針對特定文件的閾值
        'src/utils/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      },
      // 檢查覆蓋率
      checkCoverage: true,
      // 所有文件都必須滿足閾值
      all: true
    }
  }
});
```

### Package.json 腳本設定

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:coverage:ui": "vitest --ui --coverage"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  }
}
```

### 示例程式碼與測試

```typescript
// src/utils/mathUtils.ts
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }

  power(base: number, exponent: number): number {
    if (exponent === 0) {
      return 1;
    }
    if (exponent < 0) {
      return 1 / this.power(base, Math.abs(exponent));
    }
    return base * this.power(base, exponent - 1);
  }

  factorial(n: number): number {
    if (n < 0) {
      throw new Error('Factorial is not defined for negative numbers');
    }
    if (n === 0 || n === 1) {
      return 1;
    }
    return n * this.factorial(n - 1);
  }

  isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }
}

export const calculator = new Calculator();
```

### 完整測試範例

```typescript
// src/utils/__tests__/mathUtils.test.ts
import { describe, it, expect } from 'vitest';
import { Calculator } from '../mathUtils';

describe('Calculator', () => {
  const calc = new Calculator();

  describe('add', () => {
    it('should add positive numbers', () => {
      expect(calc.add(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      expect(calc.add(-2, -3)).toBe(-5);
    });

    it('should add positive and negative numbers', () => {
      expect(calc.add(5, -3)).toBe(2);
    });
  });

  describe('subtract', () => {
    it('should subtract numbers correctly', () => {
      expect(calc.subtract(5, 3)).toBe(2);
      expect(calc.subtract(1, 5)).toBe(-4);
    });
  });

  describe('multiply', () => {
    it('should multiply numbers correctly', () => {
      expect(calc.multiply(3, 4)).toBe(12);
      expect(calc.multiply(-2, 3)).toBe(-6);
      expect(calc.multiply(0, 5)).toBe(0);
    });
  });

  describe('divide', () => {
    it('should divide numbers correctly', () => {
      expect(calc.divide(8, 2)).toBe(4);
      expect(calc.divide(7, 2)).toBe(3.5);
    });

    it('should throw error when dividing by zero', () => {
      expect(() => calc.divide(5, 0)).toThrow('Division by zero');
    });
  });

  describe('power', () => {
    it('should calculate power correctly', () => {
      expect(calc.power(2, 3)).toBe(8);
      expect(calc.power(5, 0)).toBe(1);
      expect(calc.power(2, -2)).toBe(0.25);
    });
  });

  describe('factorial', () => {
    it('should calculate factorial correctly', () => {
      expect(calc.factorial(0)).toBe(1);
      expect(calc.factorial(1)).toBe(1);
      expect(calc.factorial(5)).toBe(120);
    });

    it('should throw error for negative numbers', () => {
      expect(() => calc.factorial(-1)).toThrow(
        'Factorial is not defined for negative numbers'
      );
    });
  });

  describe('isPrime', () => {
    it('should identify prime numbers correctly', () => {
      expect(calc.isPrime(2)).toBe(true);
      expect(calc.isPrime(3)).toBe(true);
      expect(calc.isPrime(17)).toBe(true);
    });

    it('should identify non-prime numbers correctly', () => {
      expect(calc.isPrime(1)).toBe(false);
      expect(calc.isPrime(4)).toBe(false);
      expect(calc.isPrime(9)).toBe(false);
      expect(calc.isPrime(15)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(calc.isPrime(-5)).toBe(false);
    });
  });
});
```

### 覆蓋率報告分析

```bash
# 執行覆蓋率測試
npm run test:coverage

# 輸出示例
 ✓ src/utils/__tests__/mathUtils.test.ts (14)
 ✓ src/components/__tests__/Button.test.tsx (8)

 Test Files  2 passed (2)
      Tests  22 passed (22)
   Start at  14:30:25
   Duration  1.23s (transform 89ms, setup 156ms, collect 234ms, tests 67ms)

 % Coverage report from v8
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   95.12 |    91.67 |     100 |   95.12 |
 src/utils          |   100   |    100   |     100 |   100   |
  mathUtils.ts      |   100   |    100   |     100 |   100   |
 src/components     |   90.24 |    83.33 |     100 |   90.24 |
  Button.tsx        |   90.24 |    83.33 |     100 |   90.24 |
--------------------|---------|----------|---------|---------|
```

### CI/CD 整合範例

```yaml
# .github/workflows/test.yml
name: Test and Coverage

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests with coverage
        run: npm run test:coverage
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          
      - name: Comment PR with coverage
        if: github.event_name == 'pull_request'
        uses: 5monkeys/cobertura-action@master
        with:
          path: coverage/cobertura-coverage.xml
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          minimum_coverage: 80
```

### 進階覆蓋率配置

```typescript
// vitest.config.ts - 進階配置
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      // 使用 istanbul 提供更詳細的報告
      provider: 'istanbul',
      
      // 自定義報告格式
      reporter: [
        ['html', { subdir: 'html' }],
        ['json', { file: 'coverage.json' }],
        ['text'],
        ['lcov'],
        ['cobertura'] // 適用於 Jenkins 等 CI 工具
      ],
      
      // 詳細的閾值設定
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        },
        // 不同目錄的不同標準
        'src/utils/': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/components/': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      
      // 忽略特定程式碼模式
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/node_modules/**',
        '**/dist/**',
        '**/.{idea,git,cache,output,temp}/**',
        // 忽略 console.log 等調試程式碼
        '**/debug.ts'
      ],
      
      // 包含的檔案模式
      include: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.{test,spec}.{ts,tsx}',
        '!src/**/*.stories.{ts,tsx}',
        '!src/**/types.ts'
      ],
      
      // 檢查所有檔案，包括沒有測試的
      all: true,
      
      // 生成詳細的覆蓋率信息
      clean: true,
      cleanOnRerun: true
    }
  }
});
```

### 覆蓋率報告自定義

```typescript
// scripts/coverage-report.ts
import fs from 'fs';
import path from 'path';

interface CoverageData {
  total: {
    lines: { total: number; covered: number; pct: number };
    statements: { total: number; covered: number; pct: number };
    functions: { total: number; covered: number; pct: number };
    branches: { total: number; covered: number; pct: number };
  };
}

async function generateCoverageReport() {
  const coveragePath = path.join(process.cwd(), 'coverage/coverage-summary.json');
  
  if (!fs.existsSync(coveragePath)) {
    console.error('Coverage summary not found. Run tests with coverage first.');
    process.exit(1);
  }

  const coverageData: CoverageData = JSON.parse(
    fs.readFileSync(coveragePath, 'utf8')
  );

  const { total } = coverageData;
  
  console.log('📊 Coverage Report');
  console.log('==================');
  console.log(`Lines:      ${total.lines.pct.toFixed(2)}% (${total.lines.covered}/${total.lines.total})`);
  console.log(`Statements: ${total.statements.pct.toFixed(2)}% (${total.statements.covered}/${total.statements.total})`);
  console.log(`Functions:  ${total.functions.pct.toFixed(2)}% (${total.functions.covered}/${total.functions.total})`);
  console.log(`Branches:   ${total.branches.pct.toFixed(2)}% (${total.branches.covered}/${total.branches.total})`);
  
  // 檢查是否達到最低要求
  const minCoverage = 80;
  const averageCoverage = (
    total.lines.pct + 
    total.statements.pct + 
    total.functions.pct + 
    total.branches.pct
  ) / 4;
  
  if (averageCoverage < minCoverage) {
    console.log(`\n❌ Coverage below minimum threshold (${minCoverage}%)`);
    process.exit(1);
  } else {
    console.log(`\n✅ Coverage meets minimum threshold (${minCoverage}%)`);
  }
}

generateCoverageReport();
```

### 覆蓋率改善策略

```typescript
// 識別未覆蓋的程式碼
// src/utils/uncovered-example.ts
export class ExampleService {
  processData(data: string[]): string[] {
    if (!data || data.length === 0) {
      return []; // 這行可能沒被測試到
    }
    
    const processed = data.map(item => {
      if (item.startsWith('special:')) {
        return this.processSpecialItem(item); // 特殊情況可能沒被測試
      }
      return item.toUpperCase();
    });
    
    // 錯誤處理分支可能沒被測試
    try {
      return this.validateResults(processed);
    } catch (error) {
      console.error('Validation failed:', error); // 這行可能沒被覆蓋
      return [];
    }
  }
  
  private processSpecialItem(item: string): string {
    return item.replace('special:', '').toUpperCase();
  }
  
  private validateResults(results: string[]): string[] {
    if (results.some(r => r.length === 0)) {
      throw new Error('Empty result detected');
    }
    return results;
  }
}
```

```typescript
// 改善覆蓋率的測試
// src/utils/__tests__/uncovered-example.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ExampleService } from '../uncovered-example';

describe('ExampleService', () => {
  let service: ExampleService;
  
  beforeEach(() => {
    service = new ExampleService();
  });

  describe('processData', () => {
    it('should return empty array for null/undefined data', () => {
      expect(service.processData(null as any)).toEqual([]);
      expect(service.processData(undefined as any)).toEqual([]);
    });
    
    it('should return empty array for empty array', () => {
      expect(service.processData([])).toEqual([]);
    });
    
    it('should process normal items', () => {
      const result = service.processData(['hello', 'world']);
      expect(result).toEqual(['HELLO', 'WORLD']);
    });
    
    it('should process special items', () => {
      const result = service.processData(['special:test', 'normal']);
      expect(result).toEqual(['TEST', 'NORMAL']);
    });
    
    // 測試錯誤處理分支
    it('should handle validation errors', () => {
      // 使用 spy 模擬 validateResults 拋出錯誤
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const validateSpy = vi.spyOn(service as any, 'validateResults')
        .mockImplementation(() => {
          throw new Error('Validation failed');
        });
        
      const result = service.processData(['test']);
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Validation failed:', expect.any(Error));
      
      consoleSpy.mockRestore();
      validateSpy.mockRestore();
    });
  });
});
```

## 常見問題

### Q: 100% 覆蓋率是否意味著完美的測試？

**A:** 不是。覆蓋率只能告訴你程式碼被執行了，但不能保證：
- 測試的品質
- 是否測試了正確的行為
- 是否涵蓋了所有邊界條件

### Q: 覆蓋率目標應該設定多少？

**A:** 建議：
- 新專案：80-90%
- 遺留專案：逐步提升到 70%+
- 關鍵業務邏輯：95%+
- 工具函數：90%+

### Q: 如何處理難以測試的程式碼？

**A:** 
1. 重構以提高可測試性
2. 使用依賴注入
3. 分離純函數和副作用
4. 適當地忽略某些程式碼

## 延伸閱讀

- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [Understanding Code Coverage](https://martinfowler.com/bliki/TestCoverage.html)
- [Istanbul Coverage Reports](https://istanbul.js.org/)
- [Codecov Integration](https://docs.codecov.io/)

## 本日重點回顧

1. **覆蓋率配置**：設定適當的覆蓋率工具和閾值
2. **報告分析**：理解不同類型的覆蓋率指標
3. **CI/CD 整合**：自動化覆蓋率檢查和報告
4. **覆蓋率改善**：系統性地提升測試覆蓋率
5. **品質平衡**：覆蓋率與測試品質的平衡

測試覆蓋率是測試策略的重要組成部分，但記住它只是工具之一，真正的目標是構建可靠、可維護的軟體系統。
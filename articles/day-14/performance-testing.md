# Day 14: 效能測試基礎

## 學習目標

- 了解 React 元件效能測試的重要性
- 學會測試渲染次數和效能優化
- 掌握 React.memo、useMemo、useCallback 的測試
- 使用效能分析工具

## 為什麼需要效能測試？

效能測試幫助我們：
1. 避免不必要的重新渲染
2. 驗證優化策略的有效性
3. 發現效能瓶頸
4. 確保應用程式的響應性

## 測試渲染次數

### 建立測試元件

```typescript
// src/components/RenderCounter.tsx
import React, { useState, useEffect } from 'react';

interface RenderCounterProps {
  name: string;
  value?: number;
  onRender?: () => void;
}

export const RenderCounter: React.FC<RenderCounterProps> = ({ 
  name, 
  value = 0,
  onRender 
}) => {
  const renderCount = React.useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    onRender?.();
  });

  return (
    <div data-testid="render-counter">
      <h3>{name}</h3>
      <p>Value: {value}</p>
      <p data-testid="render-count">Render count: {renderCount.current}</p>
    </div>
  );
};

// 使用 React.memo 優化的版本
export const MemoizedRenderCounter = React.memo(RenderCounter);

// 自定義比較函數
export const CustomMemoCounter = React.memo(
  RenderCounter,
  (prevProps, nextProps) => {
    // 只在 name 改變時重新渲染
    return prevProps.name === nextProps.name;
  }
);
```

### 測試渲染次數

```typescript
// src/components/RenderCounter.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  RenderCounter, 
  MemoizedRenderCounter,
  CustomMemoCounter 
} from './RenderCounter';

describe('RenderCounter - 渲染次數測試', () => {
  test('追蹤元件渲染次數', () => {
    const onRender = vi.fn();
    const { rerender } = render(
      <RenderCounter name="Test" onRender={onRender} />
    );
    
    expect(onRender).toHaveBeenCalledTimes(1);
    
    // 重新渲染相同的 props
    rerender(<RenderCounter name="Test" onRender={onRender} />);
    expect(onRender).toHaveBeenCalledTimes(2);
    
    // 改變 props
    rerender(<RenderCounter name="Updated" onRender={onRender} />);
    expect(onRender).toHaveBeenCalledTimes(3);
  });

  test('React.memo 防止不必要的渲染', () => {
    const onRender = vi.fn();
    const { rerender } = render(
      <MemoizedRenderCounter name="Test" value={1} onRender={onRender} />
    );
    
    expect(onRender).toHaveBeenCalledTimes(1);
    
    // 相同的 props，不應該重新渲染
    rerender(
      <MemoizedRenderCounter name="Test" value={1} onRender={onRender} />
    );
    expect(onRender).toHaveBeenCalledTimes(1);
    
    // props 改變，應該重新渲染
    rerender(
      <MemoizedRenderCounter name="Test" value={2} onRender={onRender} />
    );
    expect(onRender).toHaveBeenCalledTimes(2);
  });

  test('自定義 memo 比較函數', () => {
    const onRender = vi.fn();
    const { rerender } = render(
      <CustomMemoCounter name="Test" value={1} onRender={onRender} />
    );
    
    expect(onRender).toHaveBeenCalledTimes(1);
    
    // value 改變但 name 相同，不應該重新渲染
    rerender(
      <CustomMemoCounter name="Test" value={999} onRender={onRender} />
    );
    expect(onRender).toHaveBeenCalledTimes(1);
    
    // name 改變，應該重新渲染
    rerender(
      <CustomMemoCounter name="Updated" value={999} onRender={onRender} />
    );
    expect(onRender).toHaveBeenCalledTimes(2);
  });
});
```

## 測試 useMemo 和 useCallback

### 建立使用 useMemo 的元件

```typescript
// src/components/ExpensiveComponent.tsx
import React, { useState, useMemo, useCallback } from 'react';

interface ExpensiveComponentProps {
  data: number[];
  multiplier: number;
}

export const ExpensiveComponent: React.FC<ExpensiveComponentProps> = ({
  data,
  multiplier
}) => {
  const [filter, setFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 昂貴的計算使用 useMemo
  const processedData = useMemo(() => {
    console.log('Processing data...');
    const filtered = data.filter(item => 
      item.toString().includes(filter)
    );
    
    const multiplied = filtered.map(item => item * multiplier);
    
    return sortOrder === 'asc' 
      ? multiplied.sort((a, b) => a - b)
      : multiplied.sort((a, b) => b - a);
  }, [data, multiplier, filter, sortOrder]);

  // 使用 useCallback 優化事件處理器
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  }, []);

  const toggleSort = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  const sum = processedData.reduce((acc, val) => acc + val, 0);

  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={handleFilterChange}
        placeholder="Filter numbers"
        aria-label="filter"
      />
      <button onClick={toggleSort}>
        Sort {sortOrder === 'asc' ? '↑' : '↓'}
      </button>
      
      <div data-testid="processed-data">
        <p>Count: {processedData.length}</p>
        <p>Sum: {sum}</p>
        <ul>
          {processedData.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

### 測試 useMemo 效能優化

```typescript
// src/components/ExpensiveComponent.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpensiveComponent } from './ExpensiveComponent';

describe('ExpensiveComponent - useMemo 測試', () => {
  beforeEach(() => {
    // 監聽 console.log 以追蹤計算次數
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  test('useMemo 快取計算結果', async () => {
    const user = userEvent.setup();
    const data = [1, 12, 23, 34, 45];
    
    const { rerender } = render(
      <ExpensiveComponent data={data} multiplier={2} />
    );
    
    // 第一次渲染，執行計算
    expect(console.log).toHaveBeenCalledWith('Processing data...');
    expect(console.log).toHaveBeenCalledTimes(1);
    
    // 相同的 props，不應該重新計算
    rerender(<ExpensiveComponent data={data} multiplier={2} />);
    expect(console.log).toHaveBeenCalledTimes(1);
    
    // 改變 filter，應該重新計算
    const filterInput = screen.getByLabelText('filter');
    await user.type(filterInput, '1');
    expect(console.log).toHaveBeenCalledTimes(2);
    
    // 清理
    vi.clearAllMocks();
  });

  test('依賴項改變時重新計算', () => {
    const data = [1, 2, 3, 4, 5];
    
    const { rerender } = render(
      <ExpensiveComponent data={data} multiplier={2} />
    );
    
    expect(console.log).toHaveBeenCalledTimes(1);
    
    // 改變 multiplier，應該重新計算
    rerender(<ExpensiveComponent data={data} multiplier={3} />);
    expect(console.log).toHaveBeenCalledTimes(2);
    
    // 改變 data，應該重新計算
    rerender(<ExpensiveComponent data={[6, 7, 8]} multiplier={3} />);
    expect(console.log).toHaveBeenCalledTimes(3);
  });
});
```

## 測試列表渲染效能

### 虛擬列表元件

```typescript
// src/components/VirtualList.tsx
import React, { useState, useCallback, memo } from 'react';

interface ListItemProps {
  id: number;
  text: string;
  onToggle: (id: number) => void;
  isSelected: boolean;
}

// 優化的列表項目
const ListItem = memo<ListItemProps>(({ id, text, onToggle, isSelected }) => {
  console.log(`Rendering item ${id}`);
  
  return (
    <li 
      onClick={() => onToggle(id)}
      style={{ backgroundColor: isSelected ? '#e0e0e0' : 'white' }}
      data-testid={`item-${id}`}
    >
      {text}
    </li>
  );
});

interface VirtualListProps {
  items: Array<{ id: number; text: string }>;
}

export const VirtualList: React.FC<VirtualListProps> = ({ items }) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // 使用 useCallback 避免子元件不必要的渲染
  const handleToggle = useCallback((id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  return (
    <ul>
      {items.map(item => (
        <ListItem
          key={item.id}
          id={item.id}
          text={item.text}
          onToggle={handleToggle}
          isSelected={selectedIds.has(item.id)}
        />
      ))}
    </ul>
  );
};
```

### 測試列表渲染效能

```typescript
// src/components/VirtualList.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VirtualList } from './VirtualList';

describe('VirtualList - 列表效能測試', () => {
  const mockItems = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    text: `Item ${i}`
  }));

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  test('只渲染必要的列表項目', async () => {
    const user = userEvent.setup();
    
    render(<VirtualList items={mockItems.slice(0, 5)} />);
    
    // 初始渲染 5 個項目
    expect(console.log).toHaveBeenCalledTimes(5);
    
    // 點擊一個項目，只有該項目重新渲染
    vi.clearAllMocks();
    await user.click(screen.getByTestId('item-0'));
    
    // 只有被點擊的項目重新渲染
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith('Rendering item 0');
  });

  test('使用 key 優化列表更新', () => {
    const { rerender } = render(
      <VirtualList items={mockItems.slice(0, 3)} />
    );
    
    vi.clearAllMocks();
    
    // 在列表開頭插入新項目
    const newItems = [
      { id: 999, text: 'New Item' },
      ...mockItems.slice(0, 3)
    ];
    
    rerender(<VirtualList items={newItems} />);
    
    // 只有新項目被渲染，其他項目保持不變
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith('Rendering item 999');
  });
});
```

## 測試效能指標

### 效能監控元件

```typescript
// src/components/PerformanceMonitor.tsx
import React, { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  componentCount: number;
}

export const PerformanceMonitor: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    updateTime: 0,
    componentCount: 0
  });
  
  const startTime = useRef<number>(0);

  useEffect(() => {
    // 測量渲染時間
    startTime.current = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime.current;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        componentCount: React.Children.count(children)
      }));
    };
  }, [children]);

  return (
    <div>
      <div data-testid="performance-metrics">
        <p>Render Time: {metrics.renderTime.toFixed(2)}ms</p>
        <p>Component Count: {metrics.componentCount}</p>
      </div>
      {children}
    </div>
  );
};
```

### 測試效能指標

```typescript
// src/components/PerformanceMonitor.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PerformanceMonitor } from './PerformanceMonitor';

describe('PerformanceMonitor - 效能指標測試', () => {
  test('測量渲染時間', async () => {
    // Mock performance.now()
    let time = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      time += 10;
      return time;
    });

    render(
      <PerformanceMonitor>
        <div>Test Component</div>
      </PerformanceMonitor>
    );

    await waitFor(() => {
      const metrics = screen.getByTestId('performance-metrics');
      expect(metrics).toHaveTextContent(/Render Time: \d+\.?\d*ms/);
    });
  });

  test('計算元件數量', () => {
    render(
      <PerformanceMonitor>
        <div>Component 1</div>
        <div>Component 2</div>
        <div>Component 3</div>
      </PerformanceMonitor>
    );

    const metrics = screen.getByTestId('performance-metrics');
    expect(metrics).toHaveTextContent('Component Count: 3');
  });
});
```

## 使用 React DevTools Profiler

### 程式化 Profiler API

```typescript
// src/components/ProfiledComponent.tsx
import React, { Profiler, ProfilerOnRenderCallback } from 'react';

const onRenderCallback: ProfilerOnRenderCallback = (
  id, // 組件的 "id"
  phase, // "mount" 或 "update"
  actualDuration, // 本次更新花費的時間
  baseDuration, // 未使用 memoization 的情況下完整子樹渲染的估計時間
  startTime, // React 開始渲染的時間
  commitTime, // React 提交更新的時間
  interactions // 屬於本次更新的 interactions 的集合
) => {
  console.log('Profiler data:', {
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  });
};

export const ProfiledComponent: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <Profiler id="ProfiledComponent" onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
};
```

### 測試 Profiler 數據

```typescript
// src/components/ProfiledComponent.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ProfiledComponent } from './ProfiledComponent';

describe('ProfiledComponent - Profiler 測試', () => {
  test('收集效能數據', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    render(
      <ProfiledComponent>
        <div>Test Content</div>
      </ProfiledComponent>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Profiler data:',
      expect.objectContaining({
        id: 'ProfiledComponent',
        phase: 'mount',
        actualDuration: expect.any(Number),
        baseDuration: expect.any(Number),
        startTime: expect.any(Number),
        commitTime: expect.any(Number)
      })
    );
  });

  test('追蹤更新階段', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    const { rerender } = render(
      <ProfiledComponent>
        <div>Initial</div>
      </ProfiledComponent>
    );

    consoleSpy.mockClear();

    rerender(
      <ProfiledComponent>
        <div>Updated</div>
      </ProfiledComponent>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Profiler data:',
      expect.objectContaining({
        phase: 'update'
      })
    );
  });
});
```

## 效能最佳實踐

### 1. 避免內聯函數和物件

```typescript
// ❌ 不好的做法
const BadComponent = () => {
  return (
    <ChildComponent 
      onClick={() => console.log('clicked')} // 每次都創建新函數
      style={{ color: 'red' }} // 每次都創建新物件
    />
  );
};

// ✅ 好的做法
const GoodComponent = () => {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  const style = useMemo(() => ({ color: 'red' }), []);

  return <ChildComponent onClick={handleClick} style={style} />;
};
```

### 2. 使用 React.lazy 進行程式碼分割

```typescript
// src/components/LazyComponent.tsx
import React, { Suspense, lazy } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

export const LazyComponent: React.FC = () => {
  const [showHeavy, setShowHeavy] = useState(false);

  return (
    <div>
      <button onClick={() => setShowHeavy(true)}>
        Load Heavy Component
      </button>
      
      {showHeavy && (
        <Suspense fallback={<div>Loading...</div>}>
          <HeavyComponent />
        </Suspense>
      )}
    </div>
  );
};
```

### 測試懶加載

```typescript
import { describe, test, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LazyComponent } from './LazyComponent';

describe('LazyComponent', () => {
  test('懶加載元件', async () => {
    const user = userEvent.setup();
    render(<LazyComponent />);
    
    // 初始時不載入重型元件
    expect(screen.queryByText('Heavy Component')).not.toBeInTheDocument();
    
    // 點擊按鈕載入
    await user.click(screen.getByText('Load Heavy Component'));
    
    // 顯示載入中
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // 等待元件載入
    await waitFor(() => {
      expect(screen.getByText('Heavy Component Content')).toBeInTheDocument();
    });
  });
});
```

## 常見問題

**Q: 什麼時候應該使用 React.memo？**
A: 當元件：
- 經常收到相同的 props
- 渲染成本較高
- 父元件頻繁重新渲染

**Q: useMemo 和 useCallback 的區別？**
A: 
- useMemo：快取計算結果
- useCallback：快取函數引用

**Q: 如何測試實際的渲染效能？**
A: 使用 React Profiler API 或瀏覽器的 Performance 工具。

## 練習題

1. **基礎練習**：優化一個包含大量數據的表格元件
2. **進階練習**：實作虛擬滾動列表並測試效能
3. **挑戰練習**：建立效能監控 Dashboard

## 延伸閱讀

- [React 效能優化](https://react.dev/learn/render-and-commit)
- [React Profiler API](https://react.dev/reference/react/Profiler)
- [Web Vitals 測量](https://web.dev/vitals/)
- [React 效能測試最佳實踐](https://kentcdodds.com/blog/profile-a-react-app-for-performance)

## 本日重點回顧

✅ 了解效能測試的重要性
✅ 學會測試渲染次數
✅ 掌握 React.memo、useMemo、useCallback 的測試
✅ 使用 Profiler API 收集效能數據
✅ 實踐效能優化最佳實踐

明天我們將學習 Redux 測試策略！
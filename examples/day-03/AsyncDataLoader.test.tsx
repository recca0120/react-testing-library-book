import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AsyncDataLoader } from './AsyncDataLoader';

describe('AsyncDataLoader - findBy queries', () => {
  test('findBy 等待非同步元素出現', async () => {
    const user = userEvent.setup();
    render(<AsyncDataLoader />);
    
    // 點擊載入按鈕
    await user.click(screen.getByText('Load Users'));
    
    // findBy 會等待元素出現（預設 timeout 1000ms）
    const usersList = await screen.findByLabelText('users list');
    expect(usersList).toBeInTheDocument();
    
    // 驗證使用者資料
    expect(await screen.findByText(/John Doe/)).toBeInTheDocument();
    expect(await screen.findByText(/Jane Smith/)).toBeInTheDocument();
  });

  test('findBy 可設定自定義 timeout', async () => {
    const user = userEvent.setup();
    render(<AsyncDataLoader />);
    
    await user.click(screen.getByText('Load Users'));
    
    // 設定較長的 timeout
    const usersList = await screen.findByLabelText('users list', {}, {
      timeout: 3000
    });
    expect(usersList).toBeInTheDocument();
  });

  test('組合使用不同查詢方法', async () => {
    const user = userEvent.setup();
    render(<AsyncDataLoader />);
    
    // 初始狀態 - 使用 queryBy
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('users list')).not.toBeInTheDocument();
    
    // 點擊載入
    await user.click(screen.getByText('Load Users'));
    
    // Loading 狀態 - 使用 getBy
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
    
    // 等待資料載入 - 使用 findBy
    await screen.findByLabelText('users list');
    
    // Loading 消失 - 使用 queryBy
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('顯示正確的使用者資訊', async () => {
    const user = userEvent.setup();
    render(<AsyncDataLoader />);
    
    await user.click(screen.getByText('Load Users'));
    
    // 等待資料載入完成
    await screen.findByLabelText('users list');
    
    // 檢查使用者資訊格式
    expect(screen.getByText('John Doe')).toHaveProperty('tagName', 'STRONG');
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'John Doe - john@example.com';
    })).toBeInTheDocument();
    
    expect(screen.getByText('Jane Smith')).toHaveProperty('tagName', 'STRONG');
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Jane Smith - jane@example.com';
    })).toBeInTheDocument();
  });
});
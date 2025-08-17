import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConditionalContent } from './ConditionalContent';

describe('ConditionalContent - queryBy queries', () => {
  test('queryBy 用於斷言元素不存在', () => {
    render(<ConditionalContent />);
    
    // 初始狀態：內容不應該存在
    const content = screen.queryByText('Dynamic Content');
    expect(content).not.toBeInTheDocument();
    
    // 錯誤訊息也不應該存在
    const error = screen.queryByRole('alert');
    expect(error).not.toBeInTheDocument();
  });

  test('元素出現後可以查詢到', async () => {
    const user = userEvent.setup();
    render(<ConditionalContent />);
    
    // 點擊前確認不存在
    expect(screen.queryByText('Dynamic Content')).not.toBeInTheDocument();
    
    // 點擊顯示內容
    await user.click(screen.getByText('Toggle Content'));
    
    // 現在應該存在
    expect(screen.queryByText('Dynamic Content')).toBeInTheDocument();
  });

  test('切換狀態時正確顯示/隱藏', async () => {
    const user = userEvent.setup();
    render(<ConditionalContent />);
    
    const toggleButton = screen.getByText('Toggle Content');
    
    // 顯示內容
    await user.click(toggleButton);
    expect(screen.queryByText('Dynamic Content')).toBeInTheDocument();
    
    // 隱藏內容
    await user.click(toggleButton);
    expect(screen.queryByText('Dynamic Content')).not.toBeInTheDocument();
  });

  test('顯示錯誤訊息', async () => {
    const user = userEvent.setup();
    render(<ConditionalContent />);
    
    // 觸發錯誤
    await user.click(screen.getByText('Trigger Error'));
    
    // 錯誤訊息應該出現
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Something went wrong!');
    
    // 內容應該隱藏
    expect(screen.queryByText('Dynamic Content')).not.toBeInTheDocument();
  });

  test('切換內容時清除錯誤', async () => {
    const user = userEvent.setup();
    render(<ConditionalContent />);
    
    // 先觸發錯誤
    await user.click(screen.getByText('Trigger Error'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    // 切換內容應該清除錯誤
    await user.click(screen.getByText('Toggle Content'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Dynamic Content')).toBeInTheDocument();
  });
});
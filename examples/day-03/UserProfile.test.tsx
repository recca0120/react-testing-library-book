import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile - getBy queries', () => {
  const mockUser = {
    name: 'Alice Chen',
    email: 'alice@example.com',
    role: 'admin' as const,
    isVerified: true,
  };

  test('getByRole - 查詢語義化元素', () => {
    render(<UserProfile user={mockUser} />);
    
    // 查詢標題
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Alice Chen');
    
    // 查詢狀態元素
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('admin');
  });

  test('getByText - 查詢文字內容', () => {
    render(<UserProfile user={mockUser} />);
    
    // 完全匹配
    const email = screen.getByText('alice@example.com');
    expect(email).toHaveClass('email');
    
    // 部分匹配（使用正則）
    const name = screen.getByText(/alice chen/i);
    expect(name).toBeInTheDocument();
  });

  test('getByLabelText - 查詢表單相關元素', () => {
    render(<UserProfile user={mockUser} />);
    
    const roleStatus = screen.getByLabelText('user role');
    expect(roleStatus).toHaveTextContent('admin');
  });

  test('getByTestId - 最後手段', () => {
    render(<UserProfile user={mockUser} />);
    
    // 只在沒有更好選擇時使用
    const badge = screen.getByTestId('verified-badge');
    expect(badge).toHaveTextContent('✓ Verified');
  });

  test('handles unverified user', () => {
    const unverifiedUser = { ...mockUser, isVerified: false };
    render(<UserProfile user={unverifiedUser} />);
    
    const badge = screen.queryByTestId('verified-badge');
    expect(badge).not.toBeInTheDocument();
  });
});
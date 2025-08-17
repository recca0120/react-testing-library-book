import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelloWorld } from './HelloWorld';

describe('HelloWorld Component', () => {
  // 測試預設 props
  test('renders with default props', () => {
    render(<HelloWorld />);
    
    // 使用 getByRole 查詢標題
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Hello, World!');
    
    // 使用 getByText 查詢文字
    const welcome = screen.getByText(/welcome to react testing library/i);
    expect(welcome).toBeInTheDocument();
  });

  // 測試自定義 name
  test('renders with custom name', () => {
    render(<HelloWorld name="Alice" />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Hello, Alice!');
  });

  // 測試條件渲染
  test('shows time when showTime is true', () => {
    render(<HelloWorld showTime={true} />);
    
    const timeElement = screen.getByText(/current time:/i);
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveClass('time');
  });

  // 測試條件渲染 - 不顯示
  test('does not show time when showTime is false', () => {
    render(<HelloWorld showTime={false} />);
    
    // 使用 queryBy 當元素可能不存在時
    const timeElement = screen.queryByText(/current time:/i);
    expect(timeElement).not.toBeInTheDocument();
  });

  // 測試 DOM 結構
  test('has correct DOM structure', () => {
    const { container } = render(<HelloWorld name="Test" />);
    
    // 檢查容器類別
    const helloContainer = container.querySelector('.hello-container');
    expect(helloContainer).toBeInTheDocument();
    
    // 檢查子元素
    expect(helloContainer?.children).toHaveLength(2);
  });

  // 快照測試
  test('matches snapshot', () => {
    const { container } = render(<HelloWorld name="Snapshot" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
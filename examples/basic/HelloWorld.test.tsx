import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HelloWorld from './HelloWorld';

describe('HelloWorld Component', () => {
  test('renders with default name', () => {
    render(<HelloWorld />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Hello, World!');
    
    const paragraph = screen.getByText('Welcome to React Testing Library');
    expect(paragraph).toBeInTheDocument();
  });

  test('renders with custom name', () => {
    render(<HelloWorld name="Alice" />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Hello, Alice!');
  });

  test('component structure is correct', () => {
    const { container } = render(<HelloWorld name="Bob" />);
    
    expect(container.firstChild).toMatchSnapshot();
  });
});
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Welcome } from './Welcome';

describe('Welcome Component', () => {
  test('displays welcome message with name', () => {
    render(<Welcome name="Alice" />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Welcome, Alice!');
  });
});
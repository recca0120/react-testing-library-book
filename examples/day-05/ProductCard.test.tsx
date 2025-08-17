import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';

const mockProduct = {
  id: 1,
  name: 'Test Product',
  price: 29.99,
  description: 'A great test product',
  image: '/test-product.jpg',
  inStock: true
};

describe('ProductCard - Component State and Props', () => {
  const mockOnAddToCart = vi.fn();
  const mockOnToggleFavorite = vi.fn();

  beforeEach(() => {
    mockOnAddToCart.mockClear();
    mockOnToggleFavorite.mockClear();
  });

  test('renders product information correctly', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByAltText('Test Product')).toHaveAttribute('src', '/test-product.jpg');
  });

  test('toggles product details visibility', async () => {
    const user = userEvent.setup();
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const detailsButton = screen.getByText('Show Details');
    
    // Initially details should be hidden
    expect(screen.queryByText(mockProduct.description)).not.toBeInTheDocument();
    expect(detailsButton).toHaveAttribute('aria-expanded', 'false');

    // Click to show details
    await user.click(detailsButton);
    expect(screen.getByText(mockProduct.description)).toBeInTheDocument();
    expect(screen.getByText('Hide Details')).toHaveAttribute('aria-expanded', 'true');

    // Click to hide details
    await user.click(screen.getByText('Hide Details'));
    expect(screen.queryByText(mockProduct.description)).not.toBeInTheDocument();
  });

  test('handles quantity changes', async () => {
    const user = userEvent.setup();
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const quantityInput = screen.getByLabelText('Quantity:');
    const increaseBtn = screen.getByLabelText('Increase quantity');
    const decreaseBtn = screen.getByLabelText('Decrease quantity');

    // Initial quantity should be 1
    expect(quantityInput).toHaveValue(1);
    expect(decreaseBtn).toBeDisabled();

    // Increase quantity
    await user.click(increaseBtn);
    expect(quantityInput).toHaveValue(2);
    expect(decreaseBtn).toBeEnabled();

    // Decrease quantity
    await user.click(decreaseBtn);
    expect(quantityInput).toHaveValue(1);
    expect(decreaseBtn).toBeDisabled();
  });

  test('handles manual quantity input', async () => {
    const user = userEvent.setup();
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const quantityInput = screen.getByLabelText('Quantity:');

    await user.clear(quantityInput);
    await user.type(quantityInput, '5');
    
    expect(quantityInput).toHaveValue(5);
  });

  test('calls onAddToCart with correct parameters', async () => {
    const user = userEvent.setup();
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const quantityInput = screen.getByLabelText('Quantity:');
    const addToCartBtn = screen.getByText('Add to Cart');

    // Set quantity to 3
    await user.clear(quantityInput);
    await user.type(quantityInput, '3');

    // Click add to cart
    await user.click(addToCartBtn);

    expect(mockOnAddToCart).toHaveBeenCalledWith(1, 3);
  });

  test('handles favorite toggle', async () => {
    const user = userEvent.setup();
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
        isFavorite={false}
      />
    );

    const favoriteBtn = screen.getByLabelText('Add to favorites');
    await user.click(favoriteBtn);

    expect(mockOnToggleFavorite).toHaveBeenCalledWith(1);
  });

  test('shows correct favorite state', () => {
    const { rerender } = render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
        isFavorite={false}
      />
    );

    expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
    expect(screen.getByText('🤍')).toBeInTheDocument();

    rerender(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
        isFavorite={true}
      />
    );

    expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
  });

  test('handles out of stock product', () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    
    render(
      <ProductCard
        product={outOfStockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const addToCartBtn = screen.getByText('Out of Stock');
    expect(addToCartBtn).toBeDisabled();
    
    const stockStatus = screen.getByRole('status');
    expect(stockStatus).toHaveTextContent('This item is currently out of stock');
  });

  test('maintains quantity state independently', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    // Change quantity
    const quantityInput = screen.getByLabelText('Quantity:');
    await user.clear(quantityInput);
    await user.type(quantityInput, '5');
    expect(quantityInput).toHaveValue(5);

    // Re-render with different props (simulating parent update)
    rerender(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
        isFavorite={true}
      />
    );

    // Quantity should be preserved
    expect(screen.getByLabelText('Quantity:')).toHaveValue(5);
  });
});
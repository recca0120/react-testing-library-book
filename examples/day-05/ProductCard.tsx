import React, { useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  inStock: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number, quantity: number) => void;
  onToggleFavorite: (productId: number) => void;
  isFavorite?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false
}) => {
  const [quantity, setQuantity] = useState(1);
  const [showDetails, setShowDetails] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product.id, quantity);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="product-card" data-testid={`product-${product.id}`}>
      <div className="product-image">
        <img src={product.image} alt={product.name} />
        <button
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={() => onToggleFavorite(product.id)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="price">${product.price.toFixed(2)}</p>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
          aria-controls={`details-${product.id}`}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        
        {showDetails && (
          <div id={`details-${product.id}`} className="product-details">
            <p>{product.description}</p>
          </div>
        )}
        
        <div className="purchase-section">
          <div className="quantity-selector">
            <label htmlFor={`quantity-${product.id}`}>Quantity:</label>
            <div className="quantity-controls">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input
                id={`quantity-${product.id}`}
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              />
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="add-to-cart-btn"
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
        
        {!product.inStock && (
          <p role="status" className="stock-status">
            This item is currently out of stock
          </p>
        )}
      </div>
    </div>
  );
};
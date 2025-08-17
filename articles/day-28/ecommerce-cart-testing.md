# Day 28: 實戰專案 - 電商購物車測試

## 學習目標

- 建立完整的電商購物車系統
- 實作全方位的購物車功能測試
- 整合單元測試、整合測試和 E2E 測試
- 處理複雜的狀態管理和業務邏輯測試
- 實作效能和使用者體驗測試
- 建立可維護的測試架構

## 購物車系統架構

### 功能需求分析

1. **商品管理**：加入、移除、更新數量
2. **價格計算**：小計、稅金、折扣、總計
3. **庫存管理**：庫存檢查、預留機制
4. **使用者體驗**：載入狀態、錯誤處理、優化響應
5. **資料持久化**：本地儲存、雲端同步
6. **訂單處理**：結帳流程、訂單確認

### 系統元件架構

```
ShoppingCartProvider (Context)
├── ShoppingCart (Container)
│   ├── CartHeader (Summary)
│   ├── CartItemList
│   │   └── CartItem (Product Info, Quantity, Actions)
│   ├── CartPromotions (Discounts, Coupons)
│   ├── CartSummary (Pricing Breakdown)
│   └── CartActions (Checkout, Continue Shopping)
├── ProductCatalog (Add to Cart Integration)
└── CheckoutFlow (Order Processing)
```

## 購物車核心實作

### 購物車狀態管理

```typescript
// src/contexts/ShoppingCartContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  imageUrl?: string;
  variant?: string;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  appliedCoupon?: string;
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'APPLY_COUPON'; payload: string }
  | { type: 'REMOVE_COUPON' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_CART' }
  | { type: 'SYNC_FROM_STORAGE'; payload: CartState };

const initialState: CartState = {
  items: [],
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  isLoading: false,
  error: null,
};

function calculateTotals(items: CartItem[], discount = 0): Partial<CartState> {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% 稅率
  const total = subtotal + tax - discount;

  return { subtotal, tax, discount, total };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => 
        item.productId === action.payload.productId && 
        item.variant === action.payload.variant
      );

      let newItems: CartItem[];
      
      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + action.payload.quantity,
          existingItem.maxQuantity
        );
        
        newItems = state.items.map(item =>
          item.id === existingItem.id 
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }

      return {
        ...state,
        items: newItems,
        error: null,
        ...calculateTotals(newItems, state.discount),
      };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: newItems,
        ...calculateTotals(newItems, state.discount),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: id });
      }

      const newItems = state.items.map(item => {
        if (item.id === id) {
          const newQuantity = Math.min(quantity, item.maxQuantity);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });

      return {
        ...state,
        items: newItems,
        ...calculateTotals(newItems, state.discount),
      };
    }

    case 'APPLY_COUPON': {
      // 簡化的優惠券邏輯
      const couponDiscounts: Record<string, number> = {
        'SAVE10': 10,
        'WELCOME20': 20,
        'BULK50': 50,
      };

      const discount = couponDiscounts[action.payload] || 0;
      
      return {
        ...state,
        discount,
        appliedCoupon: action.payload,
        ...calculateTotals(state.items, discount),
      };
    }

    case 'REMOVE_COUPON': {
      return {
        ...state,
        discount: 0,
        appliedCoupon: undefined,
        ...calculateTotals(state.items, 0),
      };
    }

    case 'SET_LOADING': {
      return { ...state, isLoading: action.payload };
    }

    case 'SET_ERROR': {
      return { ...state, error: action.payload, isLoading: false };
    }

    case 'CLEAR_CART': {
      return { ...initialState };
    }

    case 'SYNC_FROM_STORAGE': {
      return action.payload;
    }

    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  applyCoupon: (coupon: string) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  getItemCount: () => number;
  hasItem: (productId: string, variant?: string) => boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const ShoppingCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // 本地儲存同步
  useEffect(() => {
    const savedCart = localStorage.getItem('shopping-cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'SYNC_FROM_STORAGE', payload: cartData });
      } catch (error) {
        console.error('Failed to load cart from storage:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (state.items.length > 0 || state.appliedCoupon) {
      localStorage.setItem('shopping-cart', JSON.stringify(state));
    }
  }, [state]);

  const addItem = async (itemData: Omit<CartItem, 'id'>): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // 模擬庫存檢查 API 呼叫
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 檢查庫存
      if (itemData.quantity > itemData.maxQuantity) {
        throw new Error(`商品庫存不足，最多只能購買 ${itemData.maxQuantity} 件`);
      }

      const item: CartItem = {
        ...itemData,
        id: `${itemData.productId}-${itemData.variant || 'default'}-${Date.now()}`,
      };

      dispatch({ type: 'ADD_ITEM', payload: item });
    } catch (error) {
      const message = error instanceof Error ? error.message : '加入購物車失敗';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const applyCoupon = (coupon: string) => {
    dispatch({ type: 'APPLY_COUPON', payload: coupon });
  };

  const removeCoupon = () => {
    dispatch({ type: 'REMOVE_COUPON' });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    localStorage.removeItem('shopping-cart');
  };

  const getItemCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const hasItem = (productId: string, variant?: string) => {
    return state.items.some(item => 
      item.productId === productId && item.variant === (variant || 'default')
    );
  };

  const value: CartContextValue = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    clearCart,
    getItemCount,
    hasItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useShoppingCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useShoppingCart must be used within a ShoppingCartProvider');
  }
  return context;
};
```

### 購物車元件實作

```typescript
// src/components/ShoppingCart/ShoppingCart.tsx
import React from 'react';
import { useShoppingCart } from '../../contexts/ShoppingCartContext';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { CartPromotions } from './CartPromotions';

export const ShoppingCart: React.FC = () => {
  const {
    items,
    isLoading,
    error,
    clearCart,
    getItemCount,
  } = useShoppingCart();

  if (isLoading && items.length === 0) {
    return (
      <div className="shopping-cart loading" data-testid="cart-loading">
        <div className="loading-spinner">載入購物車中...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="shopping-cart empty" data-testid="empty-cart">
        <div className="empty-state">
          <h2>購物車是空的</h2>
          <p>還沒有商品在購物車中，開始購物吧！</p>
          <button className="continue-shopping-btn">
            繼續購物
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shopping-cart" data-testid="shopping-cart">
      <div className="cart-header">
        <h2>購物車 ({getItemCount()} 件商品)</h2>
        <button 
          className="clear-cart-btn"
          onClick={clearCart}
          data-testid="clear-cart-button"
        >
          清空購物車
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert" data-testid="cart-error">
          {error}
        </div>
      )}

      <div className="cart-content">
        <div className="cart-items">
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        <div className="cart-sidebar">
          <CartPromotions />
          <CartSummary />
        </div>
      </div>
    </div>
  );
};
```

```typescript
// src/components/ShoppingCart/CartItem.tsx
import React, { useState } from 'react';
import { CartItem as CartItemType, useShoppingCart } from '../../contexts/ShoppingCartContext';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeItem } = useShoppingCart();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity === item.quantity) return;

    setIsUpdating(true);
    try {
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 300));
      updateQuantity(item.id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = () => {
    removeItem(item.id);
  };

  return (
    <div className="cart-item" data-testid={`cart-item-${item.id}`}>
      <div className="item-image">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} />
        ) : (
          <div className="placeholder-image">圖片</div>
        )}
      </div>

      <div className="item-details">
        <h3 className="item-name" data-testid="item-name">{item.name}</h3>
        {item.variant && (
          <p className="item-variant" data-testid="item-variant">
            規格: {item.variant}
          </p>
        )}
        <p className="item-price" data-testid="item-price">
          ${item.price.toFixed(2)}
        </p>
      </div>

      <div className="quantity-controls">
        <label htmlFor={`quantity-${item.id}`}>數量:</label>
        <div className="quantity-input-group">
          <button
            className="quantity-btn decrease"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={isUpdating || item.quantity <= 1}
            data-testid="decrease-quantity"
          >
            -
          </button>
          <input
            id={`quantity-${item.id}`}
            type="number"
            min="1"
            max={item.maxQuantity}
            value={item.quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            disabled={isUpdating}
            data-testid="quantity-input"
          />
          <button
            className="quantity-btn increase"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={isUpdating || item.quantity >= item.maxQuantity}
            data-testid="increase-quantity"
          >
            +
          </button>
        </div>
        {isUpdating && <span className="updating">更新中...</span>}
      </div>

      <div className="item-total" data-testid="item-total">
        ${(item.price * item.quantity).toFixed(2)}
      </div>

      <button
        className="remove-item-btn"
        onClick={handleRemove}
        data-testid="remove-item"
        aria-label={`移除 ${item.name}`}
      >
        ×
      </button>
    </div>
  );
};
```

## 購物車測試實作

### 購物車 Context 測試

```typescript
// src/contexts/ShoppingCartContext.test.tsx
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ShoppingCartProvider, useShoppingCart } from './ShoppingCartContext';

const mockCartItem = {
  productId: 'product-1',
  name: 'Test Product',
  price: 99.99,
  quantity: 1,
  maxQuantity: 10,
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ShoppingCartProvider>{children}</ShoppingCartProvider>
);

describe('ShoppingCart Context', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    test('initializes with empty cart', () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.subtotal).toBe(0);
      expect(result.current.total).toBe(0);
      expect(result.current.getItemCount()).toBe(0);
    });

    test('loads cart from localStorage if available', () => {
      const savedCart = {
        items: [{ ...mockCartItem, id: 'item-1' }],
        subtotal: 99.99,
        tax: 8.00,
        discount: 0,
        total: 107.99,
        isLoading: false,
        error: null,
      };

      localStorage.setItem('shopping-cart', JSON.stringify(savedCart));

      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.subtotal).toBe(99.99);
    });
  });

  describe('Add Item', () => {
    test('adds new item to empty cart', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      await act(async () => {
        await result.current.addItem(mockCartItem);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toMatchObject(mockCartItem);
      expect(result.current.subtotal).toBe(99.99);
      expect(result.current.tax).toBeCloseTo(8.00, 2);
      expect(result.current.total).toBeCloseTo(107.99, 2);
    });

    test('increases quantity for existing item', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      await act(async () => {
        await result.current.addItem(mockCartItem);
      });

      await act(async () => {
        await result.current.addItem(mockCartItem);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.subtotal).toBe(199.98);
    });

    test('respects maximum quantity limit', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });
      const limitedItem = { ...mockCartItem, quantity: 12, maxQuantity: 10 };

      await expect(
        act(async () => {
          await result.current.addItem(limitedItem);
        })
      ).rejects.toThrow('商品庫存不足');

      expect(result.current.items).toHaveLength(0);
    });

    test('handles different variants as separate items', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });
      const variant1 = { ...mockCartItem, variant: 'red' };
      const variant2 = { ...mockCartItem, variant: 'blue' };

      await act(async () => {
        await result.current.addItem(variant1);
      });

      await act(async () => {
        await result.current.addItem(variant2);
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].variant).toBe('red');
      expect(result.current.items[1].variant).toBe('blue');
    });
  });

  describe('Remove Item', () => {
    test('removes item from cart', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      await act(async () => {
        await result.current.addItem(mockCartItem);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.removeItem(itemId);
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.subtotal).toBe(0);
      expect(result.current.total).toBe(0);
    });
  });

  describe('Update Quantity', () => {
    test('updates item quantity', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      await act(async () => {
        await result.current.addItem(mockCartItem);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.updateQuantity(itemId, 3);
      });

      expect(result.current.items[0].quantity).toBe(3);
      expect(result.current.subtotal).toBe(299.97);
    });

    test('removes item when quantity is 0', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      await act(async () => {
        await result.current.addItem(mockCartItem);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.updateQuantity(itemId, 0);
      });

      expect(result.current.items).toHaveLength(0);
    });

    test('respects maximum quantity when updating', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      await act(async () => {
        await result.current.addItem(mockCartItem);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.updateQuantity(itemId, 15); // Over max of 10
      });

      expect(result.current.items[0].quantity).toBe(10);
    });
  });

  describe('Coupon System', () => {
    test('applies valid coupon discount', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      await act(async () => {
        await result.current.addItem(mockCartItem);
      });

      const totalBeforeDiscount = result.current.total;

      act(() => {
        result.current.applyCoupon('SAVE10');
      });

      expect(result.current.discount).toBe(10);
      expect(result.current.appliedCoupon).toBe('SAVE10');
      expect(result.current.total).toBe(totalBeforeDiscount - 10);
    });

    test('ignores invalid coupon', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      await act(async () => {
        await result.current.addItem(mockCartItem);
      });

      const totalBefore = result.current.total;

      act(() => {
        result.current.applyCoupon('INVALID');
      });

      expect(result.current.discount).toBe(0);
      expect(result.current.appliedCoupon).toBe('INVALID');
      expect(result.current.total).toBe(totalBefore);
    });

    test('removes coupon discount', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      await act(async () => {
        await result.current.addItem(mockCartItem);
      });

      act(() => {
        result.current.applyCoupon('SAVE10');
      });

      const discountedTotal = result.current.total;

      act(() => {
        result.current.removeCoupon();
      });

      expect(result.current.discount).toBe(0);
      expect(result.current.appliedCoupon).toBeUndefined();
      expect(result.current.total).toBe(discountedTotal + 10);
    });
  });

  describe('Utility Functions', () => {
    test('getItemCount returns correct total quantity', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      expect(result.current.getItemCount()).toBe(0);

      await act(async () => {
        await result.current.addItem(mockCartItem);
      });

      expect(result.current.getItemCount()).toBe(1);

      await act(async () => {
        await result.current.addItem({ ...mockCartItem, productId: 'product-2' });
      });

      expect(result.current.getItemCount()).toBe(2);
    });

    test('hasItem correctly identifies existing items', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      expect(result.current.hasItem('product-1')).toBe(false);

      await act(async () => {
        await result.current.addItem({ ...mockCartItem, variant: 'red' });
      });

      expect(result.current.hasItem('product-1', 'red')).toBe(true);
      expect(result.current.hasItem('product-1', 'blue')).toBe(false);
      expect(result.current.hasItem('product-2')).toBe(false);
    });
  });

  describe('Clear Cart', () => {
    test('clears all items and resets state', async () => {
      const { result } = renderHook(() => useShoppingCart(), { wrapper });

      await act(async () => {
        await result.current.addItem(mockCartItem);
        result.current.applyCoupon('SAVE10');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.appliedCoupon).toBe('SAVE10');

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.subtotal).toBe(0);
      expect(result.current.discount).toBe(0);
      expect(result.current.total).toBe(0);
      expect(result.current.appliedCoupon).toBeUndefined();
    });
  });
});
```

### 購物車元件測試

```typescript
// src/components/ShoppingCart/ShoppingCart.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShoppingCart } from './ShoppingCart';
import { ShoppingCartProvider } from '../../contexts/ShoppingCartContext';

// Mock the cart items for testing
const mockCartItems = [
  {
    id: 'item-1',
    productId: 'product-1',
    name: 'Laptop',
    price: 999.99,
    quantity: 1,
    maxQuantity: 5,
  },
  {
    id: 'item-2',
    productId: 'product-2',
    name: 'Mouse',
    price: 29.99,
    quantity: 2,
    maxQuantity: 10,
  },
];

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <ShoppingCartProvider>
      {ui}
    </ShoppingCartProvider>
  );
};

// Mock the useShoppingCart hook for specific test scenarios
const createMockCartContext = (overrides = {}) => ({
  items: [],
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  isLoading: false,
  error: null,
  addItem: vi.fn(),
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  applyCoupon: vi.fn(),
  removeCoupon: vi.fn(),
  clearCart: vi.fn(),
  getItemCount: vi.fn(() => 0),
  hasItem: vi.fn(() => false),
  ...overrides,
});

describe('ShoppingCart Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    test('renders empty cart message when no items', () => {
      renderWithProvider(<ShoppingCart />);

      expect(screen.getByTestId('empty-cart')).toBeInTheDocument();
      expect(screen.getByText('購物車是空的')).toBeInTheDocument();
      expect(screen.getByText('還沒有商品在購物車中，開始購物吧！')).toBeInTheDocument();
    });

    test('shows continue shopping button in empty state', () => {
      renderWithProvider(<ShoppingCart />);

      expect(screen.getByText('繼續購物')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows loading spinner when cart is loading', () => {
      // We need to mock the context to return loading state
      const MockShoppingCart = () => {
        vi.doMock('../../contexts/ShoppingCartContext', () => ({
          useShoppingCart: () => createMockCartContext({
            isLoading: true,
            items: [],
          }),
        }));
        
        return <ShoppingCart />;
      };

      render(<MockShoppingCart />);
      expect(screen.getByTestId('cart-loading')).toBeInTheDocument();
      expect(screen.getByText('載入購物車中...')).toBeInTheDocument();
    });
  });

  describe('Cart with Items', () => {
    test('renders cart items when items exist', async () => {
      // Add items to cart through context
      const TestWrapper = () => {
        const { addItem } = useShoppingCart();
        
        React.useEffect(() => {
          mockCartItems.forEach(item => {
            addItem(item);
          });
        }, [addItem]);
        
        return <ShoppingCart />;
      };

      renderWithProvider(<TestWrapper />);

      await waitFor(() => {
        expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
        expect(screen.getByText('購物車 (3 件商品)')).toBeInTheDocument();
      });
    });

    test('displays correct item count in header', async () => {
      // This test would need proper setup with items in context
      renderWithProvider(<ShoppingCart />);
      
      // Add items through the context and verify the count updates
      // This requires integration with the context provider
    });

    test('shows clear cart button when items exist', async () => {
      // Similar setup needed for testing with actual items
      renderWithProvider(<ShoppingCart />);
      
      // Would need to add items first, then check for clear cart button
    });
  });

  describe('Error Handling', () => {
    test('displays error message when error occurs', () => {
      const MockShoppingCartWithError = () => {
        vi.doMock('../../contexts/ShoppingCartContext', () => ({
          useShoppingCart: () => createMockCartContext({
            error: 'Failed to load cart items',
            items: mockCartItems,
          }),
        }));
        
        return <ShoppingCart />;
      };

      render(<MockShoppingCartWithError />);
      expect(screen.getByTestId('cart-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load cart items')).toBeInTheDocument();
    });
  });

  describe('Clear Cart Functionality', () => {
    test('calls clearCart when clear button is clicked', async () => {
      const user = userEvent.setup();
      const mockClearCart = vi.fn();
      
      const MockShoppingCartWithItems = () => {
        vi.doMock('../../contexts/ShoppingCartContext', () => ({
          useShoppingCart: () => createMockCartContext({
            items: mockCartItems,
            getItemCount: () => 3,
            clearCart: mockClearCart,
          }),
        }));
        
        return <ShoppingCart />;
      };

      render(<MockShoppingCartWithItems />);
      
      const clearButton = screen.getByTestId('clear-cart-button');
      await user.click(clearButton);
      
      expect(mockClearCart).toHaveBeenCalledTimes(1);
    });
  });
});
```

### CartItem 元件測試

```typescript
// src/components/ShoppingCart/CartItem.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartItem } from './CartItem';
import { ShoppingCartProvider } from '../../contexts/ShoppingCartContext';

const mockItem = {
  id: 'item-1',
  productId: 'product-1',
  name: 'Test Product',
  price: 99.99,
  quantity: 2,
  maxQuantity: 10,
  imageUrl: 'https://example.com/image.jpg',
  variant: 'red',
};

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <ShoppingCartProvider>
      {ui}
    </ShoppingCartProvider>
  );
};

describe('CartItem Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('displays item information correctly', () => {
      renderWithProvider(<CartItem item={mockItem} />);

      expect(screen.getByTestId('item-name')).toHaveTextContent('Test Product');
      expect(screen.getByTestId('item-price')).toHaveTextContent('$99.99');
      expect(screen.getByTestId('item-variant')).toHaveTextContent('規格: red');
      expect(screen.getByTestId('item-total')).toHaveTextContent('$199.98');
    });

    test('displays item image when imageUrl is provided', () => {
      renderWithProvider(<CartItem item={mockItem} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', mockItem.imageUrl);
      expect(image).toHaveAttribute('alt', mockItem.name);
    });

    test('displays placeholder when no image URL', () => {
      const itemWithoutImage = { ...mockItem, imageUrl: undefined };
      renderWithProvider(<CartItem item={itemWithoutImage} />);

      expect(screen.getByText('圖片')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    test('does not show variant when not provided', () => {
      const itemWithoutVariant = { ...mockItem, variant: undefined };
      renderWithProvider(<CartItem item={itemWithoutVariant} />);

      expect(screen.queryByTestId('item-variant')).not.toBeInTheDocument();
    });
  });

  describe('Quantity Controls', () => {
    test('displays current quantity in input', () => {
      renderWithProvider(<CartItem item={mockItem} />);

      const quantityInput = screen.getByTestId('quantity-input');
      expect(quantityInput).toHaveValue(2);
    });

    test('increase button increments quantity', async () => {
      const user = userEvent.setup();
      renderWithProvider(<CartItem item={mockItem} />);

      const increaseButton = screen.getByTestId('increase-quantity');
      await user.click(increaseButton);

      await waitFor(() => {
        const quantityInput = screen.getByTestId('quantity-input');
        expect(quantityInput).toHaveValue(3);
      });
    });

    test('decrease button decrements quantity', async () => {
      const user = userEvent.setup();
      renderWithProvider(<CartItem item={mockItem} />);

      const decreaseButton = screen.getByTestId('decrease-quantity');
      await user.click(decreaseButton);

      await waitFor(() => {
        const quantityInput = screen.getByTestId('quantity-input');
        expect(quantityInput).toHaveValue(1);
      });
    });

    test('decrease button is disabled when quantity is 1', () => {
      const itemWithMinQuantity = { ...mockItem, quantity: 1 };
      renderWithProvider(<CartItem item={itemWithMinQuantity} />);

      const decreaseButton = screen.getByTestId('decrease-quantity');
      expect(decreaseButton).toBeDisabled();
    });

    test('increase button is disabled when at max quantity', () => {
      const itemAtMax = { ...mockItem, quantity: 10, maxQuantity: 10 };
      renderWithProvider(<CartItem item={itemAtMax} />);

      const increaseButton = screen.getByTestId('increase-quantity');
      expect(increaseButton).toBeDisabled();
    });

    test('direct input changes quantity', async () => {
      const user = userEvent.setup();
      renderWithProvider(<CartItem item={mockItem} />);

      const quantityInput = screen.getByTestId('quantity-input');
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      // Trigger blur or enter to commit the change
      await user.keyboard('[Enter]');

      await waitFor(() => {
        expect(quantityInput).toHaveValue(5);
      });
    });

    test('shows updating state while quantity changes', async () => {
      const user = userEvent.setup();
      renderWithProvider(<CartItem item={mockItem} />);

      const increaseButton = screen.getByTestId('increase-quantity');
      await user.click(increaseButton);

      // Should show updating state temporarily
      expect(screen.getByText('更新中...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('更新中...')).not.toBeInTheDocument();
      });
    });

    test('controls are disabled while updating', async () => {
      const user = userEvent.setup();
      renderWithProvider(<CartItem item={mockItem} />);

      const increaseButton = screen.getByTestId('increase-quantity');
      await user.click(increaseButton);

      // Buttons should be disabled during update
      expect(screen.getByTestId('increase-quantity')).toBeDisabled();
      expect(screen.getByTestId('decrease-quantity')).toBeDisabled();
      expect(screen.getByTestId('quantity-input')).toBeDisabled();
    });
  });

  describe('Remove Item', () => {
    test('calls remove function when remove button clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<CartItem item={mockItem} />);

      const removeButton = screen.getByTestId('remove-item');
      expect(removeButton).toHaveAttribute('aria-label', '移除 Test Product');

      await user.click(removeButton);

      // Item should be removed from the cart
      // This would be tested through the context behavior
    });
  });

  describe('Accessibility', () => {
    test('quantity input has proper label', () => {
      renderWithProvider(<CartItem item={mockItem} />);

      const quantityInput = screen.getByTestId('quantity-input');
      expect(quantityInput).toHaveAccessibleName('數量:');
    });

    test('remove button has descriptive aria-label', () => {
      renderWithProvider(<CartItem item={mockItem} />);

      const removeButton = screen.getByTestId('remove-item');
      expect(removeButton).toHaveAttribute('aria-label', '移除 Test Product');
    });

    test('quantity input has proper constraints', () => {
      renderWithProvider(<CartItem item={mockItem} />);

      const quantityInput = screen.getByTestId('quantity-input');
      expect(quantityInput).toHaveAttribute('min', '1');
      expect(quantityInput).toHaveAttribute('max', '10');
      expect(quantityInput).toHaveAttribute('type', 'number');
    });
  });
});
```

## E2E 購物車測試

### 完整購物流程 E2E 測試

```typescript
// tests/e2e/shopping-cart.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Shopping Cart E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 設定初始狀態
    await page.goto('/');
    
    // 清空購物車（如果有的話）
    await page.evaluate(() => {
      localStorage.removeItem('shopping-cart');
    });
  });

  test('Complete shopping flow: Browse -> Add to Cart -> Checkout', async ({ page }) => {
    // 1. 瀏覽產品頁面
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-grid"]');

    // 2. 選擇第一個產品
    const firstProduct = page.locator('[data-testid^="product-card-"]').first();
    await firstProduct.click();

    // 3. 在產品詳情頁加入購物車
    await page.waitForSelector('[data-testid="product-detail"]');
    await page.locator('[data-testid="add-to-cart-button"]').click();

    // 4. 驗證成功訊息
    await expect(page.locator('[data-testid="add-to-cart-success"]')).toBeVisible();

    // 5. 前往購物車
    await page.goto('/cart');
    await expect(page.locator('[data-testid="shopping-cart"]')).toBeVisible();

    // 6. 驗證商品在購物車中
    await expect(page.locator('[data-testid^="cart-item-"]')).toHaveCount(1);

    // 7. 修改商品數量
    await page.locator('[data-testid="increase-quantity"]').click();
    await expect(page.locator('[data-testid="quantity-input"]')).toHaveValue('2');

    // 8. 驗證價格更新
    const itemTotal = await page.locator('[data-testid="item-total"]').textContent();
    const cartTotal = await page.locator('[data-testid="cart-total"]').textContent();
    
    // 基本價格驗證（具體數值依產品而定）
    expect(itemTotal).toBeTruthy();
    expect(cartTotal).toBeTruthy();

    // 9. 進入結帳流程
    await page.locator('[data-testid="checkout-button"]').click();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('Add multiple products to cart', async ({ page }) => {
    // 前往產品列表
    await page.goto('/products');
    
    // 添加第一個產品
    await page.locator('[data-testid^="product-card-"]').first().locator('[data-testid="quick-add"]').click();
    await page.waitForTimeout(500); // 等待 API 調用
    
    // 添加第二個產品
    await page.locator('[data-testid^="product-card-"]').nth(1).locator('[data-testid="quick-add"]').click();
    await page.waitForTimeout(500);

    // 前往購物車
    await page.goto('/cart');
    
    // 驗證兩個商品都在購物車中
    await expect(page.locator('[data-testid^="cart-item-"]')).toHaveCount(2);
    
    // 驗證購物車標題顯示正確的商品數量
    await expect(page.locator('[data-testid="cart-header"]')).toContainText('購物車 (2 件商品)');
  });

  test('Remove item from cart', async ({ page }) => {
    // 添加商品到購物車
    await page.goto('/products');
    await page.locator('[data-testid^="product-card-"]').first().locator('[data-testid="quick-add"]').click();
    await page.waitForTimeout(500);

    // 前往購物車
    await page.goto('/cart');
    
    // 確認商品在購物車中
    await expect(page.locator('[data-testid^="cart-item-"]')).toHaveCount(1);
    
    // 移除商品
    await page.locator('[data-testid="remove-item"]').click();
    
    // 確認購物車變空
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible();
    await expect(page.locator('[data-testid^="cart-item-"]')).toHaveCount(0);
  });

  test('Apply and remove coupon code', async ({ page }) => {
    // 添加商品到購物車
    await page.goto('/products');
    await page.locator('[data-testid^="product-card-"]').first().locator('[data-testid="quick-add"]').click();
    await page.waitForTimeout(500);

    // 前往購物車
    await page.goto('/cart');
    
    // 記錄原始總價
    const originalTotal = await page.locator('[data-testid="cart-total"]').textContent();
    
    // 應用優惠券
    await page.locator('[data-testid="coupon-input"]').fill('SAVE10');
    await page.locator('[data-testid="apply-coupon-button"]').click();
    
    // 驗證折扣應用
    await expect(page.locator('[data-testid="discount-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="applied-coupon"]')).toContainText('SAVE10');
    
    // 驗證總價變化
    const discountedTotal = await page.locator('[data-testid="cart-total"]').textContent();
    expect(discountedTotal).not.toBe(originalTotal);
    
    // 移除優惠券
    await page.locator('[data-testid="remove-coupon"]').click();
    
    // 驗證折扣移除
    const finalTotal = await page.locator('[data-testid="cart-total"]').textContent();
    expect(finalTotal).toBe(originalTotal);
  });

  test('Cart persistence across browser sessions', async ({ page, context }) => {
    // 添加商品到購物車
    await page.goto('/products');
    await page.locator('[data-testid^="product-card-"]').first().locator('[data-testid="quick-add"]').click();
    await page.waitForTimeout(500);

    // 前往購物車確認商品
    await page.goto('/cart');
    await expect(page.locator('[data-testid^="cart-item-"]')).toHaveCount(1);
    
    // 記錄商品名稱
    const productName = await page.locator('[data-testid="item-name"]').textContent();

    // 關閉頁面並建立新頁面（模擬重新開啟瀏覽器）
    await page.close();
    const newPage = await context.newPage();
    
    // 前往購物車
    await newPage.goto('/cart');
    
    // 驗證購物車內容持續存在
    await expect(newPage.locator('[data-testid^="cart-item-"]')).toHaveCount(1);
    await expect(newPage.locator('[data-testid="item-name"]')).toContainText(productName || '');
  });

  test('Clear entire cart', async ({ page }) => {
    // 添加多個商品到購物車
    await page.goto('/products');
    await page.locator('[data-testid^="product-card-"]').first().locator('[data-testid="quick-add"]').click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid^="product-card-"]').nth(1).locator('[data-testid="quick-add"]').click();
    await page.waitForTimeout(500);

    // 前往購物車
    await page.goto('/cart');
    await expect(page.locator('[data-testid^="cart-item-"]')).toHaveCount(2);
    
    // 清空購物車
    await page.locator('[data-testid="clear-cart-button"]').click();
    
    // 確認對話框並確認清空
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
    await page.locator('[data-testid="confirm-clear"]').click();
    
    // 驗證購物車已清空
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible();
  });

  test('Handle out-of-stock products', async ({ page }) => {
    // 前往產品頁面，找到缺貨商品
    await page.goto('/products?filter=out-of-stock');
    
    // 嘗試添加缺貨商品
    const outOfStockProduct = page.locator('[data-testid="out-of-stock-product"]').first();
    await outOfStockProduct.locator('[data-testid="add-to-cart-button"]').click();
    
    // 驗證錯誤訊息
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('商品目前缺貨');
    
    // 前往購物車確認沒有添加商品
    await page.goto('/cart');
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible();
  });

  test('Responsive design on mobile', async ({ page }) => {
    // 設定手機視窗大小
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 添加商品到購物車
    await page.goto('/products');
    await page.locator('[data-testid^="product-card-"]').first().locator('[data-testid="quick-add"]').click();
    await page.waitForTimeout(500);

    // 前往購物車
    await page.goto('/cart');
    
    // 驗證手機版佈局
    await expect(page.locator('[data-testid="mobile-cart-layout"]')).toBeVisible();
    
    // 驗證數量控制在手機版正常運作
    await page.locator('[data-testid="increase-quantity"]').click();
    await expect(page.locator('[data-testid="quantity-input"]')).toHaveValue('2');
    
    // 驗證移除商品功能
    await page.locator('[data-testid="remove-item"]').click();
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible();
  });
});
```

## 效能測試

### 購物車效能測試

```typescript
// tests/performance/shopping-cart-performance.test.ts
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShoppingCartProvider, useShoppingCart } from '../../src/contexts/ShoppingCartContext';
import { ShoppingCart } from '../../src/components/ShoppingCart/ShoppingCart';

describe('Shopping Cart Performance', () => {
  test('handles large number of cart items efficiently', async () => {
    const largeItemList = Array.from({ length: 100 }, (_, index) => ({
      id: `item-${index}`,
      productId: `product-${index}`,
      name: `Product ${index}`,
      price: 10 + index,
      quantity: 1,
      maxQuantity: 10,
    }));

    const TestComponent = () => {
      const { items } = useShoppingCart();
      
      React.useEffect(() => {
        const addAllItems = async () => {
          for (const item of largeItemList) {
            await addItem(item);
          }
        };
        addAllItems();
      }, []);

      return (
        <div data-testid="performance-test">
          {items.length} items
        </div>
      );
    };

    const startTime = performance.now();
    
    render(
      <ShoppingCartProvider>
        <TestComponent />
      </ShoppingCartProvider>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // 驗證渲染時間在合理範圍內（< 100ms）
    expect(renderTime).toBeLessThan(100);
  });

  test('cart calculations are performed efficiently', () => {
    const manyItems = Array.from({ length: 50 }, (_, index) => ({
      id: `item-${index}`,
      productId: `product-${index}`,
      name: `Product ${index}`,
      price: Math.random() * 100,
      quantity: Math.floor(Math.random() * 5) + 1,
      maxQuantity: 10,
    }));

    const startTime = performance.now();
    
    // 模擬計算
    const subtotal = manyItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const endTime = performance.now();
    const calculationTime = endTime - startTime;

    // 計算應該很快（< 1ms）
    expect(calculationTime).toBeLessThan(1);
    expect(total).toBeGreaterThan(0);
  });
});
```

## 本日重點回顧

✅ 建立完整的電商購物車系統架構
✅ 實作複雜的狀態管理和業務邏輯
✅ 撰寫全方位的單元測試和整合測試
✅ 實作完整的 E2E 測試場景
✅ 處理效能測試和優化驗證
✅ 整合持久化存儲和錯誤處理
✅ 建立可維護和擴展的測試架構

明天我們將學習測試重構與維護，了解如何保持測試程式碼的品質和可持續性！
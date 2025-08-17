import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { createAppStore, RootState } from '../day-15/store';

// Test wrapper with Redux Provider
interface RenderWithStoreOptions extends RenderOptions {
  initialState?: Partial<RootState>;
  store?: ReturnType<typeof createAppStore>;
}

export const renderWithStore = (
  ui: ReactElement,
  {
    initialState,
    store = createAppStore(initialState),
    ...renderOptions
  }: RenderWithStoreOptions = {}
): RenderResult & { store: ReturnType<typeof createAppStore> } => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
};

// Test wrapper with Router
export const renderWithRouter = (
  ui: ReactElement,
  { route = '/', ...renderOptions }: RenderOptions & { route?: string } = {}
) => {
  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Test wrapper with both Redux and Router
export const renderWithProviders = (
  ui: ReactElement,
  {
    initialState,
    store = createAppStore(initialState),
    route = '/',
    ...renderOptions
  }: RenderWithStoreOptions & { route?: string } = {}
) => {
  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <Provider store={store}>{children}</Provider>
    </BrowserRouter>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
};

// Custom matchers for testing
export const customMatchers = {
  toBeInTheDOM: (received: any) => {
    const pass = received && received.parentNode;
    return {
      message: () =>
        pass
          ? `Expected element not to be in the DOM`
          : `Expected element to be in the DOM`,
      pass,
    };
  },
};

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'user' as const,
  isVerified: true,
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  id: 1,
  name: 'Test Product',
  price: 29.99,
  description: 'A great test product',
  image: '/test-product.jpg',
  inStock: true,
  ...overrides,
});

export const createMockTodo = (overrides = {}) => ({
  id: Date.now(),
  text: 'Test Todo',
  completed: false,
  createdAt: new Date(),
  ...overrides,
});

// Test data factory
export class TestDataFactory {
  static user = (overrides = {}) => createMockUser(overrides);
  static product = (overrides = {}) => createMockProduct(overrides);
  static todo = (overrides = {}) => createMockTodo(overrides);

  static users = (count: number, overrides = {}) =>
    Array.from({ length: count }, (_, index) =>
      createMockUser({ id: index + 1, name: `User ${index + 1}`, ...overrides })
    );

  static products = (count: number, overrides = {}) =>
    Array.from({ length: count }, (_, index) =>
      createMockProduct({ id: index + 1, name: `Product ${index + 1}`, ...overrides })
    );

  static todos = (count: number, overrides = {}) =>
    Array.from({ length: count }, (_, index) =>
      createMockTodo({ id: index + 1, text: `Todo ${index + 1}`, ...overrides })
    );
}

// Async testing utilities
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Custom render hook for testing hooks with providers
export const renderHookWithProviders = <T,>(
  hook: () => T,
  options: {
    initialState?: Partial<RootState>;
    route?: string;
  } = {}
) => {
  const { initialState, route = '/' } = options;
  const store = createAppStore(initialState);
  
  window.history.pushState({}, 'Test page', route);

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <Provider store={store}>{children}</Provider>
    </BrowserRouter>
  );

  return { store };
};

// Error boundary for testing error states
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return <div role="alert">Something went wrong: {this.state.error?.message}</div>;
    }

    return this.props.children;
  }
}

// Mock implementations for common APIs
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
  };
};

export const mockFetch = (response: any, ok = true) => {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  });
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
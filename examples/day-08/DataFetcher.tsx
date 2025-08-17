import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
}

interface DataFetcherProps {
  userId?: number;
  onUserLoaded?: (user: User) => void;
  onError?: (error: string) => void;
}

export const DataFetcher: React.FC<DataFetcherProps> = ({
  userId = 1,
  onUserLoaded,
  onError
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchUser = async (id: number, attempt = 1) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate random failure for demonstration
      if (Math.random() < 0.2 && attempt === 1) {
        throw new Error('Network error');
      }

      // Mock API response
      const mockUser: User = {
        id,
        name: `User ${id}`,
        email: `user${id}@example.com`,
        username: `user${id}`
      };

      setUser(mockUser);
      onUserLoaded?.(mockUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchUser(userId, retryCount + 2);
  };

  const handleRefresh = () => {
    setRetryCount(0);
    fetchUser(userId);
  };

  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  if (loading) {
    return (
      <div data-testid="loading-spinner" role="status" aria-live="polite">
        <p>Loading user data...</p>
        <div className="spinner" aria-hidden="true">⏳</div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="error-state" role="alert">
        <h3>Error Loading User</h3>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={handleRetry} data-testid="retry-button">
            Retry ({retryCount} attempts)
          </button>
          <button onClick={handleRefresh} data-testid="refresh-button">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div data-testid="no-user" role="status">
        <p>No user found</p>
      </div>
    );
  }

  return (
    <div data-testid="user-data" className="user-data">
      <h2>User Information</h2>
      <div className="user-details">
        <p><strong>ID:</strong> <span data-testid="user-id">{user.id}</span></p>
        <p><strong>Name:</strong> <span data-testid="user-name">{user.name}</span></p>
        <p><strong>Email:</strong> <span data-testid="user-email">{user.email}</span></p>
        <p><strong>Username:</strong> <span data-testid="user-username">{user.username}</span></p>
      </div>
      <button onClick={handleRefresh} data-testid="refresh-data">
        Refresh Data
      </button>
    </div>
  );
};
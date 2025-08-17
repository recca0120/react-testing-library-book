import React, { useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

export const AsyncDataLoader: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模擬資料
      const mockUsers: User[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ];
      
      setUsers(mockUsers);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchUsers}>Load Users</button>
      
      {loading && <p role="status">Loading...</p>}
      
      {error && <p role="alert">{error}</p>}
      
      {users.length > 0 && (
        <ul aria-label="users list">
          {users.map(user => (
            <li key={user.id}>
              <strong>{user.name}</strong> - {user.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
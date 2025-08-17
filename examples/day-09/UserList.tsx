import React, { useState, useEffect } from 'react';
import { UserService, User } from './UserService';

interface UserListProps {
  userService?: UserService;
  onUserSelect?: (user: User) => void;
  onUserDelete?: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({
  userService = UserService.getInstance(),
  onUserSelect,
  onUserDelete
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userList = await userService.getAllUsers();
      setUsers(userList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    setDeleteLoading(user.id);
    
    try {
      const success = await userService.deleteUser(user.id);
      if (success) {
        setUsers(prev => prev.filter(u => u.id !== user.id));
        onUserDelete?.(user);
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <div data-testid="loading" role="status" aria-live="polite">
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="error" role="alert">
        <p>Error: {error}</p>
        <button onClick={loadUsers} data-testid="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div data-testid="empty-state">
        <p>No users found</p>
        <button onClick={loadUsers} data-testid="refresh-button">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div data-testid="user-list">
      <div className="user-list-header">
        <h2>Users ({users.length})</h2>
        <button onClick={loadUsers} data-testid="refresh-users">
          Refresh
        </button>
      </div>
      
      <ul className="users" role="list">
        {users.map(user => (
          <li key={user.id} className="user-item" data-testid={`user-${user.id}`}>
            <div className="user-info">
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </div>
            
            <div className="user-actions">
              <button
                onClick={() => onUserSelect?.(user)}
                data-testid={`select-user-${user.id}`}
              >
                Select
              </button>
              
              <button
                onClick={() => handleDeleteUser(user)}
                disabled={deleteLoading === user.id}
                data-testid={`delete-user-${user.id}`}
                className="delete-button"
              >
                {deleteLoading === user.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
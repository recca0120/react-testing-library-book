import React from 'react';

interface UserProfileProps {
  user: {
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
    isVerified: boolean;
  };
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p className="email">{user.email}</p>
      <span role="status" aria-label="user role">
        {user.role}
      </span>
      {user.isVerified && (
        <span className="badge" data-testid="verified-badge">
          ✓ Verified
        </span>
      )}
    </div>
  );
};
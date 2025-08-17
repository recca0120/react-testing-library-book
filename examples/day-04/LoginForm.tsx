import React, { useState } from 'react';

interface LoginFormProps {
  onSubmit: (credentials: { username: string; password: string }) => void;
  loading?: boolean;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, loading = false, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ username, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="username">Username:</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <div className="password-input">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={loading || !username || !password}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
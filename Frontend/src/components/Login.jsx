import React, { useState } from 'react';
import Auth from '../utils/auth';

const Login = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await Auth.login(email, password);
      setLoading(false);
      if (onSuccess) onSuccess(data);
      // fallback: reload to let app pick up new auth
      window.location.href = '/';
    } catch (err) {
      console.error('Login failed', err);
      setError(err?.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h3>Login</h3>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
    </div>
  );
};

export default Login;

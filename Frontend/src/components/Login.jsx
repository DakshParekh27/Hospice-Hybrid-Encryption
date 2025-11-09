import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
      window.location.href = '/';
    } catch (err) {
      console.error('Login failed', err);
      setError(err?.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔐</div>
        <h3>Welcome Back</h3>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>Sign in to access your account</p>
      </div>

      {error && (
        <div className="error">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="your.email@example.com"
            required 
          />
        </div>
        
        <div>
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required 
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              Signing In
              <span className="loading-spinner"></span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div style={{ 
        marginTop: '1.5rem', 
        textAlign: 'center',
        paddingTop: '1.5rem',
        borderTop: '1px solid #e0e0e0'
      }}>
        <p style={{ color: '#666', fontSize: '0.95rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ 
            color: '#667eea', 
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
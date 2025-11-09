import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Auth from '../utils/auth';

const Register = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { name, email, password, role };
      if (role === 'doctor') payload.specialization = specialization;
      const data = await Auth.register(payload);
      setLoading(false);
      if (onSuccess) onSuccess(data);
      window.location.href = '/';
    } catch (err) {
      console.error('Register failed', err);
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
          {role === 'doctor' ? '👨‍⚕️' : '🧑‍💼'}
        </div>
        <h3>Create Account</h3>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>
          Join MediCrypt to secure your medical records
        </p>
      </div>

      {error && (
        <div className="error">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Full Name</label>
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required 
          />
        </div>

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
            placeholder="Create a strong password"
            required 
          />
          <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
            Minimum 8 characters recommended
          </small>
        </div>

        <div>
          <label>I am a</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
        </div>

        {role === 'doctor' && (
          <div style={{ 
            animation: 'fadeIn 0.3s ease',
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '10px',
            border: '2px dashed #667eea'
          }}>
            <label>Medical Specialization</label>
            <input 
              value={specialization} 
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g., Cardiology, Neurology"
            />
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              Your area of medical expertise
            </small>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              Creating Account
              <span className="loading-spinner"></span>
            </>
          ) : (
            'Create Account'
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
          Already have an account?{' '}
          <Link to="/login" style={{ 
            color: '#667eea', 
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
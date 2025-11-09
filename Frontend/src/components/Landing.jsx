import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="landing-container">
      <h1>🏥 Welcome to MediCrypt</h1>
      <p>Secure, encrypted medical records management for patients and doctors</p>
      
      <div className="card" style={{ 
        maxWidth: '600px', 
        margin: '2rem auto',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ textAlign: 'left' }}>
          <h3 style={{ color: '#667eea', marginBottom: '1rem', fontSize: '1.5rem' }}>
            ✨ Features
          </h3>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🔐</span>
              <span>End-to-end encryption for all medical records</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👨‍⚕️</span>
              <span>Secure sharing between patients and doctors</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📄</span>
              <span>Support for multiple report types</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🔒</span>
              <span>Password-protected private keys</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="landing-buttons">
        <Link to="/login">
          <button>Login to Your Account</button>
        </Link>
        <Link to="/register">
          <button className="secondary" style={{
            background: 'white',
            color: '#667eea',
            border: '2px solid white'
          }}>
            Create New Account
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Landing;
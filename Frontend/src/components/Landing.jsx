import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome to MediCrypt</h1>
      <p>Please login or register to continue.</p>

      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/login"><button>Login</button></Link>
        <Link to="/register"><button>Register</button></Link>
      </div>
    </div>
  );
};

export default Landing;

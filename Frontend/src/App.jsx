import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Auth from './utils/auth';
import Login from './components/Login';
import Register from './components/Register';
import DoctorProfile from './components/DoctorProfile';
import PatientProfile from './components/PatientProfile';
import Landing from './components/Landing';

const App = () => {
  const isAuth = Auth.isAuthenticated();
  const role = Auth.getRole();

  return (
    <Router>
      <nav className="main-nav">
        <Link to="/">Home</Link>
        {!isAuth && <Link to="/login">Login</Link>}
        {!isAuth && <Link to="/register">Register</Link>}
        {isAuth && localStorage.getItem('doctorId') && <Link to="/doctor">Doctor</Link>}
        {isAuth && localStorage.getItem('patientId') && <Link to="/patient">Patient</Link>}
      </nav>

      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doctor" element={isAuth ? <DoctorProfile /> : <Navigate to="/login" />} />
          <Route path="/patient" element={isAuth ? <PatientProfile /> : <Navigate to="/login" />} />
          <Route
            path="/"
            element={
              isAuth ? (
                <Navigate to={localStorage.getItem('doctorId') ? '/doctor' : '/patient'} />
              ) : (
                <Landing />
              )
            }
          />
        </Routes>
      </main>
    </Router>
  );
};

export default App;

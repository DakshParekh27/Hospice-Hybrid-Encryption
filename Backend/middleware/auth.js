const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Doctor = require('../models/doctor');
const Patient = require('../models/patient');
const dotenv = require('dotenv');

dotenv.config();

exports.protect = async (req, res, next) => {
  let token;

  // Extract Bearer token if provided
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 🔒 Early validation to prevent "jwt malformed" errors
  if (
    !token ||
    token === 'null' ||
    token === 'undefined' ||
    token.trim() === ''
  ) {
    return res.redirect('/');
  }

  try {
    // Verify token validity
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the user exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // Attach user info to request
    req.user = {
      id: user._id,
      role: user.role,
    };

    // Attach doctor or patient IDs if applicable
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: user._id });
      if (doctor) req.user.doctorId = doctor._id;
    }

    if (user.role === 'patient') {
      const patient = await Patient.findOne({ user: user._id });
      if (patient) req.user.patientId = patient._id;
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    // More specific error response
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token format.' });
    }
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// Role-based authorization middleware
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
};

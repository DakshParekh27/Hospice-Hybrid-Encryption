const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/user');
const Doctor = require('../models/doctor');
const Patient = require('../models/patient');

dotenv.config();

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, specialization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashed, role: role || 'user' });

    let doctorId;
    let patientId;

    if (user.role === 'doctor') {
      const doctor = await Doctor.create({ user: user._id, name: user.name, specialization });
      doctorId = doctor._id;
    }

    if (user.role === 'patient') {
      const patient = await Patient.create({ user: user._id, name: user.name });
      patientId = patient._id;
    }

    const token = signToken({ id: user._id });

    res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role, doctorId, patientId } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Failed to register', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    let doctorId;
    let patientId;
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: user._id });
      if (doctor) doctorId = doctor._id;
    }
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ user: user._id });
      if (patient) patientId = patient._id;
    }

    const token = signToken({ id: user._id });

    res.status(200).json({ token, user: { id: user._id, email: user.email, role: user.role, doctorId, patientId } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login', error: error.message });
  }
};

exports.logout = async (req, res) => {
  // Stateless JWT - instruct client to delete token
  res.status(200).json({ message: 'Logged out' });
};

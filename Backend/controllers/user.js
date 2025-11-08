const User = require('../models/user');
const Doctor = require('../models/doctor');
const Patient = require('../models/patient');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let extra = {};
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: user._id });
      extra.doctor = doctor;
    }
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ user: user._id });
      extra.patient = patient;
    }

    res.status(200).json({ user, ...extra });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.status(200).json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

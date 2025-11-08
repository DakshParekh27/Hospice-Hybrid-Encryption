const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: { type: String },
  age: { type: Number },
  contact: { type: String },
  dateOfBirth: { type: Date },
  bloodGroup: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);

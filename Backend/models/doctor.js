const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: { type: String },
  specialization: { type: String },
  contact: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);

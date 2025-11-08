const Patient = require('../models/patient');
const Report = require('../models/reports');

exports.getPatientsForDoctor = async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    if (!doctorId) return res.status(400).json({ message: 'Doctor id not found on user' });

    // For now, return patients who have reports with this doctor
    const reports = await Report.find({ doctorId }).select('patientId').lean();
    const patientIds = [...new Set(reports.map(r => String(r.patientId)))].filter(Boolean);

    const patients = await Patient.find({ _id: { $in: patientIds } }).select('-__v');

    res.status(200).json({ patients });
  } catch (error) {
    console.error('getPatientsForDoctor error', error);
    res.status(500).json({ message: 'Failed to get patients', error: error.message });
  }
};

const Report = require('../models/reports');
const Doctor = require('../models/doctor');
const User = require('../models/user');

exports.getDoctorReports = async (req, res) => {
  try {
    const doctorId = req.user.doctorId;

    const reports = await Report.find({ doctorId })
      .populate('patientId', 'name email')
      .sort({ uploadedAt: -1 });

    res.status(200).json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
  }
};

exports.getPatientReportsByDoctor = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user.doctorId;

    const reports = await Report.find({ 
      patientId, 
      doctorId 
    }).sort({ uploadedAt: -1 });

    res.status(200).json({ reports });
  } catch (error) {
    console.error('Error fetching patient reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    if (!doctorId) return res.status(404).json({ message: 'Doctor profile not found' });

    const doctor = await Doctor.findById(doctorId).populate({ path: 'user', select: 'name email' }).lean();
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    // Flatten response for frontend convenience
    const response = {
      _id: doctor._id,
      name: doctor.name || doctor.user?.name,
      specialization: doctor.specialization,
      contact: doctor.contact,
      email: doctor.user?.email
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ message: 'Failed to fetch doctor profile', error: error.message });
  }
};
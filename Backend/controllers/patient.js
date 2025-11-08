const Report = require('../models/reports');
const cloudinary = require('../utils/cloudinary');
const Patient = require('../models/patient');
const Doctor = require('../models/doctor');

exports.uploadReport = async (req, res) => {
  try {
    const { patientId, doctorId, reportType, encryptedKey, iv } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload encrypted file to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'medical-reports',
      resource_type: 'raw'
    });

    // Save report metadata
    const report = await Report.create({
      patientId,
      doctorId,
      reportType,
      fileUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      encryptedKey,
      iv,
      isEncrypted: true
    });

    res.status(201).json({
      message: 'Report uploaded successfully',
      report
    });
  } catch (error) {
    console.error('Error uploading report:', error);
    res.status(500).json({ message: 'Failed to upload report', error: error.message });
  }
};

exports.getPatientReports = async (req, res) => {
  try {
    const { patientId } = req.params;

    const reports = await Report.find({ patientId })
      .populate('doctorId', 'name specialization')
      .sort({ uploadedAt: -1 });

    res.status(200).json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const patient = await Patient.findOne({ user: userId }).populate({ path: 'user', select: 'name email' }).lean();
    if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

    // Flatten and include user email/name for frontend
    const response = {
      _id: patient._id,
      name: patient.name || patient.user?.name,
      email: patient.user?.email,
      dateOfBirth: patient.dateOfBirth,
      bloodGroup: patient.bloodGroup,
      age: patient.age,
      contact: patient.contact
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ message: 'Failed to fetch patient profile', error: error.message });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    // Return list of doctors (basic info) so patient can select a doctor to share with
    const doctors = await Doctor.find().select('name specialization contact').lean();
    res.status(200).json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Failed to fetch doctors', error: error.message });
  }
};
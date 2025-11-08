const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const doctorController = require('../controllers/doctor');

router.get(
  '/reports',
  protect,
  authorizeRoles('doctor'),
  doctorController.getDoctorReports
);

router.get(
  '/patient-reports/:patientId',
  protect,
  authorizeRoles('doctor'),
  doctorController.getPatientReportsByDoctor
);

router.get(
  '/profile',
  protect,
  authorizeRoles('doctor'),
  doctorController.getProfile
);

module.exports = router;
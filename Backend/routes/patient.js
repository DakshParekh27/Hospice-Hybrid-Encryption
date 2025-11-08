const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorizeRoles } = require('../middleware/auth');
const patientController = require('../controllers/patient');

const upload = multer({ dest: 'uploads/' });

router.post(
  '/upload-report',
  protect,
  upload.single('file'),
  patientController.uploadReport
);

router.get(
  '/reports/:patientId',
  protect,
  patientController.getPatientReports
);

router.get(
  '/profile',
  protect,
  authorizeRoles('patient'),
  patientController.getProfile
);

router.get(
  '/doctors',
  protect,
  patientController.getDoctors
);

module.exports = router;
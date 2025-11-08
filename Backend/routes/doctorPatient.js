const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const doctorPatientController = require('../controllers/doctorPatient');

router.get('/patients', protect, authorizeRoles('doctor'), doctorPatientController.getPatientsForDoctor);

module.exports = router;

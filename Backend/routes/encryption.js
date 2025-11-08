const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const encryptionController = require('../controllers/encryption');

router.post('/generate-keypair', protect, authorizeRoles('doctor'), encryptionController.generateKeyPair);
router.get('/public-key/:doctorId', protect, encryptionController.getPublicKey);
router.get('/private-key', protect, authorizeRoles('doctor'), encryptionController.getEncryptedPrivateKey);

module.exports = router;
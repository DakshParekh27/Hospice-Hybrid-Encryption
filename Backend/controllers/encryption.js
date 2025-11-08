const EncryptionKey = require('../models/encryption');
const EncryptionUtils = require('../utils/encryption');

exports.generateKeyPair = async (req, res) => {
  try {
    const { publicKey, encryptedPrivateKey, iv, salt } = req.body;
    const doctorId = req.user.doctorId;

    if (!publicKey || !encryptedPrivateKey || !iv || !salt) {
      return res.status(400).json({ message: 'Missing encryption data' });
    }

    const existingKey = await EncryptionKey.findOne({ doctorId });
    
    if (existingKey) {
      existingKey.publicKey = publicKey;
      existingKey.encryptedPrivateKey = encryptedPrivateKey;
      existingKey.iv = iv;
      existingKey.salt = salt;
      await existingKey.save();
    } else {
      await EncryptionKey.create({
        doctorId,
        publicKey,
        encryptedPrivateKey,
        iv,
        salt
      });
    }

    res.status(200).json({ message: 'Keys stored successfully' });
  } catch (error) {
    console.error('Error storing keys:', error);
    res.status(500).json({ message: 'Failed to store keys', error: error.message });
  }
};

exports.getPublicKey = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const keyData = await EncryptionKey.findOne({ doctorId });
    
    if (!keyData) {
      return res.status(404).json({ message: 'Public key not found for this doctor' });
    }

    res.status(200).json({ publicKey: keyData.publicKey });
  } catch (error) {
    console.error('Error fetching public key:', error);
    res.status(500).json({ message: 'Failed to fetch public key', error: error.message });
  }
};

exports.getEncryptedPrivateKey = async (req, res) => {
  try {
    const doctorId = req.user.doctorId;

    const keyData = await EncryptionKey.findOne({ doctorId });
    
    if (!keyData) {
      return res.status(404).json({ message: 'Private key not found' });
    }

    res.status(200).json({
      encryptedPrivateKey: keyData.encryptedPrivateKey,
      iv: keyData.iv,
      salt: keyData.salt
    });
  } catch (error) {
    console.error('Error fetching private key:', error);
    res.status(500).json({ message: 'Failed to fetch private key', error: error.message });
  }
};
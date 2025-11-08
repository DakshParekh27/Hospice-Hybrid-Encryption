const crypto = require('crypto');

class EncryptionUtils {
  static deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }

  static encryptPrivateKey(privateKey, password) {
    const salt = crypto.randomBytes(16);
    const key = this.deriveKey(password, salt);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedPrivateKey: encrypted + ':' + authTag.toString('base64'),
      iv: iv.toString('base64'),
      salt: salt.toString('base64')
    };
  }

  static decryptPrivateKey(encryptedData, password, iv, salt) {
    const key = this.deriveKey(password, Buffer.from(salt, 'base64'));
    const [encrypted, authTag] = encryptedData.split(':');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

module.exports = EncryptionUtils;
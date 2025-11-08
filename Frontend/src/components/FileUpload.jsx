import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoManager from '../utils/encryption';

const FileUpload = ({ patientId, doctorId, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [reportType, setReportType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [doctorPublicKey, setDoctorPublicKey] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDoctorPublicKey();
  }, [doctorId]);

  const fetchDoctorPublicKey = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/encryption/public-key/${doctorId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const publicKey = await CryptoManager.importPublicKey(response.data.publicKey);
      setDoctorPublicKey(publicKey);
    } catch (error) {
      console.error('Error fetching doctor public key:', error);
      setError('Failed to fetch doctor encryption key. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleUpload = async () => {
    if (!file || !reportType) {
      setError('Please select a file and report type');
      return;
    }

    if (!doctorPublicKey) {
      setError('Doctor encryption key not available');
      return;
    }

    try {
      setEncrypting(true);

      // Generate AES key for file encryption
      const aesKey = await CryptoManager.generateAESKey();
      
      // Encrypt file with AES
      const { encryptedData, iv } = await CryptoManager.encryptFileWithAES(file, aesKey);
      
      // Export AES key
      const aesKeyBase64 = await CryptoManager.exportAESKey(aesKey);
      
      // Encrypt AES key with doctor's RSA public key
      const encryptedAESKey = await CryptoManager.encryptAESKeyWithRSA(aesKeyBase64, doctorPublicKey);
      
      setEncrypting(false);
      setUploading(true);

      // Create encrypted file blob
      const encryptedFile = await CryptoManager.createEncryptedBlob(encryptedData, file.name);
      
      // Upload to Cloudinary via backend
      const formData = new FormData();
      formData.append('file', encryptedFile);
      formData.append('patientId', patientId);
      formData.append('doctorId', doctorId);
      formData.append('reportType', reportType);
      formData.append('encryptedKey', encryptedAESKey);
      formData.append('iv', iv);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/patient/upload-report`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUploading(false);
      setFile(null);
      setReportType('');
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data.report);
      }
      
      alert('File encrypted and uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
      setEncrypting(false);
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <h3>Upload Medical Report</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label>Report Type:</label>
        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
          <option value="">Select Type</option>
          <option value="blood-test">Blood Test</option>
          <option value="xray">X-Ray</option>
          <option value="mri">MRI</option>
          <option value="ct-scan">CT Scan</option>
          <option value="prescription">Prescription</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Select File:</label>
        <input type="file" onChange={handleFileChange} disabled={encrypting || uploading} />
      </div>

      <button 
        onClick={handleUpload} 
        disabled={!file || !reportType || encrypting || uploading || !doctorPublicKey}
      >
        {encrypting ? 'Encrypting...' : uploading ? 'Uploading...' : 'Upload Report'}
      </button>

      {encrypting && <p className="status-message">🔒 Encrypting file securely...</p>}
      {uploading && <p className="status-message">📤 Uploading encrypted file...</p>}
    </div>
  );
};

export default FileUpload;
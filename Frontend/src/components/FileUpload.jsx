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
  const [uploadProgress, setUploadProgress] = useState(0);

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
      setError('Failed to fetch doctor encryption key. The doctor may not have set up encryption yet.');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');
  };

  const handleUpload = async () => {
    if (!file || !reportType) {
      setError('Please select a file and report type');
      return;
    }

    if (!doctorPublicKey) {
      setError('Doctor encryption key not available. The doctor must set up encryption first.');
      return;
    }

    try {
      setEncrypting(true);
      setUploadProgress(10);

      // Generate AES key for file encryption
      const aesKey = await CryptoManager.generateAESKey();
      setUploadProgress(20);
      
      // Encrypt file with AES
      const { encryptedData, iv } = await CryptoManager.encryptFileWithAES(file, aesKey);
      setUploadProgress(40);
      
      // Export AES key
      const aesKeyBase64 = await CryptoManager.exportAESKey(aesKey);
      
      // Encrypt AES key with doctor's RSA public key
      const encryptedAESKey = await CryptoManager.encryptAESKeyWithRSA(aesKeyBase64, doctorPublicKey);
      setUploadProgress(60);
      
      setEncrypting(false);
      setUploading(true);

      // Create encrypted file blob
      const encryptedFile = await CryptoManager.createEncryptedBlob(encryptedData, file.name);
      setUploadProgress(70);
      
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

      setUploadProgress(100);
      setUploading(false);
      setFile(null);
      setReportType('');
      setUploadProgress(0);
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data.report);
      }
      
      alert('✅ File encrypted and uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
      setEncrypting(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const reportTypes = [
    { value: 'blood-test', label: '🩸 Blood Test', icon: '🩸' },
    { value: 'xray', label: '🦴 X-Ray', icon: '🦴' },
    { value: 'mri', label: '🧠 MRI Scan', icon: '🧠' },
    { value: 'ct-scan', label: '💫 CT Scan', icon: '💫' },
    { value: 'prescription', label: '💊 Prescription', icon: '💊' },
    { value: 'other', label: '📄 Other', icon: '📄' }
  ];

  return (
    <div className="file-upload-container">
      <h3>Upload Medical Report</h3>
      
      {error && (
        <div className="error-message">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {doctorPublicKey && (
        <div style={{
          padding: '1rem',
          background: '#d4edda',
          borderLeft: '4px solid #28a745',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          color: '#155724',
          fontSize: '0.9rem'
        }}>
          ✅ Doctor's encryption key verified. Your file will be encrypted before upload.
        </div>
      )}
      
      <div className="form-group">
        <label>Report Type</label>
        <select 
          value={reportType} 
          onChange={(e) => setReportType(e.target.value)}
          disabled={encrypting || uploading}
        >
          <option value="">Select report type...</option>
          {reportTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Select File (PDF)</label>
        <input 
          type="file" 
          onChange={handleFileChange} 
          disabled={encrypting || uploading}
          accept=".pdf"
        />
        {file && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: '#f8f9fa',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            📎 Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
          </div>
        )}
      </div>

      {(encrypting || uploading) && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e0e0e0',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #667eea, #764ba2)',
              transition: 'width 0.3s ease',
              borderRadius: '10px'
            }}></div>
          </div>
          <p style={{ 
            marginTop: '0.5rem', 
            fontSize: '0.9rem', 
            color: '#666',
            textAlign: 'center'
          }}>
            {uploadProgress}% complete
          </p>
        </div>
      )}

      <button 
        onClick={handleUpload} 
        disabled={!file || !reportType || encrypting || uploading || !doctorPublicKey}
      >
        {encrypting ? (
          <>
            🔐 Encrypting File
            <span className="loading-spinner"></span>
          </>
        ) : uploading ? (
          <>
            📤 Uploading
            <span className="loading-spinner"></span>
          </>
        ) : (
          '🔒 Encrypt & Upload Report'
        )}
      </button>

      {encrypting && (
        <p className="status-message">
          🔐 Encrypting your file with military-grade AES-256 encryption...
        </p>
      )}
      {uploading && (
        <p className="status-message">
          📤 Uploading encrypted file to secure cloud storage...
        </p>
      )}

      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: '#fff3cd',
        borderLeft: '4px solid #ffc107',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#856404'
      }}>
        <strong>🔒 Security Note:</strong> Your file is encrypted on your device before upload. 
        Only the selected doctor can decrypt and view this file using their private key.
      </div>
    </div>
  );
};

export default FileUpload;
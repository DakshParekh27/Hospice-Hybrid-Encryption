import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CryptoManager from '../utils/encryption';
import Auth from '../utils/auth';

const DoctorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [hasEncryptionKeys, setHasEncryptionKeys] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [generatingKeys, setGeneratingKeys] = useState(false);
  const [reports, setReports] = useState([]);
  const [decryptingReport, setDecryptingReport] = useState(null);

  useEffect(() => {
    fetchProfile();
    checkEncryptionKeys();
    fetchReports();
  }, []);

  const navigate = useNavigate();

  const handleLogout = () => {
    Auth.logout();
    // return to landing page (login/register)
    navigate('/');
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/doctor/profile`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkEncryptionKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.get(
        `${import.meta.env.VITE_API_URL}/api/encryption/private-key`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setHasEncryptionKeys(true);
    } catch (error) {
      setHasEncryptionKeys(false);
    }
  };

  const generateEncryptionKeys = async () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      setGeneratingKeys(true);

      // Generate RSA key pair
      const keyPair = await CryptoManager.generateKeyPair();
      
      // Export keys
      const publicKeyBase64 = await CryptoManager.exportPublicKey(keyPair.publicKey);
      const privateKeyBase64 = await CryptoManager.exportPrivateKey(keyPair.privateKey);
      
      // Encrypt private key with password
      const { encryptedPrivateKey, iv, salt } = await CryptoManager.encryptPrivateKeyWithPassword(
        privateKeyBase64,
        password
      );

      // Send to backend
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/encryption/generate-keypair`,
        {
          publicKey: publicKeyBase64,
          encryptedPrivateKey,
          iv,
          salt
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Encryption keys generated successfully! Please remember your password.');
      setHasEncryptionKeys(true);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error generating keys:', error);
      alert('Failed to generate encryption keys');
    } finally {
      setGeneratingKeys(false);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/doctor/reports`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const decryptAndDownloadReport = async (report) => {
    const decryptPassword = prompt('Enter your encryption password:');
    
    if (!decryptPassword) {
      return;
    }

    try {
      setDecryptingReport(report._id);

      // Get encrypted private key
      const token = localStorage.getItem('token');
      const keyResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/encryption/private-key`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { encryptedPrivateKey, iv, salt } = keyResponse.data;

      // Decrypt private key
      const privateKeyBase64 = await CryptoManager.decryptPrivateKeyWithPassword(
        encryptedPrivateKey,
        decryptPassword,
        iv,
        salt
      );

      const privateKey = await CryptoManager.importPrivateKey(privateKeyBase64);

      // Decrypt AES key with RSA private key
      const aesKeyBase64 = await CryptoManager.decryptAESKeyWithRSA(
        report.encryptedKey,
        privateKey
      );

      const aesKey = await CryptoManager.importAESKey(aesKeyBase64);

      // Download encrypted file from Cloudinary
      const fileResponse = await axios.get(report.fileUrl, {
        responseType: 'arraybuffer'
      });

      // Decrypt file
      const decryptedData = await CryptoManager.decryptFileWithAES(
        fileResponse.data,
        aesKey,
        report.iv
      );

      // Download decrypted file
      await CryptoManager.downloadDecryptedFile(
        decryptedData,
        `${report.reportType}-${report.patientId?.name || 'patient'}.pdf`,
        'application/pdf'
      );

      alert('File decrypted and downloaded successfully!');
    } catch (error) {
      console.error('Error decrypting file:', error);
      alert('Failed to decrypt file. Please check your password.');
    } finally {
      setDecryptingReport(null);
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="doctor-profile">
      <div className="profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Doctor Profile</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
      
      <div className="profile-info">
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Specialization:</strong> {profile.specialization}</p>
        <p><strong>Email:</strong> {profile.email}</p>
      </div>

      {!hasEncryptionKeys && (
        <div className="encryption-setup">
          <h3>Setup Encryption</h3>
          <p>Generate encryption keys to securely access patient medical records.</p>
          
          <div className="form-group">
            <label>Create Encryption Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />
          </div>

          <button onClick={generateEncryptionKeys} disabled={generatingKeys}>
            {generatingKeys ? 'Generating Keys...' : 'Generate Encryption Keys'}
          </button>
        </div>
      )}

      {hasEncryptionKeys && (
        <div className="reports-section">
          <h3>Patient Reports</h3>
          
          {reports.length === 0 ? (
            <p>No reports available</p>
          ) : (
            <div className="reports-list">
              {reports.map((report) => (
                <div key={report._id} className="report-item">
                  <p><strong>Type:</strong> {report.reportType}</p>
                  <p><strong>Patient:</strong> {report.patientId?.name}</p>
                  <p><strong>Date:</strong> {new Date(report.uploadedAt).toLocaleDateString()}</p>
                  
                  <button
                    onClick={() => decryptAndDownloadReport(report)}
                    disabled={decryptingReport === report._id}
                  >
                    {decryptingReport === report._id ? 'Decrypting...' : '🔓 Decrypt & Download'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorProfile;
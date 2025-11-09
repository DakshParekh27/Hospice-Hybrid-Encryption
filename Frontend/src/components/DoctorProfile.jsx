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

  const handleLogout = async () => {
  await Auth.logout();
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
      alert('⚠️ Passwords do not match');
      return;
    }

    if (password.length < 8) {
      alert('⚠️ Password must be at least 8 characters long');
      return;
    }

    try {
      setGeneratingKeys(true);

      const keyPair = await CryptoManager.generateKeyPair();
      const publicKeyBase64 = await CryptoManager.exportPublicKey(keyPair.publicKey);
      const privateKeyBase64 = await CryptoManager.exportPrivateKey(keyPair.privateKey);
      
      const { encryptedPrivateKey, iv, salt } = await CryptoManager.encryptPrivateKeyWithPassword(
        privateKeyBase64,
        password
      );

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

      alert('✅ Encryption keys generated successfully! Please remember your password.');
      setHasEncryptionKeys(true);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error generating keys:', error);
      alert('❌ Failed to generate encryption keys');
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
    const decryptPassword = prompt('🔐 Enter your encryption password:');
    
    if (!decryptPassword) {
      return;
    }

    try {
      setDecryptingReport(report._id);

      const token = localStorage.getItem('token');
      const keyResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/encryption/private-key`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { encryptedPrivateKey, iv, salt } = keyResponse.data;

      const privateKeyBase64 = await CryptoManager.decryptPrivateKeyWithPassword(
        encryptedPrivateKey,
        decryptPassword,
        iv,
        salt
      );

      const privateKey = await CryptoManager.importPrivateKey(privateKeyBase64);

      const aesKeyBase64 = await CryptoManager.decryptAESKeyWithRSA(
        report.encryptedKey,
        privateKey
      );

      const aesKey = await CryptoManager.importAESKey(aesKeyBase64);

      const fileResponse = await axios.get(report.fileUrl, {
        responseType: 'arraybuffer'
      });

      const decryptedData = await CryptoManager.decryptFileWithAES(
        fileResponse.data,
        aesKey,
        report.iv
      );

      await CryptoManager.downloadDecryptedFile(
        decryptedData,
        `${report.reportType}-${report.patientId?.name || 'patient'}.pdf`,
        'application/pdf'
      );

      alert('✅ File decrypted and downloaded successfully!');
    } catch (error) {
      console.error('Error decrypting file:', error);
      alert('❌ Failed to decrypt file. Please check your password.');
    } finally {
      setDecryptingReport(null);
    }
  };

  if (!profile) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        fontSize: '1.2rem',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ 
            width: '40px', 
            height: '40px',
            margin: '0 auto 1rem'
          }}></div>
          Loading your profile...
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-profile">
      <div className="card">
        <div className="profile-header">
          <h2>Doctor Dashboard</h2>
          <button onClick={handleLogout} className="danger">
            🚪 Logout
          </button>
        </div>
        
        <div className="profile-info">
          <p>
            <strong>👨‍⚕️ Name:</strong> 
            Dr. {profile.name}
          </p>
          <p>
            <strong>🏥 Specialization:</strong> 
            {profile.specialization}
          </p>
          <p>
            <strong>📧 Email:</strong> 
            {profile.email}
          </p>
        </div>

        {!hasEncryptionKeys && (
          <div className="encryption-setup">
            <h3>🔐 Setup End-to-End Encryption</h3>
            <p>
              Generate encryption keys to securely access patient medical records. 
              Your private key will be encrypted with a password that only you know.
            </p>
            
            <div className="form-group">
              <label>Create Encryption Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
              />
            </div>

            <button onClick={generateEncryptionKeys} disabled={generatingKeys}>
              {generatingKeys ? (
                <>
                  Generating Keys
                  <span className="loading-spinner"></span>
                </>
              ) : (
                '🔑 Generate Encryption Keys'
              )}
            </button>
            
              <div style={{ 
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'linear-gradient(90deg, rgba(6,95,70,0.02), rgba(4,120,87,0.01))',
                borderLeft: '4px solid rgba(6,95,70,0.12)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'var(--muted)'
              }}>
                ⚠️ <strong>Important:</strong> Remember this password. It cannot be recovered if lost!
              </div>
          </div>
        )}

        {hasEncryptionKeys && (
          <div className="reports-section">
            <h3>Patient Medical Reports</h3>
            
            {reports.length === 0 ? (
              <div className="empty-state">
                No reports available yet
              </div>
            ) : (
              <div className="reports-list">
                {reports.map((report) => (
                  <div key={report._id} className="report-item">
                    <div style={{ marginBottom: '1rem' }}>
                      <p>
                        <strong>📋 Type:</strong> 
                        <span style={{ 
                          marginLeft: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          background: 'rgba(6,95,70,0.06)',
                          borderRadius: '12px',
                          fontSize: '0.9rem',
                          color: 'var(--text)'
                        }}>
                          {report.reportType}
                        </span>
                      </p>
                      <p>
                        <strong>👤 Patient:</strong> 
                        {report.patientId?.name || 'Unknown'}
                      </p>
                      <p>
                        <strong>📅 Date:</strong> 
                        {new Date(report.uploadedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => decryptAndDownloadReport(report)}
                      disabled={decryptingReport === report._id}
                    >
                      {decryptingReport === report._id ? (
                        <>
                          Decrypting
                          <span className="loading-spinner"></span>
                        </>
                      ) : (
                        '🔓 Decrypt & Download'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FileUpload from './FileUpload';
import Auth from '../utils/auth';

const PatientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchReports();
    fetchDoctors();
  }, []);

  const navigate = useNavigate();

  const handleLogout = () => {
    Auth.logout();
    navigate('/');
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/patient/profile`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const patientId = localStorage.getItem('patientId');
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/patient/reports/${patientId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/patient/doctors`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleUploadSuccess = (newReport) => {
    setReports([newReport, ...reports]);
    setShowUpload(false);
    setSelectedDoctor(null);
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
    <div className="patient-profile">
      <div className="card">
        <div className="profile-header">
          <h2>Patient Dashboard</h2>
          <button onClick={handleLogout} className="danger">
            🚪 Logout
          </button>
        </div>
        
        <div className="profile-info">
          <p>
            <strong>👤 Name:</strong> 
            {profile.name}
          </p>
          <p>
            <strong>📧 Email:</strong> 
            {profile.email}
          </p>
          <p>
            <strong>🎂 Date of Birth:</strong> 
            {new Date(profile.dateOfBirth).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p>
            <strong>🩸 Blood Group:</strong> 
            <span style={{
              marginLeft: '0.5rem',
              padding: '0.25rem 0.75rem',
              background: '#dc354515',
              color: '#dc3545',
              borderRadius: '12px',
              fontWeight: '600'
            }}>
              {profile.bloodGroup}
            </span>
          </p>
        </div>

        <div className="upload-section">
          <h3>Upload Medical Report</h3>
          
          {!showUpload ? (
            <>
              <p style={{ color: '#666', marginBottom: '1rem' }}>
                Share your medical reports securely with your doctor using end-to-end encryption.
              </p>
              
              <div className="form-group">
                <label>Select Doctor to Share With</label>
                <select 
                  value={selectedDoctor || ''} 
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      👨‍⚕️ Dr. {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => setShowUpload(true)}
                disabled={!selectedDoctor}
              >
                📤 Continue to Upload
              </button>

              {doctors.length === 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#fff3cd',
                  borderLeft: '4px solid #ffc107',
                  borderRadius: '8px',
                  color: '#856404'
                }}>
                  ℹ️ No doctors available. Please contact administrator.
                </div>
              )}
            </>
          ) : (
            <>
              <FileUpload
                patientId={profile._id}
                doctorId={selectedDoctor}
                onUploadSuccess={handleUploadSuccess}
              />
              <button 
                onClick={() => {
                  setShowUpload(false);
                  setSelectedDoctor(null);
                }}
                className="secondary"
                style={{ marginTop: '1rem' }}
              >
                ← Back to Doctor Selection
              </button>
            </>
          )}
        </div>

        <div className="reports-section">
          <h3>Your Medical Reports</h3>
          
          {reports.length === 0 ? (
            <div className="empty-state">
              No reports uploaded yet
            </div>
          ) : (
            <>
              <div style={{ 
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#d4edda',
                borderLeft: '4px solid #28a745',
                borderRadius: '8px',
                color: '#155724',
                fontSize: '0.9rem'
              }}>
                ✅ All reports are encrypted end-to-end. Only you and the designated doctor can access them.
              </div>
              
              <div className="reports-list">
                {reports.map((report) => (
                  <div key={report._id} className="report-item">
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p>
                        <strong>📋 Type:</strong> 
                        <span style={{ 
                          marginLeft: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          background: '#667eea15',
                          borderRadius: '12px',
                          fontSize: '0.9rem'
                        }}>
                          {report.reportType}
                        </span>
                      </p>
                      <p>
                        <strong>👨‍⚕️ Shared With:</strong> 
                        Dr. {report.doctorId?.name || 'Unknown'}
                      </p>
                      <p>
                        <strong>📅 Uploaded:</strong> 
                        {new Date(report.uploadedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <p className="encrypted-badge">End-to-End Encrypted</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
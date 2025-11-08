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
    // go to landing page which shows login/register
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
    return <div>Loading...</div>;
  }

  return (
    <div className="patient-profile">
      <div className="profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Patient Profile</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
      
      <div className="profile-info">
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Date of Birth:</strong> {new Date(profile.dateOfBirth).toLocaleDateString()}</p>
        <p><strong>Blood Group:</strong> {profile.bloodGroup}</p>
      </div>

      <div className="upload-section">
        <h3>Upload Medical Report</h3>
        
        {!showUpload ? (
          <>
            <p>Select a doctor to share your report with:</p>
            <select 
              value={selectedDoctor || ''} 
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              <option value="">Select Doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.name} - {doctor.specialization}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setShowUpload(true)}
              disabled={!selectedDoctor}
            >
              Continue to Upload
            </button>
          </>
        ) : (
          <>
            <FileUpload
              patientId={profile._id}
              doctorId={selectedDoctor}
              onUploadSuccess={handleUploadSuccess}
            />
            <button onClick={() => {
              setShowUpload(false);
              setSelectedDoctor(null);
            }}>
              Cancel
            </button>
          </>
        )}
      </div>

      <div className="reports-section">
        <h3>Your Medical Reports</h3>
        
        {reports.length === 0 ? (
          <p>No reports uploaded yet</p>
        ) : (
          <div className="reports-list">
            {reports.map((report) => (
              <div key={report._id} className="report-item">
                <p><strong>Type:</strong> {report.reportType}</p>
                <p><strong>Doctor:</strong> Dr. {report.doctorId?.name}</p>
                <p><strong>Uploaded:</strong> {new Date(report.uploadedAt).toLocaleDateString()}</p>
                <p className="encrypted-badge">🔒 Encrypted</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfile;
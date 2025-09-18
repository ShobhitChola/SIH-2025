import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LanguageProvider } from './contexts/LanguageContext';
import MainApp from './MainApp';
import LandingPage from './components/LandingPage';
import Notification from './components/Notification';
import ValidatorPage from './components/ValidatorPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [showValidator, setShowValidator] = useState(false);

  // ✅ This useEffect hook MUST contain the logic to set isLoading to false
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('aayuLinkToken');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const response = await axios.get(`${API_URL}/api/auth/verify`);
          setCurrentUser(response.data.user);
        } catch (error) {
          localStorage.removeItem('aayuLinkToken');
        }
      }
      // This line tells the app to stop loading and render the content
      setIsLoading(false);
    };
    verifyUser();
  }, []);

  const toggleValidator = () => setShowValidator(prev => !prev);

  const showNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 5000);
  };
  
  const handleLogin = async (username, password, role) => {
    setAuthError('');
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { username, password, role });
      localStorage.setItem('aayuLinkToken', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setCurrentUser(response.data.user);
      navigate('/patientLookup');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Login failed.');
    }
  };

  const handleSignUp = async (username, password, role, hospitalName, specialCode) => {
    setAuthError('');
    try {
      await axios.post(`${API_URL}/api/auth/register`, { username, password, role, hospitalName, specialCode });
      return true;
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Registration failed.');
      return false;
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('aayuLinkToken');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    navigate('/');
  };
  
  if (isLoading) {
    return null;
  }

  return (
    <LanguageProvider>
      <Notification show={notification.show} message={notification.message} />
      
      {showValidator ? (
        <ValidatorPage onBack={toggleValidator} />
      ) : (
        <Routes>
          {currentUser ? (
            <Route path="/*" element={<MainApp currentUser={currentUser} onLogout={handleLogout} showNotification={showNotification} />} />
          ) : (
            <Route 
              path="/*" 
              element={
                <LandingPage 
                  onLogin={handleLogin} 
                  onSignUp={handleSignUp} 
                  authError={authError}
                  showNotification={showNotification}
                  onValidatorClick={toggleValidator} 
                />
              } 
            />
          )}
        </Routes>
      )}
    </LanguageProvider>
  );
}
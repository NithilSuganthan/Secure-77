import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import LoginPage from './loginpage';
import OAuthCallbackHandler from './OAuthCallbackHandler';
import Navigation from './Navigation';
import Dashboard from './Dashboard';
import SteganographyPage from './SteganographyPage';
import AESEncryptionPage from './AESEncryptionPage';
import FileTransferPage from './FileTransferPage';
import HyperlinkDashboard from './HyperlinkDashboard';

// Clear login state on every app reload to force login each time
localStorage.removeItem('isLoggedIn');

function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? (
    <>
      <Navigation />
      {children}
    </>
  ) : <Navigate to="/login" replace />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackHandler />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/steganography"
            element={
              <ProtectedRoute>
                <SteganographyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/aes-encryption"
            element={
              <ProtectedRoute>
                <AESEncryptionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfer"
            element={
              <ProtectedRoute>
                <FileTransferPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hyperlink"
            element={
              <ProtectedRoute>
                <HyperlinkDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  </React.StrictMode>
);

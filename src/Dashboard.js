import React from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import "./style.css";

function Dashboard() {
  const navigate = useNavigate();

  const features = [
    {
      title: "Steganography Suite",
      description: "Hide encrypted data within images using advanced steganography techniques",
      icon: "🖼️",
      path: "/steganography",
      features: ["AES-256 Encryption", "Invisible Data Hiding", "Image Steganography", "Military-Grade Security"]
    },
    {
      title: "AES Encryption Suite",
      description: "Encrypt any file type with AES-256-GCM encryption and PBKDF2 key derivation",
      icon: "🔒",
      path: "/aes-encryption",
      features: ["AES-256-GCM", "Any File Type", "PBKDF2 Key Derivation", "100,000 Iterations"]
    }
  ];

  const securityStats = [
    { label: "Encryption Strength", value: "AES-256", color: "var(--success-color)" },
    { label: "Key Derivation", value: "PBKDF2", color: "var(--accent-color)" },
    { label: "Iterations", value: "100,000", color: "var(--secure-green)" },
    { label: "Security Level", value: "Military-Grade", color: "var(--primary-color)" }
  ];

  return (
    <div className="app-container dashboard-page">
      <div className="app-header">
        <div className="header-top">
          <div className="header-content">
            <h1 className="app-title">🛡️ Secure77 Dashboard</h1>
            <p className="app-subtitle">
              Advanced cryptographic tools for maximum security and data protection
            </p>
          </div>
          <ThemeToggle className="dashboard-theme-toggle" />
        </div>
        <div className="security-badge">
          <svg className="security-icon" viewBox="0 0 24 24">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
          </svg>
          Military-Grade Security Platform
        </div>
      </div>

      <div className="security-stats">
        {securityStats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card" onClick={() => navigate(feature.path)}>
            <div className="feature-header">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
            </div>
            <p className="feature-description">{feature.description}</p>
            <div className="feature-list">
              {feature.features.map((item, idx) => (
                <div key={idx} className="feature-item">
                  <svg className="feature-check" viewBox="0 0 24 24">
                    <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                  </svg>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="feature-action">
              <button className="btn btn-primary">
                Access Tool
                <svg className="btn-icon" viewBox="0 0 24 24">
                  <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="security-info">
        <div className="info-card">
          <h3>🔐 Security Features</h3>
          <ul>
            <li>End-to-end encryption with AES-256-GCM</li>
            <li>PBKDF2 key derivation with 100,000 iterations</li>
            <li>Secure random IV generation for each encryption</li>
            <li>Client-side processing - no data leaves your device</li>
            <li>Military-grade security standards</li>
          </ul>
        </div>
        <div className="info-card">
          <h3>🛡️ Privacy Protection</h3>
          <ul>
            <li>All encryption happens in your browser</li>
            <li>No server-side data storage</li>
            <li>Zero-knowledge architecture</li>
            <li>Files are processed locally only</li>
            <li>Complete data sovereignty</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

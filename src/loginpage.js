import React, { useState } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [mode, setMode] = useState("login"); // 'login' or 'signup'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage("");
    const endpoint = mode === "login" ? "login" : "signup";
    try {
      const res = await fetch(`http://localhost:4000/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (mode === "login") {
          localStorage.setItem("isLoggedIn", "true");
          navigate("/", { replace: true });
        } else {
          setMessage("Signup successful! You can now log in.");
          setMode("login");
        }
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage("Server error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h1>Secure77</h1>
        <p>Enterprise Security Platform</p>
        <div className="security-badge">
          <svg className="security-icon" viewBox="0 0 24 24">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
          </svg>
          Secure Authentication
        </div>
      </div>

      <h2>{mode === "login" ? "Secure Login" : "Create Account"}</h2>
      <form onSubmit={handleAuth}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            required
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">
          {mode === "login" ? "🔐 Secure Login" : "🛡️ Create Account"}
        </button>
      </form>
      
      <button
        type="button"
        className="github-login-btn"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setMessage("");
        }}
      >
        {mode === "login"
          ? "Don't have an account? Sign Up"
          : "Already have an account? Login"}
      </button>
      
      {message && (
        <div className={`message ${
          message.includes('success') ? 'success' :
          message.includes('error') || message.includes('Server error') ? 'error' :
          'info'
        }`}>
          {message}
        </div>
      )}

      <div className="security-indicators">
        <div className="security-indicator">
          <div className="indicator-dot"></div>
          <span>AES-256 Encryption</span>
        </div>
        <div className="security-indicator">
          <div className="indicator-dot"></div>
          <span>Secure Session</span>
        </div>
        <div className="security-indicator">
          <div className="indicator-dot"></div>
          <span>Zero-Knowledge</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

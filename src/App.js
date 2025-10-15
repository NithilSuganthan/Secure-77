import React, { useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import DecodeStego from "./DecodeStego";
import FileTransferPage from "./FileTransferPage";
import "./style.css";

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

const deriveKeyFromPassword = async (password, salt) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
};

const encryptData = async (key, data) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, data
  );
  return { encrypted, iv };
};

function StegoApp() {
  const [encryptedBase64, setEncryptedBase64] = useState("");
  const [stegoImageUrl, setStegoImageUrl] = useState("");
  const coverImageRef = useRef();

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const password = prompt("Enter password for encryption:");
    if (!password) {
      alert("Encryption cancelled.");
      return;
    }

    const metadata = JSON.stringify({ name: file.name, type: file.type });
    const encoder = new TextEncoder();
    const metaBytes = encoder.encode(metadata);
    const metaLen = metaBytes.length;
    const metaLenBuffer = new Uint8Array([metaLen >> 8, metaLen & 0xff]);

    const fileBuffer = await file.arrayBuffer();
    const toEncrypt = new Uint8Array(2 + metaLen + fileBuffer.byteLength);
    toEncrypt.set(metaLenBuffer, 0);
    toEncrypt.set(metaBytes, 2);
    toEncrypt.set(new Uint8Array(fileBuffer), 2 + metaLen);

    const salt = new TextEncoder().encode(password);
    const key = await deriveKeyFromPassword(password, salt);
    const { encrypted, iv } = await encryptData(key, toEncrypt.buffer);

    const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
    combined.set(new Uint8Array(iv), 0);
    combined.set(new Uint8Array(encrypted), iv.byteLength);

    setEncryptedBase64(arrayBufferToBase64(combined.buffer));
    alert("File encrypted. Now upload a cover image.");
  };

  const handleCoverImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const imgURL = URL.createObjectURL(file);
    if (coverImageRef.current) coverImageRef.current.src = imgURL;
  };

  const embedDataInImage = () => {
    if (!coverImageRef.current || !encryptedBase64) {
      alert("Upload both file and cover image.");
      return;
    }
    if (window.steg && typeof window.steg.encode === "function") {
      const stegoDataUrl = window.steg.encode(encryptedBase64, coverImageRef.current);
      setStegoImageUrl(stegoDataUrl);
    } else {
      alert("Steganography library not loaded! Restart your dev server.");
    }
  };

  const downloadStegoImage = () => {
    if (!stegoImageUrl) return;
    const a = document.createElement("a");
    a.href = stegoImageUrl;
    a.download = "stego-image.png";
    a.click();
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">🔐 Secure File Encryption & Steganography</h1>
        <p className="app-subtitle">
          Advanced AES-256 encryption with invisible data hiding using steganography
        </p>
        <div className="security-badge">
          <svg className="security-icon" viewBox="0 0 24 24">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
          </svg>
          Military-Grade Security
        </div>
      </div>

      <div className="content-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="step-number">1</span>
              Upload File to Encrypt
            </h3>
          </div>
          <div className="form-group">
            <div className="file-input-wrapper">
              <input
                type="file"
                className="file-input"
                onChange={handleFileChange}
                id="file-upload"
              />
              <label htmlFor="file-upload" className="file-input-label">
                <svg className="upload-icon" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                Choose File to Encrypt
              </label>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="step-number">2</span>
              Select Cover Image
            </h3>
          </div>
          <div className="form-group">
            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/*"
                className="file-input"
                onChange={handleCoverImageChange}
                id="cover-upload"
              />
              <label htmlFor="cover-upload" className="file-input-label">
                <svg className="upload-icon" viewBox="0 0 24 24">
                  <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
                </svg>
                Choose Cover Image
              </label>
            </div>
          </div>
          <div className="image-container">
            <img
              ref={coverImageRef}
              alt="Cover Image Preview"
              className="image-preview"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="step-number">3</span>
            Embed Encrypted Data
          </h3>
        </div>
        <button className="btn btn-primary" onClick={embedDataInImage}>
          <svg className="btn-icon" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
          </svg>
          Embed Encrypted File Data into Cover Image
        </button>
      </div>

      {stegoImageUrl && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="step-number">4</span>
              Secure Stego Image Generated
            </h3>
          </div>
          <div className="image-container">
            <img src={stegoImageUrl} alt="Secure Stego Image" className="image-preview" />
          </div>
          <div className="form-group">
            <button className="btn btn-success" onClick={downloadStegoImage}>
              <svg className="btn-icon" viewBox="0 0 24 24">
                <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
              </svg>
              Download Secure Stego Image
            </button>
          </div>
        </div>
      )}
      <DecodeStego />
    </div>
  );
}

function App() {
  return (
    <Router>
      <nav style={{ padding: "1rem", backgroundColor: "#f0f0f0" }}>
        <Link to="/" style={{ marginRight: "1rem", fontWeight: "bold" }}>Stego Encryption</Link>
        <Link to="/transfer" style={{ fontWeight: "bold" }}>Send File (Code Transfer)</Link>
      </nav>
      <Routes>
        <Route path="/" element={<StegoApp />} />
        <Route path="/transfer" element={<FileTransferPage />} />
      </Routes>
    </Router>
  );
}

export default App;

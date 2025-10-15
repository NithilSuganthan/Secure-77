import React, { useState, useRef } from "react";
import "./style.css";

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
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
    ["encrypt", "decrypt"]
  );
};

const encryptData = async (key, data) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, data
  );
  return { encrypted, iv };
};

const decryptData = async (key, encryptedData, iv) => {
  return await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv }, key, encryptedData
  );
};

function AESEncryptionPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [encryptedData, setEncryptedData] = useState("");
  const [decryptedData, setDecryptedData] = useState(null);
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef();
  

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setEncryptedData("");
      setDecryptedData(null);
      setStatus(`Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    }
  };

  const handleEncrypt = async () => {
    if (!selectedFile) {
      setStatus("Please select a file first.");
      return;
    }

    const password = prompt("Enter password for encryption:");
    if (!password) {
      setStatus("Encryption cancelled.");
      return;
    }

    setIsProcessing(true);
    setStatus("Encrypting file...");

    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const salt = new TextEncoder().encode(password);
      const key = await deriveKeyFromPassword(password, salt);
      const { encrypted, iv } = await encryptData(key, fileBuffer);

      const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
      combined.set(new Uint8Array(iv), 0);
      combined.set(new Uint8Array(encrypted), iv.byteLength);

      const encryptedBase64 = arrayBufferToBase64(combined.buffer);
      setEncryptedData(encryptedBase64);
      setStatus(`File encrypted successfully! Size: ${(encryptedBase64.length / 1024).toFixed(2)} KB`);
    } catch (error) {
      setStatus("Encryption failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedData) {
      setStatus("No encrypted data to decrypt.");
      return;
    }

    const password = prompt("Enter password for decryption:");
    if (!password) {
      setStatus("Decryption cancelled.");
      return;
    }

    setIsProcessing(true);
    setStatus("Decrypting file...");

    try {
      const encryptedBuffer = base64ToArrayBuffer(encryptedData);
      
      // Check if buffer is large enough
      if (encryptedBuffer.byteLength < 12) {
        throw new Error("Invalid encrypted data format.");
      }
      
      const iv = encryptedBuffer.slice(0, 12);
      const encrypted = encryptedBuffer.slice(12);
      
      const salt = new TextEncoder().encode(password);
      const key = await deriveKeyFromPassword(password, salt);
      const decrypted = await decryptData(key, encrypted, new Uint8Array(iv));

      const blob = new Blob([decrypted], { type: selectedFile?.type || 'application/octet-stream' });
      setDecryptedData(blob);
      setStatus("File decrypted successfully!");
    } catch (error) {
      console.error("Decryption error:", error);
      if (error.name === 'OperationError') {
        setStatus("Decryption failed: Invalid password. Please check your password and try again.");
      } else {
        setStatus("Decryption failed: " + error.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadEncrypted = () => {
    if (!encryptedData) return;
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedFile?.name || 'encrypted'}.enc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDecrypted = () => {
    if (!decryptedData) return;
    const url = URL.createObjectURL(decryptedData);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile?.name || 'decrypted';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetProcess = () => {
    setSelectedFile(null);
    setEncryptedData("");
    setDecryptedData(null);
    setStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  return (
    <div className="app-container aes-page">
      <div className="app-header">
        <h1 className="app-title">Secure77 AES-256 File Encryption Suite</h1>
        <p className="app-subtitle">
          Enterprise-grade AES-256 encryption and decryption for any file type with PBKDF2 key derivation
        </p>
        <div className="security-badge">
          <svg className="security-icon" viewBox="0 0 24 24">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
          </svg>
          AES-256 Security
        </div>
      </div>

      <div className="security-features">
        <div className="security-feature">
          <svg className="feature-icon" viewBox="0 0 24 24">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
          </svg>
          <span className="feature-text">AES-256-GCM Encryption</span>
        </div>
        <div className="security-feature">
          <svg className="feature-icon" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
          </svg>
          <span className="feature-text">PBKDF2 Key Derivation</span>
        </div>
        <div className="security-feature">
          <svg className="feature-icon" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
          <span className="feature-text">Any File Type Support</span>
        </div>
        <div className="security-feature">
          <svg className="feature-icon" viewBox="0 0 24 24">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
          </svg>
          <span className="feature-text">100,000 PBKDF2 Iterations</span>
        </div>
      </div>

      <div className="content-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="step-number">1</span>
              Select File to Encrypt
            </h3>
          </div>
          <div className="form-group">
            <div className="file-input-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                className="file-input"
                onChange={handleFileSelect}
                id="aes-file-upload"
              />
              <label htmlFor="aes-file-upload" className="file-input-label">
                <svg className="upload-icon" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                Choose File to Encrypt
              </label>
            </div>
          </div>
          {selectedFile && (
            <div className="file-info">
              <p><strong>File:</strong> {selectedFile.name}</p>
              <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
              <p><strong>Type:</strong> {selectedFile.type || 'Unknown'}</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="step-number">2</span>
              Encryption Controls
            </h3>
          </div>
          <div className="form-group">
            <button 
              className="btn btn-primary" 
              onClick={handleEncrypt}
              disabled={!selectedFile || isProcessing}
            >
              <svg className="btn-icon" viewBox="0 0 24 24">
                <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
              </svg>
              {isProcessing ? "Encrypting..." : "Encrypt File"}
            </button>
          </div>
          <div className="form-group">
            <button 
              className="btn btn-warning" 
              onClick={handleDecrypt}
              disabled={!encryptedData || isProcessing}
            >
              <svg className="btn-icon" viewBox="0 0 24 24">
                <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
              </svg>
              {isProcessing ? "Decrypting..." : "Decrypt File"}
            </button>
          </div>
        </div>
      </div>

      {encryptedData && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="step-number">3</span>
              Encrypted File Ready
            </h3>
          </div>
          <div className="form-group">
            <button className="btn btn-success" onClick={downloadEncrypted}>
              <svg className="btn-icon" viewBox="0 0 24 24">
                <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
              </svg>
              Download Encrypted File
            </button>
          </div>
        </div>
      )}

      {decryptedData && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="step-number">4</span>
              Decrypted File Ready
            </h3>
          </div>
          <div className="form-group">
            <button className="btn btn-success" onClick={downloadDecrypted}>
              <svg className="btn-icon" viewBox="0 0 24 24">
                <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
              </svg>
              Download Decrypted File
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="step-number">5</span>
            Process Control
          </h3>
        </div>
        <div className="form-group">
          <button className="btn btn-warning" onClick={resetProcess}>
            <svg className="btn-icon" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
            </svg>
            Reset Process
          </button>
        </div>
      </div>

      {status && (
        <div className={`status-message ${
          status.includes('success') || status.includes('successfully') ? 'status-success' :
          status.includes('warning') || status.includes('cancelled') ? 'status-warning' :
          status.includes('error') || status.includes('failed') ? 'status-error' :
          'status-info'
        }`}>
          {status}
        </div>
      )}

    </div>
  );
}

export default AESEncryptionPage;

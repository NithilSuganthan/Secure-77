import React, { useRef, useState } from "react";

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
    ["decrypt"]
  );
};

function DecodeStego() {
  const [decodedBase64, setDecodedBase64] = useState("");
  const [decryptedBlobUrl, setDecryptedBlobUrl] = useState("");
  const [status, setStatus] = useState("");
  const decodeImageRef = useRef();
  const [originalFileName, setOriginalFileName] = useState("decrypted_file");

  const handleStegoImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const imgURL = URL.createObjectURL(file);
    if (decodeImageRef.current) decodeImageRef.current.src = imgURL;
    setDecodedBase64("");
    setDecryptedBlobUrl("");
    setStatus("");
    setOriginalFileName("decrypted_file");
  };

  const handleDecodeStego = () => {
    if (decodeImageRef.current && window.steg && window.steg.decode) {
      const extracted = window.steg.decode(decodeImageRef.current);
      setDecodedBase64(extracted);
      setStatus(
        extracted
          ? "Encrypted data extracted! Now enter password to decrypt."
          : "No message found in image."
      );
    } else {
      setStatus("Steganography library not loaded or image missing.");
    }
  };

  const handleDecrypt = async () => {
    try {
      let password = prompt("Enter password for decryption:");
      if (!password) {
        setStatus("Decryption cancelled.");
        return;
      }
      const encryptedBuffer = base64ToArrayBuffer(decodedBase64);
      const iv = encryptedBuffer.slice(0, 12);
      const ct = encryptedBuffer.slice(12);
      const salt = new TextEncoder().encode(password);
      const key = await deriveKeyFromPassword(password, salt);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv) },
        key,
        ct
      );

      const decryptedBytes = new Uint8Array(decrypted);

      const metaLen = (decryptedBytes[0] << 8) | decryptedBytes[1];
      const metaJsonBytes = decryptedBytes.slice(2, 2 + metaLen);
      const metaJson = new TextDecoder().decode(metaJsonBytes);
      const metadata = JSON.parse(metaJson);

      const fileBytes = decryptedBytes.slice(2 + metaLen);

      const blob = new Blob([fileBytes], { type: metadata.type });
      const url = URL.createObjectURL(blob);
      setDecryptedBlobUrl(url);
      setOriginalFileName(metadata.name);
      setStatus(`Decrypted! Download your file below (original name: ${metadata.name}).`);
    } catch {
      setStatus("Decryption failed: likely wrong password or corrupted file.");
    }
  };

  return (
    <div className="decode-section">
      <div className="decode-header">
        <h2 className="decode-title">🔓 Decode Secure Stego Image</h2>
        <p className="decode-subtitle">Extract and decrypt your hidden files with military-grade security</p>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="step-number">1</span>
            Upload Stego Image
          </h3>
        </div>
        <div className="form-group">
          <div className="file-input-wrapper">
            <input 
              type="file" 
              accept="image/*" 
              className="file-input" 
              onChange={handleStegoImageChange}
              id="stego-upload"
            />
            <label htmlFor="stego-upload" className="file-input-label">
              <svg className="upload-icon" viewBox="0 0 24 24">
                <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/>
              </svg>
              Choose Stego Image
            </label>
          </div>
        </div>
        <div className="image-container">
          <img ref={decodeImageRef} alt="Stego Image Preview" className="image-preview" />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="step-number">2</span>
            Extract Encrypted Data
          </h3>
        </div>
        <button className="btn btn-primary" onClick={handleDecodeStego}>
          <svg className="btn-icon" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
          </svg>
          Extract Encrypted Data
        </button>
      </div>

      {decodedBase64 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="step-number">3</span>
              Decrypt with Password
            </h3>
          </div>
          <button className="btn btn-warning" onClick={handleDecrypt}>
            <svg className="btn-icon" viewBox="0 0 24 24">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z"/>
            </svg>
            Decrypt Data with Password
          </button>
        </div>
      )}

      {decryptedBlobUrl && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="step-number">4</span>
              Download Decrypted File
            </h3>
          </div>
          <a href={decryptedBlobUrl} download={originalFileName} className="download-link">
            <svg className="btn-icon" viewBox="0 0 24 24">
              <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
            </svg>
            Download Decrypted File
          </a>
        </div>
      )}

      {status && (
        <div className={`status-message ${
          status.includes('success') || status.includes('Decrypted') ? 'status-success' :
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

export default DecodeStego;

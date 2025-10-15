import React, { useState, useRef } from 'react';

function HyperlinkDashboard() {
  const [mode, setMode] = useState('encoding'); // 'encoding' or 'decoding'
  const [selectedImage, setSelectedImage] = useState(null);
  const [hyperlink, setHyperlink] = useState('');
  const [encryptedImage, setEncryptedImage] = useState(null);
  const [decodedHyperlink, setDecodedHyperlink] = useState('');
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const imageInputRef = useRef();
  const encryptedImageInputRef = useRef();

  // Simple steganography functions
  const encodeHyperlink = (imageData, hyperlink) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
        
        // Add delimiter and encode hyperlink
        const message = `HYPERLINK_START:${hyperlink}:HYPERLINK_END`;
        const messageBytes = new TextEncoder().encode(message);
        
        // Debug: Log encoding information
        console.log('Encoding message:', message);
        console.log('Message bytes length:', messageBytes.length);
        
        // Check if image has enough capacity
        const maxCapacity = Math.floor(data.length / 4 / 8); // 8 bits per byte, 4 channels per pixel
        console.log('Image capacity:', maxCapacity, 'pixels');
        if (messageBytes.length > maxCapacity) {
          reject(new Error('Image too small to encode this hyperlink. Try a larger image.'));
          return;
        }
        
        // LSB steganography - encode in red channel (index 0, 4, 8, ...)
        let pixelIndex = 0;
        for (let messageIndex = 0; messageIndex < messageBytes.length; messageIndex++) {
          const messageByte = messageBytes[messageIndex];
          
          // Encode each bit of the message byte
          for (let bit = 0; bit < 8; bit++) {
            if (pixelIndex >= data.length) break;
            
            const bitValue = (messageByte >> bit) & 0x01;
            data[pixelIndex] = (data[pixelIndex] & 0xFE) | bitValue;
            pixelIndex += 4; // Move to next red channel
          }
        }
        
        ctx.putImageData(imageDataObj, 0, 0);
        canvas.toBlob(resolve, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageData;
    });
  };

  const decodeHyperlink = (imageData) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
        
        // Extract LSB data from red channel (index 0, 4, 8, ...)
        let extractedBits = [];
        for (let i = 0; i < data.length; i += 4) {
          extractedBits.push(data[i] & 0x01);
        }
        
        // Convert bits to bytes
        let messageBytes = [];
        for (let i = 0; i < extractedBits.length; i += 8) {
          if (i + 7 < extractedBits.length) {
            let byte = 0;
            for (let j = 0; j < 8; j++) {
              byte |= (extractedBits[i + j] << j);
            }
            messageBytes.push(byte);
          }
        }
        
        // Convert bytes to string
        const message = new TextDecoder().decode(new Uint8Array(messageBytes));
        
        // Debug: Log the extracted message for troubleshooting
        console.log('Extracted message:', message.substring(0, 200)); // Log first 200 chars
        
        // Look for the hyperlink pattern
        const match = message.match(/HYPERLINK_START:(.*?):HYPERLINK_END/);
        if (match && match[1]) {
          console.log('Found hyperlink pattern:', match[1]);
          resolve(match[1]);
        } else {
          // If no pattern found, try to find any URL-like string
          const urlMatch = message.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            console.log('Found URL pattern:', urlMatch[0]);
            resolve(urlMatch[0]);
          } else {
            console.log('No hyperlink found in extracted message');
            resolve(null);
          }
        }
      };
      img.src = imageData;
    });
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setEncryptedImage(null);
      setDecodedHyperlink('');
      setStatus(`Selected image: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    }
  };

  const handleEncrypt = async () => {
    if (!selectedImage || !hyperlink.trim()) {
      setStatus('Please select an image and enter a hyperlink.');
      return;
    }

    setIsProcessing(true);
    setStatus('Encoding hyperlink into image...');

    try {
      const imageData = await selectedImage.arrayBuffer();
      const blob = new Blob([imageData], { type: selectedImage.type });
      const url = URL.createObjectURL(blob);
      
      const encryptedBlob = await encodeHyperlink(url, hyperlink);
      setEncryptedImage(encryptedBlob);
      setStatus('Hyperlink encoded successfully!');
    } catch (error) {
      setStatus('Encoding failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedImage) {
      setStatus('Please select an encrypted image first.');
      return;
    }

    setIsProcessing(true);
    setStatus('Decoding hyperlink from image...');

    try {
      const imageData = await encryptedImage.arrayBuffer();
      const blob = new Blob([imageData], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      
      const decodedLink = await decodeHyperlink(url);
      if (decodedLink) {
        setDecodedHyperlink(decodedLink);
        setStatus('Hyperlink decoded successfully!');
      } else {
        setStatus('No hyperlink found in this image.');
      }
    } catch (error) {
      setStatus('Decoding failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenLink = () => {
    if (decodedHyperlink) {
      window.open(decodedHyperlink, '_blank');
    }
  };

  const downloadEncryptedImage = () => {
    if (!encryptedImage) return;
    const url = URL.createObjectURL(encryptedImage);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encrypted_${selectedImage?.name || 'image.png'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEncryptedImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setEncryptedImage(file);
      setDecodedHyperlink('');
      setStatus(`Selected encrypted image: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    // Clear all form data when switching modes
    setSelectedImage(null);
    setHyperlink('');
    setEncryptedImage(null);
    setDecodedHyperlink('');
    setStatus('');
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (encryptedImageInputRef.current) encryptedImageInputRef.current.value = '';
  };

  const resetProcess = () => {
    setSelectedImage(null);
    setHyperlink('');
    setEncryptedImage(null);
    setDecodedHyperlink('');
    setStatus('');
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (encryptedImageInputRef.current) encryptedImageInputRef.current.value = '';
  };

  return (
    <div className="app-container hyperlink-page">
      <div className="app-header">
        <h1 className="app-title">🔗 Secure77 Hyperlink Steganography</h1>
        <p className="app-subtitle">
          Hide hyperlinks inside images using advanced steganography techniques
        </p>
        <div className="security-badge">
          <svg className="security-icon" viewBox="0 0 24 24">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
          </svg>
          Steganography Security
        </div>
      </div>

      <div className="security-features">
        <div className="security-feature">
          <svg className="feature-icon" viewBox="0 0 24 24">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
          </svg>
          <span className="feature-text">LSB Steganography</span>
        </div>
        <div className="security-feature">
          <svg className="feature-icon" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
          <span className="feature-text">Invisible Encoding</span>
        </div>
        <div className="security-feature">
          <svg className="feature-icon" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
          </svg>
          <span className="feature-text">Secure Extraction</span>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="card mode-selection-card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="step-number">0</span>
            Select Operation Mode
          </h3>
        </div>
        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'encoding' ? 'active' : ''}`}
            onClick={() => handleModeChange('encoding')}
          >
            <svg className="mode-icon" viewBox="0 0 24 24">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
            </svg>
            <div className="mode-content">
              <h4>Encode Hyperlink</h4>
              <p>Hide a hyperlink inside an image</p>
            </div>
          </button>
          
          <button
            className={`mode-btn ${mode === 'decoding' ? 'active' : ''}`}
            onClick={() => handleModeChange('decoding')}
          >
            <svg className="mode-icon" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
            </svg>
            <div className="mode-content">
              <h4>Decode Hyperlink</h4>
              <p>Extract a hyperlink from an image</p>
            </div>
          </button>
        </div>
      </div>

      <div className="content-grid">
        {mode === 'encoding' ? (
          /* Encoding Mode */
          <>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <span className="step-number">1</span>
                  Select Image
                </h3>
              </div>
              <div className="form-group">
                <div className="file-input-wrapper">
                  <input
                    ref={imageInputRef}
                    type="file"
                    className="file-input"
                    onChange={handleImageSelect}
                    id="image-upload"
                    accept="image/*"
                  />
                  <label htmlFor="image-upload" className="file-input-label">
                    <svg className="upload-icon" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                    Choose Image
                  </label>
                </div>
              </div>
              {selectedImage && (
                <div className="file-info">
                  <p><strong>Image:</strong> {selectedImage.name}</p>
                  <p><strong>Size:</strong> {(selectedImage.size / 1024).toFixed(2)} KB</p>
                  <p><strong>Type:</strong> {selectedImage.type}</p>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <span className="step-number">2</span>
                  Enter Hyperlink
                </h3>
              </div>
              <div className="form-group">
                <label htmlFor="hyperlink-input" className="form-label">Hyperlink URL</label>
                <input
                  type="url"
                  id="hyperlink-input"
                  className="form-input"
                  value={hyperlink}
                  onChange={(e) => setHyperlink(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="form-group">
                <button 
                  className="btn btn-primary" 
                  onClick={handleEncrypt}
                  disabled={!selectedImage || !hyperlink.trim() || isProcessing}
                >
                  <svg className="btn-icon" viewBox="0 0 24 24">
                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
                  </svg>
                  {isProcessing ? "Encoding..." : "Encode Hyperlink"}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Decoding Mode */
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="step-number">1</span>
                Select Encrypted Image
              </h3>
            </div>
            <div className="form-group">
              <div className="file-input-wrapper">
                <input
                  ref={encryptedImageInputRef}
                  type="file"
                  className="file-input"
                  onChange={handleEncryptedImageSelect}
                  id="encrypted-image-upload"
                  accept="image/*"
                />
                <label htmlFor="encrypted-image-upload" className="file-input-label">
                  <svg className="upload-icon" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  Choose Encrypted Image
                </label>
              </div>
            </div>
            {encryptedImage && (
              <div className="file-info">
                <p><strong>Image:</strong> {encryptedImage.name}</p>
                <p><strong>Size:</strong> {(encryptedImage.size / 1024).toFixed(2)} KB</p>
                <p><strong>Type:</strong> {encryptedImage.type}</p>
              </div>
            )}
            <div className="form-group">
              <button 
                className="btn btn-warning" 
                onClick={handleDecrypt}
                disabled={!encryptedImage || isProcessing}
              >
                <svg className="btn-icon" viewBox="0 0 24 24">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
                </svg>
                {isProcessing ? "Decoding..." : "Decode Hyperlink"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {mode === 'encoding' && encryptedImage && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="step-number">3</span>
              Encoded Image Ready
            </h3>
          </div>
          <div className="form-group">
            <button className="btn btn-success" onClick={downloadEncryptedImage}>
              <svg className="btn-icon" viewBox="0 0 24 24">
                <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
              </svg>
              Download Encoded Image
            </button>
          </div>
        </div>
      )}

      {mode === 'decoding' && decodedHyperlink && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="step-number">2</span>
              Hyperlink Decoded
            </h3>
          </div>
          <div className="form-group">
            <div className="hyperlink-display">
              <p><strong>Decoded URL:</strong></p>
              <div className="url-display">{decodedHyperlink}</div>
            </div>
          </div>
          <div className="form-group">
            <button className="btn btn-success" onClick={handleOpenLink}>
              <svg className="btn-icon" viewBox="0 0 24 24">
                <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
              </svg>
              Open Hyperlink
            </button>
          </div>
        </div>
      )}

      {/* Process Control */}
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

export default HyperlinkDashboard;

import React, { useState } from "react";

const API_URL = "http://localhost:4000/api/transfer";

function FileTransferPage() {
  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [transferCode, setTransferCode] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Download state
  const [downloadCode, setDownloadCode] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle file select
  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
    setUploadError("");
    setTransferCode("");
  };

  // Handle upload
  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    setIsUploading(true);
    setTransferCode("");
    setUploadError("");
    const formData = new FormData();
    formData.append("file", uploadFile);
    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.code) {
        setTransferCode(data.code);
      } else {
        setUploadError(data.error || "Failed to upload file.");
      }
    } catch (err) {
      setUploadError("Network error during upload.");
    }
    setIsUploading(false);
  };

  // Handle download
  const handleDownload = async () => {
    if (!downloadCode.trim()) {
      setDownloadStatus("Enter a transfer code.");
      return;
    }
    setIsDownloading(true);
    setDownloadStatus("Downloading...");
    try {
      const res = await fetch(`${API_URL}/download/${downloadCode.trim()}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        setDownloadStatus(`Error: ${errorText}`);
        setIsDownloading(false);
        return;
      }
      
      // Get filename from response (Content-Disposition header)
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = "downloaded-file";
      
      if (contentDisposition && contentDisposition.includes("filename=")) {
        // Extract filename from Content-Disposition header
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Convert response to blob
      const blob = await res.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      
      // Add to DOM, click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      setDownloadStatus(`Download successful: ${filename}`);
    } catch (err) {
      console.error('Download error:', err);
      setDownloadStatus(`Network error: ${err.message}`);
    }
    setIsDownloading(false);
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">Secure77 File Transfer</h1>
        <p className="app-subtitle">
          Enterprise-grade secure file sharing with short-lived transfer codes
        </p>
        <div className="security-badge">
          <svg className="security-icon" viewBox="0 0 24 24">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
          </svg>
          Secure Transfer System
        </div>
      </div>

      <div className="content-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="step-number">1</span>
              Upload File (Sender)
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
                Choose File to Send
              </label>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleUpload} 
              disabled={isUploading}
              style={{ marginTop: "1rem", width: "100%" }}
            >
              {isUploading ? "Uploading..." : "Upload & Generate Code"}
            </button>
            {uploadError && <div className="error-message">{uploadError}</div>}
            {transferCode && (
              <div className="success-message">
                <h4>Transfer Code Generated!</h4>
                <div className="code-display">
                  <span className="code-text">{transferCode}</span>
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigator.clipboard.writeText(transferCode)}
                    style={{ marginLeft: "1rem" }}
                  >
                    Copy Code
                  </button>
                </div>
                <p className="code-instructions">
                  Share this code with the recipient. The file will be available for 10 minutes.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="step-number">2</span>
              Download File (Receiver)
            </h3>
          </div>
          <div className="form-group">
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter transfer code"
                value={downloadCode}
                onChange={(e) => setDownloadCode(e.target.value)}
                className="form-input"
              />
              <button 
                className="btn btn-primary" 
                onClick={handleDownload} 
                disabled={isDownloading}
              >
                {isDownloading ? "Downloading..." : "Download File"}
              </button>
            </div>
            
            <div className="download-instructions">
              <h4>📝 Important Note:</h4>
              <p>
                When saving the downloaded file, you may need to manually specify the correct file extension 
                (e.g., .pdf, .txt, .jpg) in the filename to ensure the file opens properly.
              </p>
              <div className="example-files">
                <strong>Examples:</strong>
                <ul>
                  <li>Document → Save as "document.pdf"</li>
                  <li>Image → Save as "image.jpg"</li>
                  <li>Text → Save as "text.txt"</li>
                </ul>
              </div>
              <div className="security-note">
                <strong>🔒 Security:</strong> This system uses short-lived transfer codes (10-minute expiry) 
                and one-time downloads for maximum security. Files are automatically deleted after download.
              </div>
            </div>
            
            {downloadStatus && (
              <div className={`status-message ${downloadStatus.includes("success") ? "success" : "error"}`}>
                {downloadStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileTransferPage;

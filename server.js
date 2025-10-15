const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Error handling middleware for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.log('JSON Parse Error:', error.message);
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next();
});

const adapter = new FileSync("users.json");
const db = low(adapter);

db.defaults({ users: [], transfers: [] }).write();

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Multer setup for temp uploads
const upload = multer({ dest: "uploads/" });

// Generate random 6-char code
function generateCode() {
  return crypto.randomBytes(3).toString("hex");
}

// Existing auth endpoints omitted for brevity

// 1. Upload file and generate code
app.post("/api/transfer/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  const code = generateCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  // Save transfer info
  db.get("transfers")
    .push({
      code,
      filePath: req.file.path,
      originalName: req.file.originalname,
      expiresAt,
    })
    .write();

  res.json({ code });
});

// 2. Download file by code
app.get("/api/transfer/download/:code", (req, res) => {
  const code = req.params.code;

  const transfer = db
    .get("transfers")
    .find((t) => t.code === code)
    .value();

  if (!transfer) return res.status(404).send("Invalid or expired code");
  if (Date.now() > transfer.expiresAt) {
    // Delete expired transfer info and file
    db.get("transfers").remove({ code }).write();
    fs.unlinkSync(transfer.filePath);
    return res.status(404).send("Code expired");
  }

  // Set proper headers for file download
  res.setHeader('Content-Disposition', `attachment; filename="${transfer.originalName}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  
  // Stream file for download
  const fileStream = fs.createReadStream(transfer.filePath);
  fileStream.pipe(res);
  
  fileStream.on('end', () => {
    // Delete file and record after successful download
    db.get("transfers").remove({ code }).write();
    fs.unlinkSync(transfer.filePath);
  });
  
  fileStream.on('error', (err) => {
    console.error('File stream error:', err);
    res.status(500).send('Error downloading file');
  });
});

// Authentication endpoints
app.post("/api/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Check if user already exists
    const existingUser = db.get("users").find({ username }).value();
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    db.get("users")
      .push({
        id: Date.now().toString(),
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      })
      .write();

    res.json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Find user
    const user = db.get("users").find({ username }).value();
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user: { id: user.id, username: user.username } });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});

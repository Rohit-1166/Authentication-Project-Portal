require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');

const authController = require('./authController');
const projectController = require('./projectController');
const { authenticateToken } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static folder for uploaded zip files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
// 1. Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/refresh', authController.refresh);
app.post('/api/auth/logout', authController.logout);
app.get('/api/auth/me', authenticateToken, authController.me);

// 2. Submissions routes
app.post('/api/submissions/upload', authenticateToken, projectController.uploadSubmission);
app.get('/api/submissions', authenticateToken, projectController.getSubmissions);
app.get('/api/submissions/download/:id', authenticateToken, projectController.downloadSubmission);
app.delete('/api/submissions/:id', authenticateToken, projectController.deleteSubmission);

// 3. Project details route
app.get('/api/project/info', (req, res) => {
  res.json({
    title: "Backend Development Project: Authentication APIs with Refresh Token",
    introduction: "In this project, interns will design and develop authentication APIs including user login, registration, and refresh token mechanisms. The APIs should be implemented using Node.js and Express, with JWT (JSON Web Tokens) for access and refresh tokens. The project emphasizes security best practices, scalable architecture, and proper error handling.",
    objectives: [
      "Create a registration API that stores user details securely with hashed passwords.",
      "Develop a login API that issues both access and refresh tokens.",
      "Implement refresh token mechanism for generating new access tokens without re-login.",
      "Ensure proper validation, error handling, and token expiration management.",
      "Follow security best practices such as password hashing, input validation, and HTTPS readiness."
    ],
    deliverables: [
      "Functional APIs for registration, login, and token refresh.",
      "Secure handling of JWTs with proper expiration and refresh token rotation."
    ],
    evaluationCriteria: [
      "Security: Proper implementation of JWTs, password hashing, and token management.",
      "Code Quality: Readable, modular, and maintainable code with comments."
    ],
    references: [
      { name: "JWT (jsonwebtoken) Documentation", url: "https://github.com/auth0/node-jsonwebtoken" },
      { name: "bcrypt Documentation", url: "https://www.npmjs.com/package/bcrypt" },
      { name: "OAuth 2.0 and JWT Best Practices", url: "https://oauth.net/2/" }
    ]
  });
});

// Default path
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the Authentication Project Intern Portal API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

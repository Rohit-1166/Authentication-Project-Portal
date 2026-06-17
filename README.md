# ⚜ Developer Portal: Security Authentication & ZIP Validator

### 🎓 Built For: Intern Project Submission & Developer Assessment Portal

A premium, glassmorphic Developer Assessment Portal built specifically as an **Intern Project Submission Portal**. It helps manage intern assignments, verify code compliance, inspect submitted ZIP files in real-time, and run security tests on API inputs. The system utilizes industry-standard security principles (rotating JWT token families) and in-memory ZIP code inspection.

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live_Demo-Active-dfb76c?style=for-the-badge&logo=vercel&logoColor=white&labelColor=0d1425)](https://authentication-project-portal.vercel.app/)

</div>


---

## 🚀 Key Features

### 1. Robust Authentication & Refresh Token Rotation (RTR)
* **Short-lived JWTs**: Employs short-lived access tokens (15m expiry) and long-lived refresh tokens (7d).
* **Token Family Rotation**: Every refresh request rotates the active credentials. If a used refresh token is reused, the entire token family is immediately revoked to mitigate theft.
* **Unique `jti` Claim**: Access and refresh tokens carry unique IDs to prevent race-condition key clashes.
* **Hashed Credentials**: Passwords are securely hashed on registration using `bcryptjs`.

### 2. In-Memory ZIP File Extraction & Audit
* **Real-time ZIP Parser**: Parses uploaded zip archives on-the-fly using `adm-zip` without extracting them to disk.
* **Compliance Checks**: Enforces structural checks to verify that `package.json` and a primary entry point (`server.js`, `index.js`, or `app.js`) are included in the archive.
* **Security & Optimization Auditing**:
  * Detects `.env` files and issues warnings to prevent leaks of private environment keys.
  * Detects `node_modules` folders and prompts users to exclude them to optimize upload sizes.
* **Cryptographic Signatures**: Calculates and displays the SHA-256 checksum hash of the uploaded submission.

### 3. Interactive API Sandbox Playground
* **JWT Claims Decoder**: A live dashboard widget showing real-time token state, active claims, issues (`iat`), and expirations (`exp`).
* **Authentication Sandboxing**: Lets developers manually fire API calls, inspect raw JSON request/response headers, and watch token rotation happen dynamically.

### 4. Glassmorphic Luxury Design
* **Classy Obsidian & Warm Gold Theme**: Responsive layout styled with vanilla CSS custom variables, gradients, and subtle shadows.
* **Spring Transitions & Micro-Animations**: Features floating elements, staggered page load transitions, and animated vector SVGs for scanners, loaders, and completion checkmarks.

---

## 🛠 Tech Stack

* **Frontend**: React, Vite, Lucide React, Vanilla CSS3 (Custom animations)
* **Backend**: Node.js, Express, Multer, Mongoose (MongoDB ODM), jsonwebtoken, adm-zip, bcryptjs
* **Database**: MongoDB (Local or Atlas)
* **Task Runner**: Concurrently (Single-command monorepo runner)

---

## 📦 Directory Structure

```text
Authentication-Project/
├── backend/                  # Express API Server
│   ├── uploads/              # Storage folder for user zip uploads
│   ├── authController.js     # User registration, login, and JWT rotation logic
│   ├── projectController.js  # ZIP extraction, validation, and submission management
│   ├── middleware.js         # JWT verification middleware
│   ├── models.js             # Mongoose Schemas (User, RefreshToken, Submission)
│   ├── test_all_backend.js   # Automated 10-step integration test suite
│   ├── package.json          
│   └── .env.example          # Sample environment configurations
│
├── frontend/                 # Vite + React Client
│   ├── src/
│   │   ├── components/       # DashboardView, AuthView, ApiSandbox, Submissions, ProjectDocs
│   │   ├── App.jsx           # Routing and core states
│   │   └── index.css         # Theme design variables, transitions, and keyframes
│   ├── index.html
│   └── package.json
│
├── package.json              # Monorepo root runner
└── zip_submission.js         # Workspace packaging utility script
```

---

## 🔧 Step-by-Step Local Setup

### 📋 Prerequisites
* Install **[Node.js](https://nodejs.org/)** (v18.x or higher recommended)
* Install and run **[MongoDB Community Server](https://www.mongodb.com/try/download/community)** locally on port `27017`

### 💻 Installation & Configuration

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd Authentication-Project
   ```

2. **Install all dependencies** (Root, Backend, and Frontend):
   ```bash
   # Install root runner dependencies
   npm install

   # Install backend dependencies
   npm install --prefix backend

   # Install frontend dependencies
   npm install --prefix frontend
   ```

3. **Configure Environment Variables**:
   In the `backend/` folder, copy the example configurations:
   ```bash
   cp backend/.env.example backend/.env
   ```
   *Edit the newly created `backend/.env` file to customize database connections, secret keys, or expiration times if necessary.*

### 🚦 Running the Application

Start the backend server and frontend client concurrently using the root runner:
```bash
npm start
```

* **Frontend portal**: `http://localhost:5173/`
* **Backend API server**: `http://localhost:5000/`

---

## 🧪 Testing

The backend includes a comprehensive, automated **10-step integration test suite** that checks user creation, login, JWT token rotation family protection, and uploader validation for valid, invalid, and warning-level zip files.

Run the tests inside a separate terminal (while the server is running):
```bash
cd backend
node test_all_backend.js
```

---


## 🌐 Production Deployment

### 🐳 Backend Deployment (e.g. Render, Heroku)
1. Add environment variables (`MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) in your hosting provider's dashboard settings.
2. Set the build/start commands:
   * **Build command**: `npm install`
   * **Start command**: `node server.js` (inside `backend/` folder)

### 🎨 Frontend Deployment (e.g. Vercel, Netlify)
1. Configure your frontend to connect to your deployed backend URL. Change `http://localhost:5000` inside your components to your production API URL (best configured via React environment variables).
2. Set the build output configurations:
   * **Build command**: `npm run build`
   * **Output directory**: `dist/`

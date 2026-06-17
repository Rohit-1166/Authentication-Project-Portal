const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const AdmZip = require('adm-zip');
const { Submission } = require('./models');

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.zip') {
    return cb(new Error('Only ZIP files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('projectFile');

// Upload controller
const uploadSubmission = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a ZIP file' });
    }

    try {
      const filePath = req.file.path;
      
      // Calculate real SHA-256 Checksum
      const fileBuffer = fs.readFileSync(filePath);
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();

      let detectedFiles = [];
      let warnings = [];
      let packageJsonExists = false;
      let entrypointExists = false;
      let hasNodeModules = false;
      let hasEnvFile = false;

      try {
        const zip = new AdmZip(filePath);
        const zipEntries = zip.getEntries();

        zipEntries.forEach((entry) => {
          // Normalize paths
          const entryPath = entry.entryName.replace(/\\/g, '/');
          
          // Ignore system files / directories
          if (entryPath.includes('__MACOSX') || entryPath.includes('.DS_Store')) {
            return;
          }

          if (entry.isDirectory) {
            if (entryPath.includes('node_modules/')) {
              hasNodeModules = true;
            }
            return;
          }

          // It's a file
          const fileName = entryPath.split('/').pop();
          detectedFiles.push(entryPath);

          if (fileName === 'package.json') {
            packageJsonExists = true;
          }
          if (fileName === 'server.js' || fileName === 'index.js' || fileName === 'app.js') {
            entrypointExists = true;
          }
          if (fileName === '.env') {
            hasEnvFile = true;
          }
          if (entryPath.includes('node_modules/')) {
            hasNodeModules = true;
          }
        });
      } catch (zipErr) {
        console.error('ZIP read error:', zipErr);
        warnings.push('Failed to fully extract ZIP file: ' + zipErr.message);
      }

      // Check validation requirements
      const missingRequirements = [];
      if (!packageJsonExists) {
        missingRequirements.push('package.json');
      }
      if (!entrypointExists) {
        missingRequirements.push('server.js, index.js, or app.js');
      }

      const isValidated = packageJsonExists && entrypointExists;
      
      // Add specific warnings
      if (hasEnvFile) {
        warnings.push('Security Warning: .env file found in ZIP archive. Do not submit environment files with secrets.');
      }
      if (hasNodeModules) {
        warnings.push('Optimization Warning: node_modules folder found in ZIP. Exclude it to reduce upload size.');
      }

      const validationReport = {
        checksum,
        structureOk: isValidated,
        detectedFiles,
        warnings,
        missingRequirements,
        timestamp: new Date().toISOString()
      };

      const submission = new Submission({
        userId: req.user.userId,
        filename: req.file.originalname,
        filepath: req.file.filename, // Store relative filename in uploads directory
        filesize: req.file.size,
        status: isValidated ? 'Validated' : 'Failed',
        validationReport
      });

      await submission.save();

      res.status(201).json({
        message: isValidated 
          ? 'Project uploaded and validated successfully' 
          : 'Project uploaded but failed validation requirements',
        submission
      });
    } catch (dbErr) {
      console.error('Save Submission Error:', dbErr);
      res.status(500).json({ message: 'Server error saving submission data' });
    }
  });
};

// Retrieve user's submissions
const getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user.userId }).sort({ uploadDate: -1 });
    res.json({ submissions });
  } catch (error) {
    console.error('Get Submissions Error:', error);
    res.status(500).json({ message: 'Server error fetching submissions' });
  }
};

// Download submission file
const downloadSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findOne({ _id: id, userId: req.user.userId });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const filePath = path.join(__dirname, 'uploads', submission.filepath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Physical file not found on server' });
    }

    res.download(filePath, submission.filename);
  } catch (error) {
    console.error('Download Submission Error:', error);
    res.status(500).json({ message: 'Server error downloading file' });
  }
};

// Delete submission
const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findOneAndDelete({ _id: id, userId: req.user.userId });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Delete local physical file
    const filePath = path.join(__dirname, 'uploads', submission.filepath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Delete Submission Error:', error);
    res.status(500).json({ message: 'Server error deleting submission' });
  }
};

module.exports = {
  uploadSubmission,
  getSubmissions,
  downloadSubmission,
  deleteSubmission
};

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

console.log('=== CREATING PORTAL SUBMISSION ZIP ARCHIVE ===\n');

const projectRoot = __dirname;
const zipName = 'Authentication_Portal_Submission.zip';
const outputZipPath = path.join(projectRoot, zipName);

const zip = new AdmZip();

// Excluded patterns (relative to project root)
const excludeFolders = [
  'node_modules',
  'dist',
  'uploads',
  '.git',
  '.gemini',
  'brain'
];

const excludeFiles = [
  '.env',
  zipName
];

function shouldExclude(filePath) {
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
  const pathParts = relativePath.split('/');

  // Check if any directory in the path matches the excluded folder names
  const hasExcludedFolder = pathParts.some(part => excludeFolders.includes(part));
  if (hasExcludedFolder) return true;

  // Check if filename matches excluded files
  const filename = path.basename(filePath);
  if (excludeFiles.includes(filename)) return true;

  return false;
}

function addDirectoryToZip(dirPath) {
  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (shouldExclude(fullPath)) {
      return; // Skip excluded files/folders
    }

    if (stat.isDirectory()) {
      addDirectoryToZip(fullPath);
    } else if (stat.isFile()) {
      const relativePath = path.relative(projectRoot, fullPath);
      console.log(`Adding: ${relativePath}`);
      zip.addLocalFile(fullPath, path.dirname(relativePath));
    }
  });
}

try {
  addDirectoryToZip(projectRoot);
  console.log('\nWriting ZIP archive...');
  zip.writeZip(outputZipPath);
  console.log(`\n✔ SUCCESS: Created clean submission file at:\n${outputZipPath}\n`);
} catch (error) {
  console.error('\n✘ FAILED to create submission ZIP:', error.message);
}

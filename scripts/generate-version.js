import { writeFile, mkdir, copyFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate version info
const versionInfo = {
  version: new Date().toISOString(),
  buildTime: Date.now()
};

// Main function
async function generateVersion() {
  try {
    const rootDir = join(__dirname, '..');
    const publicDir = join(rootDir, 'public');
    const distDir = join(rootDir, 'dist');

    // Ensure directories exist
    await mkdir(publicDir, { recursive: true });
    await mkdir(distDir, { recursive: true });

    const versionJson = JSON.stringify(versionInfo, null, 2);

    // Write to public directory
    const publicPath = join(publicDir, 'version.json');
    await writeFile(publicPath, versionJson);

    // Write to dist directory
    const distPath = join(distDir, 'version.json');
    await writeFile(distPath, versionJson);

    console.log('Version files generated successfully');
    console.log('Version info:', versionInfo);
  } catch (error) {
    console.error('Error generating version files:', error);
    process.exit(1);
  }
}

// Run the function
generateVersion();

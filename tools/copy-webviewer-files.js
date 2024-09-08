import fs from 'fs-extra';
import path from 'path';

const copyFiles = async () => {
  const sourcePath = path.resolve('./node_modules/@pdftron/pdfjs-express-viewer/public');
  const destPath = path.resolve('./static/pdf-viewer-lib/');

  try {
    await fs.copy(sourcePath, destPath, { overwrite: true });
    console.log('WebViewer files copied over successfully');
  } catch (err) {
    console.error(err);
  }
};

copyFiles(); 
import multer from 'multer';
const imageExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (imageExtensions[file.mimetype]) {
      callback(null, true);
      return;
    }
    const error = new Error('Only JPG, PNG, and WebP images are allowed.');
    error.status = 400;
    callback(error, false);
  }
});

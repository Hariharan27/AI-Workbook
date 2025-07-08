const path = require('path');

// For local uploads, just return the file path and type
exports.uploadFile = async (file, options = {}) => {
  // file.path is the local path set by multer
  return {
    url: `/uploads/${path.basename(file.path)}`,
    type: file.mimetype
  };
};

// If you have deleteFile or other methods, you can stub them for local dev
exports.deleteFile = async (publicId, type) => {
  // No-op for local
  return true;
}; 
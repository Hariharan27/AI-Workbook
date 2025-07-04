const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class MediaService {
  constructor() {
    this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv'];
    this.maxImageSize = 10 * 1024 * 1024; // 10MB
    this.maxVideoSize = 100 * 1024 * 1024; // 100MB
  }

  // Validate file type and size
  validateFile(file) {
    const { mimetype, size } = file;
    
    if (!this.allowedImageTypes.includes(mimetype) && !this.allowedVideoTypes.includes(mimetype)) {
      throw new Error('Invalid file type. Only images and videos are allowed.');
    }
    
    const maxSize = this.allowedImageTypes.includes(mimetype) ? this.maxImageSize : this.maxVideoSize;
    if (size > maxSize) {
      throw new Error(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
    }
    
    return true;
  }

  // Process image with Sharp before upload
  async processImage(buffer, options = {}) {
    const {
      width = 1920,
      height = 1080,
      quality = 80,
      format = 'webp'
    } = options;

    try {
      const processedBuffer = await sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality })
        .toBuffer();

      return processedBuffer;
    } catch (error) {
      throw new Error('Failed to process image: ' + error.message);
    }
  }

  // Generate thumbnail for image
  async generateThumbnail(buffer, options = {}) {
    const {
      width = 300,
      height = 300,
      quality = 70
    } = options;

    try {
      const thumbnailBuffer = await sharp(buffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality })
        .toBuffer();

      return thumbnailBuffer;
    } catch (error) {
      throw new Error('Failed to generate thumbnail: ' + error.message);
    }
  }

  // Upload file to Cloudinary
  async uploadFile(file, options = {}) {
    const {
      folder = 'ideatorpechu',
      resourceType = 'auto',
      transformation = []
    } = options;

    try {
      this.validateFile(file);

      const uploadOptions = {
        folder,
        resource_type: resourceType,
        transformation,
        eager: [
          { width: 300, height: 300, crop: 'fill', quality: 70 }
        ],
        eager_async: true
      };

      // For images, process with Sharp first
      if (this.allowedImageTypes.includes(file.mimetype)) {
        const processedBuffer = await this.processImage(file.buffer);
        const thumbnailBuffer = await this.generateThumbnail(file.buffer);

        // Upload main image
        const mainResult = await this.uploadBuffer(processedBuffer, {
          ...uploadOptions,
          public_id: `${folder}/${Date.now()}_main`
        });

        // Upload thumbnail
        const thumbnailResult = await this.uploadBuffer(thumbnailBuffer, {
          ...uploadOptions,
          public_id: `${folder}/${Date.now()}_thumb`,
          transformation: [{ width: 300, height: 300, crop: 'fill' }]
        });

        return {
          url: mainResult.secure_url,
          thumbnail: thumbnailResult.secure_url,
          publicId: mainResult.public_id,
          type: 'image',
          metadata: {
            size: file.size,
            format: file.mimetype,
            dimensions: {
              width: mainResult.width,
              height: mainResult.height
            }
          }
        };
      }

      // For videos, upload directly
      if (this.allowedVideoTypes.includes(file.mimetype)) {
        const result = await this.uploadBuffer(file.buffer, {
          ...uploadOptions,
          resource_type: 'video'
        });

        return {
          url: result.secure_url,
          thumbnail: result.thumbnail_url,
          publicId: result.public_id,
          type: 'video',
          metadata: {
            size: file.size,
            format: file.mimetype,
            duration: result.duration,
            dimensions: {
              width: result.width,
              height: result.height
            }
          }
        };
      }

    } catch (error) {
      throw new Error('Upload failed: ' + error.message);
    }
  }

  // Upload buffer to Cloudinary
  async uploadBuffer(buffer, options = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  // Delete file from Cloudinary
  async deleteFile(publicId, resourceType = 'auto') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
      return result;
    } catch (error) {
      throw new Error('Delete failed: ' + error.message);
    }
  }

  // Get file info from Cloudinary
  async getFileInfo(publicId, resourceType = 'auto') {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType
      });
      return result;
    } catch (error) {
      throw new Error('Failed to get file info: ' + error.message);
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(files, options = {}) {
    const uploadPromises = files.map(file => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  // Generate optimized URL for different devices
  generateOptimizedUrl(publicId, options = {}) {
    const {
      width = 'auto',
      height = 'auto',
      quality = 'auto',
      format = 'auto'
    } = options;

    const transformation = [
      { width, height, quality, fetch_format: format }
    ];

    return cloudinary.url(publicId, {
      transformation,
      secure: true
    });
  }
}

module.exports = new MediaService(); 
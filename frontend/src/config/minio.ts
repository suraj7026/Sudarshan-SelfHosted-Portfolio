/**
 * MinIO Configuration for Assets Storage
 * 
 * Assets (resume, images) are stored in MinIO object storage and served via Nginx proxy.
 * 
 * Setup:
 * 1. MinIO runs at: http://surajhomeserver:9000 (API) and :9001 (Console)
 * 2. Bucket: surajwebsite
 * 3. Nginx proxies /assets/ requests to MinIO
 */

// MinIO configuration
export const MINIO_CONFIG = {
  // Base URL for the object storage (Direct S3 access)
  baseUrl: 'https://s3.sudarshanrajagopalan.one',

  // Bucket name
  bucket: 'surajwebsite',

  // Asset paths in MinIO
  paths: {
    resume: 'resume/SUDARSHAN-RAJAGOPALAN-Resume.pdf',
    profileImage: 'images/suraj.jpg',
    profileImageNoBg: 'images/suraj_no_bg.png',
  },

  // Helper function to generate asset URLs
  getAssetUrl(path: string) {
    return `${this.baseUrl}/${this.bucket}/${path}`;
  },

  // Full URLs for assets
  get resumeUrl() {
    return this.getAssetUrl(this.paths.resume);
  },

  get profileImageUrl() {
    return this.getAssetUrl(this.paths.profileImage);
  },

  get profileImageNoBgUrl() {
    return this.getAssetUrl(this.paths.profileImageNoBg);
  },
};

// Export commonly used URLs for convenience
export const RESUME_URL = MINIO_CONFIG.resumeUrl;
export const PROFILE_IMAGE_URL = MINIO_CONFIG.profileImageUrl;
export const PROFILE_IMAGE_NO_BG_URL = MINIO_CONFIG.profileImageNoBgUrl;

// For local development (if you want to test without Nginx)
// Uncomment these and use them if testing locally:
// export const RESUME_URL = `http://localhost:9000/surajwebsite/${MINIO_CONFIG.paths.resume}`;
// export const PROFILE_IMAGE_URL = `http://localhost:9000/surajwebsite/${MINIO_CONFIG.paths.profileImage}`;
// export const PROFILE_IMAGE_NO_BG_URL = `http://localhost:9000/surajwebsite/${MINIO_CONFIG.paths.profileImageNoBg}`;

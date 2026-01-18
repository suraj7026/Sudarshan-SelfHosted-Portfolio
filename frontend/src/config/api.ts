/**
 * API Configuration for Backend Connection
 * 
 * The Go backend serves portfolio data from PostgreSQL.
 * Default: http://localhost:8080
 */

// Use environment variable or fallback to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const API_CONFIG = {
    baseUrl: API_BASE_URL,
    endpoints: {
        profile: '/api/v1/profile',
        experience: '/api/v1/experience',
        projects: '/api/v1/projects',
        skills: '/api/v1/skills',
        certifications: '/api/v1/certifications',
    },

    getUrl(endpoint: keyof typeof this.endpoints) {
        return `${this.baseUrl}${this.endpoints[endpoint]}`;
    }
};

// Export individual endpoints for convenience
export const API_ENDPOINTS = {
    profile: `${API_BASE_URL}/api/v1/profile`,
    experience: `${API_BASE_URL}/api/v1/experience`,
    projects: `${API_BASE_URL}/api/v1/projects`,
    skills: `${API_BASE_URL}/api/v1/skills`,
    certifications: `${API_BASE_URL}/api/v1/certifications`,
};

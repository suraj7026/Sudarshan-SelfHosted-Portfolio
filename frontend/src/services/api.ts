/**
 * API Service for fetching portfolio data from the Go backend.
 * Uses sessionStorage for caching to reduce API calls.
 */

import { API_ENDPOINTS } from '../config/api';

// Cache keys
const CACHE_KEYS = {
    profile: 'portfolio_profile',
    experience: 'portfolio_experience',
    projects: 'portfolio_projects',
    skills: 'portfolio_skills',
    certifications: 'portfolio_certifications',
};

// Types matching the Go backend models
export interface Profile {
    id: number;
    name: string;
    title: string;
    subtitle: string;
    about_me: string;
    resume_url: string;
    social_links: Record<string, string>;
}

export interface Experience {
    id: number;
    company: string;
    role: string;
    start_date: string;
    end_date: string | null;
    location: string;
    achievements: string[];
}

export interface Project {
    id: number;
    title: string;
    description: string;
    tech_stack: string[];
    repo_link: string;
    live_link: string;
    featured: boolean;
    display_order: number;
}

export interface Skill {
    id: number;
    category: string;
    skill: string;
    description: string;
    icon_name: string;
    icon_color: string;
}

export interface Certification {
    id: number;
    name: string;
    issuer: string;
    issue_date: string;
    credential_url: string;
    display_order: number;
}

// Helper to get cached data from sessionStorage
function getFromCache<T>(key: string): T | null {
    try {
        const cached = sessionStorage.getItem(key);
        if (cached) {
            return JSON.parse(cached) as T;
        }
    } catch (error) {
        console.error('Error reading from cache:', error);
    }
    return null;
}

// Helper to save data to sessionStorage
function saveToCache<T>(key: string, data: T): void {
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to cache:', error);
    }
}

// API Fetch functions with caching
export async function fetchProfile(): Promise<Profile | null> {
    // Check cache first
    const cached = getFromCache<Profile>(CACHE_KEYS.profile);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(API_ENDPOINTS.profile);
        if (!response.ok) return null;
        const data = await response.json();
        saveToCache(CACHE_KEYS.profile, data);
        return data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

export async function fetchExperience(): Promise<Experience[]> {
    // Check cache first
    const cached = getFromCache<Experience[]>(CACHE_KEYS.experience);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(API_ENDPOINTS.experience);
        if (!response.ok) return [];
        const data = await response.json();
        saveToCache(CACHE_KEYS.experience, data);
        return data;
    } catch (error) {
        console.error('Error fetching experience:', error);
        return [];
    }
}

export async function fetchProjects(featured?: boolean): Promise<Project[]> {
    // Use different cache key for featured filter
    const cacheKey = featured ? `${CACHE_KEYS.projects}_featured` : CACHE_KEYS.projects;

    // Check cache first
    const cached = getFromCache<Project[]>(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        let url = API_ENDPOINTS.projects;
        if (featured) {
            url += '?featured=true';
        }
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        saveToCache(cacheKey, data);
        return data;
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}

export async function fetchSkills(): Promise<Skill[]> {
    // Check cache first
    const cached = getFromCache<Skill[]>(CACHE_KEYS.skills);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(API_ENDPOINTS.skills);
        if (!response.ok) return [];
        const data = await response.json();
        saveToCache(CACHE_KEYS.skills, data);
        return data;
    } catch (error) {
        console.error('Error fetching skills:', error);
        return [];
    }
}

export async function fetchCertifications(): Promise<Certification[]> {
    // Check cache first
    const cached = getFromCache<Certification[]>(CACHE_KEYS.certifications);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(API_ENDPOINTS.certifications);
        if (!response.ok) return [];
        const data = await response.json();
        saveToCache(CACHE_KEYS.certifications, data);
        return data;
    } catch (error) {
        console.error('Error fetching certifications:', error);
        return [];
    }
}

// Helper to format dates from API (e.g., "2025-07-01T00:00:00Z" -> "07/2025")
export function formatDate(dateString: string | null): string {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
}

// Clear all cached data (useful for refresh)
export function clearCache(): void {
    Object.values(CACHE_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
    });
    sessionStorage.removeItem(`${CACHE_KEYS.projects}_featured`);
}

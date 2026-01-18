package models

import "time"

// Profile maps to the 'profile' table
type Profile struct {
    ID          int                    `json:"id"`
    Name        string                 `json:"name"`
    Title       string                 `json:"title"`
    Subtitle    string                 `json:"subtitle"`
    AboutMe     string                 `json:"about_me"`
    ResumeURL   string                 `json:"resume_url"`
    SocialLinks map[string]string      `json:"social_links"` // Maps JSONB to Go Map
}

// Experience maps to the 'experience' table
type Experience struct {
    ID           int       `json:"id"`
    Company      string    `json:"company"`
    Role         string    `json:"role"`
    StartDate    time.Time `json:"start_date"`
    EndDate      *time.Time `json:"end_date"` // Pointer allows null (for "Present")
    Location     string    `json:"location"`
    Achievements []string  `json:"achievements"` // Maps JSONB array to string slice
}

// Project maps to the 'projects' table
type Project struct {
    ID           int       `json:"id"`
    Title        string    `json:"title"`
    Description  string    `json:"description"`
    TechStack    []string  `json:"tech_stack"`   // Maps JSONB array
    RepoLink     string    `json:"repo_link"`
    LiveLink     string    `json:"live_link"`
    Featured     bool      `json:"featured"`
    DisplayOrder int       `json:"display_order"`
}

// Skill maps to the 'skills' table
type Skill struct {
	ID          int    `json:"id"`
	Category    string `json:"category"`
	Skill       string `json:"skill"`
	Description string `json:"description"`
	IconName    string `json:"icon_name"`
	IconColor   string `json:"icon_color"`
}

// Certification maps to the 'certifications' table
type Certification struct {
    ID            int       `json:"id"`
    Name          string    `json:"name"`
    Issuer        string    `json:"issuer"`
    IssueDate     time.Time `json:"issue_date"`
    CredentialURL string    `json:"credential_url"`
    DisplayOrder  int       `json:"display_order"`
}

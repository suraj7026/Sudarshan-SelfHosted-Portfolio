package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/suraj/portfolio-api/internal/models"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// GetProfile returns the single profile row
func (r *Repository) GetProfile(ctx context.Context) (*models.Profile, error) {
	// Use COALESCE to handle potential NULLs for text fields
	query := `SELECT id, name, COALESCE(title, ''), COALESCE(subtitle, ''), COALESCE(about_me, ''), COALESCE(resume_url, ''), social_links 
	          FROM profile LIMIT 1;`

	var p models.Profile
	var socialLinksBytes []byte

	err := r.db.QueryRow(ctx, query).Scan(
		&p.ID, &p.Name, &p.Title, &p.Subtitle, &p.AboutMe, &p.ResumeURL, &socialLinksBytes,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to scan profile: %w", err)
	}

	if len(socialLinksBytes) > 0 {
		if err := json.Unmarshal(socialLinksBytes, &p.SocialLinks); err != nil {
			return nil, fmt.Errorf("failed to unmarshal social_links: %w", err)
		}
	}

	return &p, nil
}

// GetExperience returns list ordered by start_date DESC
func (r *Repository) GetExperience(ctx context.Context) ([]models.Experience, error) {
	// end_date is nullable (pointer in struct), so no COALESCE needed there.
	query := `SELECT id, company, role, start_date, end_date, COALESCE(location, ''), achievements 
	          FROM experience ORDER BY start_date DESC;`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query experience: %w", err)
	}
	defer rows.Close()

	var experiences []models.Experience
	for rows.Next() {
		var e models.Experience
		var achievementsBytes []byte

		if err := rows.Scan(
			&e.ID, &e.Company, &e.Role, &e.StartDate, &e.EndDate, &e.Location, &achievementsBytes,
		); err != nil {
			return nil, fmt.Errorf("failed to scan experience: %w", err)
		}

		if len(achievementsBytes) > 0 {
			if err := json.Unmarshal(achievementsBytes, &e.Achievements); err != nil {
				return nil, fmt.Errorf("failed to unmarshal achievements: %w", err)
			}
		}
		experiences = append(experiences, e)
	}

	return experiences, rows.Err()
}

// GetProjects returns all projects
func (r *Repository) GetProjects(ctx context.Context) ([]models.Project, error) {
	query := `SELECT id, title, COALESCE(description, ''), tech_stack, COALESCE(repo_link, ''), COALESCE(live_link, ''), featured, display_order
	          FROM projects ORDER BY display_order ASC;`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query projects: %w", err)
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var p models.Project
		var techStackBytes []byte

		if err := rows.Scan(
			&p.ID, &p.Title, &p.Description, &techStackBytes, &p.RepoLink, &p.LiveLink, &p.Featured, &p.DisplayOrder,
		); err != nil {
			return nil, fmt.Errorf("failed to scan project: %w", err)
		}

		if len(techStackBytes) > 0 {
			if err := json.Unmarshal(techStackBytes, &p.TechStack); err != nil {
				return nil, fmt.Errorf("failed to unmarshal tech_stack: %w", err)
			}
		}
		projects = append(projects, p)
	}

	return projects, rows.Err()
}

// GetSkills returns all skills ordered by category and id
func (r *Repository) GetSkills(ctx context.Context) ([]models.Skill, error) {
	query := `SELECT id, category, skill, description, icon_name, icon_color 
	          FROM skills 
	          ORDER BY category ASC, id ASC;`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query skills: %w", err)
	}
	defer rows.Close()

	var skills []models.Skill
	for rows.Next() {
		var s models.Skill

		if err := rows.Scan(&s.ID, &s.Category, &s.Skill, &s.Description, &s.IconName, &s.IconColor); err != nil {
			return nil, fmt.Errorf("failed to scan skill: %w", err)
		}

		skills = append(skills, s)
	}

	return skills, rows.Err()
}

// GetCertifications returns all certifications
func (r *Repository) GetCertifications(ctx context.Context) ([]models.Certification, error) {
	query := `SELECT id, name, issuer, issue_date, COALESCE(credential_url, ''), display_order 
	          FROM certifications 
	          ORDER BY display_order ASC, issue_date DESC;`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query certifications: %w", err)
	}
	defer rows.Close()

	var certs []models.Certification
	for rows.Next() {
		var c models.Certification

		if err := rows.Scan(
			&c.ID, &c.Name, &c.Issuer, &c.IssueDate, &c.CredentialURL, &c.DisplayOrder,
		); err != nil {
			return nil, fmt.Errorf("failed to scan certification: %w", err)
		}

		certs = append(certs, c)
	}

	return certs, rows.Err()
}

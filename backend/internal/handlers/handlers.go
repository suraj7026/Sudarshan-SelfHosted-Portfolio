package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/suraj/portfolio-api/internal/repository"
)

type Handler struct {
	Repo *repository.Repository
}

func NewHandler(repo *repository.Repository) *Handler {
	return &Handler{Repo: repo}
}

// GetProfile handles GET /api/v1/profile
func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	profile, err := h.Repo.GetProfile(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch profile")
		return
	}
	if profile == nil {
		respondError(w, http.StatusNotFound, "Profile not found")
		return
	}
	respondJSON(w, http.StatusOK, profile)
}

// GetExperience handles GET /api/v1/experience
func (h *Handler) GetExperience(w http.ResponseWriter, r *http.Request) {
	experiences, err := h.Repo.GetExperience(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch experience")
		return
	}
	respondJSON(w, http.StatusOK, experiences)
}

// GetProjects handles GET /api/v1/projects
// Supports ?featured=true
func (h *Handler) GetProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := h.Repo.GetProjects(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch projects")
		return
	}

	// Filter by featured if requested
	featuredParam := r.URL.Query().Get("featured")
	if featuredParam == "true" {
		// Use slice filtering
		filtered := projects[:0]
		for _, p := range projects {
			if p.Featured {
				filtered = append(filtered, p)
			}
		}
		projects = filtered
	}

	respondJSON(w, http.StatusOK, projects)
}

// GetSkills handles GET /api/v1/skills
func (h *Handler) GetSkills(w http.ResponseWriter, r *http.Request) {
	skills, err := h.Repo.GetSkills(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch skills")
		return
	}
	respondJSON(w, http.StatusOK, skills)
}

// GetCertifications handles GET /api/v1/certifications
func (h *Handler) GetCertifications(w http.ResponseWriter, r *http.Request) {
	certs, err := h.Repo.GetCertifications(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch certifications")
		return
	}
	respondJSON(w, http.StatusOK, certs)
}

// respondJSON writes a JSON response
func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// respondError writes an error response
func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

import React, { useState, useEffect } from 'react';
import { FaRobot, FaBrain, FaMicroscope, FaCode, FaDatabase, FaCloud, FaGithub, FaExternalLinkAlt } from 'react-icons/fa';
import { fetchProjects, Project as ProjectType } from '../services/api';

// Icon mapping based on project title or keywords
const getProjectIcon = (title: string): React.ReactNode => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('email') || lowerTitle.includes('agent') || lowerTitle.includes('automation')) {
        return <FaRobot />;
    }
    if (lowerTitle.includes('speech') || lowerTitle.includes('emotion') || lowerTitle.includes('nlp')) {
        return <FaBrain />;
    }
    if (lowerTitle.includes('medical') || lowerTitle.includes('tumor') || lowerTitle.includes('detection')) {
        return <FaMicroscope />;
    }
    if (lowerTitle.includes('database') || lowerTitle.includes('sql')) {
        return <FaDatabase />;
    }
    if (lowerTitle.includes('cloud') || lowerTitle.includes('aws') || lowerTitle.includes('deploy')) {
        return <FaCloud />;
    }
    return <FaCode />;
};

// Color mapping based on project index or keywords
const getProjectColor = (index: number, title: string): string => {
    const colors = ['#00FF88', '#00ADD8', '#FF4D4D', '#FFD700', '#9B59B6', '#3498DB'];
    return colors[index % colors.length];
};

const Projects: React.FC = () => {
    const [projects, setProjects] = useState<ProjectType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProjects = async () => {
            const data = await fetchProjects();
            setProjects(data);
            setLoading(false);
        };
        loadProjects();
    }, []);

    if (loading) {
        return (
            <section id="projects" className="section bg-secondary">
                <div className="container">
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        Loading...
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="projects" className="section bg-secondary">
            <div className="container">
                <div style={{ marginBottom: 0 }}>
                    <div style={{
                        color: 'var(--color-accent)',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: 'var(--spacing-xs)'
                    }}>
                        / MY PORTFOLIO
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', maxWidth: '600px', margin: 0 }}>
                        Take a look at the latest projects I've done
                    </h2>
                </div>

                <div className="projects-grid">
                    {projects.map((project, index) => {
                        const color = getProjectColor(index, project.title);
                        const icon = getProjectIcon(project.title);

                        return (
                            <div
                                key={project.id}
                                className={`project-card ${project.featured ? 'featured' : ''}`}
                                style={{ 
                                    animationDelay: `${index * 0.1}s`,
                                    cursor: project.repo_link ? 'pointer' : 'default'
                                }}
                                onClick={() => {
                                    if (project.repo_link) {
                                        window.open(project.repo_link, '_blank', 'noopener,noreferrer');
                                    }
                                }}
                            >
                                <div className="project-header">
                                    <div className="project-icon-placeholder" style={{
                                        color: color,
                                        borderColor: color
                                    }}>
                                        {icon}
                                    </div>
                                    <div className="project-tags-group">
                                        {project.tech_stack?.map(t => (
                                            <span key={t} className="project-tag-pill">{t}</span>
                                        ))}
                                    </div>
                                </div>

                                <h3 className="project-title">{project.title}</h3>
                                <p className="project-desc">{project.description}</p>

                                <div className="project-image-mockup">
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-20px',
                                        right: '-20px',
                                        width: '120%',
                                        height: '100%',
                                        background: `radial-gradient(circle at bottom right, ${color}20 0%, transparent 70%)`
                                    }}></div>
                                </div>

                                {/* Project Links Footer */}
                                <div style={{
                                    display: 'flex',
                                    gap: 'var(--spacing-md)',
                                    marginTop: 'var(--spacing-lg)',
                                    alignItems: 'center'
                                }}>
                                    {project.repo_link && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            color: 'var(--color-text-secondary)',
                                            fontSize: '0.9rem'
                                        }}>
                                            <FaGithub size={18} />
                                            <span style={{ fontSize: '0.85rem' }}>View Code</span>
                                        </div>
                                    )}
                                    {project.live_link && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(project.live_link, '_blank', 'noopener,noreferrer');
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 16px',
                                                backgroundColor: color,
                                                color: 'var(--color-bg-primary)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                marginLeft: 'auto'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = `0 4px 12px ${color}40`;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <span>View Live</span>
                                            <FaExternalLinkAlt size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Projects;

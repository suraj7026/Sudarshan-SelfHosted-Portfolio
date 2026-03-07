import React, { useState, useEffect } from 'react';
import { FaRobot, FaBrain, FaMicroscope, FaCode, FaDatabase, FaCloud, FaGithub, FaExternalLinkAlt } from 'react-icons/fa';
import { fetchProjects, Project as ProjectType } from '../services/api';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
// import required modules
import { EffectCards, Autoplay, Keyboard, Mousewheel, Pagination } from 'swiper/modules';
import 'swiper/css/pagination';

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
        <section id="projects" className="section bg-secondary" style={{ overflow: 'hidden' }}>
            <div className="container" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <div style={{ marginBottom: 'var(--spacing-2xl)', width: '100%' }}>
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

                <div style={{ width: '100%', maxWidth: '500px', padding: '20px 0' }}>
                    <Swiper
                        effect={'cards'}
                        grabCursor={true}
                        modules={[EffectCards, Autoplay, Keyboard, Mousewheel, Pagination]}
                        pagination={{
                            clickable: true,
                            dynamicBullets: true,
                        }}
                        autoplay={{
                            delay: 4000,
                            disableOnInteraction: false,
                        }}
                        keyboard={{
                            enabled: true,
                        }}
                        mousewheel={{
                            forceToAxis: true,
                        }}
                        className="mySwiper projects-swiper"
                        onSlideChange={(swiper: SwiperClass) => {
                            const color = getProjectColor(projects.length > 0 ? swiper.realIndex : 0, projects[swiper.realIndex]?.title || '');
                            swiper.el.style.setProperty('--active-project-color', color);
                        }}
                        onInit={(swiper: SwiperClass) => {
                            if (projects.length > 0) {
                                const color = getProjectColor(0, projects[0]?.title || '');
                                swiper.el.style.setProperty('--active-project-color', color);
                            }
                        }}
                    >
                        {projects.map((project, index) => {
                            const color = getProjectColor(index, project.title);
                            const icon = getProjectIcon(project.title);

                            return (
                                <SwiperSlide key={project.id} style={{ display: 'flex', height: 'auto', alignSelf: 'stretch' }}>
                                    <div
                                        className={`project-card ${project.featured ? 'featured' : ''}`}
                                        style={{
                                            flex: 1,
                                            boxShadow: 'var(--shadow-lg)',
                                            margin: 0,
                                            transform: 'none', // Override hover transform for swiper cards
                                            cursor: project.repo_link ? 'pointer' : 'grab'
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
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                </div>
            </div>
        </section>
    );
};

export default Projects;

import React, { useState, useEffect } from 'react';
import { fetchExperience, formatDate, Experience as ExperienceType } from '../services/api';

const Experience: React.FC = () => {
    const [experiences, setExperiences] = useState<ExperienceType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadExperiences = async () => {
            const data = await fetchExperience();
            setExperiences(data);
            setLoading(false);
        };
        loadExperiences();
    }, []);

    // Format duration from API dates
    const formatDuration = (startDate: string, endDate: string | null): string => {
        return `${formatDate(startDate)} – ${formatDate(endDate)}`;
    };

    if (loading) {
        return (
            <section id="experience" className="section">
                <div className="container">
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        Loading...
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="experience" className="section">
            <div className="container">
                <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                    <div style={{
                        color: 'var(--color-accent)',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: 'var(--spacing-xs)'
                    }}>
                        / WORK EXPERIENCE
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: 'var(--color-text-primary)' }}>
                        My professional journey
                    </h2>
                </div>

                <div className="experience-timeline">
                    {/* Visual Vertical Line */}
                    <div className="timeline-thread"></div>

                    {experiences.map((exp, index) => (
                        <div key={exp.id} className="timeline-card-wrapper" style={{ animationDelay: `${index * 0.2}s` }}>
                            <div className="experience-card-thread">
                                <div className="exp-header">
                                    <div>
                                        <h3 className="exp-company">{exp.company}</h3>
                                        <div className="exp-role">{exp.role}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="exp-duration">{formatDuration(exp.start_date, exp.end_date)}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                                            {exp.location}
                                        </div>
                                    </div>
                                </div>

                                <ul className="exp-achievements">
                                    {exp.achievements?.map((achievement, i) => (
                                        <li key={i}>{achievement}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Experience;

import React, { useEffect, useState } from 'react';
import { fetchExperience, formatDate, Experience as ExperienceType } from '../services/api';
import { Reveal, SectionHeader, ParallaxWord } from './metro';
import experienceSnapshot from '../data/experience.json';

const Experience: React.FC = () => {
  const [experiences, setExperiences] = useState<ExperienceType[]>(experienceSnapshot);

  useEffect(() => {
    const loadExperiences = async () => {
      const data = await fetchExperience();
      setExperiences(data);
    };
    loadExperiences();
  }, []);

  const formatDuration = (exp: ExperienceType): string =>
    `${formatDate(exp.start_date)} – ${exp.end_date ? formatDate(exp.end_date) : 'present'}`;

  return (
    <section id="experience" className="metro-section metro-t-section">
      <ParallaxWord word="work" />
      <div className="container">
        <div className="metro-section-sidebar">
          <Reveal>
            <SectionHeader title="experience" />
          </Reveal>
        </div>

        <div
          id="experience-strip"
          className="metro-experience-list metro-vertical-scroll"
          role="region"
          aria-label="Experience, vertically scrollable"
          tabIndex={0}
        >
          {experiences.map((exp, index) => (
            <Reveal
              key={exp.id}
              delay={Math.min(index * 0.08, 0.4)}
            >
              <article className="metro-exp">
                <div className="metro-exp-identity">
                  <span className="metro-exp-mark" aria-hidden="true" />
                  <h3 className="metro-exp-company">{exp.company}</h3>
                </div>
                <div className="metro-exp-content">
                  <div className="metro-exp-head">
                    <p className="metro-exp-role">{exp.role}</p>
                    <div className="metro-exp-meta">
                      <span className="metro-exp-when">{formatDuration(exp)}</span>
                      {exp.location && <span className="metro-exp-where">{exp.location}</span>}
                    </div>
                  </div>
                  {exp.achievements?.length > 0 && (
                    <ul className="metro-exp-points">
                      {exp.achievements.map((achievement, i) => (
                        <li key={i}>{achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;

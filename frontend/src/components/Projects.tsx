import React, { useEffect, useState } from 'react';
import { fetchProjects, Project as ProjectType } from '../services/api';
import { Reveal, SectionHeader, ParallaxWord } from './metro';
import projectsSnapshot from '../data/projects.json';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<ProjectType[]>(projectsSnapshot);

  useEffect(() => {
    const loadProjects = async () => {
      const data = await fetchProjects();
      setProjects(data);
    };
    loadProjects();
  }, []);

  return (
    <section id="projects" className="metro-section">
      <ParallaxWord word="build" />
      <div className="container">
        <Reveal>
          <SectionHeader title="projects" />
        </Reveal>

        <div className="metro-project-list">
          {projects.map((project, index) => {
            const points = project.description
              .split('•')
              .map((point) => point.replace(/\\n/g, ' ').trim())
              .filter(Boolean);

            return (
              <Reveal key={project.id} delay={Math.min(index * 0.04, 0.12)}>
                <article className="metro-project">
                  <div className="metro-project-identity">
                    {project.featured && <span className="metro-project-featured-label">featured project</span>}
                    <h3 className="metro-project-title">{project.title}</h3>
                    <div className="metro-project-links">
                      {project.repo_link && (
                        <a
                          className="metro-project-link"
                          href={project.repo_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          view code <span aria-hidden="true">↗</span>
                        </a>
                      )}
                      {project.live_link && (
                        <a
                          className="metro-project-link"
                          href={project.live_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          visit project <span aria-hidden="true">↗</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="metro-project-story">
                    {points.length > 0 && <p className="metro-project-lead">{points[0]}</p>}
                    {points.length > 1 && (
                      <ul className="metro-project-points">
                        {points.slice(1).map((point, i) => <li key={i}>{point}</li>)}
                      </ul>
                    )}
                    {project.tech_stack?.length > 0 && (
                      <div className="metro-project-stack">
                        <span>built with</span>
                        <p>{project.tech_stack.join(' / ')}</p>
                      </div>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Projects;

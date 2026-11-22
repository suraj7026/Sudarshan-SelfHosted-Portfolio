import React, { useEffect, useState } from 'react';
import { RESUME_URL } from '../config/minio';
import profileImage from '../assets/hero-profile.png';
import experienceSnapshot from '../data/experience.json';
import { fetchExperience, Experience } from '../services/api';
import { Reveal, LiveTile } from './metro';

/**
 * The start screen: lock-screen typography, then a grid of live tiles —
 * large, wide, and medium sizes like a WP8 home.
 */
const About: React.FC = () => {
  const [companies, setCompanies] = useState<string[]>(experienceSnapshot.map(exp => exp.company));

  useEffect(() => {
    const loadCompanies = async () => {
      const experiences = await fetchExperience();
      const previous = Array.from(
        new Set(
          experiences
            .filter((exp: Experience) => exp.company.toLowerCase() !== 'google')
            .map((exp: Experience) => exp.company)
        )
      );
      setCompanies(previous);
    };
    loadCompanies();
  }, []);

  return (
    <section id="about" className="metro-section metro-hero">
      <div className="container">
        <div className="metro-hero-intro">
          <div className="metro-hero-photo">
            <img src={profileImage} alt="Portrait of Sudarshan Rajagopalan" />
          </div>
          <Reveal>
          <h1 className="metro-hero-name">
            <span>sudarshan</span>
            <span>
              rajagopalan<span className="metro-period" aria-hidden="true" />
            </span>
          </h1>
          <p className="metro-hero-role">cloud ai engineer at google</p>
          <p className="metro-hero-sub">
            i build scalable backend systems, ai applications, and cloud infrastructure — end to end.
          </p>
          </Reveal>
        </div>

        {/* The start screen */}
        <Reveal className="metro-start" delay={0.15}>
          {/* Wide live tile — cycles what i do */}
          <LiveTile
            className="metro-tile tile-whatido"
            label="what i do"
            items={['cloud ai systems', 'scalable backends', 'generative ai', 'devops automation']}
          />

          {/* Medium status tile — the live update, glanceable */}
          <div className="metro-tile tile-status">
            <span className="metro-pulse" aria-hidden="true" />
            <div className="metro-status-block">
              <span className="metro-tile-label">new role</span>
              <span className="metro-status-text">cloud ai engineer</span>
              <span className="metro-status-sub">at google</span>
            </div>
          </div>

          {/* Medium social tiles — type only */}
          <a
            className="metro-tile tile-social"
            href="https://github.com/suraj7026"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="metro-tile-value">github</span>
          </a>
          <a
            className="metro-tile tile-social"
            href="https://www.linkedin.com/in/sudarshan-rajagopalan/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="metro-tile-value">linkedin</span>
          </a>

          {/* Wide text tiles */}
          <div className="metro-tile tile-text tile-about">
            <div>
              <span className="metro-tile-label">about</span>
              <p>
                passionate about end-to-end ownership and building ai-powered applications, including
                rag systems and llm-based agents.
              </p>
            </div>
            <a href="#experience" className="metro-tile-link">
              more
            </a>
          </div>
          <div className="metro-tile tile-text">
            <div>
              <span className="metro-tile-label">my work</span>
              <p>
                from high-performance apis to automated cloud infrastructure: scalable
                microservices, modern devops, and end-to-end machine learning.
              </p>
            </div>
            <a href="#projects" className="metro-tile-link">
              portfolio
            </a>
          </div>

          {/* Wide accent resume tile */}
          <a
            className="metro-tile metro-tile-accent tile-resume"
            href={RESUME_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="metro-resume-title">résumé</span>
            <span className="metro-resume-note">download the pdf</span>
          </a>
        </Reveal>

        {/* Companies panorama — wider than the screen */}
        {companies.length > 0 && (
          <Reveal className="metro-companies" delay={0.1}>
            <p className="metro-companies-label">previously worked at</p>
            <div className="metro-companies-row">
              {companies.map((company) => (
                <span key={company} className="metro-company">
                  {company}
                </span>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
};

export default About;

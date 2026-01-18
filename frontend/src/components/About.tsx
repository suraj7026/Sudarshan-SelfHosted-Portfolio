import React, { useState, useEffect } from 'react';
import { FaArrowRight, FaArrowDown, FaGithub, FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa';
import { PROFILE_IMAGE_NO_BG_URL } from '../config/minio';
import { fetchExperience, Experience } from '../services/api';

const About: React.FC = () => {
    const [companies, setCompanies] = useState<string[]>([]);

    useEffect(() => {
        const loadCompanies = async () => {
            const experiences = await fetchExperience();
            // Extract unique company names from experience data using Set
            const uniqueCompanies = Array.from(new Set(experiences.map((exp: Experience) => exp.company)));
            setCompanies(uniqueCompanies);
        };
        loadCompanies();
    }, []);

    return (
        <section id="about" className="section hero-section">
            <div className="container hero-container">
                {/* 3-Column Grid */}
                <div className="hero-grid">

                    {/* Left Column: Intro & Scroll */}
                    <div className="hero-left">
                        <div className="hero-intro-line"></div>
                        <h1 className="hero-title">
                            I'm Sudarshan, a <br />
                            <span className="text-accent">Software Engineer</span>
                        </h1>
                        <p className="hero-subtitle">
                            Building scalable AI/ML systems and intelligent agents since 2021.
                        </p>

                        <div className="hero-scroll-btn-wrapper">
                            <a href="#projects" className="hero-scroll-btn" aria-label="Scroll down">
                                <FaArrowDown />
                            </a>
                        </div>
                    </div>

                    {/* Center Column: Image */}
                    <div className="hero-center">
                        <div className="hero-image-wrapper">
                            <img src={PROFILE_IMAGE_NO_BG_URL} alt="Sudarshan Rajagopalan" className="hero-img" />
                            <div className="hero-img-glow"></div>
                        </div>
                    </div>

                </div>

                {/* Bottom Details Row (Horizontal) */}
                <div className="hero-details-row">
                    {/* About Me Block */}
                    <div className="hero-info-block">
                        <h3 className="hero-info-title">ABOUT ME</h3>
                        <p className="hero-info-text">
                            Passionate about architecting RAG-powered systems and optimizing AI pipelines.
                            Currently working at Norstella to reduce processing times by 95% using GenAI.
                        </p>
                        <a href="#experience" className="hero-link">
                            LEARN MORE <FaArrowRight />
                        </a>
                    </div>

                    {/* My Work Block */}
                    <div className="hero-info-block">
                        <h3 className="hero-info-title">MY WORK</h3>
                        <p className="hero-info-text">
                            From automated pipelines to generative AI dashboards, I specialize in
                            end-to-end ML solutions and full-stack development.
                        </p>
                        <a href="#projects" className="hero-link">
                            BROWSE PORTFOLIO <FaArrowRight />
                        </a>
                    </div>

                    {/* Follow Me Block */}
                    <div className="hero-info-block">
                        <h3 className="hero-info-title">FOLLOW ME</h3>
                        <div className="hero-socials">
                            <a href="https://github.com/Sudarshan-Rajagopalan" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
                            <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
                            <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Previously Worked On Strip */}
            <div className="companies-strip" style={{ marginTop: 'auto', paddingBottom: 'var(--spacing-xl)' }}>
                <span className="companies-label">PREVIOUSLY WORKED AT</span>
                <div className="companies-logos">
                    {companies.map((company, index) => (
                        <span key={index} className="company-logo">
                            {company}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default About;

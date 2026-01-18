import React from 'react';
import { FaGithub, FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa';
import { PROFILE_IMAGE_URL } from '../config/minio';

const Footer: React.FC = () => {
    return (
        <footer className="footer bg-secondary section" style={{ padding: 'var(--spacing-2xl) 0', borderTop: '1px solid var(--color-border)' }}>
            <div className="container">
                <div className="footer-content-grid">
                    {/* Left Column: Profile & Socials */}
                    <div className="footer-left">
                        <div className="footer-profile">
                            <img src={PROFILE_IMAGE_URL} alt="Sudarshan Rajagopalan" className="footer-profile-img" />
                            <div>
                                <h3 className="footer-name">Sudarshan Rajagopalan</h3>
                                <p className="footer-role">Software Engineer & AI Specialist</p>
                            </div>
                        </div>
                        <div className="footer-socials">
                            <a href="https://github.com/Sudarshan-Rajagopalan" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub /></a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
                            <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
                            <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                        </div>
                    </div>

                    {/* Right Column: Contact Details */}
                    <div className="footer-right">
                        <div className="footer-contact-group">
                            <h3 className="footer-cta-title">Get in touch <span className="text-accent">&rarr;</span></h3>
                            <div className="footer-contact-links">
                                <div>
                                    <span className="footer-contact-label">EMAIL ME:</span>
                                    <a href="mailto:sudarshanr2308@gmail.com" className="footer-contact-link">sudarshanr2308@gmail.com</a>
                                </div>
                                <div>
                                    <span className="footer-contact-label">CALL ME:</span>
                                    <a href="tel:+918072263579" className="footer-contact-link">+91 8072263579</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2026 Sudarshan Rajagopalan. All rights reserved.</p>
                    <div className="footer-bottom-links">
                        <a href="/">Home</a>
                        <a href="#about">About</a>
                        <a href="#projects">Portfolio</a>
                        <a href="#contact">Contact</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

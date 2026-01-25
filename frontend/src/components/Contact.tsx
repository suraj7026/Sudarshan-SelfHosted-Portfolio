import React from 'react';
import { FaArrowRight, FaFileDownload, FaEnvelope, FaLinkedin, FaGithub } from 'react-icons/fa';
import { RESUME_URL } from '../config/minio';

const Contact: React.FC = () => {
    return (
        <section id="contact" className="section container">
            <div className="contact-grid">
                {/* Left Column: Headline */}
                <div className="contact-left">
                    <h2 className="contact-headline">
                        Ready to make <br />
                        an impact? <br />
                        Let's connect <span className="text-accent"><FaArrowRight style={{ display: 'inline', transform: 'rotate(-45deg)', verticalAlign: 'middle' }} /></span>
                    </h2>
                    <p className="contact-subtext">
                        I'm currently open to new opportunities and collaborations.
                        Whether you have a question or just want to say hi, feel free to reach out!
                    </p>
                </div>

                {/* Right Column: Actions */}
                <div className="contact-right">
                    <div className="cta-container">
                        <a
                            href={RESUME_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="resume-btn"
                        >
                            Download Resume <FaFileDownload />
                        </a>

                        <div className="contact-methods">
                            <a href="mailto:sudarshanr2308@gmail.com" className="contact-method-link">
                                <FaEnvelope /> sudarshanr2308@gmail.com
                            </a>
                            <a href="https://www.linkedin.com/in/sudarshan-rajagopalan/" target="_blank" rel="noopener noreferrer" className="contact-method-link">
                                <FaLinkedin /> LinkedIn Profile
                            </a>
                            <a href="https://github.com/suraj7026" target="_blank" rel="noopener noreferrer" className="contact-method-link">
                                <FaGithub /> GitHub Profile
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;

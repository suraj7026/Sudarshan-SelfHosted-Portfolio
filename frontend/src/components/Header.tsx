import React, { useState } from 'react';
// import { Link } from 'react-router-dom'; // Using simple anchor tags for smooth scroll
import { RESUME_URL, PROFILE_IMAGE_URL } from '../config/minio';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showName, setShowName] = useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowName(true);
            } else {
                setShowName(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const navLinks = [
        { name: 'About', href: '#about' },
        { name: 'Skills', href: '#skills' },
        { name: 'Experience', href: '#experience' },
        { name: 'Projects', href: '#projects' },
        { name: 'Contact', href: '#contact' },
    ];

    return (
        <header className="header">
            <div className="container header-content">
                <div className="logo">
                    <a href="/" className="logo-link">
                        <img src={PROFILE_IMAGE_URL} alt="SR" className="header-profile-img" />
                        <span className={`header-name ${showName ? 'visible' : ''}`}>
                            Sudarshan Rajagopalan
                        </span>
                    </a>
                </div>

                {/* Desktop Navigation */}
                <nav className="nav-links">
                    {navLinks.map((link) => (
                        <a key={link.name} href={link.href} className="nav-link">
                            {link.name}
                        </a>
                    ))}
                    <a
                        href={RESUME_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            marginLeft: 'var(--spacing-lg)',
                            backgroundColor: 'var(--color-accent)',
                            color: 'var(--color-bg-primary)', /* Dark text on green bg */
                            padding: '8px 16px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: '700', /* Made bolder */
                            transition: 'all 0.3s ease',
                            display: 'inline-flex', /* Use flex for centering if needed, block usually fine */
                            alignItems: 'center'
                        }}
                    >
                        Resume
                    </a>
                </nav>

                {/* Mobile Menu Button */}
                <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle menu">
                    {isMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <nav className="mobile-menu">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="mobile-nav-link"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {link.name}
                        </a>
                    ))}
                    <a
                        href={RESUME_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mobile-nav-link"
                        style={{
                            color: 'var(--color-accent)',
                            fontWeight: '600'
                        }}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Resume
                    </a>
                </nav>
            )}
        </header>
    );
};

export default Header;

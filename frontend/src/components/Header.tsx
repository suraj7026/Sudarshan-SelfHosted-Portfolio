import React, { useEffect, useState } from 'react';
import { RESUME_URL } from '../config/minio';

const navLinks = [
  { name: 'about', href: '#about' },
  { name: 'skills', href: '#skills' },
  { name: 'experience', href: '#experience' },
  { name: 'projects', href: '#projects' },
  { name: 'contact', href: '#contact' },
];

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <header className="metro-header">
        <div className="metro-header-inner">
          <a href="#about" className="metro-brand">
            <span className="metro-mark" aria-hidden="true" />
            sudarshan rajagopalan
          </a>

          {/* Desktop navigation */}
          <nav className="metro-nav" aria-label="Primary">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="metro-nav-link">
                {link.name}
              </a>
            ))}
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="metro-header-resume"
            >
              resume
            </a>
          </nav>

          <button
            type="button"
            className="metro-menu-btn"
            aria-label="Menu"
            aria-expanded={isMenuOpen}
            aria-controls="metro-menu"
            onClick={toggleMenu}
          >
            {isMenuOpen ? '✕' : '≡'}
          </button>
        </div>
      </header>

      {/* Full-screen hub menu — big type, sliding up into place */}
      {isMenuOpen && (
        <div id="metro-menu" className="metro-menu">
          <nav className="metro-menu-nav" aria-label="Mobile">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="metro-menu-link"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="metro-menu-link metro-menu-link-accent"
              onClick={() => setIsMenuOpen(false)}
            >
              resume
            </a>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;

import React from 'react';

/**
 * Minimal footer: a square, a name, the essentials.
 */
const Footer: React.FC = () => {
  return (
    <footer className="metro-footer">
      <div className="container">
        <div className="metro-footer-inner">
          <div>
            <p className="metro-footer-name">
              <span className="metro-mark" aria-hidden="true" />
              sudarshan rajagopalan
            </p>
            <p className="metro-footer-role">cloud ai engineer — google</p>
          </div>

          <nav className="metro-footer-nav" aria-label="Footer">
            <a href="#about">about</a>
            <a href="#skills">skills</a>
            <a href="#projects">projects</a>
            <a href="#contact">contact</a>
          </nav>
        </div>

        <div className="metro-footer-bottom">
          <p>© 2026 sudarshan rajagopalan. all rights reserved.</p>
          <p>built in the metro design language</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

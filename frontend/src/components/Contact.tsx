import React from 'react';
import { RESUME_URL } from '../config/minio';
import { Reveal, ParallaxWord } from './metro';

/**
 * Contact, WP-style: giant lock-screen type, one big accent tile for the
 * resume, and a people-hub list for everything else.
 */
const Contact: React.FC = () => {
  return (
    <section id="contact" className="metro-section">
      <ParallaxWord word="connect" />
      <div className="container">
        <Reveal>
          <h2 className="metro-contact-title">
            let's connect<span className="metro-mark" aria-hidden="true" />
          </h2>
          <p className="metro-contact-sub">
            i've recently started as a cloud ai engineer at google — and i'm always up for
            collaborations and good conversations. whether you have a question or just want to say
            hi, feel free to reach out.
          </p>
        </Reveal>

        <div className="metro-contact-grid">
          <Reveal delay={0.1}>
            <a
              className="metro-resume-tile"
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="metro-resume-title">resume</span>
              <span className="metro-resume-note">download the pdf</span>
            </a>
          </Reveal>

          <Reveal className="metro-contact-methods" delay={0.15}>
            <a className="metro-contact-method" href="mailto:sudarshanr2308@gmail.com">
              <span className="metro-contact-method-label">email</span>
              <span className="metro-contact-method-value">sudarshanr2308@gmail.com</span>
            </a>
            <a
              className="metro-contact-method"
              href="https://www.linkedin.com/in/sudarshan-rajagopalan/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="metro-contact-method-label">linkedin</span>
              <span className="metro-contact-method-value">sudarshan rajagopalan</span>
            </a>
            <a
              className="metro-contact-method"
              href="https://github.com/suraj7026"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="metro-contact-method-label">github</span>
              <span className="metro-contact-method-value">suraj7026</span>
            </a>
            <a className="metro-contact-method" href="tel:+918072263579">
              <span className="metro-contact-method-label">phone</span>
              <span className="metro-contact-method-value">+91 80722 63579</span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default Contact;

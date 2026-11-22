import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IconType } from 'react-icons';
import {
  FaUser,
  FaThLarge,
  FaBriefcase,
  FaCubes,
  FaEnvelope,
  FaFileAlt,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import { RESUME_URL } from '../config/minio';

const NavIcon = (Component: IconType, size = 15) =>
  React.createElement(Component as any, { size, 'aria-hidden': true });

const navLinks = [
  { name: 'about', href: '#about', icon: FaUser },
  { name: 'skills', href: '#skills', icon: FaThLarge },
  { name: 'experience', href: '#experience', icon: FaBriefcase },
  { name: 'projects', href: '#projects', icon: FaCubes },
  { name: 'contact', href: '#contact', icon: FaEnvelope },
];

const AUTO_DISMISS_MS = 2800;

const Header: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [isMobileVisible, setIsMobileVisible] = useState<boolean>(false);
  const dismissTimerRef = useRef<number | null>(null);
  const lastScrollLeftRef = useRef<number>(0);

  const scheduleAutoDismiss = useCallback(() => {
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current);
    }
    dismissTimerRef.current = window.setTimeout(() => {
      setIsMobileVisible(false);
      dismissTimerRef.current = null;
    }, AUTO_DISMISS_MS);
  }, []);

  const revealMobileBar = useCallback(() => {
    setIsMobileVisible(true);
    scheduleAutoDismiss();
  }, [scheduleAutoDismiss]);

  useEffect(() => {
    const panorama = document.querySelector('.metro-panorama') as HTMLElement | null;
    if (!panorama) return;

    lastScrollLeftRef.current = panorama.scrollLeft;

    const onScroll = () => {
      const current = panorama.scrollLeft;
      const delta = current - lastScrollLeftRef.current;
      lastScrollLeftRef.current = current;

      // Show the bar when scrolling left on mobile, then auto-dismiss after inactivity
      if (delta < -2) {
        revealMobileBar();
      }
    };

    panorama.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      panorama.removeEventListener('scroll', onScroll);
      if (dismissTimerRef.current !== null) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, [revealMobileBar]);

  const handleInteraction = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      revealMobileBar();
    }
  };

  return (
    <header
      className={`metro-header${isCollapsed ? ' metro-header--collapsed' : ''}${
        isMobileVisible ? ' metro-header--mobile-visible' : ''
      }`}
      onPointerDown={handleInteraction}
      onTouchStart={handleInteraction}
      onMouseEnter={handleInteraction}
      onFocus={handleInteraction}
    >
      <div className="metro-header-inner">
        <div className="metro-header-top">
          <a
            href="#about"
            className="metro-brand"
            aria-label="Sudarshan Rajagopalan — Home"
            title="Sudarshan Rajagopalan"
          >
            <span className="metro-mark" aria-hidden="true" />
            {!isCollapsed && (
              <span className="metro-brand-text">
                <span>sudarshan</span>
                <span>rajagopalan</span>
              </span>
            )}
          </a>

          <button
            type="button"
            className="metro-rail-toggle"
            onClick={() => {
              setIsCollapsed((c) => !c);
              handleInteraction();
            }}
            aria-label={isCollapsed ? 'Expand navigation rail' : 'Collapse navigation rail'}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {NavIcon(isCollapsed ? FaChevronRight : FaChevronLeft, 12)}
          </button>
        </div>

        {/* Vertical quick-access navigation: text-only when expanded, icons-only when thin */}
        <nav className="metro-nav" aria-label="Primary">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="metro-nav-link"
              aria-label={link.name}
              title={link.name}
              onClick={handleInteraction}
            >
              {isCollapsed ? (
                <span className="metro-nav-icon">{NavIcon(link.icon, 16)}</span>
              ) : (
                <span className="metro-nav-label">{link.name}</span>
              )}
            </a>
          ))}
        </nav>

        <a
          href={RESUME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="metro-header-resume"
          aria-label="Résumé"
          title="Résumé (PDF)"
          onClick={handleInteraction}
        >
          {isCollapsed ? (
            <span className="metro-nav-icon">{NavIcon(FaFileAlt, 16)}</span>
          ) : (
            <span className="metro-resume-label">résumé</span>
          )}
        </a>
      </div>
    </header>
  );
};

export default Header;

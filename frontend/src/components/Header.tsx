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
const LEFT_EDGE_TAP_WIDTH_PX = 36;
const SWIFT_SWIPE_MIN_DISTANCE_PX = 75;
const SWIFT_SWIPE_MIN_VELOCITY_PX_PER_MS = 0.78;
const SWIFT_WHEEL_MIN_DELTA_PX = 45;

const Header: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [isMobileVisible, setIsMobileVisible] = useState<boolean>(false);
  const dismissTimerRef = useRef<number | null>(null);

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
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (window.innerWidth > 768 || e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = performance.now();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (window.innerWidth > 768 || e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      const dt = Math.max(1, performance.now() - touchStartTime);
      const dist = Math.hypot(dx, dy);

      // 1. Tap over the left edge of the screen
      if (touchStartX <= LEFT_EDGE_TAP_WIDTH_PX && dist < 14 && dt < 450) {
        revealMobileBar();
        return;
      }

      // 2. Swift / speedy swipe toward the left (scrolling back leftward):
      // Small or slow swipes toward the left do NOT open the sidebar.
      const velocityX = Math.abs(dx) / dt;
      const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.5;
      if (
        isHorizontal &&
        dx >= SWIFT_SWIPE_MIN_DISTANCE_PX &&
        velocityX >= SWIFT_SWIPE_MIN_VELOCITY_PX_PER_MS
      ) {
        revealMobileBar();
      }
    };

    // Support mouse/trackpad testing in mobile viewport: left-edge click or fast leftward wheel flick
    const onMouseDown = (e: MouseEvent) => {
      if (window.innerWidth > 768) return;
      if (e.clientX <= LEFT_EDGE_TAP_WIDTH_PX) {
        revealMobileBar();
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth > 768) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('.metro-vertical-scroll') && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        return;
      }
      const leftwardDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (leftwardDelta <= -SWIFT_WHEEL_MIN_DELTA_PX) {
        revealMobileBar();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('wheel', onWheel);
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
    <>
      {/* Left-edge tap zone for summoning the sidebar on mobile */}
      <div
        className="metro-left-edge-zone"
        onClick={revealMobileBar}
        aria-hidden="true"
      />
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
    </>
  );
};

export default Header;

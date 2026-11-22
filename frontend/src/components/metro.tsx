import React, { useEffect, useRef, useState } from 'react';

/**
 * Metro building blocks.
 *
 * Motion here follows the Metro design language: it is structural, not
 * decorative — entrances, flips and parallax tell you where content lives.
 * Everything respects prefers-reduced-motion.
 */

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface RevealProps {
  className?: string;
  /** Stagger delay in seconds. */
  delay?: number;
  children?: React.ReactNode;
}

/**
 * Metro entrance: content rises into place once, as it enters the viewport.
 */
export const Reveal: React.FC<RevealProps> = ({ className = '', delay = 0, children }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const classes = `reveal${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`;
  const style = delay ? ({ transitionDelay: `${delay}s` } as React.CSSProperties) : undefined;

  return (
    <div ref={ref} className={classes} style={style}>
      {children}
    </div>
  );
};

interface ParallaxWordProps {
  word: string;
  /** Fraction of scroll distance the word lags behind. */
  speed?: number;
}

/**
 * Panorama depth: an oversized word drifting slower than the page.
 * It runs past the section's right edge — Metro's cropped typography.
 */
export const ParallaxWord: React.FC<ParallaxWordProps> = ({ word, speed = 0.14 }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const parent = el.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const center = rect.top + rect.height / 2;
      el.style.transform = `translate3d(0, ${((center - viewportH / 2) * speed).toFixed(1)}px, 0)`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  return (
    <div ref={ref} className="metro-parallax-word" aria-hidden="true">
      {word}
    </div>
  );
};

interface LiveTileProps {
  items: React.ReactNode[];
  intervalMs?: number;
  className?: string;
  label?: string;
}

/**
 * Live tile: content cycles on a timer with a flip, like the tiles that
 * made the Metro start screen glanceable. Pauses on hover and for
 * reduced-motion users.
 */
export const LiveTile: React.FC<LiveTileProps> = ({ items, intervalMs = 3400, className = '', label }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reducedMotion() || items.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [paused, items.length, intervalMs]);

  return (
    <div
      className={`metro-live-tile${className ? ` ${className}` : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {label && <span className="metro-tile-label">{label}</span>}
      <div className="metro-live-tile-stage">
        <div key={index} className="metro-live-tile-item">
          {items[index]}
        </div>
      </div>
    </div>
  );
};

interface SectionHeaderProps {
  title: string;
}

/**
 * Metro pivot header: a small accent square, a giant lowercase title,
 * and a WP10-style accent underline.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <header className="metro-section-head">
    <span className="metro-mark" aria-hidden="true" />
    <h2 className="metro-section-title">{title}</h2>
  </header>
);

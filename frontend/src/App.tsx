import React, { useEffect, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import About from './components/About';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';

/**
 * Computes the ordered horizontal stop positions (in scrollLeft px) along the
 * panorama. On desktop (> 768px) each top-level section is a stop; on phone
 * (<= 768px) wide multi-part sections (#about, #contact) also include their
 * sub-panels so each swipe reveals the next screen of content without skipping.
 */
export function getPanoramaStops(panorama: HTMLElement): number[] {
  const isPhone = window.innerWidth <= 768;
  const selector = isPhone
    ? '#about, .metro-start, .tile-status, #skills, #experience, #projects, #contact, .metro-resume-tile, .metro-contact-methods, .metro-footer'
    : '.metro-section, .metro-footer';

  const elements = Array.from(panorama.querySelectorAll<HTMLElement>(selector));
  const panoramaRect = panorama.getBoundingClientRect();
  const maxScroll = Math.max(0, panorama.scrollWidth - panorama.clientWidth);

  const rawStops = elements.map((el) => {
    const isSubPanel =
      !el.classList.contains('metro-section') && !el.classList.contains('metro-footer');
    const offset =
      panorama.scrollLeft + (el.getBoundingClientRect().left - panoramaRect.left) - (isSubPanel ? 16 : 0);
    return Math.max(0, Math.min(maxScroll, Math.round(offset)));
  });

  rawStops.sort((a, b) => a - b);

  // Deduplicate stops that are within 24px of each other
  const stops: number[] = [];
  for (const stop of rawStops) {
    if (stops.length === 0 || stop - stops[stops.length - 1] > 24) {
      stops.push(stop);
    }
  }
  if (stops.length > 0 && maxScroll - stops[stops.length - 1] > 24) {
    stops.push(Math.round(maxScroll));
  }
  return stops.length > 0 ? stops : [0];
}

function findClosestStopIndex(stops: number[], currentScrollLeft: number): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  stops.forEach((stop, idx) => {
    const dist = Math.abs(stop - currentScrollLeft);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

function App() {
  const panoramaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) {
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ behavior: 'auto', inline: 'start', block: 'nearest' })
      );
    }
  }, []);

  useEffect(() => {
    const panorama = panoramaRef.current;
    if (!panorama) return;

    let activeStopIndex: number | null = null;
    let activeStopResetTimer: number | null = null;

    // Phone touch-swipe clamp state so big swipes never overshoot the next content stop
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartStopIdx = 0;
    let clampMinScroll: number | null = null;
    let clampMaxScroll: number | null = null;
    let clampReleaseTimer: number | null = null;

    const clearClamp = () => {
      clampMinScroll = null;
      clampMaxScroll = null;
      if (clampReleaseTimer !== null) {
        window.clearTimeout(clampReleaseTimer);
        clampReleaseTimer = null;
      }
    };

    const scrollToStopIndex = (stops: number[], nextIdx: number) => {
      const clampedIdx = Math.max(0, Math.min(stops.length - 1, nextIdx));
      activeStopIndex = clampedIdx;
      if (activeStopResetTimer !== null) {
        window.clearTimeout(activeStopResetTimer);
      }
      activeStopResetTimer = window.setTimeout(() => {
        activeStopIndex = null;
      }, 550);
      panorama.scrollTo({ left: stops[clampedIdx], behavior: 'smooth' });
    };

    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      // Let vertical scroll streams (skills, experience, projects) handle vertical wheel scrolling directly
      if (target?.closest('.metro-vertical-scroll') && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        return;
      }

      // Translate predominantly vertical wheel movement into horizontal panorama scroll
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        panorama.scrollLeft += e.deltaY;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        clearClamp();
        const stops = getPanoramaStops(panorama);
        const baseIdx =
          activeStopIndex !== null
            ? activeStopIndex
            : findClosestStopIndex(stops, panorama.scrollLeft);
        const direction = e.key === 'ArrowRight' ? 1 : -1;
        scrollToStopIndex(stops, baseIdx + direction);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (window.innerWidth > 768 || e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      const stops = getPanoramaStops(panorama);
      touchStartStopIdx = findClosestStopIndex(stops, panorama.scrollLeft);
      clampMinScroll = stops[Math.max(0, touchStartStopIdx - 1)];
      clampMaxScroll = stops[Math.min(stops.length - 1, touchStartStopIdx + 1)];
      if (clampReleaseTimer !== null) {
        window.clearTimeout(clampReleaseTimer);
        clampReleaseTimer = null;
      }
    };

    const onScroll = () => {
      if (window.innerWidth > 768) return;
      if (clampMinScroll !== null && panorama.scrollLeft < clampMinScroll) {
        panorama.scrollLeft = clampMinScroll;
      } else if (clampMaxScroll !== null && panorama.scrollLeft > clampMaxScroll) {
        panorama.scrollLeft = clampMaxScroll;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (window.innerWidth > 768 || e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      const stops = getPanoramaStops(panorama);
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 24) {
        const direction = dx < 0 ? 1 : -1;
        const targetIdx = Math.max(0, Math.min(stops.length - 1, touchStartStopIdx + direction));
        const targetScroll = stops[targetIdx];
        if (direction > 0) {
          clampMinScroll = stops[touchStartStopIdx];
          clampMaxScroll = targetScroll;
        } else {
          clampMinScroll = targetScroll;
          clampMaxScroll = stops[touchStartStopIdx];
        }
        scrollToStopIndex(stops, targetIdx);
      }

      clampReleaseTimer = window.setTimeout(() => {
        clearClamp();
      }, 520);
    };

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (!hash || hash.length < 2) return;
      const targetEl = document.getElementById(hash.slice(1));
      if (targetEl) {
        e.preventDefault();
        clearClamp();
        window.history.pushState(null, '', hash);
        targetEl.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      }
    };

    panorama.addEventListener('wheel', onWheel, { passive: false });
    panorama.addEventListener('touchstart', onTouchStart, { passive: true });
    panorama.addEventListener('touchend', onTouchEnd, { passive: true });
    panorama.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick);
    return () => {
      panorama.removeEventListener('wheel', onWheel);
      panorama.removeEventListener('touchstart', onTouchStart);
      panorama.removeEventListener('touchend', onTouchEnd);
      panorama.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClick);
      clearClamp();
      if (activeStopResetTimer !== null) {
        window.clearTimeout(activeStopResetTimer);
      }
    };
  }, []);

  return (
    <div className="app">
      <Header />
      <div ref={panoramaRef} className="metro-panorama">
        <main className="metro-panorama-track">
          <About />
          <Skills />
          <Experience />
          <Projects />
          <Contact />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;

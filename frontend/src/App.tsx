import React, { useEffect, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import About from './components/About';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';

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

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (!hash || hash.length < 2) return;
      const targetEl = document.getElementById(hash.slice(1));
      if (targetEl) {
        e.preventDefault();
        window.history.pushState(null, '', hash);
        targetEl.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      }
    };

    panorama.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('click', onClick);
    return () => {
      panorama.removeEventListener('wheel', onWheel);
      document.removeEventListener('click', onClick);
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

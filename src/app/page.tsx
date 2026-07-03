"use client";

import React, { useState, useEffect, useRef } from 'react';
import Timer from '@/components/Timer';
import Schedule from '@/components/Schedule';
import GoalSystem from '@/components/GoalSystem';
import ProgressJournal from '@/components/ProgressJournal';
import DailyPlanner from '@/components/DailyPlanner';
import ImportantDangers from '@/components/ImportantDangers';
import styles from './page.module.css';

const QUOTES = [
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "It's not about having time, it's about making time.", author: "Unknown" },
  { text: "The pain of discipline is far less than the pain of regret.", author: "Sarah Bombell" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
];

export default function Home() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [clock, setClock] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<'focus' | 'dashboard'>('focus');
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setDateStr(now.toLocaleDateString('uz-UZ', { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    update();
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLeftOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!mounted) return null;

  const quote = QUOTES[quoteIndex];

  const scrollToDashboard = () => {
    setActiveSection('dashboard');
    dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFocus = () => {
    setActiveSection('focus');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.app}>
      {/* Overlay */}
      {leftOpen && (
        <div className={styles.overlay} onClick={() => setLeftOpen(false)} />
      )}

      {/* Left Sidebar - Schedule & Daily Plan */}
      <aside className={`${styles.sidebar} ${styles.sidebarLeft} ${leftOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>⚡</div>
            <div>
              <div className={styles.brandText}>SEF</div>
              <div className={styles.brandSub}>Study Extreme Focus</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={() => setLeftOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className={styles.sidebarScroll}>
          <DailyPlanner />
          <div className={styles.divider} />
          <Schedule />
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════ */}
      {/* SECTION 1: FOCUS — Full Screen Hero Timer */}
      {/* ═══════════════════════════════════════════════ */}
      <section className={styles.focusSection}>
        <div className={styles.glow1} />
        <div className={styles.glow2} />
        <div className={styles.glow3} />

        {/* Top Bar */}
        <header className={styles.topBar}>
          <button className={styles.menuBtn} onClick={() => setLeftOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            <span className={styles.menuLabel}>Plan</span>
          </button>

          <div className={styles.topCenter}>
            <span className={styles.clockDisplay}>{clock}</span>
            <span className={styles.dateDisplay}>{dateStr}</span>
          </div>

          <div className={styles.topRight}>
            <button
              className={`${styles.navBtn} ${activeSection === 'dashboard' ? styles.navBtnActive : ''}`}
              onClick={scrollToDashboard}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              <span className={styles.menuLabel}>Dashboard</span>
            </button>
          </div>
        </header>

        {/* Timer - Full Center */}
        <div className={styles.timerArea}>
          <Timer />
        </div>

        {/* Scroll indicator */}
        <div className={styles.scrollIndicator} onClick={scrollToDashboard}>
          <span className={styles.scrollText}>Dashboard</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* SECTION 2: DASHBOARD — Below Focus */}
      {/* ═══════════════════════════════════════════════ */}
      <section className={styles.dashboardSection} ref={dashboardRef}>
        {/* Dashboard Header */}
        <div className={styles.dashHeader}>
          <div className={styles.dashHeaderLeft}>
            <button className={styles.backToFocus} onClick={scrollToFocus}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 15l-6-6-6 6"/>
              </svg>
              Back to Focus
            </button>
          </div>
          <h2 className={styles.dashTitle}>📊 Master Dashboard</h2>
          <div className={styles.dashHeaderRight}>
            <span className={styles.clockSmall}>{clock}</span>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className={styles.dashContent}>
          {/* Goal System - Full Width */}
          <GoalSystem />
          
          <div className={styles.divider} />
          
          {/* Two Column Grid: Dangers + Journal */}
          <div className={styles.dashGrid}>
            <ImportantDangers />
            <ProgressJournal />
          </div>

          <div className={styles.divider} />

          {/* Quote */}
          <div className={styles.quoteCard}>
            <div className={styles.quoteText}>&ldquo;{quote.text}&rdquo;</div>
            <div className={styles.quoteAuthor}>— {quote.author}</div>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import React, { useState, useEffect, memo } from 'react';
import Timer from '@/components/Timer';

import GoalSystem from '@/components/GoalSystem';
import ProgressJournal from '@/components/ProgressJournal';

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

const MemoizedGoalSystem = memo(GoalSystem);


const MemoizedTimer = memo(Timer);
const MemoizedImportantDangers = memo(ImportantDangers);
const MemoizedProgressJournal = memo(ProgressJournal);

const TopClock = () => {
  const [clock, setClock] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.dashHeaderRight}>
      <span className={styles.clockDate}>{dateStr}</span>
      <span className={styles.clockTime}>{clock}</span>
    </div>
  );
};

export default function Home() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'focus'>('dashboard');

  useEffect(() => {
    setMounted(true);
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
  }, []);

  if (!mounted) return null;

  const quote = QUOTES[quoteIndex];

  if (activeView === 'focus') {
    return (
      <div className={styles.focusApp}>
        <button className={styles.exitFocusBtn} onClick={() => setActiveView('dashboard')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Dashboard
        </button>
        <MemoizedTimer />
      </div>
    );
  }

  return (
    <div className={styles.dashApp}>
      {/* HEADER */}
      <header className={styles.dashHeader}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>⚡</div>
          <div className={styles.brandText}>SEF <span className={styles.brandSub}>Study Extreme Focus</span></div>
        </div>
        
        <TopClock />

        <button className={styles.enterFocusBtn} onClick={() => setActiveView('focus')}>
          ENTER FOCUS
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </header>

      {/* MAIN DASHBOARD CONTENT */}
      <main className={styles.dashContent}>
        
        <div className={styles.dashTopRow}>

          <div className={styles.goalsWidget}>
            <MemoizedGoalSystem />
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.dashBottomRow}>
          <div className={styles.dangersWidget}>
            <MemoizedImportantDangers />
          </div>
          <div className={styles.journalWidget}>
            <MemoizedProgressJournal />
          </div>
        </div>

        <div className={styles.divider} />

        {/* Quote */}
        <div className={styles.quoteCard}>
          <div className={`${styles.quoteText} serif`}>&ldquo;{quote.text}&rdquo;</div>
          <div className={styles.quoteAuthor}>— {quote.author}</div>
        </div>
      </main>
    </div>
  );
}


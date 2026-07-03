"use client";

import React, { useState, useEffect } from 'react';
import styles from './PsychCards.module.css';

const PSYCH_CARDS = [
  {
    id: 1,
    title: 'The 90-Minute Rule',
    concept: 'Ultradian Rhythms',
    icon: '🌊',
    text: 'Your brain operates in 90-minute cycles of high cognitive capacity followed by a 20-minute necessary recovery phase. Pushing past 90 minutes without a break causes a sharp drop in IQ and retention.',
    color: '#6366f1' // Indigo
  },
  {
    id: 2,
    title: 'The "Lock In" Effect',
    concept: 'Decision Paralysis',
    icon: '🔒',
    text: 'Every small decision drains your prefrontal cortex. By having a single "LOCK IN" button and forced auto-transitions, you eliminate decision fatigue. Your brain doesn\'t have to decide WHAT to do, only to EXECUTE.',
    color: '#10b981' // Emerald
  },
  {
    id: 3,
    title: 'Anti-Fake Productivity',
    concept: 'Zeigarnik Effect & Dopamine',
    icon: '🛑',
    text: 'Watching lectures or reading feels productive but often isn\'t. The mandatory "Reflection" at the end of each session forces active recall, preventing the illusion of competence and ensuring actual neuroplasticity.',
    color: '#ef4444' // Red
  },
  {
    id: 4,
    title: 'Pain Over Pleasure',
    concept: 'Loss Aversion',
    icon: '💀',
    text: 'Humans are psychologically wired to avoid pain twice as hard as they seek pleasure. That\'s why "Pain Cards" (visualizing failure) are statistically more effective for driving action than "Dream Cards".',
    color: '#f59e0b' // Amber
  },
  {
    id: 5,
    title: 'Break Neurochemistry',
    concept: 'Parasympathetic Reset',
    icon: '☕',
    text: 'During focus, cortisol and adenosine build up. If you check your phone during a break, you stay in a sympathetic (stressed) state. Real breaks (walking, looking far away) physically clear these chemicals from your brain.',
    color: '#8b5cf6' // Violet
  }
];

export default function PsychCards() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotate daily or randomly. For now, let's rotate every 30 seconds to keep it dynamic.
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PSYCH_CARDS.length);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const card = PSYCH_CARDS[currentIndex];

  const nextCard = () => setCurrentIndex((prev) => (prev + 1) % PSYCH_CARDS.length);
  const prevCard = () => setCurrentIndex((prev) => (prev - 1 + PSYCH_CARDS.length) % PSYCH_CARDS.length);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>🧠 Psychology Ops</span>
        <div className={styles.controls}>
          <button onClick={prevCard}>◀</button>
          <span>{currentIndex + 1} / {PSYCH_CARDS.length}</span>
          <button onClick={nextCard}>▶</button>
        </div>
      </div>
      
      <div className={styles.card} style={{ '--card-color': card.color } as React.CSSProperties}>
        <div className={styles.cardTop}>
          <div className={styles.icon}>{card.icon}</div>
          <div className={styles.labels}>
            <div className={styles.concept}>{card.concept}</div>
            <div className={styles.cardTitle}>{card.title}</div>
          </div>
        </div>
        <div className={styles.text}>{card.text}</div>
      </div>
    </div>
  );
}

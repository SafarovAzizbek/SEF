"use client";

import React, { useState } from 'react';
import styles from './SessionReflection.module.css';

interface Props {
  sessionNumber: number;
  onSubmit: (reflection: string) => void;
  onSkip: () => void;
}

// ══════════════════════════════════════════════════════════════
//  POST-SESSION ACTIVE RECALL ENGINE (2026)
//  Based on: Retrieval Practice, Feynman Technique, 
//  Elaborative Interrogation, Blurting Method
//  "If you can't write it down, you didn't learn it."
// ══════════════════════════════════════════════════════════════

type Phase = 'subject' | 'blurt' | 'gaps' | 'rating';

const PHASE_INFO = {
  subject: {
    title: '📚 What did you study?',
    subtitle: 'Name the subject and specific topic of this 90-minute block.',
    placeholder: 'e.g. "Oliy Matematika — Integrallar, 2-bob"',
  },
  blurt: {
    title: '🧠 BLURT IT OUT (Active Recall)',
    subtitle: 'Close your notes. Write EVERYTHING you remember from the session. Don\'t look back. Your brain must retrieve, not recognize.',
    placeholder: 'Write everything you remember from the session...\n\nKey formulas, definitions, concepts, examples, connections to other topics...\n\nThe more you retrieve from memory right now, the stronger the neural pathways become.',
  },
  gaps: {
    title: '🔍 Knowledge Gaps & Feynman Check',
    subtitle: 'What couldn\'t you explain to a 5-year-old? What confused you? These gaps are GOLD — they show you exactly what to attack next.',
    placeholder: '1. What concepts were unclear?\n2. Where did you get stuck?\n3. What do you need to review tomorrow?\n4. What surprised you?',
  },
  rating: {
    title: '⚡ Session Quality',
    subtitle: 'Rate your focus quality. Be brutally honest.',
    placeholder: '',
  },
};

export default function SessionReflection({ sessionNumber, onSubmit, onSkip }: Props) {
  const [phase, setPhase] = useState<Phase>('subject');
  const [subject, setSubject] = useState('');
  const [blurt, setBlurt] = useState('');
  const [gaps, setGaps] = useState('');
  const [rating, setRating] = useState(0);
  const [focusQuality, setFocusQuality] = useState<'deep' | 'medium' | 'shallow' | ''>('');
  const [distractions, setDistractions] = useState<string[]>([]);

  const DISTRACTION_OPTIONS = ['📱 Phone', '💬 Chat', '🌐 Social Media', '💭 Daydreaming', '😴 Sleepy', '🍔 Hungry', '✅ None'];

  const toggleDistraction = (d: string) => {
    setDistractions(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const phaseIndex = ['subject', 'blurt', 'gaps', 'rating'].indexOf(phase);
  const totalPhases = 4;

  const nextPhase = () => {
    if (phase === 'subject' && !subject.trim()) return;
    if (phase === 'subject') setPhase('blurt');
    else if (phase === 'blurt') setPhase('gaps');
    else if (phase === 'gaps') setPhase('rating');
    else handleFinalSubmit();
  };

  const prevPhase = () => {
    if (phase === 'blurt') setPhase('subject');
    else if (phase === 'gaps') setPhase('blurt');
    else if (phase === 'rating') setPhase('gaps');
  };

  const handleFinalSubmit = () => {
    const wordCount = blurt.trim().split(/\s+/).filter(w => w).length;
    const entry = [
      `📚 SUBJECT: ${subject.trim()}`,
      ``,
      `🧠 ACTIVE RECALL (${wordCount} words):`,
      blurt.trim() || '(skipped)',
      ``,
      `🔍 KNOWLEDGE GAPS:`,
      gaps.trim() || '(none identified)',
      ``,
      `⚡ RATING: ${rating}/10 | Focus: ${focusQuality || 'N/A'}`,
      distractions.length > 0 ? `🚫 Distractions: ${distractions.join(', ')}` : '✅ No distractions reported',
    ].join('\n');
    onSubmit(entry);
  };

  const info = PHASE_INFO[phase];
  const wordCount = blurt.trim().split(/\s+/).filter(w => w).length;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Progress bar */}
        <div className={styles.progressBar}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`${styles.progressDot} ${i <= phaseIndex ? styles.progressActive : ''}`} />
          ))}
        </div>

        <div className={styles.badge}>✅ Session #{sessionNumber} complete!</div>
        <h3 className={styles.prompt}>{info.title}</h3>
        <p className={styles.sub}>{info.subtitle}</p>

        {/* ═══ PHASE: Subject ═══ */}
        {phase === 'subject' && (
          <input
            className={styles.subjectInput}
            placeholder={info.placeholder}
            value={subject}
            onChange={e => setSubject(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') nextPhase(); }}
          />
        )}

        {/* ═══ PHASE: Blurt (Active Recall) ═══ */}
        {phase === 'blurt' && (
          <div className={styles.blurtWrap}>
            <div className={styles.blurtHeader}>
              <span className={styles.blurtSubject}>{subject}</span>
              <span className={styles.wordCount}>{wordCount} words</span>
            </div>
            <textarea
              className={styles.textarea}
              placeholder={info.placeholder}
              value={blurt}
              onChange={e => setBlurt(e.target.value)}
              rows={7}
              autoFocus
            />
            {wordCount > 0 && wordCount < 20 && (
              <div className={styles.blurtWarning}>⚠️ Too short! Deep recall needs at least 30+ words. Dig deeper.</div>
            )}
            {wordCount >= 50 && (
              <div className={styles.blurtSuccess}>🔥 Excellent recall! {wordCount} words retrieved from memory.</div>
            )}
          </div>
        )}

        {/* ═══ PHASE: Gaps (Feynman) ═══ */}
        {phase === 'gaps' && (
          <textarea
            className={styles.textarea}
            placeholder={info.placeholder}
            value={gaps}
            onChange={e => setGaps(e.target.value)}
            rows={5}
            autoFocus
          />
        )}

        {/* ═══ PHASE: Rating ═══ */}
        {phase === 'rating' && (
          <div className={styles.ratingPhase}>
            {/* Numeric rating */}
            <div className={styles.ratingRow}>
              <span className={styles.ratingLabel}>Session score:</span>
              <div className={styles.ratingButtons}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <button
                    key={n}
                    className={`${styles.ratingBtn} ${rating === n ? styles.ratingActive : ''} ${rating === n && n >= 8 ? styles.ratingHigh : ''} ${rating === n && n <= 3 ? styles.ratingLow : ''}`}
                    onClick={() => setRating(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus quality */}
            <div className={styles.qualityRow}>
              <span className={styles.ratingLabel}>Focus depth:</span>
              <div className={styles.qualityButtons}>
                {([
                  { key: 'deep', label: '🟢 Deep Flow', desc: 'Lost track of time' },
                  { key: 'medium', label: '🟡 Medium', desc: 'Some focus breaks' },
                  { key: 'shallow', label: '🔴 Shallow', desc: 'Constantly distracted' },
                ] as const).map(q => (
                  <button
                    key={q.key}
                    className={`${styles.qualityBtn} ${focusQuality === q.key ? styles.qualityActive : ''}`}
                    onClick={() => setFocusQuality(q.key)}
                  >
                    <span>{q.label}</span>
                    <span className={styles.qualityDesc}>{q.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Distractions */}
            <div className={styles.distractRow}>
              <span className={styles.ratingLabel}>What distracted you?</span>
              <div className={styles.distractGrid}>
                {DISTRACTION_OPTIONS.map(d => (
                  <button
                    key={d}
                    className={`${styles.distractBtn} ${distractions.includes(d) ? styles.distractActive : ''}`}
                    onClick={() => toggleDistraction(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={styles.actions}>
          {phase === 'subject' ? (
            <button className={styles.skipBtn} onClick={onSkip}>Skip for now</button>
          ) : (
            <button className={styles.skipBtn} onClick={prevPhase}>← Back</button>
          )}
          <button
            className={styles.submitBtn}
            onClick={nextPhase}
            disabled={phase === 'subject' && !subject.trim()}
          >
            {phase === 'rating' ? '💾 Save & Break →' : `Next (${phaseIndex + 1}/${totalPhases}) →`}
          </button>
        </div>

        <div className={styles.hint}>
          🧠 Active Recall is the #1 evidence-based study technique. Retrieving = Learning.
        </div>
      </div>
    </div>
  );
}

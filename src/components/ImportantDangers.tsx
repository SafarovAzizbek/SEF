"use client";

import React, { useState } from 'react';
import styles from './ImportantDangers.module.css';

const DANGERS = [
  {
    id: 1,
    title: 'Sleep Debt Destroys Memory',
    icon: '🛌',
    danger: 'Sleeping less than 7 hours drops memory retention by 40%.',
    detail: 'During deep sleep, the hippocampus replays the day\'s learning and transfers it to the cortex. If you cut sleep short, that transfer fails. The time you spent studying is literally wasted.',
    color: '#f43f5e' // Rose
  },
  {
    id: 2,
    title: 'Attention Residue',
    icon: '📱',
    danger: 'One quick phone check ruins focus for 23 minutes.',
    detail: 'When you switch from studying to Instagram and back, a part of your brain stays thinking about the app (attention residue). You are now studying with reduced IQ and higher error rates.',
    color: '#ef4444' // Red
  },
  {
    id: 3,
    title: 'Cheap Dopamine Depletion',
    icon: '📉',
    danger: 'High-dopamine activities before studying kill motivation.',
    detail: 'TikTok, games, or junk food spike your dopamine baseline artificially high. Studying (which provides delayed, slow dopamine) will suddenly feel impossibly boring and painful. Protect your morning dopamine.',
    color: '#f97316' // Orange
  },
  {
    id: 4,
    title: 'The Illusion of Competence',
    icon: '📖',
    danger: 'Re-reading and highlighting is FAKE productivity.',
    detail: 'Your brain recognizes the text and makes you feel like you know it. But recognition is not recall. If you don\'t close the book and test yourself from a blank page, you aren\'t actually learning.',
    color: '#eab308' // Yellow
  },
  {
    id: 5,
    title: 'Cortisol Neurotoxicity',
    icon: '🧠',
    danger: 'Studying for 3+ hours without breaks damages the brain.',
    detail: 'Pushing past the 90-minute limit without a proper "parasympathetic reset" (walking, staring into the distance) floods the brain with cortisol. Chronic cortisol physically damages the hippocampus (the memory center).',
    color: '#dc2626' // Red
  }
];

const renderVisual = (id: number) => {
  switch (id) {
    case 1:
      return (
        <div className={styles.visualWrap}>
          <div className={styles.visLabel}>Memory Retention Capacity</div>
          <div className={styles.visBars}>
            <div className={styles.visBarWrap}><div className={styles.visBar} style={{ height: '100%', background: '#10b981' }}></div><span>8h</span></div>
            <div className={styles.visBarWrap}><div className={styles.visBar} style={{ height: '80%', background: '#f59e0b' }}></div><span>7h</span></div>
            <div className={styles.visBarWrap}><div className={styles.visBar} style={{ height: '60%', background: '#ef4444' }}></div><span>6h</span></div>
            <div className={styles.visBarWrap}><div className={styles.visBar} style={{ height: '40%', background: '#991b1b' }}></div><span>&lt;5h</span></div>
          </div>
        </div>
      );
    case 2:
      return (
        <div className={styles.visualWrap}>
          <div className={styles.visLabel}>Focus Recovery Timeline</div>
          <div className={styles.timeline}>
            <div className={styles.tlTick} style={{ flex: 1, background: '#ef4444' }}>Distraction</div>
            <div className={styles.tlTick} style={{ flex: 6, background: '#f59e0b' }}>Recovery (23 min)</div>
            <div className={styles.tlTick} style={{ flex: 3, background: '#10b981' }}>Deep Focus</div>
          </div>
        </div>
      );
    case 3:
      return (
        <div className={styles.visualWrap}>
          <div className={styles.visLabel}>Dopamine Baseline (Cheap vs Hard)</div>
          <div className={styles.dopamineChart}>
            <div className={styles.dopLine} style={{ background: 'linear-gradient(90deg, #ef4444 20%, #991b1b 100%)' }}>📱 TikTok (Spike & Crash)</div>
            <div className={styles.dopLine} style={{ background: 'linear-gradient(90deg, #10b981 100%, #10b981 100%)', width: '70%' }}>📚 Study (Steady)</div>
          </div>
        </div>
      );
    case 4:
      return (
        <div className={styles.visualWrap}>
          <div className={styles.visLabel}>Knowledge Recall</div>
          <div className={styles.circleChartWrap}>
            <div className={styles.circleChart} style={{ borderColor: '#ef4444' }}>10%<br/><span>Reading</span></div>
            <div className={styles.circleChart} style={{ borderColor: '#10b981' }}>90%<br/><span>Testing</span></div>
          </div>
        </div>
      );
    case 5:
      return (
        <div className={styles.visualWrap}>
          <div className={styles.visLabel}>Cortisol Accumulation</div>
          <div className={styles.cortisolGrad}></div>
          <div className={styles.cortisolLabels}>
            <span>0m</span>
            <span>90m (Limit)</span>
            <span>180m (Damage)</span>
          </div>
        </div>
      );
    default:
      return null;
  }
};

export default function ImportantDangers() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>🛑 LEVEL 5 BIOLOGICAL THREATS & PROTOCOLS</span>
      </div>
      
      <div className={styles.list}>
        {DANGERS.map((d) => (
          <div key={d.id} className={`${styles.item} ${expandedId === d.id ? styles.expanded : ''}`}
            onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}>
            
            <div className={styles.itemTop}>
              <div className={styles.icon} style={{ background: `${d.color}20`, color: d.color }}>{d.icon}</div>
              <div className={styles.itemInfo}>
                <div className={styles.itemTitle} style={{ color: d.color }}>{d.title}</div>
                <div className={styles.dangerText}>{d.danger}</div>
              </div>
              <div className={styles.chevron}>{expandedId === d.id ? '▲' : '▼'}</div>
            </div>

            {expandedId === d.id && (
              <div className={styles.detail}>
                {d.detail}
                {renderVisual(d.id)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

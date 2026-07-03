"use client";

import React, { useState, useEffect, useCallback } from 'react';
import styles from './Schedule.module.css';

// ══════════════════════════════════════════════════════════
//  UNIVERSAL 12H SCHEDULE ENGINE
//  Pattern: 3 Blocks × (90m + 60m + 90m) = 12h PURE FOCUS
//  Breaks: 10m micro + 10m micro + 40m recovery between blocks
//  Each block = 4h focus + 1h breaks = 5h total
//  Grand Total: 15h (including all breaks)
// ══════════════════════════════════════════════════════════

interface ScheduleBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'focus' | 'break';
  note: string;
  blockNum: number;
  duration: number; // minutes
  brainZone?: {
    name: string;
    icon: string;
    description: string;
    bestFor: string;
    neuroscience: string;
    brainRegions: { name: string; activation: number; color: string }[];
  };
}

// Brain zone data for each session type within a block
const BRAIN_ZONES: Record<number, Record<string, {
  name: string; icon: string; description: string; bestFor: string; neuroscience: string;
  brainRegions: { name: string; activation: number; color: string }[];
}>> = {
  1: {
    s1: {
      name: 'Prefrontal Cortex Ignition',
      icon: '🧠',
      description: 'Morning cortisol peak activates the prefrontal cortex. Analytical reasoning and working memory are at maximum capacity.',
      bestFor: 'Hardest subjects: Complex math, physics problems, learning new concepts from scratch',
      neuroscience: 'Cortisol + Norepinephrine → Prefrontal cortex activation → Maximum analytical power',
      brainRegions: [
        { name: 'Prefrontal Cortex', activation: 95, color: '#ef4444' },
        { name: 'Working Memory', activation: 90, color: '#f59e0b' },
        { name: 'Hippocampus', activation: 60, color: '#6366f1' },
      ],
    },
    s2: {
      name: 'Hippocampal Encoding',
      icon: '⚡',
      description: 'After 90min deep work, hippocampus switches to rapid encoding mode. Perfect for pattern recognition and quick drills.',
      bestFor: 'Quick drills: Test questions, memorizing formulas, flashcards, speed practice',
      neuroscience: 'Acetylcholine ↑↑ → Hippocampal long-term potentiation → Fast memory encoding',
      brainRegions: [
        { name: 'Hippocampus', activation: 95, color: '#6366f1' },
        { name: 'Temporal Lobe', activation: 80, color: '#8b5cf6' },
        { name: 'Prefrontal Cortex', activation: 55, color: '#ef4444' },
      ],
    },
    s3: {
      name: 'Basal Ganglia Automation',
      icon: '🔥',
      description: 'After 2.5h of focus, basal ganglia takes over from prefrontal cortex. Skills become more automatic — perfect for practice.',
      bestFor: 'Consolidation: Bulk problem-solving, written exercises, applied practice',
      neuroscience: 'Dopamine reward loop → Basal ganglia pattern automation → Skill consolidation',
      brainRegions: [
        { name: 'Basal Ganglia', activation: 90, color: '#10b981' },
        { name: 'Motor Cortex', activation: 75, color: '#14b8a6' },
        { name: 'Prefrontal Cortex', activation: 40, color: '#ef4444' },
      ],
    },
  },
  2: {
    s1: {
      name: 'Default Mode Reset',
      icon: '🔄',
      description: 'After recovery break, Default Mode Network has processed Block 1. Fresh neural pathways ready for new material.',
      bestFor: 'Start a new topic or deepen the previous one. Conceptual understanding.',
      neuroscience: 'DMN → Creative connections formed during break → New learning primed',
      brainRegions: [
        { name: 'Default Mode Network', activation: 85, color: '#a855f7' },
        { name: 'Prefrontal Cortex', activation: 80, color: '#ef4444' },
        { name: 'Anterior Cingulate', activation: 70, color: '#f97316' },
      ],
    },
    s2: {
      name: 'Active Recall Zone',
      icon: '🎯',
      description: 'Mid-day working memory is optimized for retrieval practice. Testing yourself builds 3x stronger memory traces than re-reading.',
      bestFor: 'Active Recall: Self-testing, practice exams, blank page recall',
      neuroscience: 'Retrieval practice → Desirable difficulty → 3x stronger memory traces',
      brainRegions: [
        { name: 'Hippocampus', activation: 95, color: '#6366f1' },
        { name: 'Prefrontal Cortex', activation: 85, color: '#ef4444' },
        { name: 'Parietal Cortex', activation: 70, color: '#06b6d4' },
      ],
    },
    s3: {
      name: 'Interleaving Cortex',
      icon: '🔀',
      description: 'Brain excels at connecting different topics at this stage. Mixing subjects creates stronger neural networks.',
      bestFor: 'Mix different subjects, find connections between topics, synthesis',
      neuroscience: 'Interleaving → Cross-cortical connections → Deeper understanding',
      brainRegions: [
        { name: 'Association Cortex', activation: 90, color: '#8b5cf6' },
        { name: 'Temporal Lobe', activation: 80, color: '#a855f7' },
        { name: 'Prefrontal Cortex', activation: 75, color: '#ef4444' },
      ],
    },
  },
  3: {
    s1: {
      name: 'Endurance Cortex',
      icon: '💪',
      description: 'This is where mental endurance separates winners. Norepinephrine spikes give you the "second wind" for the final block.',
      bestFor: 'Review critical material, strategic reading, problem-solving endurance',
      neuroscience: 'Norepinephrine spike → Second wind phenomenon → Endurance unlocked',
      brainRegions: [
        { name: 'Locus Coeruleus', activation: 95, color: '#ef4444' },
        { name: 'Prefrontal Cortex', activation: 70, color: '#f59e0b' },
        { name: 'Amygdala', activation: 60, color: '#dc2626' },
      ],
    },
    s2: {
      name: 'Spaced Repetition Window',
      icon: '📝',
      description: 'Reviewing material learned 4-8 hours ago creates optimal spacing effect. Memory retention jumps from 20% to 80%.',
      bestFor: 'Quick review of today\'s material, summarize key ideas, write notes',
      neuroscience: 'Spacing effect → Hippocampal reactivation → 4x retention boost',
      brainRegions: [
        { name: 'Hippocampus', activation: 90, color: '#6366f1' },
        { name: 'Neocortex', activation: 85, color: '#8b5cf6' },
        { name: 'Prefrontal Cortex', activation: 65, color: '#ef4444' },
      ],
    },
    s3: {
      name: 'BDNF Consolidation Peak',
      icon: '🏆',
      description: '12 hours of focused work triggers massive BDNF (Brain-Derived Neurotrophic Factor) release. Your brain is literally growing new connections.',
      bestFor: 'FINAL PUSH: Wrap up all work, summarize the day, prepare for tomorrow',
      neuroscience: 'BDNF ↑↑↑ → Neurogenesis → New neural connections forming RIGHT NOW',
      brainRegions: [
        { name: 'Whole Brain BDNF', activation: 100, color: '#10b981' },
        { name: 'Hippocampus', activation: 95, color: '#6366f1' },
        { name: 'Synaptic Growth', activation: 90, color: '#34d399' },
      ],
    },
  },
};

const BLOCK_TEMPLATE = [
  { suffix: 's1', title: 'Deep Session', duration: 90, type: 'focus' as const, emoji: '🧠' },
  { suffix: 'b1', title: 'Micro Reset', duration: 10, type: 'break' as const, emoji: '☕' },
  { suffix: 's2', title: 'Sprint', duration: 60, type: 'focus' as const, emoji: '⚡' },
  { suffix: 'b2', title: 'Micro Reset', duration: 10, type: 'break' as const, emoji: '☕' },
  { suffix: 's3', title: 'Final Push', duration: 90, type: 'focus' as const, emoji: '🔥' },
  { suffix: 'lb', title: 'Recovery Break', duration: 40, type: 'break' as const, emoji: '🌿' },
];

const BREAK_NOTES: Record<string, string> = {
  b1: 'Water, wash face, 10 squats.',
  b2: 'Close eyes, deep breaths, stretch.',
  lb: 'Eat, walk outside, no screens. Give your brain oxygen.',
};

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMin = (h * 60 + m + minutes) % (24 * 60);
  const newH = Math.floor(totalMin / 60);
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function generateSchedule(startTime: string): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];
  let cursor = startTime;

  for (let blockNum = 1; blockNum <= 3; blockNum++) {
    for (const tmpl of BLOCK_TEMPLATE) {
      const endTime = addMinutes(cursor, tmpl.duration);
      const isLastPush = blockNum === 3 && tmpl.suffix === 's3';
      const brainZone = tmpl.type === 'focus' ? BRAIN_ZONES[blockNum]?.[tmpl.suffix] : undefined;
      const note = tmpl.type === 'break' 
        ? (BREAK_NOTES[tmpl.suffix] || 'Rest and recover.')
        : (brainZone?.bestFor || '');
      
      blocks.push({
        id: `b${blockNum}${tmpl.suffix}`,
        title: isLastPush 
          ? '🏆 Block 3 · FINAL PUSH' 
          : `${tmpl.emoji} Block ${blockNum} · ${tmpl.title}`,
        startTime: cursor,
        endTime,
        type: tmpl.type,
        note,
        blockNum,
        duration: tmpl.duration,
        brainZone,
      });
      cursor = endTime;
    }
  }

  // Victory cooldown
  blocks.push({
    id: 'done',
    title: '🏆 Victory Cooldown',
    startTime: cursor,
    endTime: addMinutes(cursor, 25),
    type: 'break',
    note: 'Plan tomorrow. Write in journal. Sleep.',
    blockNum: 0,
    duration: 25,
  });

  return blocks;
}

const STORAGE_KEY = 'sef_schedule_start';
const DEFAULT_START = '07:00';

export default function Schedule() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState(DEFAULT_START);
  const [editingStart, setEditingStart] = useState(false);
  const [tempStart, setTempStart] = useState(DEFAULT_START);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { setStartTime(saved); setTempStart(saved); }
    } catch {}
  }, []);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const scheduleData = generateSchedule(startTime);

  const saveStartTime = useCallback(() => {
    setStartTime(tempStart);
    localStorage.setItem(STORAGE_KEY, tempStart);
    setEditingStart(false);
  }, [tempStart]);

  const presets = [
    { label: '🌅 05:00', value: '05:00' },
    { label: '☀️ 07:00', value: '07:00' },
    { label: '🌤️ 09:00', value: '09:00' },
    { label: '🌙 14:00', value: '14:00' },
    { label: '🦉 18:00', value: '18:00' },
    { label: '🌌 22:00', value: '22:00' },
  ];

  if (!currentTime) return null;

  const timeToDate = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date(currentTime);
    d.setHours(hours, minutes, 0, 0);
    const startHour = parseInt(startTime.split(':')[0]);
    if (startHour >= 18 && hours < 12) d.setDate(d.getDate() + 1);
    return d;
  };

  let currentItem: ScheduleBlock | null = null;
  let nextItem: ScheduleBlock | null = null;
  let completedCount = 0;

  for (let i = 0; i < scheduleData.length; i++) {
    const item = scheduleData[i];
    const start = timeToDate(item.startTime);
    const end = timeToDate(item.endTime);
    if (currentTime >= end) completedCount++;
    if (currentTime >= start && currentTime < end) {
      currentItem = item;
      nextItem = scheduleData[i + 1] || null;
    }
  }

  if (!currentItem) {
    nextItem = scheduleData.find(item => timeToDate(item.startTime) > currentTime) || null;
  }

  const getProgress = (item: ScheduleBlock) => {
    const start = timeToDate(item.startTime);
    const end = timeToDate(item.endTime);
    const total = end.getTime() - start.getTime();
    const elapsed = currentTime.getTime() - start.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getStatus = (item: ScheduleBlock) => {
    const start = timeToDate(item.startTime);
    const end = timeToDate(item.endTime);
    if (currentTime >= start && currentTime < end) return 'active';
    if (currentTime >= end) return 'past';
    return 'upcoming';
  };

  const focusBlocks = scheduleData.filter(i => i.type === 'focus');
  const totalFocusMinutes = focusBlocks.reduce((acc, item) => acc + item.duration, 0);
  const endTime = scheduleData[scheduleData.length - 1]?.endTime || '21:45';

  // Block summary (3 big blocks, each 4h focus)
  const blockSummaries = [1, 2, 3].map(bn => {
    const blockItems = scheduleData.filter(b => b.blockNum === bn);
    const focusMins = blockItems.filter(b => b.type === 'focus').reduce((a, b) => a + b.duration, 0);
    const firstStart = blockItems[0]?.startTime || '';
    const lastEnd = blockItems[blockItems.length - 1]?.endTime || '';
    const completedFocus = blockItems.filter(b => b.type === 'focus' && getStatus(b) === 'past').length;
    const totalFocus = blockItems.filter(b => b.type === 'focus').length;
    return { blockNum: bn, focusMins, firstStart, lastEnd, completedFocus, totalFocus };
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>📋 Today&apos;s Battle Plan</h2>
          <div className={styles.subtitle}>
            {completedCount}/{scheduleData.length} blocks · {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m focus
          </div>
        </div>
      </div>

      {/* Start Time Editor */}
      <div className={styles.startTimeSection}>
        {editingStart ? (
          <div className={styles.startEditor}>
            <div className={styles.startEditorLabel}>🕐 Set your start time:</div>
            <input type="time" value={tempStart} onChange={e => setTempStart(e.target.value)} className={styles.timeInput} />
            <div className={styles.presetGrid}>
              {presets.map(p => (
                <button key={p.value} className={`${styles.presetBtn} ${tempStart === p.value ? styles.presetActive : ''}`}
                  onClick={() => setTempStart(p.value)}>{p.label}</button>
              ))}
            </div>
            <div className={styles.startEditorActions}>
              <button className={styles.cancelBtn} onClick={() => { setEditingStart(false); setTempStart(startTime); }}>Cancel</button>
              <button className={styles.saveBtn} onClick={saveStartTime}>Apply Schedule</button>
            </div>
          </div>
        ) : (
          <button className={styles.startTimeBtn} onClick={() => setEditingStart(true)}>
            <span className={styles.startIcon}>🕐</span>
            <span>Start: <strong>{startTime}</strong> → End: <strong>{endTime}</strong></span>
            <span className={styles.editIcon}>✏️</span>
          </button>
        )}
      </div>

      {/* Block Overview Cards */}
      <div className={styles.blockOverview}>
        {blockSummaries.map(bs => (
          <div key={bs.blockNum} className={styles.blockCard}>
            <div className={styles.blockCardHeader}>
              <span className={styles.blockCardNum}>BLOCK {bs.blockNum}</span>
              <span className={styles.blockCardTime}>{bs.firstStart}–{bs.lastEnd}</span>
            </div>
            <div className={styles.blockCardDuration}>{bs.focusMins / 60}h focus</div>
            <div className={styles.blockCardPattern}>90m + 60m + 90m</div>
            <div className={styles.blockCardProgress}>
              {[0, 1, 2].map(i => (
                <div key={i} className={`${styles.blockDot} ${i < bs.completedFocus ? styles.blockDotDone : ''}`} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Live Now Card */}
      {currentItem && (
        <div className={`${styles.statusCard} ${styles.liveCard}`}>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            LIVE NOW
          </div>
          <div className={styles.liveTitle}>{currentItem.title}</div>
          <div className={styles.liveTime}>
            {currentItem.startTime} → {currentItem.endTime}
            <span className={styles.liveDuration}>{currentItem.duration}m</span>
          </div>
          <div className={styles.liveNote}>{currentItem.note}</div>
          <div className={styles.liveProgress}>
            <div className={styles.liveProgressFill} style={{ width: `${getProgress(currentItem)}%` }} />
          </div>
          {currentItem.brainZone && (
            <div className={styles.liveBrainZone}>
              <span>{currentItem.brainZone.icon} {currentItem.brainZone.name}</span>
            </div>
          )}
        </div>
      )}

      {!currentItem && (
        <div className={`${styles.statusCard} ${styles.offCard}`}>
          <div className={styles.offTitle}>🌙 Free Time</div>
          <div className={styles.offNote}>You&apos;re outside scheduled blocks. Recover well!</div>
        </div>
      )}

      {/* Up Next */}
      {nextItem && (
        <div className={`${styles.statusCard} ${styles.nextCard}`}>
          <div className={styles.nextBadge}>UP NEXT</div>
          <div className={styles.nextTitle}>{nextItem.title}</div>
          <div className={styles.nextTime}>
            {nextItem.startTime} → {nextItem.endTime}
            <span className={styles.liveDuration}>{nextItem.duration}m</span>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className={styles.timeline}>
        {scheduleData.map((item) => {
          const status = getStatus(item);
          const isFocus = item.type === 'focus';
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className={`${styles.timelineItem} ${styles[status]}`}
              onClick={() => item.brainZone && setExpandedId(isExpanded ? null : item.id)}
              style={{ cursor: item.brainZone ? 'pointer' : 'default' }}>
              <div className={styles.timelineDot}>
                <span className={`${styles.dot} ${isFocus ? styles.dotFocus : styles.dotBreak}`} />
                {status !== 'past' && <span className={styles.timeLine} />}
              </div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineHeader}>
                  <span className={styles.timelineTitle}>
                    {item.title}
                  </span>
                  <span className={styles.timelineTime}>
                    {item.startTime}
                    <span className={styles.durationBadge}>{item.duration}m</span>
                  </span>
                </div>
                {status === 'active' && (
                  <div className={styles.timelineProgress}>
                    <div className={styles.timelineProgressFill} style={{ width: `${getProgress(item)}%` }} />
                  </div>
                )}
                <div className={styles.timelineNote}>{item.note}</div>
                
                {/* Brain Zone Detail (expandable) */}
                {isExpanded && item.brainZone && (
                  <div className={styles.brainZoneDetail}>
                    <div className={styles.bzHeader}>
                      <span className={styles.bzIcon}>{item.brainZone.icon}</span>
                      <span className={styles.bzName}>{item.brainZone.name}</span>
                    </div>
                    <div className={styles.bzDesc}>{item.brainZone.description}</div>
                    
                    {/* Visual Brain Region Activation Map */}
                    <div className={styles.bzRegions}>
                      <div className={styles.bzRegionsLabel}>BRAIN REGION ACTIVATION</div>
                      {item.brainZone.brainRegions.map((region) => (
                        <div key={region.name} className={styles.bzRegionRow}>
                          <span className={styles.bzRegionName}>{region.name}</span>
                          <div className={styles.bzRegionBar}>
                            <div 
                              className={styles.bzRegionFill} 
                              style={{ width: `${region.activation}%`, background: region.color, boxShadow: `0 0 8px ${region.color}40` }} 
                            />
                          </div>
                          <span className={styles.bzRegionPct} style={{ color: region.color }}>{region.activation}%</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.bzBest}>
                      <strong>🎯 Best for:</strong> {item.brainZone.bestFor}
                    </div>
                    <div className={styles.bzNeuro}>
                      <strong>🧬 Neuroscience:</strong> {item.brainZone.neuroscience}
                    </div>
                  </div>
                )}
                {item.brainZone && !isExpanded && (
                  <div className={styles.bzHint}>
                    {item.brainZone.icon} {item.brainZone.name} <span className={styles.bzTap}>tap ▾</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

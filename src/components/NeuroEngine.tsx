"use client";

import React, { useState, useEffect, useMemo } from 'react';
import styles from './NeuroEngine.module.css';
import DigitalBrain from './DigitalBrain';
import type { BrainRegionData } from './DigitalBrain';

// ══════════════════════════════════════════════════════════════
//  NEUROBIOLOGICAL PRODUCTIVITY ENGINE
//  Based on: Huberman Lab, Cal Newport, cognitive neuroscience
// ══════════════════════════════════════════════════════════════

interface NeuroState {
  dopamine: number;      // 0-100: Motivation & reward
  norepinephrine: number; // 0-100: Alertness & urgency  
  acetylcholine: number;  // 0-100: Focus & learning
  serotonin: number;      // 0-100: Wellbeing & satisfaction
  cortisol: number;       // 0-100: Stress (too high = bad)
  adenosine: number;      // 0-100: Sleep pressure / fatigue
  bdnf: number;           // 0-100: Brain growth factor
  endorphins: number;     // 0-100: Pain relief & euphoria
}

interface BreakProtocol {
  title: string;
  actions: string[];
  neuroReason: string;
  icon: string;
}

interface CircadianPhase {
  name: string;
  icon: string;
  description: string;
  optimal: string;
  avoid: string;
  neurochemistry: string;
}

// ═══ CIRCADIAN RHYTHM MAP ═══
const getCircadianPhase = (hour: number): CircadianPhase => {
  if (hour >= 5 && hour < 8) return {
    name: 'Cortisol Awakening Response',
    icon: '🌅',
    description: 'Cortisol peaks naturally. Best time for high-alertness tasks.',
    optimal: 'Hard analytical work, math, problem-solving',
    avoid: 'Creative brainstorming (save for afternoon)',
    neurochemistry: 'Cortisol ↑ Norepinephrine ↑ — natural alertness without caffeine'
  };
  if (hour >= 8 && hour < 10) return {
    name: 'Peak Cognitive Window',
    icon: '🧠',
    description: 'Working memory and concentration at their highest.',
    optimal: 'Most demanding intellectual work, new concepts',
    avoid: 'Routine tasks, easy review',
    neurochemistry: 'Acetylcholine ↑ Dopamine ↑ — learning and focus optimized'
  };
  if (hour >= 10 && hour < 12) return {
    name: 'Sustained Focus Zone',
    icon: '⚡',
    description: 'Body temperature rising. Excellent for deep work.',
    optimal: 'Extended problem sets, deep reading, analysis',
    avoid: 'Multitasking (destroys acetylcholine pathways)',
    neurochemistry: 'Acetylcholine ↑↑ — deep encoding active'
  };
  if (hour >= 12 && hour < 14) return {
    name: 'Post-Prandial Dip',
    icon: '😴',
    description: 'Natural alertness dip. Blood diverts to digestion.',
    optimal: 'Light review, flashcards, passive recall',
    avoid: 'Complex new material (retention drops 40%)',
    neurochemistry: 'Adenosine ↑ Serotonin ↑ — drowsiness signals'
  };
  if (hour >= 14 && hour < 16) return {
    name: 'Second Wind',
    icon: '🔄',
    description: 'Alertness recovers. Good for creative connections.',
    optimal: 'Practice tests, creative problem-solving, synthesis',
    avoid: 'Pure memorization (save for morning)',
    neurochemistry: 'Dopamine ↑ — reward circuits re-engage'
  };
  if (hour >= 16 && hour < 18) return {
    name: 'Physical-Cognitive Peak',
    icon: '💪',
    description: 'Body temperature peaks. Reaction time fastest.',
    optimal: 'Timed practice tests, competitive studying',
    avoid: 'Starting new complex topics',
    neurochemistry: 'Norepinephrine ↑ Endorphins ↑ — performance peak'
  };
  if (hour >= 18 && hour < 20) return {
    name: 'Consolidation Window',
    icon: '🌆',
    description: 'Brain begins transferring short-term → long-term memory.',
    optimal: 'Review today\'s material, spaced repetition, summaries',
    avoid: 'Heavy new learning (interferes with consolidation)',
    neurochemistry: 'BDNF ↑ — neural pathway strengthening begins'
  };
  if (hour >= 20 && hour < 22) return {
    name: 'Wind-Down Phase',
    icon: '🌙',
    description: 'Melatonin begins rising. Cognitive load should decrease.',
    optimal: 'Light review, planning tomorrow, journaling',
    avoid: 'Intense focus (disrupts sleep onset → kills BDNF)',
    neurochemistry: 'Melatonin ↑ Cortisol ↓ — recovery mode activating'
  };
  return {
    name: 'Sleep Architecture Active',
    icon: '🌌',
    description: 'Brain is consolidating memories during sleep cycles.',
    optimal: 'SLEEP. Non-negotiable for memory consolidation.',
    avoid: 'Everything. Sleep debt destroys learning by 40%.',
    neurochemistry: 'Growth Hormone ↑ BDNF ↑↑ — neuroplasticity happens NOW'
  };
};

// ═══ FLOW STATE DETECTION ═══
type FlowLevel = 'none' | 'entering' | 'flow' | 'deep_flow' | 'hyperfocus';

const getFlowInfo = (consecutiveMinutes: number): { level: FlowLevel; label: string; tip: string; color: string } => {
  if (consecutiveMinutes < 15) return { level: 'none', label: 'Warming up', tip: 'First 15 min are hardest. Push through the resistance.', color: '#64748b' };
  if (consecutiveMinutes < 30) return { level: 'entering', label: 'Entering flow', tip: 'Prefrontal cortex handing control to basal ganglia. Don\'t check phone!', color: '#f59e0b' };
  if (consecutiveMinutes < 60) return { level: 'flow', label: 'Flow state', tip: 'Norepinephrine + dopamine + endorphins active. You\'re in the zone.', color: '#10b981' };
  if (consecutiveMinutes < 90) return { level: 'deep_flow', label: 'Deep flow', tip: 'Transient hypofrontality active — ego dissolving, pure performance.', color: '#6366f1' };
  return { level: 'hyperfocus', label: 'Hyperfocus', tip: 'Maximum neuroplasticity window. Your brain is literally rewiring right now.', color: '#a855f7' };
};

// ═══ BREAK PROTOCOLS ═══
const BREAK_PROTOCOLS: Record<string, BreakProtocol> = {
  short: {
    title: 'Neural Reset Protocol',
    icon: '☕',
    actions: [
      '🚶 Walk 2 minutes (increases BDNF by 30%)',
      '💧 Drink 250ml water (dehydration drops focus 25%)',
      '👀 20-20-20 rule: look 20ft away for 20 sec',
      '🫁 Box breathing: 4s in, 4s hold, 4s out, 4s hold',
      '❌ NO phone, NO social media (preserves dopamine)',
    ],
    neuroReason: 'Short breaks allow adenosine partial clearance while maintaining task-relevant neural activation (Zeigarnik effect keeps your brain working on the problem).',
  },
  long: {
    title: 'Deep Recovery Protocol',
    icon: '🌿',
    actions: [
      '🏃 10-min walk outside (sunlight resets circadian clock)',
      '🍎 Eat protein + complex carbs (fuels acetylcholine synthesis)',
      '🧊 Cold water on face (triggers diving reflex → parasympathetic reset)',
      '🎵 Listen to familiar music only (novel music steals attention)',
      '📵 Phone stays in another room (proximity alone drops IQ by 10pts)',
      '🧘 5-min eyes-closed rest (non-sleep deep rest boosts dopamine 65%)',
    ],
    neuroReason: 'Long breaks activate parasympathetic nervous system, clear cortisol, restore prefrontal glucose, and allow hippocampal replay of learned material.',
  },
};

// ═══ NEUROCHEMICAL STATE CALCULATOR ═══
const calculateNeuroState = (
  minutesFocused: number,
  sessionsToday: number,
  hour: number,
  isOnBreak: boolean,
  streakDays: number,
): NeuroState => {
  const phase = getCircadianPhase(hour);
  
  // Base levels by circadian phase
  let dopamine = 50, norepinephrine = 50, acetylcholine = 50;
  let serotonin = 50, cortisol = 30, adenosine = 20, bdnf = 30, endorphins = 20;

  // Circadian modulation
  if (hour >= 8 && hour < 12) { acetylcholine += 25; norepinephrine += 15; }
  if (hour >= 5 && hour < 9) { cortisol += 25; norepinephrine += 20; }
  if (hour >= 12 && hour < 14) { adenosine += 20; serotonin += 10; }
  if (hour >= 16 && hour < 18) { norepinephrine += 15; endorphins += 15; }
  if (hour >= 20) { adenosine += 25; cortisol -= 15; }

  // Focus modulation — energy ONLY drops during active focus
  if (!isOnBreak && minutesFocused > 0) {
    acetylcholine += Math.min(30, minutesFocused * 0.4);
    norepinephrine += Math.min(20, minutesFocused * 0.25);
    dopamine += Math.min(15, minutesFocused * 0.2);
    adenosine += minutesFocused * 0.15; // Fatigue accumulates ONLY during focus
    cortisol += minutesFocused > 60 ? (minutesFocused - 60) * 0.3 : 0;
  }

  // Session count modulation
  dopamine += sessionsToday * 5;
  bdnf += sessionsToday * 8;
  endorphins += sessionsToday * 3;
  if (sessionsToday > 6) cortisol += (sessionsToday - 6) * 8;
  // Fatigue from completed sessions — only focus sessions add fatigue
  adenosine += sessionsToday * 4;

  // Break modulation — RECOVERY happens here
  if (isOnBreak) {
    cortisol -= 20;
    adenosine -= 15; // Actively recover energy during breaks
    serotonin += 15;
    endorphins += 5;
  }

  // Streak bonus
  if (streakDays > 1) {
    bdnf += Math.min(20, streakDays * 2);  // Neuroplasticity compounds
    dopamine += Math.min(10, streakDays);   // Habit loop strengthens
  }

  // Clamp all values
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  
  // Suppress phase warning (used for base calculation context)
  void phase;
  
  return {
    dopamine: clamp(dopamine),
    norepinephrine: clamp(norepinephrine),
    acetylcholine: clamp(acetylcholine),
    serotonin: clamp(serotonin),
    cortisol: clamp(cortisol),
    adenosine: clamp(adenosine),
    bdnf: clamp(bdnf),
    endorphins: clamp(endorphins),
  };
};

// ═══ NEURO WARNINGS ═══
interface NeuroWarning {
  type: 'danger' | 'warning' | 'tip' | 'celebrate';
  icon: string;
  title: string;
  message: string;
}

const getWarnings = (state: NeuroState, sessionsToday: number, minutesFocused: number): NeuroWarning[] => {
  const w: NeuroWarning[] = [];

  if (state.cortisol > 75) w.push({
    type: 'danger', icon: '🚨', title: 'Cortisol Overload',
    message: 'Stress hormones too high. Take a break NOW or learning efficiency drops to near-zero. Cortisol literally kills hippocampal neurons.',
  });

  if (state.adenosine > 80) w.push({
    type: 'danger', icon: '😴', title: 'Adenosine Critical',
    message: 'Sleep pressure maxed out. Further studying is counterproductive — your brain cannot encode new memories. Consider NSDR (non-sleep deep rest) or stop for today.',
  });

  if (state.cortisol > 55 && state.cortisol <= 75) w.push({
    type: 'warning', icon: '⚠️', title: 'Rising Cortisol',
    message: 'Stress building up. The 90-min ultradian limit exists for a reason — your brain needs a reset.',
  });

  if (state.acetylcholine > 70 && minutesFocused > 20) w.push({
    type: 'celebrate', icon: '🧠', title: 'Peak Acetylcholine',
    message: 'Your focus neurochemistry is firing at maximum. This is when real learning happens — don\'t stop!',
  });

  if (state.dopamine > 75 && sessionsToday >= 3) w.push({
    type: 'celebrate', icon: '🔥', title: 'Dopamine Surge',
    message: 'Reward circuits fully engaged. You\'re in the productive zone. Each completed session strengthens the habit loop.',
  });

  if (state.bdnf > 60) w.push({
    type: 'tip', icon: '🌱', title: 'BDNF Elevated',
    message: 'Brain-Derived Neurotrophic Factor is high — your brain is literally growing new connections right now. Consistency compounds this effect.',
  });

  if (sessionsToday === 0) w.push({
    type: 'tip', icon: '⚡', title: 'Activation Energy',
    message: 'The hardest part is starting. Once you begin, norepinephrine kicks in within 5 minutes and resistance disappears. Just press LOCK IN.',
  });

  if (sessionsToday >= 9) w.push({
    type: 'celebrate', icon: '💎', title: 'Elite Status',
    message: `${sessionsToday} sessions today. You're in the top 1% of focused work. Your neural pathways are being permanently strengthened.`,
  });

  return w;
};

// ═══ COMPONENT ═══

interface Props {
  minutesFocused: number;
  sessionsToday: number;
  isOnBreak: boolean;
  isActive: boolean;
  breakType?: 'short' | 'long';
  activeBrainRegions?: BrainRegionData[];
}

export default function NeuroEngine({ minutesFocused, sessionsToday, isOnBreak, isActive, breakType, activeBrainRegions }: Props) {
  const [hour, setHour] = useState(new Date().getHours());
  const [expanded, setExpanded] = useState(false);
  const [showBreakProto, setShowBreakProto] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Read streak from goal system
  const streak = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const data = JSON.parse(localStorage.getItem('sef_goal_system') || '{}');
      return data.streak || 0;
    } catch { return 0; }
  }, []);

  const neuroState = useMemo(() =>
    calculateNeuroState(minutesFocused, sessionsToday, hour, isOnBreak, streak),
    [minutesFocused, sessionsToday, hour, isOnBreak, streak]
  );

  const flowInfo = useMemo(() => getFlowInfo(minutesFocused), [minutesFocused]);
  const circadian = useMemo(() => getCircadianPhase(hour), [hour]);
  const warnings = useMemo(() => getWarnings(neuroState, sessionsToday, minutesFocused), [neuroState, sessionsToday, minutesFocused]);
  const currentBreakProto = breakType ? BREAK_PROTOCOLS[breakType] : BREAK_PROTOCOLS.short;

  const CHEMS: { key: keyof NeuroState; label: string; icon: string; color: string; goodHigh: boolean }[] = [
    { key: 'dopamine', label: 'Dopamine', icon: '🎯', color: '#f59e0b', goodHigh: true },
    { key: 'norepinephrine', label: 'Norepinephrine', icon: '⚡', color: '#ef4444', goodHigh: true },
    { key: 'acetylcholine', label: 'Acetylcholine', icon: '🧠', color: '#6366f1', goodHigh: true },
    { key: 'serotonin', label: 'Serotonin', icon: '😊', color: '#10b981', goodHigh: true },
    { key: 'cortisol', label: 'Cortisol', icon: '😰', color: '#ef4444', goodHigh: false },
    { key: 'adenosine', label: 'Adenosine', icon: '😴', color: '#64748b', goodHigh: false },
    { key: 'bdnf', label: 'BDNF', icon: '🌱', color: '#10b981', goodHigh: true },
    { key: 'endorphins', label: 'Endorphins', icon: '✨', color: '#a855f7', goodHigh: true },
  ];

  const energyPct = Math.max(0, Math.min(100, Math.round(100 - neuroState.adenosine - (neuroState.cortisol > 40 ? (neuroState.cortisol - 40) * 0.5 : 0))));

  return (
    <div className={styles.container}>
      {/* ═══ DIGITAL BRAIN VISUALIZATION ═══ */}
      {activeBrainRegions && activeBrainRegions.length > 0 && (
        <DigitalBrain
          activeRegions={activeBrainRegions}
          title="🧠 BRAIN ACTIVATION MAP"
          subtitle={isOnBreak ? 'Recovery mode — regions cooling down' : isActive ? 'Active neural pathways' : 'Idle state'}
        />
      )}

      {/* Brain Energy */}
      <div className={styles.energyCard}>
        <div className={styles.energyTop}>
          <span className={styles.energyLabel}>🔋 Brain Energy</span>
          <span className={styles.energyVal} style={{ color: energyPct > 50 ? '#10b981' : energyPct > 20 ? '#f59e0b' : '#ef4444' }}>{energyPct}%</span>
        </div>
        <div className={styles.energyBar}>
          <div className={styles.energyFill} style={{ width: `${energyPct}%`, background: energyPct > 50 ? 'linear-gradient(90deg, #10b981, #6ee7b7)' : energyPct > 20 ? 'linear-gradient(90deg, #f59e0b, #fcd34d)' : '#ef4444' }} />
        </div>
      </div>

      {/* Flow State Indicator */}
      {isActive && !isOnBreak && (
        <div className={styles.flowBar} style={{ borderColor: flowInfo.color }}>
          <div className={styles.flowDot} style={{ background: flowInfo.color }} />
          <div className={styles.flowInfo}>
            <span className={styles.flowLabel} style={{ color: flowInfo.color }}>{flowInfo.label}</span>
            <span className={styles.flowTip}>{flowInfo.tip}</span>
          </div>
        </div>
      )}

      {/* Break Protocol */}
      {isOnBreak && (
        <div className={styles.breakProto}>
          <button className={styles.breakToggle} onClick={() => setShowBreakProto(!showBreakProto)}>
            {currentBreakProto.icon} {currentBreakProto.title}
            <span className={styles.chevron}>{showBreakProto ? '▲' : '▼'}</span>
          </button>
          {showBreakProto && (
            <div className={styles.breakContent}>
              <div className={styles.breakActions}>
                {currentBreakProto.actions.map((action, i) => (
                  <div key={i} className={styles.breakAction}>{action}</div>
                ))}
              </div>
              <div className={styles.breakReason}>
                <strong>Why:</strong> {currentBreakProto.neuroReason}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {warnings.slice(0, 2).map((w, i) => (
        <div key={i} className={`${styles.warning} ${styles[`warning_${w.type}`]}`}>
          <span className={styles.warningIcon}>{w.icon}</span>
          <div>
            <div className={styles.warningTitle}>{w.title}</div>
            <div className={styles.warningMsg}>{w.message}</div>
          </div>
        </div>
      ))}

      {/* Circadian Phase */}
      <button className={styles.circadianBar} onClick={() => setExpanded(!expanded)}>
        <span>{circadian.icon} {circadian.name}</span>
        <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className={styles.expandedPanel}>
          {/* Circadian Details */}
          <div className={styles.circadianDetail}>
            <p className={styles.circDesc}>{circadian.description}</p>
            <div className={styles.circRow}>
              <div className={styles.circGood}>
                <span className={styles.circLabel}>✅ Optimal now:</span>
                <span>{circadian.optimal}</span>
              </div>
              <div className={styles.circBad}>
                <span className={styles.circLabel}>❌ Avoid:</span>
                <span>{circadian.avoid}</span>
              </div>
            </div>
            <div className={styles.circNeuro}>🧬 {circadian.neurochemistry}</div>
          </div>

          {/* Neurochemical Dashboard */}
          <div className={styles.neuroTitle}>🧪 Neural State</div>
          <div className={styles.chemGrid}>
            {CHEMS.map(chem => {
              const val = neuroState[chem.key];
              const isHigh = val > 70;
              const isDanger = !chem.goodHigh && val > 65;
              return (
                <div key={chem.key} className={`${styles.chemItem} ${isDanger ? styles.chemDanger : ''}`}>
                  <div className={styles.chemTop}>
                    <span>{chem.icon}</span>
                    <span className={styles.chemLabel}>{chem.label}</span>
                    <span className={styles.chemVal} style={{ color: isDanger ? '#fca5a5' : isHigh && chem.goodHigh ? chem.color : 'var(--text-muted)' }}>
                      {val}
                    </span>
                  </div>
                  <div className={styles.chemBar}>
                    <div className={styles.chemFill} style={{
                      width: `${val}%`,
                      background: isDanger ? '#ef4444' : chem.color,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Science Tips */}
          <div className={styles.scienceTips}>
            <div className={styles.neuroTitle}>🔬 Neuroscience Tips</div>
            <div className={styles.tipsList}>
              <div className={styles.sciTip}>
                <strong>Dopamine:</strong> Reward yourself AFTER sessions, never during. Anticipation drives motivation more than the reward itself.
              </div>
              <div className={styles.sciTip}>
                <strong>Acetylcholine:</strong> Focus narrows attention. Eliminate ALL distractions — even having your phone nearby drops cognitive capacity by 10%.
              </div>
              <div className={styles.sciTip}>
                <strong>BDNF:</strong> Increases 300% with exercise. A 10-min walk during long breaks literally grows your brain.
              </div>
              <div className={styles.sciTip}>
                <strong>Cortisol:</strong> Chronic stress kills hippocampal neurons. 90-min max per session is not optional — it&apos;s neurobiology.
              </div>
              <div className={styles.sciTip}>
                <strong>Sleep:</strong> One night of poor sleep reduces learning capacity by 40%. Memories consolidate during deep sleep, not while studying.
              </div>
              <div className={styles.sciTip}>
                <strong>NSDR:</strong> Non-Sleep Deep Rest (10-min eyes closed, body still) boosts dopamine by 65%. Use during long breaks.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

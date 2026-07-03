"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Timer.module.css';
import { loadTimerState, saveTimerState, saveReflection } from '../lib/cloudSync';
import SessionReflection from './SessionReflection';
// NeuroEngine and NeuroGuideModal moved to Dashboard

// ══════════════════════════════════════════════════════════
//  COGNITIVE PSYCHOLOGY ENGINE
//  - Ultradian Rhythm: 90 min focus aligns with natural brain cycles
//  - Decision Fatigue Elimination: AUTO transitions, ZERO choices needed
//  - Progress Dopamine: Visual feedback at every milestone
//  - Implementation Intentions: "When X happens, I will Y" — automated
//  - Commitment Device: Once locked in, the day runs itself
// ══════════════════════════════════════════════════════════

type Mode = 'focus' | 'shortBreak' | 'longBreak' | 'custom';
type FlowState = 'idle' | 'locked' | 'paused';

interface TimerSettings {
  sequence: number[]; // e.g. [90, 60, 90]
  breakRatio: number; // e.g. 0.2 (20% of focus time)
}

const DEFAULT_SETTINGS: TimerSettings = {
  sequence: [90, 60, 90],
  breakRatio: 0.2, // 20%
};

const DAILY_GOAL_HOURS = 12;

// Psychological reward messages based on progress
const getMotivation = (sessions: number, todayHours: number): { msg: string; sub: string } => {
  if (sessions === 0) return { msg: "Take the first step.", sub: "90 minutes. Just begin." };
  if (sessions === 1) return { msg: "Session 1 done! 💪", sub: "You're already ahead of 90% of people." };
  if (sessions === 2) return { msg: "Momentum building 🔥", sub: "Neural pathways are strengthening right now." };
  if (sessions === 3) return { msg: "BLOCK 1 COMPLETE! 🏆", sub: "4 hours of deep work. Professional level." };
  if (sessions === 4) return { msg: "Block 2 started.", sub: "No decisions needed. Just keep going." };
  if (sessions === 5) return { msg: "Halfway there!", sub: "Most people never make it this far." };
  if (sessions === 6) return { msg: "BLOCK 2 COMPLETE! 🔥🔥", sub: "8 hours! Approaching elite level." };
  if (sessions === 7) return { msg: "Final block.", sub: "This is where winners and quitters separate." };
  if (sessions === 8) return { msg: "Almost there! 💎", sub: "Your brain will thank you." };
  if (todayHours >= 12) return { msg: "12 HOURS COMPLETE! 🏆🔥💪", sub: "You became a LEGEND today. Rest now." };
  return { msg: `${sessions} sessions done! Keep going.`, sub: "Every minute counts." };
};

// Break messages — remind them WHY they rest
const getBreakMessage = (mode: Mode): string => {
  if (mode === 'shortBreak') return "Give your brain oxygen. Auto-resume in 10 minutes.";
  return "Deep rest. Eat. Walk. Brain is recovering...";
};

// Time-of-day greeting
const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 6) return "Night owl mode 🦉";
  if (h < 9) return "Early bird 🌅";
  if (h < 12) return "Morning grind ☀️";
  if (h < 15) return "Afternoon push 💪";
  if (h < 18) return "Evening grind 🔥";
  if (h < 21) return "Final block 🌙";
  return "Late night focus 🌌";
};

const playBell = () => {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05 + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + 3.5);
    });
  } catch {}
};

// Urgent alarm for focus end
const playAlarm = () => {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(880, ctx.currentTime + i * 0.4);
      o.frequency.setValueAtTime(660, ctx.currentTime + i * 0.4 + 0.15);
      g.gain.setValueAtTime(0, ctx.currentTime + i * 0.4);
      g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.4 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.4 + 0.35);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.4);
      o.stop(ctx.currentTime + i * 0.4 + 0.4);
    }
  } catch {}
};

export default function Timer() {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<Mode>('focus');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.sequence[0] * 60);
  const [isActive, setIsActive] = useState(false);
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [autoMode, setAutoMode] = useState(true); // KEY: auto-transition enabled by default
  const [showComplete, setShowComplete] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

  const [pendingBreakType, setPendingBreakType] = useState<'shortBreak' | 'longBreak'>('shortBreak');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [customDuration, setCustomDuration] = useState(30);
  const transitionRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Reflection handlers
  const handleReflectionSubmit = (text: string) => {
    const reflection = {
      id: Date.now().toString(),
      session: sessionsCompleted,
      text,
      date: new Date().toISOString(),
    };
    // Save locally + cloud
    const reflections = JSON.parse(localStorage.getItem('sef_reflections') || '[]');
    reflections.push(reflection);
    localStorage.setItem('sef_reflections', JSON.stringify(reflections));
    saveReflection(reflection); // Cloud sync
    setShowReflection(false);
    switchMode(pendingBreakType, true);
  };

  const handleReflectionSkip = () => {
    setShowReflection(false);
    switchMode(pendingBreakType, true);
  };

  // Load — try cloud first, fall back to localStorage
  useEffect(() => {
    const load = async () => {
      // Try local first for speed
      try {
        const saved = localStorage.getItem('sef_v3');
        const activeState = localStorage.getItem('sef_active_timer');
        
        let loadedTimeLeft = DEFAULT_SETTINGS.sequence[0] * 60;
        let wasActive = false;
        let savedMode: Mode = 'focus';
        let savedFlowState: FlowState = 'idle';

        if (saved) {
          const d = JSON.parse(saved);
          if (d.settings) setSettings(d.settings);
          setSessionsCompleted(d.sessions || 0);
          setAutoMode(d.autoMode !== false);
          const today = new Date().toDateString();
          if (d.lastDate === today) setTodaySeconds(d.todaySeconds || 0);
          const s = d.settings || DEFAULT_SETTINGS;
          loadedTimeLeft = s.sequence[0] * 60;
        }

        // Restore active timer if it exists
        if (activeState) {
          const active = JSON.parse(activeState);
          if (active.isActive && active.targetEndTime) {
            const remaining = Math.round((active.targetEndTime - Date.now()) / 1000);
            if (remaining > 0) {
              loadedTimeLeft = remaining;
              wasActive = true;
              savedMode = active.mode || 'focus';
              savedFlowState = 'locked';
            } else {
              loadedTimeLeft = 0; // It finished while offline!
            }
          } else if (active.timeLeft) {
             loadedTimeLeft = active.timeLeft;
             savedMode = active.mode || 'focus';
             savedFlowState = active.flowState || 'idle';
          }
        }
        
        setTimeLeft(loadedTimeLeft);
        if (wasActive) {
          setMode(savedMode);
          setFlowState(savedFlowState);
          setIsActive(true);
        }

      } catch {}
      
      // Then sync from cloud (overrides if newer)
      try {
        const cloud = await loadTimerState();
        if (cloud) {
          setSettings(cloud.settings || DEFAULT_SETTINGS);
          setSessionsCompleted(cloud.sessions_completed || 0);
          setAutoMode(cloud.auto_mode !== false);
          const today = new Date().toDateString();
          if (cloud.last_date === today) setTodaySeconds(cloud.today_seconds || 0);
        }
      } catch {}
      setIsLoaded(true);
    };
    load();
  }, []);

  // Save — localStorage (instant) + Supabase (async)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    const state = {
      settings, sessions: sessionsCompleted, todaySeconds,
      autoMode, lastDate: new Date().toDateString(),
    };
    localStorage.setItem('sef_v3', JSON.stringify(state));
    // Debounce cloud save (every 10 seconds max)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimerState(state);
    }, 10000);
  }, [settings, sessionsCompleted, todaySeconds, autoMode, isLoaded]);

  const switchMode = useCallback((m: Mode, autoStart = false, customMins = 0) => {
    setMode(m);
    if (m === 'custom') {
      setTimeLeft(customMins * 60);
    } else {
      const currentFocus = settings.sequence[sessionsCompleted % settings.sequence.length];
      if (m === 'focus') {
        setTimeLeft(currentFocus * 60);
      } else if (m === 'shortBreak') {
        setTimeLeft(Math.round(currentFocus * settings.breakRatio) * 60);
      } else if (m === 'longBreak') {
        setTimeLeft(Math.round(currentFocus * settings.breakRatio * 1.5) * 60);
      }
    }
    
    if (autoStart && autoMode && m !== 'custom') {
      // 3 second countdown before auto-starting next session
      setShowComplete(true);
      transitionRef.current = setTimeout(() => {
        setShowComplete(false);
        setIsActive(true);
      }, 3000);
    } else {
      setIsActive(false);
    }
  }, [settings, autoMode]);

  const startCustomSession = () => {
    if (!customReason.trim()) return;
    setShowCustomModal(false);
    switchMode('custom', false, customDuration);
    setIsActive(true); // Auto start custom session immediately
    setFlowState('locked');
  };

  // Cleanup transition timer
  useEffect(() => {
    return () => {
      if (transitionRef.current) clearTimeout(transitionRef.current);
    };
  }, []);

  // Tick — uses timestamp-based tracking to survive background tabs
  useEffect(() => {
    if (!isActive) {
      // Save paused state
      localStorage.setItem('sef_active_timer', JSON.stringify({ isActive: false, timeLeft, mode, flowState }));
      return;
    }
    
    lastTickRef.current = Date.now();
    const targetEndTime = Date.now() + timeLeft * 1000;
    
    // Save target end time so it survives reloads/closed tabs
    localStorage.setItem('sef_active_timer', JSON.stringify({ 
      isActive: true, 
      targetEndTime, 
      mode,
      flowState 
    }));

    // Use Web Worker to bypass browser throttling on unfocused tabs
    const workerCode = `
      let iv;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          iv = setInterval(() => self.postMessage('tick'), 1000);
        } else if (e.data === 'stop') {
          clearInterval(iv);
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = () => {
      const now = Date.now();
      const elapsed = Math.round((now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      if (elapsed > 0) {
        setTimeLeft(t => {
          const newTime = Math.max(0, t - elapsed);
          return newTime;
        });
        setMode(m => {
          if (m === 'focus') setTodaySeconds(s => s + elapsed);
          return m;
        });
      }
    };

    worker.postMessage('start');

    return () => {
      worker.postMessage('stop');
      worker.terminate();
    };
  }, [isActive, mode, flowState]); // Note: timeLeft is intentionally omitted to avoid resetting the interval

  // ═══ CORE: Auto-transition on complete ═══
  useEffect(() => {
    if (timeLeft !== 0 || !isActive) return;
    setIsActive(false);

    if (mode === 'focus') {
      // Focus completed → SHOW REFLECTION before transitioning
      playAlarm();
      const n = sessionsCompleted + 1;
      setSessionsCompleted(n);
      setShowReflection(true); // Show reflection FIRST
      setPendingBreakType(n % 3 === 0 ? 'longBreak' : 'shortBreak');
      setFlowState('locked');
    } else if (mode === 'custom') {
      playAlarm();
      setFlowState('idle');
      switchMode('focus', false); // Reset to default mode
    } else {
      // Break completed → signal + auto focus
      playBell();
      switchMode('focus', true);
    }
  }, [timeLeft, isActive, mode, sessionsCompleted, switchMode]);

  // Tab title
  useEffect(() => {
    if (!isLoaded) return;
    const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
    const t = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (mode === 'focus') {
      document.title = isActive ? `🔥 ${t} FOCUS` : 'SEF · Study Extreme Focus';
    } else if (mode === 'custom') {
      document.title = isActive ? `⚙️ ${t} CUSTOM` : 'SEF · Study Extreme Focus';
    } else {
      document.title = isActive ? `☕ ${t} BREAK` : 'SEF · Study Extreme Focus';
    }
  }, [timeLeft, mode, isActive, isLoaded]);

  // Space to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        setIsActive(prev => {
          if (!prev) setFlowState('locked');
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const fmtHM = (sec: number) => {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Progress
  const currentFocus = settings.sequence[sessionsCompleted % settings.sequence.length];
  const total = (mode === 'custom' ? customDuration : mode === 'focus' ? currentFocus : mode === 'shortBreak' ? Math.round(currentFocus * settings.breakRatio) : Math.round(currentFocus * settings.breakRatio * 1.5)) * 60;
  const progress = total > 0 ? (total - timeLeft) / total : 0;

  // Daily progress
  const todayHours = todaySeconds / 3600;
  const dailyPct = Math.min(100, (todayHours / DAILY_GOAL_HOURS) * 100);

  const motivation = getMotivation(sessionsCompleted, todayHours);

  // ═══ BROADCAST STATE TO DASHBOARD ═══
  useEffect(() => {
    if (!isLoaded) return;
    const state = {
      sessionsCompleted,
      todaySeconds,
      todayHours,
      dailyPct,
      mode,
      isActive,
      currentFocus,
      timeLeft,
      flowState,
    };
    localStorage.setItem('sef_timer_state', JSON.stringify(state));
  }, [sessionsCompleted, todaySeconds, todayHours, dailyPct, mode, isActive, currentFocus, timeLeft, flowState, isLoaded]);



  const lockIn = () => {
    setFlowState('locked');
    setIsActive(true);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  if (!isLoaded) return null;

  return (
    <div className={styles.wrapper}>
      {/* Greeting */}
      <div className={styles.greeting}>{getGreeting()}</div>

      {/* ═══ IDLE STATE: "Just Start" anti-paralysis ═══ */}
      {flowState === 'idle' && !isActive && (
        <div className={styles.idleState}>
          <div className={styles.idleMsg}>{motivation.msg}</div>
          <div className={styles.idleSub}>{motivation.sub}</div>
          <button className={styles.lockInBtn} onClick={lockIn}>
            LOCK IN 🔒
          </button>
          <div className={styles.lockInHint}>
            Once locked in, your day runs itself. No decisions. Just action.
          </div>
        </div>
      )}

      {/* ═══ ACTIVE/LOCKED STATE ═══ */}
      {(flowState !== 'idle' || isActive) && (
        <>
          {/* Top Controls (Hidden while active) */}
          <div className={`${styles.topControls} ${isActive ? styles.hideControls : ''}`}>
            {/* Mode indicator */}
            <div className={styles.modes}>
              {(['focus', 'shortBreak', 'longBreak'] as Mode[]).map(m => {
                const labels: Record<Mode, string> = { focus: 'Focus', shortBreak: 'Short Break', longBreak: 'Long Break', custom: 'Custom' };
                const icons: Record<Mode, string> = { focus: '🔥', shortBreak: '☕', longBreak: '🌿', custom: '⚙️' };
                return (
                  <div key={m}
                    className={`${styles.modeBtn} ${mode === m ? (m === 'focus' ? styles.modeFocus : styles.modeBreak) : ''}`}
                    style={{ cursor: 'default' }}>
                    <span>{icons[m]}</span> {labels[m]}
                  </div>
                );
              })}
            </div>

            {/* Auto-mode toggle */}
            <button className={`${styles.autoToggle} ${autoMode ? styles.autoOn : ''}`}
              onClick={() => setAutoMode(!autoMode)}>
              {autoMode ? '🔄 Auto-transition: ON' : '⏸ Auto-transition: OFF'}
            </button>
          </div>

          {/* Auto-transition overlay */}
          {showComplete && (
            <div className={styles.transitionOverlay}>
              <div className={styles.transitionText}>
                {mode === 'focus' ? '🔥 Focus starting...' : mode === 'shortBreak' ? '☕ Short break starting...' : '🌿 Long break starting...'}
              </div>
              <div className={styles.transitionCountdown}>Auto-starting in 3 seconds</div>
            </div>
          )}

          {/* Massive Timer + Linear Progress */}
          <div className={styles.hugeTimerWrap}>
            <div className={`${styles.timerLabel} ${isActive ? styles.hideControls : ''}`}>
              {mode === 'focus' ? 'DEEP FOCUS' : mode === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK'}
            </div>
            
            <div className={`${styles.digits} ${isActive ? styles.digitsActive : ''}`}>
              {fmt(timeLeft)}
            </div>
            
            {/* YITA-style Progress Bar */}
            <div className={styles.progressWrap}>
              <div className={styles.progressTrack}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${progress * 100}%` }} 
                />
              </div>
            </div>

            <div className={`${styles.session} ${isActive ? styles.hideControls : ''}`}>
              Session #{sessionsCompleted + 1} · Block {Math.floor(sessionsCompleted / 3) + 1}
            </div>
          </div>

          {/* Bottom Controls (Hidden while active) */}
          <div className={`${styles.bottomControls} ${isActive ? styles.hideControls : ''}`}>
            <div className={styles.controls}>
              <button className={styles.ctrlBtn} onClick={() => { switchMode(mode); setIsActive(false); }} title="Reset">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </button>
              <button className={`${styles.playBtn} ${isActive ? styles.playing : ''}`}
                onClick={() => setIsActive(!isActive)}>
                {isActive ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>
                )}
              </button>
              <button className={styles.ctrlBtn} onClick={toggleFullScreen} title="Full Screen">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              </button>
            </div>
            
            <div className={styles.spaceHint}>
              <kbd className={styles.kbd}>Space</kbd> {isActive ? 'pause' : 'resume'}
            </div>
          </div>
        </>
      )}

      {/* Session Reflection Modal */}
      {showReflection && (
        <SessionReflection
          sessionNumber={sessionsCompleted}
          onSubmit={handleReflectionSubmit}
          onSkip={handleReflectionSkip}
        />
      )}
      {/* Custom Session Modal */}
      {showCustomModal && (
        <div className={styles.overlay} onClick={() => setShowCustomModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalH}>⚙️ Custom Session</h3>
            <p className={styles.modalSub}>
              Neurobiological optimum is 90 mins. Custom sessions are OUTSIDE the main study system and will not count towards your daily block score.
            </p>
            
            <div className={styles.setGrid}>
              <label className={styles.setItem}>
                <span>⏱ Duration</span>
                <div className={styles.setInputWrap}>
                  <input type="number" min={1} max={240} value={customDuration}
                    onChange={e => setCustomDuration(Number(e.target.value))}
                    className={styles.setInput} />
                  <span className={styles.setUnit}>min</span>
                </div>
              </label>
              <label className={styles.setItem} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span>📝 Mandatory Reason</span>
                <input type="text" value={customReason} onChange={e => setCustomReason(e.target.value)}
                  placeholder="Why are you breaking the 90m rule?"
                  className={styles.textInput} />
              </label>
            </div>
            
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => setShowCustomModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={startCustomSession} disabled={!customReason.trim()}>
                Start Custom Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

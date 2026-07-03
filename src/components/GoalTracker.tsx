"use client";

import React, { useState, useEffect } from 'react';
import styles from './GoalTracker.module.css';
import { loadGoals, saveGoal, deleteGoal } from '../lib/cloudSync';

interface Goal {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  emoji: string;
  color: string;
}

export default function GoalTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', targetDate: '', emoji: '🎯' });
  const [now, setNow] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Local first
      const saved = localStorage.getItem('sef_goals');
      if (saved) { try { setGoals(JSON.parse(saved)); } catch {} }
      setNow(new Date());
      setIsLoaded(true);
      // Then cloud
      try {
        const cloudGoals = await loadGoals();
        if (cloudGoals.length > 0) {
          setGoals(cloudGoals.map(g => ({ id: g.id, title: g.title, targetDate: g.target_date, emoji: g.emoji, color: g.color })));
        }
      } catch {}
    };
    load();
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem('sef_goals', JSON.stringify(goals));
  }, [goals, isLoaded]);

  if (!now) return null;

  const addGoal = () => {
    if (!newGoal.title || !newGoal.targetDate) return;
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];
    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      targetDate: newGoal.targetDate,
      emoji: newGoal.emoji || '🎯',
      color: colors[goals.length % colors.length],
    };
    setGoals([...goals, goal]);
    saveGoal(goal); // Cloud sync
    setNewGoal({ title: '', targetDate: '', emoji: '🎯' });
    setShowAdd(false);
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    deleteGoal(id); // Cloud sync
  };

  const getCountdown = (targetDate: string) => {
    const target = new Date(targetDate + 'T23:59:59');
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, label: 'Completed!', progress: 100 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours, label: `${days}d ${hours}h`, progress: 0 };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>🎯 Goals & Deadlines</h2>
        <button className={styles.addBtn} onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕' : '＋'}
        </button>
      </div>

      {showAdd && (
        <div className={styles.addForm}>
          <input
            className={styles.input}
            placeholder="Goal name (e.g. SAT Exam)"
            value={newGoal.title}
            onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
          />
          <input
            className={styles.input}
            type="date"
            value={newGoal.targetDate}
            onChange={e => setNewGoal({ ...newGoal, targetDate: e.target.value })}
          />
          <div className={styles.emojiRow}>
            {['🎯', '🔥', '📚', '🧠', '💪', '⭐', '🏆', '🚀'].map(e => (
              <button
                key={e}
                className={`${styles.emojiBtn} ${newGoal.emoji === e ? styles.emojiSelected : ''}`}
                onClick={() => setNewGoal({ ...newGoal, emoji: e })}
              >
                {e}
              </button>
            ))}
          </div>
          <button className={styles.saveBtn} onClick={addGoal}>Add Goal</button>
        </div>
      )}

      <div className={styles.goalsList}>
        {goals.map(goal => {
          const countdown = getCountdown(goal.targetDate);
          const urgency = countdown.days <= 7 ? styles.urgent : countdown.days <= 30 ? styles.soon : '';
          return (
            <div key={goal.id} className={`${styles.goalCard} ${urgency}`} style={{ '--goal-color': goal.color } as React.CSSProperties}>
              <div className={styles.goalTop}>
                <div className={styles.goalEmoji}>{goal.emoji}</div>
                <div className={styles.goalInfo}>
                  <div className={styles.goalTitle}>{goal.title}</div>
                  <div className={styles.goalDate}>{goal.targetDate}</div>
                </div>
                <button className={styles.removeBtn} onClick={() => removeGoal(goal.id)}>✕</button>
              </div>
              <div className={styles.countdownRow}>
                <div className={styles.countdownBig}>{countdown.days}</div>
                <div className={styles.countdownUnit}>
                  <span>days</span>
                  <span className={styles.countdownHours}>{countdown.hours}h remaining</span>
                </div>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${Math.max(2, 100 - (countdown.days / 90 * 100))}%` }} />
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', lineHeight: '1.6', fontStyle: 'italic' }}>
            No goals yet. Tap + to add your first goal and deadline.
          </div>
        )}
      </div>
    </div>
  );
}

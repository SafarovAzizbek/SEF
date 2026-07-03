"use client";

import React, { useState, useEffect } from 'react';
import styles from './AppSettings.module.css';

interface AppConfig {
  googleSheetUrl: string;
  dailyGoalHours: number;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsPerBlock: number;
  autoTransition: boolean;
  reflectionRequired: boolean;
  userName: string;
  examName: string;
  examDate: string;
}

const DEFAULT_CONFIG: AppConfig = {
  googleSheetUrl: '',
  dailyGoalHours: 12,
  focusMinutes: 90,
  shortBreakMinutes: 10,
  longBreakMinutes: 40,
  sessionsPerBlock: 3,
  autoTransition: true,
  reflectionRequired: true,
  userName: '',
  examName: '',
  examDate: '',
};

export function loadConfig(): AppConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const saved = localStorage.getItem('sef_config');
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveConfig(config: AppConfig) {
  localStorage.setItem('sef_config', JSON.stringify(config));
}

interface Props {
  onClose: () => void;
  inline?: boolean; // When true, render without overlay/modal wrapper
}

export default function AppSettings({ onClose, inline = false }: Props) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'general' | 'integration'>('general');
  const [sheetStatus, setSheetStatus] = useState<string>('');

  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  const save = () => {
    saveConfig(config);
    onClose();
    window.location.reload(); // Apply changes
  };

  const testSheet = async () => {
    if (!config.googleSheetUrl) return;
    setSheetStatus('Testing...');
    try {
      // Convert Google Sheets URL to CSV export URL
      let url = config.googleSheetUrl;
      if (url.includes('/edit')) {
        url = url.replace(/\/edit.*$/, '/export?format=csv');
      } else if (url.includes('/pubhtml')) {
        url = url.replace(/\/pubhtml.*$/, '/export?format=csv');
      }
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        const lines = text.split('\n').filter(l => l.trim());
        setSheetStatus(`✅ Connection successful! ${lines.length - 1} rows found.`);
      } else {
        setSheetStatus('❌ Error. Is the sheet published to web?');
      }
    } catch {
      setSheetStatus('❌ CORS error. Sheet is not published correctly.');
    }
  };

  const content = (
    <>
      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { key: 'general' as const, label: '👤 General' },
          { key: 'integration' as const, label: '🔗 Integration' },
        ].map(tab => (
          <button key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {/* General */}
        {activeTab === 'general' && (
          <div className={styles.section}>
            <label className={styles.field}>
              <span>Your name</span>
              <input className={styles.input} placeholder="e.g. John"
                value={config.userName} onChange={e => setConfig({ ...config, userName: e.target.value })} />
            </label>
            <label className={styles.field}>
              <span>Exam name</span>
              <input className={styles.input} placeholder="e.g. SAT, IELTS, GRE"
                value={config.examName} onChange={e => setConfig({ ...config, examName: e.target.value })} />
            </label>
            <label className={styles.field}>
              <span>Exam date</span>
              <input className={styles.input} type="date"
                value={config.examDate} onChange={e => setConfig({ ...config, examDate: e.target.value })} />
            </label>
            <label className={styles.toggle}>
              <span>Require reflection after each session?</span>
              <button className={`${styles.toggleBtn} ${config.reflectionRequired ? styles.toggleOn : ''}`}
                onClick={() => setConfig({ ...config, reflectionRequired: !config.reflectionRequired })}>
                {config.reflectionRequired ? 'ON' : 'OFF'}
              </button>
            </label>

            <div className={styles.info} style={{ marginTop: '0.5rem' }}>
              🔒 <strong>Daily Target: 12 HOURS</strong> — Hardcoded. Non-negotiable. Temir Intizom.
            </div>
          </div>
        )}

        {/* Integration */}
        {activeTab === 'integration' && (
          <div className={styles.section}>
            <div className={styles.info}>
              📊 Manage your schedule and data via Google Sheets.
              <br /><br />
              <strong>How to connect:</strong>
              <br />1. Open Google Sheets
              <br />2. File → Share → Publish to web → CSV
              <br />3. Paste the link below
            </div>
            <label className={styles.field}>
              <span>Google Sheet URL</span>
              <input className={styles.input}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={config.googleSheetUrl}
                onChange={e => setConfig({ ...config, googleSheetUrl: e.target.value })} />
            </label>
            <button className={styles.testBtn} onClick={testSheet}>
              🔍 Test connection
            </button>
            {sheetStatus && <div className={styles.sheetStatus}>{sheetStatus}</div>}

            <div className={styles.divider} />

            <div className={styles.info}>
              📤 <strong>Export your data:</strong>
            </div>
            <button className={styles.exportBtn} onClick={() => {
              const data = {
                reflections: JSON.parse(localStorage.getItem('sef_reflections') || '[]'),
                journal: JSON.parse(localStorage.getItem('sef_journal') || '[]'),
                goals: JSON.parse(localStorage.getItem('sef_goals') || '[]'),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `sef-export-${new Date().toISOString().split('T')[0]}.json`;
              a.click(); URL.revokeObjectURL(url);
            }}>
              📥 Download all data as JSON
            </button>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        {!inline && <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>}
        <button className={styles.saveBtn} onClick={save}>💾 Save</button>
      </div>
    </>
  );

  if (inline) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>{content}</div>;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>⚙️ Settings</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        {content}
      </div>
    </div>
  );
}

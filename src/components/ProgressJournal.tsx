"use client";

import React, { useState, useEffect } from 'react';
import styles from './ProgressJournal.module.css';
import { loadJournal, saveJournalEntry, deleteJournalEntry } from '../lib/cloudSync';

interface JournalEntry {
  id: string;
  date: string;
  text: string;
  mood: string;
  timestamp: number;
}

export default function ProgressJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newText, setNewText] = useState('');
  const [selectedMood, setSelectedMood] = useState('💪');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      const saved = localStorage.getItem('sef_journal');
      if (saved) { try { setEntries(JSON.parse(saved)); } catch {} }
      setIsLoaded(true);
      try {
        const cloud = await loadJournal();
        if (cloud.length > 0) setEntries(cloud);
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem('sef_journal', JSON.stringify(entries));
  }, [entries, isLoaded]);

  if (!isLoaded) return null;

  const addEntry = () => {
    if (!newText.trim()) return;
    const now = new Date();
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      text: newText.trim(),
      mood: selectedMood,
      timestamp: now.getTime(),
    };
    setEntries([entry, ...entries]);
    saveJournalEntry(entry); // Cloud sync
    setNewText('');
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    deleteJournalEntry(id); // Cloud sync
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addEntry();
    }
  };

  const displayEntries = showAll ? entries : entries.slice(0, 5);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📝 Progress Notes</h2>
        <span className={styles.count}>{entries.length}</span>
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <div className={styles.moodRow}>
          {['💪', '🔥', '😤', '😊', '😴', '🤔', '😰'].map(m => (
            <button
              key={m}
              className={`${styles.moodBtn} ${selectedMood === m ? styles.moodSelected : ''}`}
              onClick={() => setSelectedMood(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <div className={styles.inputRow}>
          <textarea
            className={styles.textarea}
            placeholder="What did you accomplish? Any blockers?..."
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />
          <button
            className={styles.sendBtn}
            onClick={addEntry}
            disabled={!newText.trim()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>

      {/* Entries */}
      <div className={styles.entries}>
        {displayEntries.map(entry => (
          <div key={entry.id} className={styles.entry}>
            <div className={styles.entryTop}>
              <span className={styles.entryMood}>{entry.mood}</span>
              <span className={styles.entryDate}>{entry.date}</span>
              <button className={styles.entryRemove} onClick={() => removeEntry(entry.id)}>✕</button>
            </div>
            <div className={styles.entryText}>{entry.text}</div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className={styles.empty}>No notes yet. Start logging your progress!</div>
        )}
        {entries.length > 5 && (
          <button className={styles.showMoreBtn} onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show less' : `Show all (${entries.length})`}
          </button>
        )}
      </div>
    </div>
  );
}

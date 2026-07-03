"use client";

import React, { useState, useEffect } from 'react';
import styles from './DailyPlanner.module.css';
import { loadDailyTasks, saveDailyTask, updateDailyTaskDone, deleteDailyTask } from '../lib/cloudSync';

interface Task {
  id: string;
  text: string;
  done: boolean;
  subject: string;
}

const SUBJECTS = ['📐 Math', '📖 Reading', '✍️ Writing', '🧪 Science', '🌍 History', '🔤 Vocabulary', '📝 Practice Test', '📚 Other'];

export default function DailyPlanner() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newSubject, setNewSubject] = useState(SUBJECTS[0]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toDateString();
      const saved = localStorage.getItem('sef_daily_' + today);
      if (saved) { try { setTasks(JSON.parse(saved)); } catch {} }
      setIsLoaded(true);
      try {
        const cloud = await loadDailyTasks(today);
        if (cloud.length > 0) {
          setTasks(cloud.map(t => ({ id: t.id, text: t.text, done: t.done, subject: t.subject })));
        }
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const today = new Date().toDateString();
    localStorage.setItem('sef_daily_' + today, JSON.stringify(tasks));
  }, [tasks, isLoaded]);

  if (!isLoaded) return null;

  const addTask = () => {
    if (!newTask.trim()) return;
    const today = new Date().toDateString();
    const task = {
      id: Date.now().toString(),
      text: newTask.trim(),
      done: false,
      subject: newSubject,
    };
    setTasks([...tasks, task]);
    saveDailyTask({ ...task, date: today }); // Cloud sync
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) updateDailyTaskDone(id, !task.done); // Cloud sync
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    deleteDailyTask(id); // Cloud sync
  };

  const completedCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📋 Daily Plan</h2>
        {totalCount > 0 && (
          <span className={styles.progress}>{completedCount}/{totalCount} · {pct}%</span>
        )}
      </div>

      {totalCount > 0 && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
      )}

      {/* Task List */}
      <div className={styles.taskList}>
        {tasks.map(task => (
          <div key={task.id} className={`${styles.taskItem} ${task.done ? styles.taskDone : ''}`}>
            <button className={styles.checkbox} onClick={() => toggleTask(task.id)}>
              {task.done ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : ''}
            </button>
            <div className={styles.taskContent}>
              <span className={styles.taskText}>{task.text}</span>
              <span className={styles.taskSubject}>{task.subject}</span>
            </div>
            <button className={styles.removeBtn} onClick={() => removeTask(task.id)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add Task */}
      <div className={styles.addArea}>
        <select className={styles.subjectSelect} value={newSubject} onChange={e => setNewSubject(e.target.value)}>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            placeholder="Add task... (e.g. 30 algebra problems)"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
          />
          <button className={styles.addBtn} onClick={addTask} disabled={!newTask.trim()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      </div>

      {totalCount === 0 && (
        <div className={styles.empty}>
          Add your tasks for today. Each session must be tied to a clear goal!
        </div>
      )}
    </div>
  );
}

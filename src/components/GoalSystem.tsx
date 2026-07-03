"use client";

import React, { useState, useEffect } from 'react';
import styles from './GoalSystem.module.css';
import { supabase } from '../lib/supabaseClient';
import LiveSchedule from './LiveSchedule';
import NeuroEngine from './NeuroEngine';
import NeuroGuideModal from './NeuroGuideModal';
import AppSettings from './AppSettings';

// ══════════════════════════════════════════════
//  DATA TYPES
// ══════════════════════════════════════════════

interface Mission {
  title: string;
  deadline: string;
  why: string;
  startDate: string;
}

interface Motivator {
  id: string;
  type: 'pain' | 'result';
  text: string;
}

type Scope = 'monthly' | 'weekly' | 'daily' | 'session';

interface TemporalTarget {
  id: string;
  scope: Scope;
  text: string;
  done: boolean;
  createdAt: number;
  parent_id: string | null;
}

interface GoalDataV4 {
  mission: Mission | null;
  motivators: Motivator[];
  targets: TemporalTarget[];
  streak: number;
  lastActiveDate: string;
}

const EMPTY_DATA: GoalDataV4 = {
  mission: null,
  motivators: [],
  targets: [],
  streak: 0,
  lastActiveDate: '',
};

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════

const daysUntil = (dStr: string) => {
  const d = new Date(dStr).setHours(0,0,0,0);
  const now = new Date().setHours(0,0,0,0);
  const diff = d - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const daysBetween = (start: string, end: string) => {
  const s = new Date(start).setHours(0,0,0,0);
  const e = new Date(end).setHours(0,0,0,0);
  return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
};

// Next scope mapping
const nextScope: Record<Scope, Scope | null> = {
  monthly: 'weekly',
  weekly: 'daily',
  daily: 'session',
  session: null
};

// ══════════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════════

export default function GoalSystem() {
  const [data, setData] = useState<GoalDataV4>(EMPTY_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'vision' | 'tree' | 'stats' | 'settings'>('vision');
  
  const [showMissionEdit, setShowMissionEdit] = useState(false);
  const [newPainResult, setNewPainResult] = useState('');

  // ═══ TIME MATRIX CALCULATIONS ═══
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = today.getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const startOfYear = new Date(currentYear, 0, 1);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalDaysInYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0 ? 366 : 365;
  const yearPct = ((dayOfYear / totalDaysInYear) * 100).toFixed(1);
  const monthName = today.toLocaleString('default', { month: 'long' }).toUpperCase();
  const [painResultType, setPainResultType] = useState<'pain' | 'result'>('pain');

  // Input states for adding new targets
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [rootInput, setRootInput] = useState('');

  // Load from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: mData }, { data: motData }, { data: tData }, { data: appData }] = await Promise.all([
          supabase.from('missions').select('*').limit(1).maybeSingle(),
          supabase.from('motivators').select('*'),
          supabase.from('targets').select('*').order('created_at', { ascending: true }),
          supabase.from('app_state').select('*').eq('id', 1).single()
        ]);

        const targets = (tData || []).map(t => ({
          id: t.id,
          scope: t.scope as Scope,
          text: t.text,
          done: t.done,
          createdAt: Number(t.created_at),
          parent_id: t.parent_id
        }));

        // Streak logic
        let streak = appData?.streak || 0;
        let lastActiveDate = appData?.last_active_date || '';
        
        const today = new Date().toDateString();
        if (lastActiveDate) {
          const lastDate = new Date(lastActiveDate);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastDate.toDateString() === yesterday.toDateString()) {
            streak += 1;
          } else if (lastDate.toDateString() !== today) {
            streak = 1;
          }
        } else {
          streak = 1;
        }
        
        if (lastActiveDate !== today || streak !== (appData?.streak || 0)) {
          await supabase.from('app_state').upsert({ id: 1, streak, last_active_date: today });
        }

        setData({
          mission: mData ? { title: mData.title, deadline: mData.deadline, why: mData.why, startDate: mData.start_date } : null,
          motivators: motData || [],
          targets,
          streak,
          lastActiveDate: today,
        });
      } catch (err) {
        console.error("Supabase load error", err);
      }
      setIsLoaded(true);
    };

    loadData();
  }, []);

  // Actions
  const saveMission = async (m: Mission) => {
    setData(prev => ({ ...prev, mission: m }));
    setShowMissionEdit(false);
    
    const { data: mData } = await supabase.from('missions').select('id').limit(1).maybeSingle();
    if (mData) {
      await supabase.from('missions').update({ title: m.title, deadline: m.deadline, why: m.why, start_date: m.startDate }).eq('id', mData.id);
    } else {
      await supabase.from('missions').insert({ title: m.title, deadline: m.deadline, why: m.why, start_date: m.startDate });
    }
  };

  const addTarget = async (scope: Scope, parentId: string | null, text: string) => {
    if (!text.trim()) return;
    const target = { id: Date.now().toString(), scope, text: text.trim(), done: false, createdAt: Date.now(), parent_id: parentId };
    
    // Optimistic UI
    setData(prev => ({ ...prev, targets: [...prev.targets, target] }));

    // DB
    await supabase.from('targets').insert({
      id: target.id, scope, text: target.text, done: target.done, created_at: target.createdAt, parent_id: target.parent_id
    });
  };

  const toggleTarget = async (id: string) => {
    const target = data.targets.find(t => t.id === id);
    if (!target) return;
    const newDone = !target.done;
    
    // Optimistic UI
    setData(prev => ({
      ...prev,
      targets: prev.targets.map(t => t.id === id ? { ...t, done: newDone } : t)
    }));

    // DB
    await supabase.from('targets').update({ done: newDone }).eq('id', id);
  };

  const removeTarget = async (id: string) => {
    // Delete target and all its recursive children
    const getChildrenIds = (parentId: string): string[] => {
      const children = data.targets.filter(t => t.parent_id === parentId).map(t => t.id);
      let allIds = [...children];
      children.forEach(c => allIds = [...allIds, ...getChildrenIds(c)]);
      return allIds;
    };
    const idsToRemove = [id, ...getChildrenIds(id)];

    setData(prev => ({
      ...prev,
      targets: prev.targets.filter(t => !idsToRemove.includes(t.id))
    }));

    // DB: ON DELETE CASCADE handles this, but let's delete explicitly if constraints fail
    // Better to delete parent and let cascade handle it, or delete idsToRemove
    await supabase.from('targets').delete().in('id', idsToRemove);
  };

  const addMotivatorSpecific = async (type: 'pain' | 'result', text: string) => {
    if (!text.trim()) return;
    const mot: Motivator = { id: Date.now().toString(), type, text: text.trim() };
    setData(prev => ({ ...prev, motivators: [...prev.motivators, mot] }));
    await supabase.from('motivators').insert({ id: mot.id, type: mot.type, text: mot.text });
  };
  
  const removeMotivator = async (id: string) => {
    setData(prev => ({ ...prev, motivators: prev.motivators.filter(m => m.id !== id) }));
    await supabase.from('motivators').delete().eq('id', id);
  };

  // RECURSIVE RENDERER
  const renderTree = (parentId: string | null = null, currentScope: Scope = 'monthly') => {
    const children = data.targets.filter(t => t.parent_id === parentId && t.scope === currentScope);
    
    return (
      <div className={styles.treeLevel}>
        {children.map(t => {
          const childScope = nextScope[currentScope];
          
          return (
            <div key={t.id} className={styles.treeNode}>
              <div className={`${styles.targetItem} ${t.done ? styles.targetDone : ''}`}>
                <button className={styles.checkBtn} onClick={() => toggleTarget(t.id)}>
                  {t.done ? (
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                  ) : (
                    <div className={styles.checkEmpty} />
                  )}
                </button>
                <div className={styles.targetInfo}>
                  <span className={styles.scopeBadge}>{currentScope}</span>
                  <span className={styles.targetText}>{t.text}</span>
                </div>
                <button className={styles.deleteBtn} onClick={() => removeTarget(t.id)}>×</button>
              </div>
              
              {/* Children recursively */}
              {childScope && (
                <div className={styles.treeChildren}>
                  {renderTree(t.id, childScope)}
                  
                  {/* Add child input */}
                  <div className={styles.addChildWrap}>
                    <input 
                      type="text" 
                      className={styles.targetInput} 
                      placeholder={`+ Add ${childScope} goal`}
                      value={inputValues[t.id] || ''}
                      onChange={e => setInputValues({ ...inputValues, [t.id]: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          addTarget(childScope, t.id, inputValues[t.id] || '');
                          setInputValues({ ...inputValues, [t.id]: '' });
                        }
                      }}
                    />
                    <button className={styles.addBtnTree} onClick={() => {
                      addTarget(childScope, t.id, inputValues[t.id] || '');
                      setInputValues({ ...inputValues, [t.id]: '' });
                    }}>+</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };


  if (!isLoaded) return <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Connecting to Cloud...</div>;

  const { mission, motivators } = data;
  const pains = motivators.filter(m => m.type === 'pain');
  const results = motivators.filter(m => m.type === 'result');

  const missionDaysLeft = mission?.deadline ? daysUntil(mission.deadline) : null;
  const missionTotalDays = mission?.startDate && mission?.deadline ? daysBetween(mission.startDate, mission.deadline) : null;
  const missionPct = missionTotalDays && missionDaysLeft !== null ? Math.min(100, Math.round(((missionTotalDays - missionDaysLeft) / missionTotalDays) * 100)) : 0;

  return (
    <div className={styles.container}>
      {/* ═══ LIVE SCHEDULE (always at top) ═══ */}
      <LiveSchedule />

      <div className={styles.tabs}>
        {([
          { key: 'vision', label: 'Vision', icon: '🌌' },
          { key: 'tree', label: 'Goal Tree', icon: '🌳' },
          { key: 'stats', label: 'Stats & Neuro', icon: '🧠' },
          { key: 'settings', label: 'Settings', icon: '⚙️' },
        ] as const).map(t => (
          <button key={t.key} className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.key as any)}>
            <span className={styles.tabIcon}>{t.icon}</span>
            <span className={styles.tabLabel}>{t.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.contentArea}>
        {activeTab === 'vision' && (
          <div className={styles.visionTab}>
            
            {!mission || showMissionEdit ? (
              <div className={styles.missionEditBox}>
                <h3 className={styles.editTitle}>{mission ? 'Edit Mission' : 'Define Your Master Mission'}</h3>
                <form className={styles.editForm} onSubmit={e => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  saveMission({
                    title: fd.get('title') as string,
                    deadline: fd.get('deadline') as string,
                    why: fd.get('why') as string,
                    startDate: mission?.startDate || new Date().toISOString(),
                  });
                }}>
                  <input name="title" required defaultValue={mission?.title} placeholder="Mission Title (e.g. Pass SAT with 1500+)" className={styles.input} />
                  <input name="deadline" type="date" required defaultValue={mission?.deadline} className={styles.input} />
                  <textarea name="why" required defaultValue={mission?.why} placeholder="Why is this non-negotiable?" className={styles.textarea} />
                  <div className={styles.formActions}>
                    {mission && <button type="button" onClick={() => setShowMissionEdit(false)} className={styles.cancelBtn}>Cancel</button>}
                    <button type="submit" className={styles.saveBtn}>Lock In Mission</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className={styles.missionCard} onClick={() => setShowMissionEdit(true)}>
                <div className={styles.missionHeader}>
                  <div className={styles.missionBadge}>MASTER MISSION</div>
                  <div className={styles.streakBadge}>🔥 {data.streak} DAY STREAK</div>
                </div>
                <div className={styles.missionTitle}>{mission.title}</div>
                <div className={styles.missionWhy}>"{mission.why}"</div>
                
                <div className={styles.missionProgress}>
                  <div className={styles.missionStats}>
                    <span>Progress to Deadline</span>
                    <span className={styles.missionDays}>{missionDaysLeft} days left</span>
                  </div>
                  <div className={styles.missionBar}>
                    <div className={styles.missionFill} style={{ width: `${missionPct}%` }} />
                  </div>
                </div>
              </div>
            )}

            {mission && !showMissionEdit && (
              <div className={styles.timeMatrix}>
                <div className={styles.tmHeader}>
                  <h3 className={styles.tmTitle}>TIME MATRIX</h3>
                  <span className={styles.tmYear}>{currentYear} PROGRESS: {yearPct}%</span>
                </div>
                
                <div className={styles.tmYearBar}>
                  <div className={styles.tmYearFill} style={{ width: `${yearPct}%` }} />
                </div>

                <div className={styles.tmMonthArea}>
                  <div className={styles.tmMonthHeader}>
                    <span>{monthName}</span>
                    <span className={styles.tmMonthStats}>Day {currentDay} / {daysInMonth}</span>
                  </div>
                  <div className={styles.tmGrid}>
                    {monthDays.map(d => {
                      let status = 'future';
                      if (d < currentDay) status = 'past';
                      if (d === currentDay) status = 'today';
                      
                      return (
                        <div 
                          key={d} 
                          className={`${styles.tmBox} ${styles[`tm_${status}`]}`}
                          title={`Day ${d}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className={styles.motivatorEngine}>
              <div className={styles.dualSection}>
                <div className={styles.painBox}>
                  <div className={styles.painHeader}>💀 ANTI-VISION (PAINS)</div>
                  <div className={styles.motInputWrap}>
                    <input 
                       className={styles.motInlineInput} 
                       placeholder="If I fail, I will..." 
                       onKeyDown={e => {
                         if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                           addMotivatorSpecific('pain', e.currentTarget.value.trim());
                           e.currentTarget.value = '';
                         }
                       }} 
                    />
                  </div>
                  {pains.length === 0 && <div className={styles.emptyMot}>No pains set.</div>}
                  {pains.map(p => (
                    <div key={p.id} className={styles.painItem}>
                      <span>{p.text}</span>
                      <button className={styles.motDel} onClick={() => removeMotivator(p.id)}>×</button>
                    </div>
                  ))}
                </div>
                <div className={styles.resultBox}>
                  <div className={styles.resultHeader}>🏆 DREAM OUTCOME (RESULTS)</div>
                  <div className={styles.motInputWrap}>
                    <input 
                       className={styles.motInlineInput} 
                       placeholder="If I succeed, I will..." 
                       onKeyDown={e => {
                         if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                           addMotivatorSpecific('result', e.currentTarget.value.trim());
                           e.currentTarget.value = '';
                         }
                       }} 
                    />
                  </div>
                  {results.length === 0 && <div className={styles.emptyMot}>No results set.</div>}
                  {results.map(r => (
                    <div key={r.id} className={styles.resultItem}>
                      <span>{r.text}</span>
                      <button className={styles.motDel} onClick={() => removeMotivator(r.id)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'tree' && (
          <div className={styles.treeTab}>
            <div className={styles.treeHeader}>
              <h2 className={styles.treeTitle}>MASTER GOAL TREE</h2>
              <p className={styles.treeDesc}>Break big goals into small pieces. Every session builds a day. Every day builds a week.</p>
            </div>

            <div className={styles.addRootWrap}>
              <input 
                type="text" 
                className={styles.targetInput} 
                placeholder="+ Add a Master Monthly Goal"
                value={rootInput}
                onChange={e => setRootInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    addTarget('monthly', null, rootInput);
                    setRootInput('');
                  }
                }}
              />
              <button className={styles.addBtn} onClick={() => {
                addTarget('monthly', null, rootInput);
                setRootInput('');
              }}>Add</button>
            </div>

            <div className={styles.treeRoot}>
              {renderTree(null, 'monthly')}
              {data.targets.filter(t => t.scope === 'monthly').length === 0 && (
                <div className={styles.emptyTarget}>Your tree is empty. Plant the first seed.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <StatsTab />
        )}

        {activeTab === 'settings' && (
          <div className={styles.settingsTab}>
            <AppSettings onClose={() => {}} inline={true} />
          </div>
        )}

      </div>
    </div>
  );
}

// ═══ STATS & NEURO TAB ═══
function StatsTab() {
  const [timerState, setTimerState] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const saved = localStorage.getItem('sef_timer_state');
        if (saved) setTimerState(JSON.parse(saved));
      } catch {}
    };
    load();
    const iv = setInterval(load, 2000); // Refresh every 2 seconds
    return () => clearInterval(iv);
  }, []);

  const fmtHM = (sec: number) => {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const sessionsCompleted = timerState?.sessionsCompleted || 0;
  const todaySeconds = timerState?.todaySeconds || 0;
  const dailyPct = timerState?.dailyPct || 0;
  const mode = timerState?.mode || 'focus';
  const isActive = timerState?.isActive || false;
  const currentFocus = timerState?.currentFocus || 90;
  const timeLeft = timerState?.timeLeft || 0;

  return (
    <div className={styles.statsTab}>
      {/* Daily Progress */}
      <div className={styles.statsCard}>
        <div className={styles.statsCardHeader}>
          <span className={styles.statsCardTitle}>📊 TODAY&apos;S PROGRESS</span>
          <span className={styles.statsCardValue}>{fmtHM(todaySeconds)} / 12h</span>
        </div>
        <div className={styles.statsBar}>
          <div className={styles.statsBarFill} style={{ width: `${dailyPct}%` }} />
        </div>
        <div className={styles.blocksRow}>
          <div className={styles.blocksLabel}>DAILY TARGET: 8 BLOCKS (12 HOURS)</div>
          <div className={styles.blocksGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`${styles.blockSquare} ${i < sessionsCompleted ? styles.blockDone : ''}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Neuro Engine */}
      <div className={styles.statsCard}>
        <NeuroEngine
          minutesFocused={mode === 'focus' ? Math.floor((currentFocus * 60 - timeLeft) / 60) : 0}
          sessionsToday={sessionsCompleted}
          isOnBreak={mode !== 'focus'}
          isActive={isActive}
          breakType={mode === 'longBreak' ? 'long' : 'short'}
        />
      </div>

      {/* Guide Button */}
      <button className={styles.guideBtn} onClick={() => setShowGuide(true)}>
        🧠 Neurobiological Rules & Guide
      </button>

      {showGuide && <NeuroGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}

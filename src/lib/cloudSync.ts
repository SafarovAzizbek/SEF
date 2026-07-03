import { supabase } from './supabaseClient';

// ══════════════════════════════════════════════════════════
//  CLOUD SYNC UTILITY
//  Supabase = source of truth, localStorage = speed cache
//  Pattern: Load cloud → cache local → save both on change
// ══════════════════════════════════════════════════════════

// --- TIMER STATE ---
interface TimerCloudState {
  sessions_completed: number;
  today_seconds: number;
  auto_mode: boolean;
  last_date: string;
  settings: { sequence: number[]; breakRatio: number };
}

export async function loadTimerState(): Promise<TimerCloudState | null> {
  try {
    const { data } = await supabase.from('timer_state').select('*').eq('id', 1).single();
    if (data) {
      // Cache locally
      localStorage.setItem('sef_v3', JSON.stringify({
        settings: data.settings,
        sessions: data.sessions_completed,
        todaySeconds: data.today_seconds,
        autoMode: data.auto_mode,
        lastDate: data.last_date,
      }));
      return data as TimerCloudState;
    }
  } catch (e) { console.error('Cloud load timer error:', e); }
  return null;
}

export async function saveTimerState(state: {
  settings: { sequence: number[]; breakRatio: number };
  sessions: number;
  todaySeconds: number;
  autoMode: boolean;
  lastDate: string;
}) {
  // Save locally first (instant)
  localStorage.setItem('sef_v3', JSON.stringify(state));
  // Save to cloud (async)
  try {
    await supabase.from('timer_state').upsert({
      id: 1,
      sessions_completed: state.sessions,
      today_seconds: state.todaySeconds,
      auto_mode: state.autoMode,
      last_date: state.lastDate,
      settings: state.settings,
      updated_at: new Date().toISOString(),
    });
  } catch (e) { console.error('Cloud save timer error:', e); }
}

// --- GOALS (GoalTracker) ---
interface GoalCloud {
  id: string;
  title: string;
  target_date: string;
  emoji: string;
  color: string;
}

export async function loadGoals(): Promise<GoalCloud[]> {
  try {
    const { data } = await supabase.from('goals').select('*').order('created_at', { ascending: true });
    if (data) {
      const local = data.map(g => ({ id: g.id, title: g.title, targetDate: g.target_date, emoji: g.emoji, color: g.color }));
      localStorage.setItem('sef_goals', JSON.stringify(local));
      return data as GoalCloud[];
    }
  } catch (e) { console.error('Cloud load goals error:', e); }
  return [];
}

export async function saveGoal(goal: { id: string; title: string; targetDate: string; emoji: string; color: string }) {
  localStorage.setItem('sef_goals', JSON.stringify(
    JSON.parse(localStorage.getItem('sef_goals') || '[]').concat([goal])
  ));
  try {
    await supabase.from('goals').upsert({
      id: goal.id, title: goal.title, target_date: goal.targetDate,
      emoji: goal.emoji, color: goal.color,
    });
  } catch (e) { console.error('Cloud save goal error:', e); }
}

export async function deleteGoal(id: string) {
  try {
    await supabase.from('goals').delete().eq('id', id);
  } catch (e) { console.error('Cloud delete goal error:', e); }
}

// --- JOURNAL ---
interface JournalCloud {
  id: string;
  date: string;
  text: string;
  mood: string;
  timestamp: number;
}

export async function loadJournal(): Promise<JournalCloud[]> {
  try {
    const { data } = await supabase.from('journal_entries').select('*').order('timestamp', { ascending: false });
    if (data) {
      localStorage.setItem('sef_journal', JSON.stringify(data));
      return data as JournalCloud[];
    }
  } catch (e) { console.error('Cloud load journal error:', e); }
  return [];
}

export async function saveJournalEntry(entry: JournalCloud) {
  try {
    await supabase.from('journal_entries').upsert({
      id: entry.id, date: entry.date, text: entry.text,
      mood: entry.mood, timestamp: entry.timestamp,
    });
  } catch (e) { console.error('Cloud save journal error:', e); }
}

export async function deleteJournalEntry(id: string) {
  try {
    await supabase.from('journal_entries').delete().eq('id', id);
  } catch (e) { console.error('Cloud delete journal error:', e); }
}

// --- DAILY TASKS ---
interface DailyTaskCloud {
  id: string;
  date: string;
  text: string;
  done: boolean;
  subject: string;
}

export async function loadDailyTasks(date: string): Promise<DailyTaskCloud[]> {
  try {
    const { data } = await supabase.from('daily_tasks').select('*').eq('date', date).order('created_at', { ascending: true });
    if (data) {
      localStorage.setItem('sef_daily_' + date, JSON.stringify(data.map(t => ({
        id: t.id, text: t.text, done: t.done, subject: t.subject,
      }))));
      return data as DailyTaskCloud[];
    }
  } catch (e) { console.error('Cloud load daily tasks error:', e); }
  return [];
}

export async function saveDailyTask(task: DailyTaskCloud) {
  try {
    await supabase.from('daily_tasks').upsert({
      id: task.id, date: task.date, text: task.text,
      done: task.done, subject: task.subject,
    });
  } catch (e) { console.error('Cloud save daily task error:', e); }
}

export async function updateDailyTaskDone(id: string, done: boolean) {
  try {
    await supabase.from('daily_tasks').update({ done }).eq('id', id);
  } catch (e) { console.error('Cloud update task error:', e); }
}

export async function deleteDailyTask(id: string) {
  try {
    await supabase.from('daily_tasks').delete().eq('id', id);
  } catch (e) { console.error('Cloud delete task error:', e); }
}

// --- REFLECTIONS ---
export async function saveReflection(reflection: { id: string; session: number; text: string; date: string }) {
  try {
    await supabase.from('reflections').upsert({
      id: reflection.id, session_number: reflection.session,
      text: reflection.text, date: reflection.date,
    });
  } catch (e) { console.error('Cloud save reflection error:', e); }
}

// --- USER PREFERENCES ---
export async function loadPreferences(): Promise<{ schedule_start_time: string; config: Record<string, unknown> } | null> {
  try {
    const { data } = await supabase.from('user_preferences').select('*').eq('id', 1).single();
    if (data) return data;
  } catch (e) { console.error('Cloud load prefs error:', e); }
  return null;
}

export async function saveScheduleStartTime(time: string) {
  localStorage.setItem('sef_schedule_start', time);
  try {
    await supabase.from('user_preferences').upsert({
      id: 1, schedule_start_time: time, updated_at: new Date().toISOString(),
    });
  } catch (e) { console.error('Cloud save start time error:', e); }
}

"use client";

import React, { useState, useEffect } from 'react';
import styles from './LiveSchedule.module.css';
import { supabase } from '../lib/supabaseClient';

interface ScheduleEvent {
  title: string;
  start: Date;
  end: Date;
  status: string;
  note?: string;
  youtubeUrl?: string;
}

export default function LiveSchedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data, error } = await supabase
          .from('schedule_events')
          .select('*')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) throw error;

        const parsedEvents: ScheduleEvent[] = data.map(item => {
          const start = new Date(`${item.date}T${item.start_time}`);
          const end = new Date(`${item.date}T${item.end_time}`);
          return {
            title: item.title,
            start,
            end,
            status: item.status,
            note: item.note,
            youtubeUrl: item.youtube_url
          };
        });

        setEvents(parsedEvents);
      } catch (err: any) {
        setError(err.message || 'Error loading schedule from Supabase.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSchedule, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className={styles.scheduleWrap}><div className={styles.loader}>Syncing with Supabase Command Center...</div></div>;
  }

  if (error) {
    return (
      <div className={styles.scheduleWrap}>
        <div className={styles.error}>⚠️ {error}</div>
        <div className={styles.subtext}>Could not connect to the database.</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={styles.scheduleWrap}>
        <div className={styles.emptyHeader}>NO LIVE SCHEDULE</div>
        <div className={styles.subtext}>Add your targets to the Supabase database to sync your battle plan.</div>
      </div>
    );
  }

  const now = new Date();
  const liveNow = events.find(e => e.start <= now && e.end > now && e.status !== 'OFF');
  const nextLive = events.find(e => e.start > now && e.status !== 'OFF');

  return (
    <div className={styles.scheduleWrap}>
      {liveNow ? (
        <div className={`${styles.card} ${styles.liveCard}`}>
          <div className={styles.badgeRow}>
            <span className={styles.badgeLive}>🔥 LIVE NOW</span>
            {liveNow.youtubeUrl && (
              <a href={liveNow.youtubeUrl} target="_blank" rel="noopener noreferrer" className={styles.youtubeLink}>
                ▶️ Stream
              </a>
            )}
          </div>
          <h3 className={styles.title}>{liveNow.title}</h3>
          <div className={styles.timeRange}>
            {liveNow.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {liveNow.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          {liveNow.note && <div className={styles.note}>{liveNow.note}</div>}
        </div>
      ) : nextLive ? (
        <div className={`${styles.card} ${styles.nextCard}`}>
          <div className={styles.badgeRow}>
            <span className={styles.badgeNext}>⏳ NEXT TARGET</span>
          </div>
          <h3 className={styles.title}>{nextLive.title}</h3>
          <div className={styles.timeRange}>
            Starts at {nextLive.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          {nextLive.note && <div className={styles.note}>{nextLive.note}</div>}
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.badgeRow}>
            <span className={styles.badgeDone}>✔️ ALL CLEAR</span>
          </div>
          <h3 className={styles.title}>No more targets today.</h3>
          <div className={styles.note}>Rest and prepare for tomorrow's battle.</div>
        </div>
      )}
    </div>
  );
}

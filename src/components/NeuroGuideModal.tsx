import React from 'react';

export default function NeuroGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)'
    }} onClick={onClose}>
      <div style={{
        background: 'rgba(15, 15, 20, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px',
        padding: '2.5rem', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)',
        color: '#fff', position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none',
          color: 'rgba(255,255,255,0.5)', fontSize: '1.5rem', cursor: 'pointer'
        }}>×</button>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '2rem', background: 'linear-gradient(90deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🧠 Neurobiological Truths of Extreme Focus
        </h2>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Ultradian Rhythm */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: '#60a5fa', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>1. The Ultradian Rhythm (90-Minute Rule)</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              The human brain cannot maintain high-intensity focus indefinitely. It operates in 90-minute ultradian cycles. 
              Pushing beyond 90 minutes without a break leads to diminishing returns, cognitive fatigue, and loss of neuroplasticity. 
              <strong> Rule:</strong> Focus intensely for exactly 90 minutes, then forcefully disconnect for 20-30 minutes.
            </p>
          </div>

          {/* Dopamine Baseline */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: '#f472b6', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>2. Dopamine Baseline Protection</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Cheap dopamine (social media, short videos, sugary snacks) artificially spikes your dopamine, causing a severe crash below your baseline. 
              This makes hard tasks (like studying) feel physically painful.
              <strong> Rule:</strong> Zero cheap dopamine during breaks. Let your baseline recover naturally so the work itself becomes rewarding.
            </p>
          </div>

          {/* Neuroplasticity and Friction */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: '#facc15', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>3. Limbic Friction (The First 15 Minutes)</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              The first 10-15 minutes of any focus block will feel highly uncomfortable. This is called "Limbic Friction" as your brain releases autonomic arousal chemicals (adrenaline) to switch contexts.
              <strong> Rule:</strong> Expect the pain. Do not quit in the first 15 minutes. It will physically pass as you enter a flow state.
            </p>
          </div>

          {/* Cortisol Spikes */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: '#fb923c', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>4. Cortisol Spikes & Learning</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Making mistakes and feeling frustrated triggers epinephrine and cortisol. This is NOT a sign to stop; it is the chemical signal telling your nervous system "something needs to change," which primes the brain for neuroplasticity.
              <strong> Rule:</strong> Frustration is the doorway to neuroplasticity. When you feel it, push harder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

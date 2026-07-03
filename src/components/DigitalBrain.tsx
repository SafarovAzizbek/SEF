"use client";

import React from 'react';
import styles from './DigitalBrain.module.css';

// ══════════════════════════════════════════════════════════
//  DIGITAL BRAIN — Interactive SVG Brain Visualization
//  Shows physical brain regions with activation glow
//  Based on neuroanatomy: Frontal, Parietal, Temporal,
//  Occipital lobes + Cerebellum, Hippocampus, Basal Ganglia
// ══════════════════════════════════════════════════════════

export interface BrainRegionData {
  name: string;
  activation: number; // 0-100
  color: string;
}

interface Props {
  activeRegions: BrainRegionData[];
  title?: string;
  subtitle?: string;
}

// Map region names to SVG region IDs
const REGION_MAP: Record<string, string> = {
  'Prefrontal Cortex': 'frontal',
  'Frontal Lobe': 'frontal',
  'Working Memory': 'frontal',
  'Parietal Cortex': 'parietal',
  'Parietal Lobe': 'parietal',
  'Temporal Lobe': 'temporal',
  'Occipital Lobe': 'occipital',
  'Cerebellum': 'cerebellum',
  'Hippocampus': 'hippocampus',
  'Basal Ganglia': 'basalganglia',
  'Motor Cortex': 'parietal',
  'Default Mode Network': 'frontal',
  'Anterior Cingulate': 'cingulate',
  'Association Cortex': 'parietal',
  'Locus Coeruleus': 'brainstem',
  'Amygdala': 'temporal',
  'Neocortex': 'parietal',
  'Whole Brain BDNF': 'wholebrain',
  'Synaptic Growth': 'wholebrain',
};

// SVG paths for each brain region (side view, anatomically inspired)
const REGIONS: Record<string, { path: string; labelX: number; labelY: number; label: string }> = {
  frontal: {
    path: 'M 45,28 C 42,22 48,14 60,10 C 72,7 88,8 100,12 C 108,15 112,22 112,30 C 112,40 108,50 100,55 L 85,58 L 70,55 C 58,50 48,40 45,28 Z',
    labelX: 78, labelY: 30,
    label: 'Frontal',
  },
  parietal: {
    path: 'M 100,12 C 112,16 118,10 132,10 C 148,10 160,16 165,28 C 168,36 165,48 158,55 L 140,58 L 120,56 L 100,55 C 108,50 112,40 112,30 C 112,22 108,15 100,12 Z',
    labelX: 135, labelY: 28,
    label: 'Parietal',
  },
  temporal: {
    path: 'M 70,55 L 85,58 L 100,62 C 105,68 108,78 105,88 C 100,96 90,98 80,96 C 68,93 58,85 52,75 C 48,68 50,60 55,55 L 70,55 Z',
    labelX: 80, labelY: 78,
    label: 'Temporal',
  },
  occipital: {
    path: 'M 158,55 C 165,48 168,36 165,28 C 170,32 178,42 180,55 C 182,65 178,78 170,85 C 164,90 155,90 150,85 C 145,80 142,70 145,60 L 158,55 Z',
    labelX: 165, labelY: 58,
    label: 'Occipital',
  },
  cerebellum: {
    path: 'M 140,58 L 158,55 L 145,60 C 142,70 145,80 150,85 C 148,88 142,92 135,92 C 125,92 118,88 115,82 C 112,76 115,68 120,62 L 140,58 Z',
    labelX: 135, labelY: 80,
    label: 'Cerebellum',
  },
  hippocampus: {
    path: 'M 100,55 L 120,56 L 120,62 C 118,68 112,72 105,72 C 98,72 95,68 95,62 L 100,55 Z',
    labelX: 108, labelY: 64,
    label: 'Hippocampus',
  },
  basalganglia: {
    path: 'M 95,42 C 98,38 105,36 112,38 C 118,40 120,45 118,50 C 116,54 110,56 105,55 C 98,54 94,48 95,42 Z',
    labelX: 107, labelY: 47,
    label: 'Basal G.',
  },
  cingulate: {
    path: 'M 85,30 C 90,26 100,24 112,25 C 124,26 135,28 140,32 C 142,36 140,40 135,42 C 128,44 118,42 108,40 C 98,38 90,36 85,30 Z',
    labelX: 112, labelY: 35,
    label: 'Cingulate',
  },
  brainstem: {
    path: 'M 115,82 C 112,76 115,68 120,62 L 125,65 C 122,72 120,80 122,88 C 120,92 116,90 115,82 Z',
    labelX: 120, labelY: 75,
    label: 'Brainstem',
  },
};

export default function DigitalBrain({ activeRegions, title, subtitle }: Props) {
  // Build activation lookup: regionId -> { activation, color }
  const activationMap: Record<string, { activation: number; color: string }> = {};

  for (const region of activeRegions) {
    const regionId = REGION_MAP[region.name];
    if (regionId === 'wholebrain') {
      // Activate ALL regions
      for (const id of Object.keys(REGIONS)) {
        if (!activationMap[id] || activationMap[id].activation < region.activation) {
          activationMap[id] = { activation: region.activation, color: region.color };
        }
      }
    } else if (regionId && REGIONS[regionId]) {
      if (!activationMap[regionId] || activationMap[regionId].activation < region.activation) {
        activationMap[regionId] = { activation: region.activation, color: region.color };
      }
    }
  }

  return (
    <div className={styles.brainContainer}>
      {title && <div className={styles.brainTitle}>{title}</div>}

      <svg
        className={styles.brainSvg}
        viewBox="30 0 170 105"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow filter definitions */}
        <defs>
          {Object.entries(activationMap).map(([id, data]) => (
            <filter key={`filter-${id}`} id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={Math.max(2, data.activation / 15)} result="blur" />
              <feFlood floodColor={data.color} floodOpacity={Math.min(0.8, data.activation / 100)} />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        {/* Brain outline (subtle background shape) */}
        <path
          d="M 45,28 C 42,22 48,14 60,10 C 72,7 88,8 100,12 C 112,16 118,10 132,10 C 148,10 160,16 165,28 C 170,32 178,42 180,55 C 182,65 178,78 170,85 C 164,90 155,90 150,85 C 148,88 142,92 135,92 C 125,92 118,88 115,82 C 112,76 115,68 120,62 L 100,62 C 105,68 108,78 105,88 C 100,96 90,98 80,96 C 68,93 58,85 52,75 C 48,68 50,60 55,55 C 48,50 42,38 45,28 Z"
          fill="rgba(255,255,255,0.01)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
        />

        {/* Render each region */}
        {Object.entries(REGIONS).map(([id, region]) => {
          const activation = activationMap[id];
          const isActive = !!activation && activation.activation > 20;
          const fillOpacity = isActive ? Math.min(0.5, activation.activation / 150) : 0.03;
          const strokeOpacity = isActive ? Math.min(0.6, activation.activation / 120) : 0.08;

          return (
            <g key={id}>
              <path
                d={region.path}
                className={`${styles.brainRegion} ${isActive ? styles.regionGlow : ''}`}
                fill={isActive ? activation.color : 'rgba(255,255,255,0.03)'}
                fillOpacity={fillOpacity}
                stroke={isActive ? activation.color : 'rgba(255,255,255,0.08)'}
                strokeOpacity={strokeOpacity}
                strokeWidth={isActive ? 1.2 : 0.5}
                filter={isActive ? `url(#glow-${id})` : undefined}
              />
              {/* Region label */}
              <text
                x={region.labelX}
                y={region.labelY}
                className={`${styles.regionLabel} ${isActive ? styles.regionLabelActive : ''}`}
                style={isActive ? { fill: activation.color } : undefined}
              >
                {region.label}
              </text>
              {/* Activation percentage for active regions */}
              {isActive && (
                <text
                  x={region.labelX}
                  y={region.labelY + 9}
                  className={styles.activationBadge}
                  style={{ fill: activation.color }}
                >
                  {activation.activation}%
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {subtitle && <div className={styles.brainSubtitle}>{subtitle}</div>}

      {/* Active regions legend */}
      {activeRegions.length > 0 && (
        <div className={styles.legend}>
          {activeRegions.map((r) => (
            <div
              key={r.name}
              className={`${styles.legendItem} ${r.activation > 30 ? styles.legendItemActive : ''}`}
            >
              <span
                className={`${styles.legendDot} ${r.activation > 30 ? styles.legendDotActive : ''}`}
                style={{ backgroundColor: r.color, color: r.color }}
              />
              <span>{r.name} {r.activation}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

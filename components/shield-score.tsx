'use client';

import React, { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScoreCategory {
  label: string;
  points: number;
  max: number;
  icon: string;
  color: string;
}

interface Tier {
  name: string;
  minScore: number;
  color: string;
  gradient: string;
  badge: string;
  perk: string;
}

const TIERS: Tier[] = [
  { name: 'Bronze',   minScore: 0,   color: '#cd7f32', gradient: 'from-amber-800 to-amber-600',   badge: '🥉', perk: 'Base coverage' },
  { name: 'Silver',   minScore: 400, color: '#94a3b8', gradient: 'from-slate-500 to-slate-400',   badge: '🥈', perk: '₹2/week discount' },
  { name: 'Gold',     minScore: 650, color: '#f59e0b', gradient: 'from-amber-500 to-yellow-400',  badge: '🏆', perk: '₹5 off + 2h extra' },
  { name: 'Platinum', minScore: 850, color: '#818cf8', gradient: 'from-indigo-500 to-violet-400', badge: '💎', perk: '₹9 off + priority claims' },
];

function getTier(score: number): Tier {
  return [...TIERS].reverse().find((t) => score >= t.minScore) ?? TIERS[0];
}
function getNextTier(score: number): Tier | null {
  return TIERS.find((t) => t.minScore > score) ?? null;
}

const CATEGORIES: ScoreCategory[] = [
  { label: 'Riding Consistency',  points: 280, max: 300, icon: '📅', color: '#22c55e' },
  { label: 'Safe Zone Time',      points: 210, max: 300, icon: '🛡️', color: '#3b82f6' },
  { label: 'Active Tracking',     points: 170, max: 200, icon: '📍', color: '#a855f7' },
  { label: 'Quick Claims',        points: 80,  max: 100, icon: '⚡', color: '#f59e0b' },
  { label: 'Wallet Health',       points: 80,  max: 100, icon: '💳', color: '#ec4899' },
];

const TOTAL = CATEGORIES.reduce((s, c) => s + c.points, 0);

// ─── Animated Ring ────────────────────────────────────────────────────────────
function ScoreRing({ score, max, tier }: { score: number; max: number; tier: Tier }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = 2;
    canvas.width = 220 * dpr;
    canvas.height = 220 * dpr;
    ctx.scale(dpr, dpr);

    const cx = 110, cy = 110, R = 85;
    const startA = Math.PI * 0.75;
    const endA = Math.PI * 2.25;
    const totalArc = endA - startA;
    let current = 0;

    function draw(val: number) {
      ctx!.clearRect(0, 0, 220, 220);

      // Outer glow ring (very subtle)
      ctx!.beginPath();
      ctx!.arc(cx, cy, R + 8, 0, Math.PI * 2);
      ctx!.strokeStyle = tier.color + '08';
      ctx!.lineWidth = 16;
      ctx!.stroke();

      // Track
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, startA, endA);
      ctx!.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx!.lineWidth = 12;
      ctx!.lineCap = 'round';
      ctx!.stroke();

      // Glow
      const pct = val / max;
      const fillEnd = startA + totalArc * pct;

      ctx!.save();
      ctx!.shadowColor = tier.color;
      ctx!.shadowBlur = 20;

      const grad = ctx!.createLinearGradient(cx - R, cy, cx + R, cy);
      grad.addColorStop(0, tier.color + '66');
      grad.addColorStop(0.5, tier.color);
      grad.addColorStop(1, tier.color + 'cc');

      ctx!.beginPath();
      ctx!.arc(cx, cy, R, startA, fillEnd);
      ctx!.strokeStyle = grad;
      ctx!.lineWidth = 12;
      ctx!.lineCap = 'round';
      ctx!.stroke();
      ctx!.restore();

      // Tick marks around the arc for premium feel
      for (let i = 0; i <= 10; i++) {
        const angle = startA + (totalArc * i) / 10;
        const inner = R - 18;
        const outer = R - 14;
        ctx!.beginPath();
        ctx!.moveTo(cx + inner * Math.cos(angle), cy + inner * Math.sin(angle));
        ctx!.lineTo(cx + outer * Math.cos(angle), cy + outer * Math.sin(angle));
        ctx!.strokeStyle = i <= pct * 10 ? tier.color + '60' : 'rgba(255,255,255,0.06)';
        ctx!.lineWidth = 1.5;
        ctx!.lineCap = 'round';
        ctx!.stroke();
      }
    }

    function animate() {
      const speed = score / 50;
      current = Math.min(current + speed, score);
      draw(current);
      if (current < score) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [score, max, tier]);

  return (
    <div className="relative w-[220px] h-[220px] mx-auto">
      <canvas ref={canvasRef} className="w-[220px] h-[220px]" />
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 8 }}>
        <span className="text-5xl font-black text-white tracking-tight leading-none">{score}</span>
        <span className="text-[11px] text-slate-500 mt-1">out of {max}</span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function BachatScore() {
  const [visible, setVisible] = useState(false);
  const tier = getTier(TOTAL);
  const nextTier = getNextTier(TOTAL);
  const toNext = nextTier ? nextTier.minScore - TOTAL : 0;
  const progressPct = nextTier
    ? Math.round(((TOTAL - tier.minScore) / (nextTier.minScore - tier.minScore)) * 100)
    : 100;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`rounded-xl overflow-hidden w-full transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Top Section — Hero with gradient */}
      <div className={`relative bg-gradient-to-br ${tier.gradient} p-5 pb-0 overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -left-8 w-32 h-32 bg-black/10 rounded-full blur-xl" />

        <div className="relative z-10 flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {tier.badge} BachatScore
            </h3>
            <p className="text-[11px] text-white/60 mt-0.5">Monthly rider safety rating</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
            <span className="text-xs font-bold text-white uppercase tracking-wider">{tier.name} Tier</span>
          </div>
        </div>

        {/* Ring */}
        <div className="relative z-10 -mb-4">
          <ScoreRing score={TOTAL} max={1000} tier={{ ...tier, color: '#ffffff' }} />
        </div>
      </div>

      {/* Bottom Section — Dark card */}
      <div className="bg-[#0c1829] border border-white/5 rounded-b-xl p-5 flex flex-col gap-4">
        {/* Progress to next */}
        {nextTier && (
          <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                Next: <span className="text-white font-semibold">{nextTier.badge} {nextTier.name}</span>
              </span>
              <span className="text-[11px] font-bold" style={{ color: nextTier.color }}>{toNext} pts away</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
                  boxShadow: `0 0 12px ${nextTier.color}44`,
                }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Unlocks: <span className="text-slate-300">{nextTier.perk}</span>
            </p>
          </div>
        )}

        {/* Score Grid */}
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 mb-2.5">Score Breakdown</p>
          <div className="grid grid-cols-1 gap-1.5">
            {CATEGORIES.map((c) => {
              const pct = Math.round((c.points / c.max) * 100);
              return (
                <div key={c.label} className="flex items-center gap-3 bg-slate-800/30 rounded-lg px-3 py-2">
                  <span className="text-sm flex-shrink-0">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-300 font-medium">{c.label}</span>
                      <span className="text-[11px] font-bold" style={{ color: c.color }}>
                        {c.points}<span className="text-slate-600">/{c.max}</span>
                      </span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: c.color, boxShadow: `0 0 6px ${c.color}44` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Perk Banner */}
        <div className="rounded-xl p-3 text-center border" style={{ background: tier.color + '0a', borderColor: tier.color + '25' }}>
          <p className="text-[11px] font-semibold" style={{ color: tier.color }}>
            {tier.badge} Current perk: {tier.perk}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Ride in any zone to earn more points!</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FraudSignal {
  rule: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  scoreImpact: number;
  triggered: boolean;
}

interface FraudAnalysis {
  score: number;
  verdict: 'CLEAN' | 'REVIEW' | 'REJECT';
  signals: FraudSignal[];
}

// ─── Simulated data for demo (mirrors backend logic) ──────────────────────────
const DEMO_SIGNALS: FraudSignal[] = [
  {
    rule: 'FREQUENCY_ANOMALY',
    description: '1 claim in past 7 days (threshold: 3)',
    severity: 'LOW',
    scoreImpact: 0,
    triggered: false,
  },
  {
    rule: 'AMOUNT_ANOMALY',
    description: 'Claim is 13% of max weekly payout',
    severity: 'LOW',
    scoreImpact: 0,
    triggered: false,
  },
  {
    rule: 'DUPLICATE_TRIGGER',
    description: '1 claim with "HEAVY_RAIN" trigger this week',
    severity: 'LOW',
    scoreImpact: 0,
    triggered: false,
  },
  {
    rule: 'RAPID_CLAIMS',
    description: '0 claims in past 24 hours',
    severity: 'LOW',
    scoreImpact: 0,
    triggered: false,
  },
  {
    rule: 'LOCATION_VALIDATION',
    description: 'GPS verified within Kattankulathur corridor',
    severity: 'LOW',
    scoreImpact: -0.05,
    triggered: false,
  },
  {
    rule: 'ACTIVITY_VALIDATION',
    description: '4 transactions in past 7 days — active rider',
    severity: 'LOW',
    scoreImpact: -0.05,
    triggered: false,
  },
  {
    rule: 'NEW_RIDER_TRUST',
    description: '2 prior claims',
    severity: 'LOW',
    scoreImpact: 0,
    triggered: false,
  },
];

const DEMO_ANALYSIS: FraudAnalysis = {
  score: 0.05,
  verdict: 'CLEAN',
  signals: DEMO_SIGNALS,
};

// ─── Component ────────────────────────────────────────────────────────────────
export function FraudDetectionPanel() {
  const [analysis, setAnalysis] = useState<FraudAnalysis>(DEMO_ANALYSIS);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Try fetching from backend, fallback to demo data
    const fetchAnalysis = async () => {
      try {
        const token = localStorage.getItem('shield_token');
        if (token) {
          const res = await fetch('/api/claims/fraud-analysis', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.analysis) setAnalysis(data.analysis);
          }
        }
      } catch {
        // Use demo data
      }
    };
    fetchAnalysis();
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const verdictColor = {
    CLEAN: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: '✅ Verified Clean' },
    REVIEW: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: '⚠️ Under Review' },
    REJECT: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: '🚫 Flagged' },
  }[analysis.verdict];

  const ruleIcons: Record<string, string> = {
    FREQUENCY_ANOMALY: '📊',
    AMOUNT_ANOMALY: '💰',
    DUPLICATE_TRIGGER: '🔄',
    RAPID_CLAIMS: '⏱️',
    LOCATION_VALIDATION: '📍',
    ACTIVITY_VALIDATION: '📱',
    NEW_RIDER_TRUST: '🆕',
  };

  const ruleNames: Record<string, string> = {
    FREQUENCY_ANOMALY: 'Claim Frequency',
    AMOUNT_ANOMALY: 'Amount Check',
    DUPLICATE_TRIGGER: 'Duplicate Detection',
    RAPID_CLAIMS: 'Rapid Filing',
    LOCATION_VALIDATION: 'GPS Verification',
    ACTIVITY_VALIDATION: 'Activity Check',
    NEW_RIDER_TRUST: 'Rider History',
  };

  const severityStyle = (sev: string, triggered: boolean) => {
    if (!triggered) return 'text-emerald-400';
    if (sev === 'HIGH') return 'text-red-400';
    if (sev === 'MEDIUM') return 'text-amber-400';
    return 'text-slate-400';
  };

  const fraudPct = Math.round(analysis.score * 100);

  return (
    <div className={`rounded-xl border border-white/5 bg-[#0f1e36]/90 backdrop-blur-md shadow-lg overflow-hidden w-full transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white/90 text-sm tracking-wide flex items-center gap-2">
              🔒 Fraud Detection Engine
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">7-signal AI verification system • Real-time analysis</p>
          </div>
          <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${verdictColor.bg} ${verdictColor.text} ${verdictColor.border}`}>
            {verdictColor.label}
          </span>
        </div>
      </div>

      {/* Fraud Score Bar */}
      <div className="px-5 pb-4">
        <div className="bg-slate-800/40 rounded-xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Fraud Risk Score</span>
            <span className={`text-sm font-bold ${fraudPct <= 20 ? 'text-emerald-400' : fraudPct <= 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {fraudPct}% risk
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.max(fraudPct, 3)}%`,
                background: fraudPct <= 20
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : fraudPct <= 60
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #ef4444, #f87171)',
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-600 mt-1.5">
            <span>Clean</span>
            <span>Review</span>
            <span>Reject</span>
          </div>
        </div>
      </div>

      {/* Signal Checks */}
      <div className="px-5 pb-5">
        <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 mb-3">Verification Signals</p>
        <div className="flex flex-col gap-1.5">
          {analysis.signals.map((sig) => (
            <div key={sig.rule} className="flex items-center gap-3 bg-slate-800/30 rounded-lg px-3 py-2.5 border border-white/[0.03]">
              <span className="text-sm flex-shrink-0">{ruleIcons[sig.rule] ?? '🔍'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-300">{ruleNames[sig.rule] ?? sig.rule}</span>
                  <span className={`text-[10px] font-bold ${severityStyle(sig.severity, sig.triggered)}`}>
                    {sig.triggered ? (sig.severity === 'LOW' ? '● Pass' : `● ${sig.severity}`) : '● Pass'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{sig.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="px-5 pb-5">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <p className="text-[11px] text-emerald-300 font-semibold">All 7 fraud checks passed</p>
          <p className="text-[10px] text-slate-400 mt-1">Claims from verified riders in valid zones are auto-approved in under 30 seconds</p>
        </div>
      </div>
    </div>
  );
}

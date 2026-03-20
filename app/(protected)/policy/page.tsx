'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Check, Info, ChevronDown, ChevronUp, CloudRain, Waves, Activity, Smartphone, Ban, ShieldAlert, Store, Crosshair, FileQuestion } from 'lucide-react';
import type { Policy } from '@/types';

const tier1Triggers = [
  { name: 'Heavy Rainfall', icon: <CloudRain className="w-4 h-4 text-blue-400" /> },
  { name: 'Flash Flood', icon: <Waves className="w-4 h-4 text-blue-500" /> },
  { name: 'AQI Spike', icon: <Activity className="w-4 h-4 text-yellow-500" /> },
  { name: 'Platform Outage', icon: <Smartphone className="w-4 h-4 text-purple-500" /> },
  { name: 'Bandh / Strike', icon: <Ban className="w-4 h-4 text-red-500" /> },
];

const tier2Triggers = [
  { name: 'VIP Convoy', icon: <ShieldAlert className="w-4 h-4 text-red-400" /> },
  { name: 'Dark Store Outage', icon: <Store className="w-4 h-4 text-orange-500" /> },
];

const tier3Triggers = [
  { name: 'Religious Procession', icon: <Crosshair className="w-4 h-4 text-yellow-400" /> },
  { name: 'Other / Manual', icon: <FileQuestion className="w-4 h-4 text-muted" /> },
];

export default function PolicyPage() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [historyPolicies, setHistoryPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [activeRes, historyRes] = await Promise.all([
          api.getActivePolicy(),
          api.getPolicyHistory(),
        ]);
        setPolicy(activeRes.policy);
        setHistoryPolicies(historyRes.policies);
      } catch (err) {
        console.error('Policy fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleActivate = async () => {
    try {
      const res = await api.activatePolicy();
      setPolicy(res.policy);
    } catch (err: any) {
      alert(err.message || 'Failed to activate policy');
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-60 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" /> My Policy
      </h1>

      {policy ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 shimmer-active" />
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="success" className="gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {policy.status}
                </Badge>
                <Shield className="w-6 h-6 text-primary/30" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted">Premium</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(policy.weeklyPremium)}<span className="text-xs text-muted">/week</span></p>
                </div>
                <div>
                  <p className="text-xs text-muted">Max Payout</p>
                  <p className="text-xl font-bold">{formatCurrency(policy.maxWeeklyPayout)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted flex items-center gap-1">
                    Zone Risk Score
                    <span title="Higher scores mean higher disruption risk in your area" className="cursor-help">
                      <Info className="w-3 h-3" />
                    </span>
                  </p>
                  <p className="text-sm font-semibold">{policy.zoneRiskScore}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Platform Modifier</p>
                  <p className="text-sm font-semibold">{policy.platformModifier}</p>
                </div>
              </div>

              <div className="border-t border-primary/20 pt-3">
                <p className="text-xs text-muted">
                  Valid: {formatDate(policy.activatedAt)} → {formatDate(policy.expiresAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-muted mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No Active Policy</h3>
            <p className="text-sm text-muted mb-4">Activate SHIELD to protect your earnings</p>
            <Button onClick={handleActivate}>Activate SHIELD — {formatCurrency(49)}/week</Button>
          </CardContent>
        </Card>
      )}

      {/* Trigger Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Trigger Coverage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted mb-2 font-medium">Tier 1 — Auto Protected</p>
            {tier1Triggers.map(t => (
              <div key={t.name} className="flex items-center gap-2 py-1.5">
                <Check className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm">{t.icon} {t.name}</span>
                <Badge variant="success" className="ml-auto text-[9px]">Auto</Badge>
              </div>
            ))}
          </div>
          <div className="border-t border-navy-700 pt-2">
            <p className="text-xs text-muted mb-2 font-medium">Tier 2 — One-Tap Confirm</p>
            {tier2Triggers.map(t => (
              <div key={t.name} className="flex items-center gap-2 py-1.5">
                <Check className="w-3.5 h-3.5 text-warning" />
                <span className="text-sm">{t.icon} {t.name}</span>
                <Badge variant="warning" className="ml-auto text-[9px]">One-Tap</Badge>
              </div>
            ))}
          </div>
          <div className="border-t border-navy-700 pt-2">
            <p className="text-xs text-muted mb-2 font-medium">Tier 3 — Manual Review</p>
            {tier3Triggers.map(t => (
              <div key={t.name} className="flex items-center gap-2 py-1.5">
                <Check className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-sm">{t.icon} {t.name}</span>
                <Badge className="ml-auto text-[9px] bg-orange-500/20 text-orange-400 border-orange-500/30">Manual</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Policy History */}
      <Card>
        <CardContent className="p-4">
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowHistory(!showHistory)}
          >
            <span className="text-sm font-medium">Policy History</span>
            {showHistory ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
          </button>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-3 space-y-2"
            >
              {historyPolicies.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-navy-700/50 last:border-0">
                  <div>
                    <p className="text-sm">{formatDate(p.activatedAt)} — {formatDate(p.expiresAt)}</p>
                    <p className="text-xs text-muted">{formatCurrency(p.weeklyPremium)}/week</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

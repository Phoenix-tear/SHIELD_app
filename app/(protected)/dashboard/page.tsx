'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, getGreeting, getTriggerIcon, getTriggerLabel, getStatusColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Bell, ArrowRight, AlertTriangle, CheckCircle, Wallet, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { RiderTracker } from '@/components/rider-tracker';
import { BachatScore } from '@/components/shield-score';
import type { Policy, Claim, Disruption, EarningsSummary } from '@/types';

export default function DashboardPage() {
  const { rider } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [disruption, setDisruption] = useState<Disruption | null>(null);
  const [hasDisruption, setHasDisruption] = useState(false);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [policyRes, disruptionRes, earningsRes, claimsRes, walletRes] = await Promise.all([
          api.getActivePolicy(),
          api.getActiveDisruptions(),
          api.getEarningsSummary(),
          api.getClaims(undefined, 1),
          api.getWallet(),
        ]);
        setPolicy(policyRes.policy);
        setDisruption(disruptionRes.disruption);
        setHasDisruption(disruptionRes.active);
        setEarnings(earningsRes);
        setRecentClaims(claimsRes.claims.slice(0, 2));
        setWalletBalance(walletRes.balance);
        fetchNotifications();
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  // Prepare chart data
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = daysOfWeek.map((day, i) => {
    const earningsForDay = earnings?.earningsHistory?.find((e: any) => {
      const d = new Date(e.date);
      return d.getDay() === (i === 6 ? 0 : i + 1);
    });
    return { day, earnings: earningsForDay?.earnings || 0 };
  });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-green-700 flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted">Bachat</p>
            <h1 className="text-lg font-semibold">{getGreeting()}, {rider?.name?.split(' ')[0]}</h1>
          </div>
        </div>
        <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-navy-800 transition-colors">
          <Bell className="w-5 h-5 text-muted" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger text-[10px] font-bold flex items-center justify-center text-white"
            >
              {unreadCount}
            </motion.span>
          )}
        </Link>
      </div>

      {/* Active Policy Card */}
      {policy && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card border-primary/20 overflow-hidden relative">
            <div className="absolute inset-0 shimmer-active" />
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="success" className="gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  BACHAT ACTIVE
                </Badge>
                {policy.expiresAt && new Date(policy.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000 && (
                  <Button size="sm" className="h-7 text-xs">Renew</Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted">Weekly Premium</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(policy.weeklyPremium)}<span className="text-xs text-muted">/week</span></p>
                </div>
                <div>
                  <p className="text-xs text-muted">Max Payout</p>
                  <p className="text-lg font-bold">{formatCurrency(policy.maxWeeklyPayout)}</p>
                </div>
              </div>
              <p className="text-xs text-muted mt-2">Expires: {formatDate(policy.expiresAt)}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Wallet Balance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted flex items-center gap-1"><Wallet className="w-3 h-3" /> Wallet Balance</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(walletBalance)}</p>
              </div>
              <div className="flex gap-2">
                <Link href="/wallet">
                  <Button size="sm" variant="outline" className="text-xs">Top Up</Button>
                </Link>
                <Link href="/wallet">
                  <Button size="sm" variant="ghost" className="text-xs">History</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tracker Component */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <RiderTracker />
      </motion.div>

      {/* BachatScore Gamification */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <BachatScore />
      </motion.div>

      {/* Disruption Alert / Claim CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {hasDisruption && disruption ? (
          <Card className="border-red-500/30 animate-pulse-glow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-danger text-sm">Disruption Detected</p>
                  <p className="text-xs text-muted mt-0.5">{disruption.title}</p>
                  <p className="text-xs text-navy-400 mt-1">{disruption.description}</p>
                </div>
              </div>
              <Link href={`/claims/new?type=semi-auto&trigger=${disruption.triggerType}`}>
                <Button className="w-full mt-3" size="sm">
                  Tap to confirm — your earnings are protected
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">No disruptions detected</p>
                  <p className="text-xs text-muted">You&apos;re covered. All clear in your zone.</p>
                </div>
              </div>
              <Link href="/claims/new">
                <Button variant="outline" className="w-full mt-3" size="sm">
                  File a Claim Manually
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Earnings This Week */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Earnings This Week</CardTitle>
              <Link href="/earnings" className="text-xs text-primary hover:underline">View All</Link>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(value: number) => [formatCurrency(value), 'Earnings']}
                  />
                  <Bar dataKey="earnings" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-muted">This week: <span className="text-white font-medium">{formatCurrency(earnings?.currentWeekEarnings || 0)}</span></span>
              <span className="text-muted">4-week median: <span className="text-white font-medium">{formatCurrency(earnings?.rollingWeeklyMedian || 0)}</span></span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Claims */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Recent Claims</CardTitle>
              <Link href="/claims" className="text-xs text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentClaims.length === 0 ? (
              <p className="text-muted text-sm text-center py-4">No claims yet</p>
            ) : (
              <div className="space-y-2">
                {recentClaims.map((claim) => (
                  <Link key={claim.id} href={`/claims/${claim.id}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-navy-800 transition-colors">
                      <span className="text-lg">{getTriggerIcon(claim.triggerType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{getTriggerLabel(claim.triggerType)}</p>
                        <p className="text-xs text-muted">{formatDate(claim.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(claim.status)}`}>
                          {claim.status}
                        </span>
                        <p className="text-xs font-medium mt-0.5">
                          {claim.status === 'PENDING' ? 'Calculating...' : formatCurrency(claim.approvedPayout || claim.calculatedPayout)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

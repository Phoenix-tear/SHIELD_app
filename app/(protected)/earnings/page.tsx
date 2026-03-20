'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TrendingUp, ChevronDown, ChevronUp, Info, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { EarningsSummary, EarningsBaseline } from '@/types';

export default function EarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [baseline, setBaseline] = useState<EarningsBaseline | null>(null);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sum, base] = await Promise.all([
          api.getEarningsSummary(),
          api.getEarningsBaseline(),
        ]);
        setSummary(sum);
        setBaseline(base);
      } catch (err) {
        console.error('Earnings fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  const chartData = summary?.earningsHistory.map((e: any) => ({
    date: new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    earnings: e.earnings,
  })) || [];

  const bestDay = summary?.earningsHistory.reduce((max: any, e: any) => (e.earnings > (max?.earnings || 0) ? e : max), null);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" /> Earnings
      </h1>

      <Tabs defaultValue="week">
        <TabsList className="w-full">
          <TabsTrigger value="week" className="flex-1">This Week</TabsTrigger>
          <TabsTrigger value="month" className="flex-1">Last 4 Weeks</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="space-y-4 mt-4">
          {/* Chart */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        formatter={(value: number) => [formatCurrency(value), 'Earnings']}
                      />
                      <Area type="monotone" dataKey="earnings" stroke="#16a34a" fill="url(#colorEarnings)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted">This Week</p>
                <p className="text-sm font-bold">{formatCurrency(summary?.currentWeekEarnings || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted">4-Week Median</p>
                <p className="text-sm font-bold">{formatCurrency(summary?.rollingWeeklyMedian || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted">Best Day</p>
                <p className="text-sm font-bold">{formatCurrency(bestDay?.earnings || 0)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="month" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEarnings2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Earnings']}
                    />
                    <Area type="monotone" dataKey="earnings" stroke="#16a34a" fill="url(#colorEarnings2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Slot Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Slot Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {baseline?.slotBreakdown.map((slot: any) => (
              <div key={slot.slot} className="flex items-center justify-between py-2 border-b border-navy-700/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm flex items-center">
                    {slot.slot === 'MORNING' ? <Sunrise className="w-4 h-4 text-yellow-500 mr-2" /> : slot.slot === 'AFTERNOON' ? <Sun className="w-4 h-4 text-yellow-400 mr-2" /> : slot.slot === 'EVENING' ? <Sunset className="w-4 h-4 text-orange-400 mr-2" /> : <Moon className="w-4 h-4 text-blue-300 mr-2" />}
                  </span>
                  <span className="text-sm">{slot.slot.charAt(0) + slot.slot.slice(1).toLowerCase()}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(slot.avgEarnings)}</p>
                  <p className="text-[10px] text-muted">Baseline avg</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="cursor-pointer" onClick={() => setInfoOpen(!infoOpen)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">How is my baseline calculated?</span>
            </div>
            {infoOpen ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
          </div>
          {infoOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-3 space-y-2 text-xs text-muted"
            >
              <p>• Your baseline is calculated from the <span className="text-white">median of your last 4 weeks</span> of earnings data, broken down by time slot.</p>
              <p>• Each slot (Morning, Afternoon, Evening, Night) has its own average, making the baseline <span className="text-white">personalized to your schedule.</span></p>
              <p>• When a disruption occurs, we compare your actual earnings against this baseline to calculate your <span className="text-primary">exact gap payout.</span></p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, getTriggerIcon, getTriggerLabel, getStatusColor, getClaimTypeBadge } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { FraudDetectionPanel } from '@/components/fraud-detection';
import type { Claim } from '@/types';

const tabs = ['all', 'PENDING', 'UNDER_REVIEW', 'PAID', 'REJECTED'];

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchClaims = async (status?: string) => {
    setLoading(true);
    try {
      const res = await api.getClaims(status === 'all' ? undefined : status);
      setClaims(res.claims);
    } catch (err) {
      console.error('Claims fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    fetchClaims(tab);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">My Claims</h1>
        <Link href="/claims/new">
          <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> New Claim</Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full overflow-x-auto flex-nowrap">
          {tabs.map(tab => (
            <TabsTrigger key={tab} value={tab} className="text-xs whitespace-nowrap">
              {tab === 'all' ? 'All' : tab === 'UNDER_REVIEW' ? 'Review' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Fraud Detection Engine */}
      <div className="mt-4">
        <FraudDetectionPanel />
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : claims.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted text-sm">No claims found</p>
            <Link href="/claims/new">
              <Button variant="outline" className="mt-3" size="sm">File a Claim</Button>
            </Link>
          </div>
        ) : (
          claims.map((claim, i) => {
            const badge = getClaimTypeBadge(claim.claimType);
            return (
              <motion.div
                key={claim.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/claims/${claim.id}`}>
                  <Card className="hover:border-navy-500 transition-colors">
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className="text-2xl">{getTriggerIcon(claim.triggerType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{getTriggerLabel(claim.triggerType)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted">{formatDate(claim.createdAt)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(claim.status)}`}>
                          {claim.status.replace('_', ' ')}
                        </span>
                        <p className="text-sm font-bold mt-1">
                          {claim.status === 'PENDING' ? <span className="text-muted text-xs">Calculating...</span> : formatCurrency(claim.approvedPayout || claim.calculatedPayout)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

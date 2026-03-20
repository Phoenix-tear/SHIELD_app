'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime, getTriggerIcon, getTriggerLabel, getStatusColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Check, Clock, AlertTriangle, XCircle } from 'lucide-react';
import type { Claim } from '@/types';

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.getClaimDetail(params.id as string);
        setClaim(res.claim);
      } catch (err) {
        console.error('Claim detail error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [params.id]);

  if (loading) {
    return <div className="p-4 space-y-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-40 rounded-xl" /></div>;
  }

  if (!claim) {
    return <div className="p-4 text-center mt-20"><p className="text-muted">Claim not found</p><Button variant="outline" onClick={() => router.back()} className="mt-4">Go Back</Button></div>;
  }

  const steps = [
    { label: 'Disruption Detected', done: true, time: claim.disruptionStartedAt },
    { label: 'Rider Confirmed Active', done: true, time: claim.createdAt },
    { label: 'Signals Corroborated', done: claim.status !== 'PENDING', time: claim.createdAt },
    {
      label: claim.fraudScore && claim.fraudScore > 0.7 ? 'Fraud Check — Under Review' : 'Fraud Check Passed',
      done: claim.status !== 'PENDING' && claim.status !== 'UNDER_REVIEW',
      warning: claim.fraudScore ? claim.fraudScore > 0.7 : false,
    },
    {
      label: claim.status === 'PAID' ? 'Payout Processed' : claim.status === 'REJECTED' ? 'Claim Rejected' : 'Payout Pending',
      done: claim.status === 'PAID',
      rejected: claim.status === 'REJECTED',
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1"><ArrowLeft className="w-5 h-5 text-muted" /></button>
        <h1 className="text-lg font-bold">Claim Details</h1>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getTriggerIcon(claim.triggerType)}</span>
            <div className="flex-1">
              <h2 className="font-bold">{getTriggerLabel(claim.triggerType)}</h2>
              <p className="text-xs text-muted">{formatDateTime(claim.createdAt)}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusColor(claim.status)}`}>
              {claim.status.replace('_', ' ')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Claim Timeline</CardTitle></CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.rejected ? 'bg-red-500/20' : step.warning ? 'bg-yellow-500/20' : step.done ? 'bg-primary/20' : 'bg-navy-700'
                  }`}>
                    {step.rejected ? <XCircle className="w-3 h-3 text-danger" /> : step.warning ? <AlertTriangle className="w-3 h-3 text-warning" /> : step.done ? <Check className="w-3 h-3 text-primary" /> : <Clock className="w-3 h-3 text-muted" />}
                  </div>
                  {i < steps.length - 1 && <div className={`w-0.5 h-6 ${step.done ? 'bg-primary/30' : 'bg-navy-700'}`} />}
                </div>
                <div className="pb-4">
                  <p className={`text-sm ${step.done ? 'text-white' : 'text-muted'}`}>{step.label}</p>
                  {step.time && <p className="text-[10px] text-muted">{formatDateTime(step.time as string)}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payout Breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Payout Breakdown</CardTitle></CardHeader>
        <CardContent className="pb-4">
          <div className="bg-navy-800 rounded-lg p-3 font-mono text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted">Baseline</span><span>{formatCurrency(claim.baselineEarnings)}</span></div>
            <div className="flex justify-between"><span className="text-muted">× Disruption</span><span>{claim.disruptionFraction}</span></div>
            <div className="flex justify-between"><span className="text-muted">× Peak Coeff</span><span>{claim.peakCoefficient}</span></div>
            <div className="border-t border-navy-600 my-1" />
            <div className="flex justify-between"><span className="text-muted">= Calculated</span><span>{formatCurrency(claim.calculatedPayout)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Actual earned</span><span className="text-red-400">{formatCurrency(claim.actualEarnings)}</span></div>
            <div className="border-t border-navy-600 my-1" />
            <div className="flex justify-between font-bold"><span className="text-primary">Gap (payout)</span><span className="text-primary">{formatCurrency(claim.approvedPayout || claim.calculatedPayout)}</span></div>
          </div>
          {claim.fraudScore !== null && claim.fraudScore !== undefined && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-muted">Fraud score:</span>
              <span className={claim.fraudScore > 0.7 ? 'text-danger' : claim.fraudScore > 0.4 ? 'text-warning' : 'text-primary'}>
                {(claim.fraudScore * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection reason */}
      {claim.status === 'REJECTED' && (
        <Card className="border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-danger mb-2">
              <XCircle className="w-4 h-4" />
              <span className="font-semibold text-sm">Claim Rejected</span>
            </div>
            <p className="text-xs text-muted">This claim was flagged by our fraud detection system. If you believe this is an error, please contact support.</p>
          </CardContent>
        </Card>
      )}

      {/* Rider Note */}
      {claim.riderNote && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted mb-1">Your Note:</p>
            <p className="text-sm">{claim.riderNote}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

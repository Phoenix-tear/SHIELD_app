'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { formatCurrency, getTriggerIcon, getTriggerLabel } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bot, Hand, Camera, Check, MapPin, Upload } from 'lucide-react';

type Lane = 'select' | 'auto' | 'semi-auto' | 'manual';

const triggerOptions = [
  { value: 'VIP_CONVOY', label: 'VIP Convoy' },
  { value: 'RELIGIOUS_PROCESSION', label: 'Religious Procession' },
  { value: 'DARK_STORE_OUTAGE', label: 'Dark Store Outage' },
  { value: 'PLATFORM_OUTAGE', label: 'Platform Outage' },
  { value: 'BANDH', label: 'Bandh / Strike' },
  { value: 'AQI_SPIKE', label: 'AQI Spike' },
  { value: 'FLASH_FLOOD', label: 'Flash Flood' },
  { value: 'HEAVY_RAINFALL', label: 'Heavy Rainfall' },
  { value: 'MANUAL_OTHER', label: 'Other' },
];

export default function NewClaimPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lane, setLane] = useState<Lane>('select');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newClaimId, setNewClaimId] = useState('');
  const [estimatedPayout, setEstimatedPayout] = useState(0);

  // Form data
  const [triggerType, setTriggerType] = useState('');
  const [riderNote, setRiderNote] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.5946 });
  const [disruption, setDisruption] = useState<any>(null);

  useEffect(() => {
    const type = searchParams.get('type');
    const trigger = searchParams.get('trigger');
    if (type === 'semi-auto' && trigger) {
      setTriggerType(trigger);
      setLane('semi-auto');
    }

    // Get GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // fallback to default
      );
    }
  }, []);

  const fetchDisruption = async () => {
    try {
      const res = await api.getActiveDisruptions();
      if (res.active) setDisruption(res.disruption);
    } catch {}
  };

  const submitClaim = async (type: string) => {
    setLoading(true);
    try {
      let res;
      if (type === 'auto') {
        res = await api.createAutoClaim({
          triggerType: triggerType || disruption?.triggerType || 'HEAVY_RAINFALL',
          geolat: coords.lat,
          geolong: coords.lng,
          disruptionStartedAt: disruption?.startedAt || new Date().toISOString(),
        });
      } else if (type === 'semi-auto') {
        res = await api.createSemiAutoClaim({
          triggerType,
          geolat: coords.lat,
          geolong: coords.lng,
          riderConfirmed: true,
        });
      } else {
        res = await api.createManualClaim({
          triggerType,
          riderNote,
          geolat: coords.lat,
          geolong: coords.lng,
          mediaUrl: mediaFile ? 'uploaded://evidence.jpg' : undefined,
        });
      }
      setNewClaimId(res.claim.id);
      setEstimatedPayout(res.claim.calculatedPayout);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4"
        >
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Check className="w-10 h-10 text-primary" />
          </motion.div>
        </motion.div>
        <h2 className="text-xl font-bold mb-2">Claim Submitted!</h2>
        <p className="text-muted text-sm text-center mb-2">
          Expected payout: <span className="text-primary font-bold">{formatCurrency(estimatedPayout)}</span>
        </p>
        <p className="text-xs text-muted text-center mb-6">You&apos;ll be notified within 4 hours.</p>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/claims/${newClaimId}`)}>View Claim</Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => lane === 'select' ? router.back() : setLane('select')} className="p-1">
          <ArrowLeft className="w-5 h-5 text-muted" />
        </button>
        <h1 className="text-lg font-bold">New Claim</h1>
      </div>

      <AnimatePresence mode="wait">
        {lane === 'select' && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

            <Card className="cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setLane('semi-auto')}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center"><Hand className="w-6 h-6 text-warning" /></div>
                <div>
                  <p className="font-semibold">One-Tap Confirm</p>
                  <p className="text-xs text-muted">Unusual event in your zone. Tap to confirm.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-orange-500/50 transition-colors" onClick={() => setLane('manual')}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center"><Camera className="w-6 h-6 text-orange-400" /></div>
                <div>
                  <p className="font-semibold">Manual Claim</p>
                  <p className="text-xs text-muted">Something else blocked your shift? Tell us.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AUTO LANE REMOVED */}

        {/* SEMI-AUTO LANE */}
        {lane === 'semi-auto' && (
          <motion.div key="semi" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted">Select the disruption type:</p>
                {triggerOptions.slice(0, 5).map(opt => (
                  <Card
                    key={opt.value}
                    className={`cursor-pointer transition-colors ${triggerType === opt.value ? 'border-primary bg-primary/5' : 'hover:border-navy-500'}`}
                    onClick={() => setTriggerType(opt.value)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className="text-lg">{getTriggerIcon(opt.value)}</span>
                      <span className="text-sm font-medium">{opt.label}</span>
                      {triggerType === opt.value && <Check className="w-4 h-4 text-primary ml-auto" />}
                    </CardContent>
                  </Card>
                ))}
                <Button className="w-full" disabled={!triggerType} onClick={() => setStep(2)}>
                  Next
                </Button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <Card className="border-blue-500/20">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Corroboration Signals Found</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs"><Check className="w-3 h-3 text-primary" /><span className="text-navy-300">Traffic API: 45 min delay in your zone</span></div>
                      <div className="flex items-center gap-2 text-xs"><Check className="w-3 h-3 text-primary" /><span className="text-navy-300">Peer idle count: 12 riders in 3km radius</span></div>
                      <div className="flex items-center gap-2 text-xs"><Check className="w-3 h-3 text-primary" /><span className="text-navy-300">Order volume drop: -60% vs baseline</span></div>
                    </div>
                  </CardContent>
                </Card>
                <p className="text-sm text-center text-muted">Does this match your experience?</p>
                <Button className="w-full" size="lg" disabled={loading} onClick={() => submitClaim('semi-auto')}>
                  {loading ? 'Submitting...' : 'Tap Confirm'}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* MANUAL LANE */}
        {lane === 'manual' && (
          <motion.div key="manual" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted">Select disruption type:</p>
                {triggerOptions.map(opt => (
                  <Card
                    key={opt.value}
                    className={`cursor-pointer transition-colors ${triggerType === opt.value ? 'border-primary bg-primary/5' : 'hover:border-navy-500'}`}
                    onClick={() => setTriggerType(opt.value)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className="text-lg">{getTriggerIcon(opt.value)}</span>
                      <span className="text-sm">{opt.label}</span>
                    </CardContent>
                  </Card>
                ))}
                <Button className="w-full" disabled={!triggerType} onClick={() => setStep(2)}>Next</Button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <Label>Describe what happened (min 20 words)</Label>
                <textarea
                  className="w-full h-24 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tell us what disrupted your shift..."
                  value={riderNote}
                  onChange={e => setRiderNote(e.target.value)}
                />
                <p className="text-xs text-muted">{riderNote.split(/\s+/).filter(Boolean).length} / 20 words minimum</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button
                    className="flex-1"
                    disabled={riderNote.split(/\s+/).filter(Boolean).length < 20}
                    onClick={() => setStep(3)}
                  >Next</Button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <Label>Upload evidence (photo or video)</Label>
                <div className="border-2 border-dashed border-navy-600 rounded-xl p-6 text-center">
                  {mediaFile ? (
                    <div className="space-y-2">
                      <p className="text-sm text-primary">📎 {mediaFile.name}</p>
                      <Button variant="ghost" size="sm" onClick={() => setMediaFile(null)}>Remove</Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 text-muted mx-auto mb-2" />
                      <p className="text-sm text-muted">Tap to upload</p>
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={e => setMediaFile(e.target.files?.[0] || null)} />
                    </label>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <MapPin className="w-3 h-3" />
                  <span>GPS auto-detected: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button className="flex-1" onClick={() => setStep(4)}>Review</Button>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold">Review Your Claim</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted">Type:</span><span>{getTriggerLabel(triggerType)}</span>
                      <span className="text-muted">Note:</span><span className="truncate">{riderNote.slice(0, 50)}...</span>
                      <span className="text-muted">Evidence:</span><span>{mediaFile ? '✅ Attached' : 'None'}</span>
                      <span className="text-muted">GPS:</span><span>{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
                    </div>
                  </CardContent>
                </Card>
                <p className="text-xs text-center text-muted">AI + human review within 2 hours</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
                  <Button className="flex-1" disabled={loading} onClick={() => submitClaim('manual')}>
                    {loading ? 'Submitting...' : 'Submit Claim'}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

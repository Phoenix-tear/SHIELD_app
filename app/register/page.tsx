'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, ArrowLeft, ArrowRight, Check, User, Briefcase, CreditCard, MapPin, Phone, Lock, Building2, Bike, IndianRupee } from 'lucide-react';

// ─── Schemas ──────────────────────────────────────────────────────────────────
const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().length(10, 'Phone must be 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const step2Schema = z.object({
  city: z.string().min(1, 'Select a city'),
  platform: z.enum(['BLINKIT', 'ZEPTO', 'INSTAMART']),
  pinCode: z.string().length(6, 'Pin code must be 6 digits'),
  weeklyEarningsBand: z.string().optional(),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;

// ─── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, title: 'Personal Info', subtitle: 'Tell us about yourself', icon: User },
  { num: 2, title: 'Work Details', subtitle: 'Your delivery platform', icon: Briefcase },
  { num: 3, title: 'Payment & KYC', subtitle: 'Verify your identity', icon: CreditCard },
];

// ─── Benefits shown alongside the form ────────────────────────────────────────
const BENEFITS = [
  { icon: '🛡️', text: '₹4,500/week coverage for delivery disruptions' },
  { icon: '🤖', text: 'AI-powered dynamic pricing — pay only for your risk' },
  { icon: '⚡', text: 'Auto-triggered claims with instant wallet payouts' },
  { icon: '📍', text: 'Real-time GPS tracking with zone safety analysis' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1 | null>(null);
  const [step2Data, setStep2Data] = useState<Step2 | null>(null);
  const [upiId, setUpiId] = useState('');
  const [aadhaarConsent, setAadhaarConsent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema) });

  const onStep1 = (data: Step1) => { setStep1Data(data); setStep(2); };
  const onStep2 = (data: Step2) => { setStep2Data(data); setStep(3); };

  const handleAadhaarVerify = async () => {
    if (!aadhaarConsent) return;
    setVerifying(true);
    await new Promise(r => setTimeout(r, 2000));
    setVerifying(false);
    setVerified(true);
  };

  const handleFinish = async () => {
    if (!step1Data || !step2Data) return;
    try {
      setError('');
      await registerUser({
        name: step1Data.name,
        phone: step1Data.phone,
        password: step1Data.password,
        city: step2Data.city,
        platform: step2Data.platform,
        pinCode: step2Data.pinCode,
        weeklyEarningsBand: step2Data.weeklyEarningsBand,
        upiId: upiId || undefined,
        aadhaarVerified: verified,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const currentStep = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-[#060e1b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-blue-500/[0.04] rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo + Branding */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20"
          >
            <Shield className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Join Bachat</h1>
          <p className="text-slate-400 text-sm mt-1">Rider insurance that protects your income</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isDone ? '#22c55e' : isActive ? '#3b82f6' : '#1e293b',
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300"
                  style={{
                    borderColor: isDone ? '#22c55e44' : isActive ? '#3b82f644' : '#ffffff08',
                    boxShadow: isActive ? '0 0 20px rgba(59,130,246,0.15)' : isDone ? '0 0 20px rgba(34,197,94,0.1)' : 'none',
                  }}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <StepIcon className={`w-4 h-4 ${isActive ? 'text-blue-300' : 'text-slate-500'}`} />
                  )}
                </motion.div>
                {i < STEPS.length - 1 && (
                  <div className={`w-10 h-0.5 rounded-full transition-all duration-500 ${step > s.num ? 'bg-emerald-500' : 'bg-white/5'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Title */}
        <div className="text-center mb-5">
          <h2 className="text-lg font-semibold text-white">{currentStep.title}</h2>
          <p className="text-xs text-slate-500 mt-1">{currentStep.subtitle}</p>
        </div>

        {/* Form Card */}
        <Card className="border-white/5 bg-[#0c1829]/90 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden">
          <CardContent className="p-5">
            <AnimatePresence mode="wait">
              {/* ─── Step 1: Personal Info ─── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ x: 200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -200, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          className="pl-10 bg-slate-800/50 border-white/5 h-11 focus:border-blue-500/40 focus:ring-blue-500/10"
                          placeholder="Enter your full name"
                          {...form1.register('name')}
                        />
                      </div>
                      {form1.formState.errors.name && <p className="text-red-400 text-[11px]">{form1.formState.errors.name.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">+91</span>
                        <Input
                          className="pl-[72px] bg-slate-800/50 border-white/5 h-11 focus:border-blue-500/40 focus:ring-blue-500/10"
                          placeholder="10-digit number"
                          maxLength={10}
                          {...form1.register('phone')}
                        />
                      </div>
                      {form1.formState.errors.phone && <p className="text-red-400 text-[11px]">{form1.formState.errors.phone.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input
                            className="pl-10 bg-slate-800/50 border-white/5 h-11 focus:border-blue-500/40 focus:ring-blue-500/10"
                            type="password"
                            placeholder="Min 6 chars"
                            {...form1.register('password')}
                          />
                        </div>
                        {form1.formState.errors.password && <p className="text-red-400 text-[11px]">{form1.formState.errors.password.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Confirm</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input
                            className="pl-10 bg-slate-800/50 border-white/5 h-11 focus:border-blue-500/40 focus:ring-blue-500/10"
                            type="password"
                            placeholder="Re-enter"
                            {...form1.register('confirmPassword')}
                          />
                        </div>
                        {form1.formState.errors.confirmPassword && <p className="text-red-400 text-[11px]">{form1.formState.errors.confirmPassword.message}</p>}
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/20 border-0" size="lg">
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ─── Step 2: Work Details ─── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ x: 200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -200, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">City</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10 pointer-events-none" />
                        <Select onValueChange={v => form2.setValue('city', v)}>
                          <SelectTrigger className="pl-10 bg-slate-800/50 border-white/5 h-11">
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Chennai">Chennai (Kattankulathur)</SelectItem>
                            <SelectItem value="Bengaluru">Bengaluru</SelectItem>
                            <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                            <SelectItem value="Delhi NCR">Delhi NCR</SelectItem>
                            <SelectItem value="Mumbai">Mumbai</SelectItem>
                            <SelectItem value="Pune">Pune</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {form2.formState.errors.city && <p className="text-red-400 text-[11px]">{form2.formState.errors.city.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Delivery Platform</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['BLINKIT', 'ZEPTO', 'INSTAMART'] as const).map((p) => {
                          const selected = form2.watch('platform') === p;
                          const colors: Record<string, string> = { BLINKIT: '#f5c518', ZEPTO: '#7c3aed', INSTAMART: '#f97316' };
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => form2.setValue('platform', p)}
                              className={`relative h-12 rounded-xl border-2 flex items-center justify-center text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                                selected
                                  ? 'bg-white/5 text-white'
                                  : 'bg-slate-800/30 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'
                              }`}
                              style={{
                                borderColor: selected ? colors[p] + '66' : undefined,
                                boxShadow: selected ? `0 0 16px ${colors[p]}22` : undefined,
                              }}
                            >
                              <Bike className="w-3.5 h-3.5 mr-1.5" style={{ color: selected ? colors[p] : undefined }} />
                              {p === 'INSTAMART' ? 'Instamart' : p.charAt(0) + p.slice(1).toLowerCase()}
                              {selected && (
                                <motion.div
                                  layoutId="platform-check"
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                                  style={{ background: colors[p] }}
                                >
                                  <Check className="w-3 h-3 text-white" />
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Pin Code</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input
                            className="pl-10 bg-slate-800/50 border-white/5 h-11 focus:border-blue-500/40 focus:ring-blue-500/10"
                            placeholder="6-digit"
                            maxLength={6}
                            {...form2.register('pinCode')}
                          />
                        </div>
                        {form2.formState.errors.pinCode && <p className="text-red-400 text-[11px]">{form2.formState.errors.pinCode.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Weekly Earnings</Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10 pointer-events-none" />
                          <Select onValueChange={v => form2.setValue('weeklyEarningsBand', v)}>
                            <SelectTrigger className="pl-10 bg-slate-800/50 border-white/5 h-11">
                              <SelectValue placeholder="Range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="₹1,000–₹3,000">₹1k–₹3k</SelectItem>
                              <SelectItem value="₹3,000–₹5,000">₹3k–₹5k</SelectItem>
                              <SelectItem value="₹5,000–₹8,000">₹5k–₹8k</SelectItem>
                              <SelectItem value="₹8,000+">₹8k+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 border-white/5 bg-slate-800/50 hover:bg-slate-700/50">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button type="submit" className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/20 border-0">
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ─── Step 3: Payment & KYC ─── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ x: 200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -200, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="space-y-4">
                    {/* UPI */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">UPI ID</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          className="pl-10 bg-slate-800/50 border-white/5 h-11 focus:border-blue-500/40 focus:ring-blue-500/10"
                          placeholder="yourname@upi"
                          value={upiId}
                          onChange={e => setUpiId(e.target.value)}
                        />
                      </div>
                      <p className="text-[10px] text-slate-600">For instant payouts when your claim is approved</p>
                    </div>

                    {/* Aadhaar KYC Section */}
                    <div className="rounded-xl border border-white/5 bg-slate-800/30 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">Aadhaar KYC Verification</h3>
                          <p className="text-[10px] text-slate-500">One-time verify via DigiLocker</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 bg-slate-900/50 rounded-lg p-3 border border-white/[0.03]">
                        <Checkbox
                          id="aadhaar"
                          checked={aadhaarConsent}
                          onCheckedChange={(c) => setAadhaarConsent(c === true)}
                          className="mt-0.5"
                        />
                        <label htmlFor="aadhaar" className="text-[11px] text-slate-400 leading-relaxed cursor-pointer">
                          I consent to Aadhaar KYC verification via DigiLocker for identity verification. This is a one-time process required for claims processing.
                        </label>
                      </div>

                      {!verified ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!aadhaarConsent || verifying}
                          onClick={handleAadhaarVerify}
                          className="w-full h-10 border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                        >
                          {verifying ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                              <span>Connecting to DigiLocker...</span>
                            </div>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Verify Aadhaar via DigiLocker
                            </>
                          )}
                        </Button>
                      ) : (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5"
                        >
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-400">Aadhaar Verified</p>
                            <p className="text-[10px] text-emerald-400/60">Identity confirmed via DigiLocker</p>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 h-11 border-white/5 bg-slate-800/50 hover:bg-slate-700/50">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button
                        onClick={handleFinish}
                        className="flex-1 h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/20 border-0"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating...
                          </div>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Create Account
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Benefits Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5 rounded-xl border border-white/5 bg-[#0c1829]/60 p-4"
        >
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3 text-center">What you get with Bachat</p>
          <div className="grid grid-cols-2 gap-2">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                <span className="text-xs leading-none mt-0.5">{b.icon}</span>
                <span className="text-[10px] text-slate-400 leading-relaxed">{b.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Login Link */}
        <p className="text-center text-slate-500 text-sm mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}

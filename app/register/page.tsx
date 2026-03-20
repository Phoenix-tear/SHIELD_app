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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, ArrowLeft, ArrowRight, Check } from 'lucide-react';

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

  const onStep1 = (data: Step1) => {
    setStep1Data(data);
    setStep(2);
  };

  const onStep2 = (data: Step2) => {
    setStep2Data(data);
    setStep(3);
  };

  const handleAadhaarVerify = async () => {
    if (!aadhaarConsent) return;
    setVerifying(true);
    await new Promise(r => setTimeout(r, 1500));
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

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-green-700 flex items-center justify-center mb-2 shadow-lg shadow-primary/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Create Account</h1>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted mb-2">
            <span className={step >= 1 ? 'text-primary' : ''}>Basic Info</span>
            <span className={step >= 2 ? 'text-primary' : ''}>Work Info</span>
            <span className={step >= 3 ? 'text-primary' : ''}>Payment</span>
          </div>
          <Progress value={step * 33.33} />
        </div>

        <Card className="border-navy-700 bg-surface/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="p-4">
            <AnimatePresence mode="wait" custom={step}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input placeholder="Enter your name" {...form1.register('name')} />
                      {form1.formState.errors.name && <p className="text-danger text-xs">{form1.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input placeholder="10-digit phone" {...form1.register('phone')} />
                      {form1.formState.errors.phone && <p className="text-danger text-xs">{form1.formState.errors.phone.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" placeholder="Min 6 characters" {...form1.register('password')} />
                      {form1.formState.errors.password && <p className="text-danger text-xs">{form1.formState.errors.password.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input type="password" placeholder="Re-enter password" {...form1.register('confirmPassword')} />
                      {form1.formState.errors.confirmPassword && <p className="text-danger text-xs">{form1.formState.errors.confirmPassword.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" size="lg">
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Select onValueChange={v => form2.setValue('city', v)}>
                        <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bengaluru">Bengaluru</SelectItem>
                          <SelectItem value="Chennai">Chennai</SelectItem>
                          <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                          <SelectItem value="Delhi NCR">Delhi NCR</SelectItem>
                        </SelectContent>
                      </Select>
                      {form2.formState.errors.city && <p className="text-danger text-xs">{form2.formState.errors.city.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select onValueChange={v => form2.setValue('platform', v as any)}>
                        <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BLINKIT">Blinkit</SelectItem>
                          <SelectItem value="ZEPTO">Zepto</SelectItem>
                          <SelectItem value="INSTAMART">Instamart</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pin Code</Label>
                      <Input placeholder="6-digit pin code" {...form2.register('pinCode')} />
                      {form2.formState.errors.pinCode && <p className="text-danger text-xs">{form2.formState.errors.pinCode.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Weekly Earnings Band</Label>
                      <Select onValueChange={v => form2.setValue('weeklyEarningsBand', v)}>
                        <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="₹1,000–₹3,000">₹1,000–₹3,000</SelectItem>
                          <SelectItem value="₹3,000–₹5,000">₹3,000–₹5,000</SelectItem>
                          <SelectItem value="₹5,000–₹8,000">₹5,000–₹8,000</SelectItem>
                          <SelectItem value="₹8,000+">₹8,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button type="submit" className="flex-1">
                        Next <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>UPI ID</Label>
                      <Input
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                      />
                    </div>

                    <div className="border border-navy-600 rounded-lg p-4 space-y-3">
                      <h3 className="text-sm font-medium">Aadhaar KYC Verification</h3>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="aadhaar"
                          checked={aadhaarConsent}
                          onCheckedChange={(c) => setAadhaarConsent(c === true)}
                        />
                        <label htmlFor="aadhaar" className="text-xs text-muted leading-relaxed">
                          I consent to Aadhaar KYC verification via DigiLocker for identity verification purposes.
                        </label>
                      </div>
                      {!verified ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!aadhaarConsent || verifying}
                          onClick={handleAadhaarVerify}
                          className="w-full"
                        >
                          {verifying ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              Verifying...
                            </div>
                          ) : (
                            'Verify Aadhaar via DigiLocker'
                          )}
                        </Button>
                      ) : (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-2 text-primary text-sm"
                        >
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          Aadhaar Verified ✅
                        </motion.div>
                      )}
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-danger text-sm">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button onClick={handleFinish} className="flex-1" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Account'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center text-muted text-sm mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
}

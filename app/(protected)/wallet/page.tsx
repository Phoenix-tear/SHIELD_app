'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, ArrowDown, ArrowUp, CreditCard, Check } from 'lucide-react';
import type { Transaction } from '@/types';

const quickAmounts = [50, 100, 200, 500];

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successRef, setSuccessRef] = useState('');
  const [displayBalance, setDisplayBalance] = useState(0);

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    // Count-up animation
    const duration = 1000;
    const steps = 30;
    const increment = (balance - displayBalance) / steps;
    if (Math.abs(balance - displayBalance) < 1) {
      setDisplayBalance(balance);
      return;
    }
    let step = 0;
    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setDisplayBalance(balance);
        clearInterval(timer);
      } else {
        setDisplayBalance(prev => prev + increment);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [balance]);

  const fetchWallet = async () => {
    try {
      const res = await api.getWallet();
      setBalance(res.balance);
      setDisplayBalance(res.balance);
      setTransactions(res.transactions);
    } catch (err) {
      console.error('Wallet fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount < 10) return;
    setProcessing(true);
    try {
      const res = await api.topupWallet(amount);
      setBalance(res.balance);
      setSuccessRef(res.upiRef);
      setShowSuccess(true);
      setTopupAmount('');
      // Refresh transactions
      const walletRes = await api.getWallet();
      setTransactions(walletRes.transactions);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Top-up failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">Wallet</h1>

      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card border-primary/20">
          <CardContent className="p-6 text-center">
            <Wallet className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted mb-1">Available Balance</p>
            <motion.p className="text-3xl font-bold text-white">
              {formatCurrency(displayBalance)}
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>

      {/* UPI Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className="border-green-500/30 bg-green-500/10">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold text-primary">Payment Successful!</p>
                <p className="text-xs text-muted mt-1">UPI Ref: {successRef}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Up */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top Up Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map(amt => (
              <Button
                key={amt}
                variant={topupAmount === String(amt) ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setTopupAmount(String(amt))}
              >
                {formatCurrency(amt)}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Custom amount"
              type="number"
              value={topupAmount}
              onChange={e => setTopupAmount(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleTopup}
              disabled={processing || !topupAmount || parseFloat(topupAmount) < 10}
              className="gap-1"
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing
                </div>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay via UPI
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {transactions.length === 0 ? (
              <p className="text-muted text-sm text-center py-4">No transactions yet</p>
            ) : (
              transactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 py-2.5 border-b border-navy-700/50 last:border-0"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    tx.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {tx.amount > 0 ? (
                      <ArrowDown className="w-4 h-4 text-primary" />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-danger" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-[10px] text-muted">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-primary' : 'text-danger'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Phone, MapPin, CreditCard, Check, LogOut, FileText, Globe } from 'lucide-react';

const languages = [
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'hi', label: 'हिंदी' },
];

export default function ProfilePage() {
  const { rider, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [language, setLanguage] = useState('en');

  if (!rider) return null;

  const initials = rider.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const maskUpi = (upi: string) => {
    if (!upi) return '—';
    const parts = upi.split('@');
    if (parts.length < 2) return upi;
    return parts[0].slice(0, 3) + '***@' + parts[1];
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">Profile</h1>

      {/* Avatar & Name */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-green-700 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-primary/20">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-bold">{rider.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px]">{rider.platform}</Badge>
                <Badge variant="secondary" className="text-[10px]">{rider.city}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Details</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setEditing(!editing)}>
              {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-muted" />
            <div className="flex-1">
              <p className="text-xs text-muted">Phone</p>
              {editing ? (
                <Input defaultValue={rider.phone} className="mt-1 h-8 text-sm" />
              ) : (
                <p className="text-sm">{rider.phone}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-muted" />
            <div>
              <p className="text-xs text-muted">City</p>
              <p className="text-sm">{rider.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-muted" />
            <div className="flex-1">
              <p className="text-xs text-muted">UPI ID</p>
              {editing ? (
                <Input defaultValue={rider.upiId || ''} className="mt-1 h-8 text-sm" />
              ) : (
                <p className="text-sm">{maskUpi(rider.upiId || '')}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-muted" />
            <div>
              <p className="text-xs text-muted">Aadhaar</p>
              <p className="text-sm flex items-center gap-1">
                {rider.aadhaarVerified ? (
                  <><Check className="w-3 h-3 text-primary" /> Verified</>
                ) : (
                  'Not Verified'
                )}
              </p>
            </div>
          </div>

          {editing && (
            <Button size="sm" className="w-full mt-2">Save Changes</Button>
          )}
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-muted" />
            <div className="flex-1">
              <p className="text-xs text-muted mb-1">Language Preference</p>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <button className="flex items-center gap-3 w-full text-left hover:text-primary transition-colors">
            <FileText className="w-4 h-4 text-muted" />
            <span className="text-sm">Policy Document (PDF)</span>
          </button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full bg-red-500/10 text-danger border border-red-500/20 hover:bg-red-500/20"
        onClick={logout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}

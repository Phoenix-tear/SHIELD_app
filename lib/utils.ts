import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import React from 'react';
import { CloudRain, Waves, Ban, Activity, Smartphone, Store, ShieldAlert, Crosshair, FileQuestion, AlertTriangle } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)}, ${formatTime(dateStr)}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export function getTriggerIcon(triggerType: string): React.ReactNode {
  switch (triggerType) {
    case 'HEAVY_RAINFALL': return React.createElement(CloudRain, { className: 'w-6 h-6 text-blue-400' });
    case 'FLASH_FLOOD': return React.createElement(Waves, { className: 'w-6 h-6 text-blue-500' });
    case 'BANDH': return React.createElement(Ban, { className: 'w-6 h-6 text-red-500' });
    case 'AQI_SPIKE': return React.createElement(Activity, { className: 'w-6 h-6 text-yellow-500' });
    case 'PLATFORM_OUTAGE': return React.createElement(Smartphone, { className: 'w-6 h-6 text-purple-500' });
    case 'DARK_STORE_OUTAGE': return React.createElement(Store, { className: 'w-6 h-6 text-orange-500' });
    case 'VIP_CONVOY': return React.createElement(ShieldAlert, { className: 'w-6 h-6 text-red-400' });
    case 'RELIGIOUS_PROCESSION': return React.createElement(Crosshair, { className: 'w-6 h-6 text-yellow-400' });
    case 'MANUAL_OTHER': return React.createElement(FileQuestion, { className: 'w-6 h-6 text-muted' });
    default: return React.createElement(AlertTriangle, { className: 'w-6 h-6 text-warning' });
  }
}

export function getTriggerLabel(triggerType: string): string {
  const labels: Record<string, string> = {
    HEAVY_RAINFALL: 'Heavy Rainfall',
    FLASH_FLOOD: 'Flash Flood',
    BANDH: 'Bandh',
    AQI_SPIKE: 'AQI Spike',
    PLATFORM_OUTAGE: 'Platform Outage',
    DARK_STORE_OUTAGE: 'Dark Store Outage',
    VIP_CONVOY: 'VIP Convoy',
    RELIGIOUS_PROCESSION: 'Religious Procession',
    MANUAL_OTHER: 'Other',
  };
  return labels[triggerType] || triggerType;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PAID: 'bg-green-500/20 text-green-400 border-green-500/30',
    APPROVED: 'bg-green-500/20 text-green-400 border-green-500/30',
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    UNDER_REVIEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    EXPIRED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
}

export function getClaimTypeBadge(type: string): { label: string; color: string } {
  const badges: Record<string, { label: string; color: string }> = {
    AUTO: { label: 'Auto', color: 'bg-green-500/20 text-green-400' },
    SEMI_AUTO: { label: 'Semi-Auto', color: 'bg-yellow-500/20 text-yellow-400' },
    MANUAL: { label: 'Manual', color: 'bg-orange-500/20 text-orange-400' },
  };
  return badges[type] || { label: type, color: 'bg-gray-500/20 text-gray-400' };
}

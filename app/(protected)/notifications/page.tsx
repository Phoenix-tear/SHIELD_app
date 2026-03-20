'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/store/notifications';
import { formatDate, formatTime } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck } from 'lucide-react';
import type { Notification } from '@/types';

const borderColors: Record<string, string> = {
  DISRUPTION_ALERT: 'border-l-red-500',
  CLAIM_UPDATE: 'border-l-blue-500',
  PAYOUT: 'border-l-green-500',
  PREMIUM: 'border-l-yellow-500',
};

export default function NotificationsPage() {
  const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" /> Notifications
        </h1>
        {notifications.some(n => !n.read) && (
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={markAllAsRead}>
            <CheckCheck className="w-3 h-3" /> Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-muted mx-auto mb-3 opacity-30" />
          <p className="text-muted text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className={`border-l-4 ${borderColors[notif.type] || 'border-l-navy-500'} ${
                  !notif.read ? 'bg-navy-800/50' : ''
                } cursor-pointer transition-colors hover:bg-navy-800/30`}
                onClick={() => !notif.read && markAsRead(notif.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!notif.read ? 'text-white' : 'text-muted'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{notif.body}</p>
                      <p className="text-[10px] text-navy-500 mt-1">
                        {formatDate(notif.createdAt)} · {formatTime(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

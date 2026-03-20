'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, FileText, Wallet, BarChart3, User } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/claims', icon: FileText, label: 'Claims' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/earnings', icon: BarChart3, label: 'Earnings' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-navy-900/95 backdrop-blur-lg border-t border-navy-700">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

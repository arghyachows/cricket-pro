'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Users,
  Trophy,
  TrendingUp,
  Play,
  Calendar,
  ShoppingCart
} from 'lucide-react';

export default function Navigation({ currentPage }) {
  const router = useRouter();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, path: '/dashboard' },
    { id: 'squad', label: 'Squad', icon: Users, path: '/squad' },
    { id: 'lineups', label: 'Lineups', icon: Play, path: '/lineups' },
    { id: 'matches', label: 'Matches', icon: Calendar, path: '/matches' },
    { id: 'league', label: 'League', icon: Trophy, path: '/league' },
    { id: 'marketplace', label: 'Market', icon: ShoppingCart, path: '/marketplace' },
  ];

  return (
    <nav className="border-b bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`flex-shrink-0 ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={() => router.push(item.path)}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

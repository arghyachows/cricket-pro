'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Globe, Trophy } from 'lucide-react';

export default function Header({ user, onLogout }) {
  const router = useRouter();

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <Trophy className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">Cricket Manager Pro</h1>
              <p className="text-sm text-muted-foreground truncate">{user?.team_name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge variant="outline" className="hidden sm:flex items-center space-x-1">
              <Coins className="w-4 h-4" />
              <span>{user?.coins?.toLocaleString() || '0'}</span>
            </Badge>
            <Badge variant="outline" className="hidden md:flex items-center space-x-1">
              <Globe className="w-4 h-4" />
              <span>{user?.country}</span>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">×</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

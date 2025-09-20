'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import ThemeToggler from './ThemeToggler';
import {
  Trophy,
  Users,
  Edit,
  Play,
  Medal,
  ShoppingCart,
  Menu,
  Coins,
  Globe,
  LogOut
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Trophy,
    description: 'Overview and stats'
  },
  {
    name: 'Squad',
    href: '/players',
    icon: Users,
    description: 'Manage your players'
  },
  {
    name: 'Lineups',
    href: '/lineups',
    icon: Edit,
    description: 'Create team lineups'
  },
  {
    name: 'Matches',
    href: '/matches',
    icon: Play,
    description: 'View and play matches'
  },
  {
    name: 'League',
    href: '/league',
    icon: Medal,
    description: 'League standings'
  },
  {
    name: 'Market',
    href: '/marketplace',
    icon: ShoppingCart,
    description: 'Player marketplace'
  }
];

export default function Navigation({ user, onLogout }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const NavItems = ({ mobile = false }) => (
    <>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={`${
                mobile
                  ? "w-full justify-start h-12 px-4"
                  : "flex-col h-auto p-3 gap-1"
              } ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-accent hover:text-accent-foreground"
              } transition-all duration-200 ease-in-out transform hover:scale-105 ${
                isActive ? "scale-105" : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Icon className={`${mobile ? "w-5 h-5 mr-3" : "w-6 h-6"}`} />
              <span className={`${mobile ? "text-base" : "text-xs font-medium"}`}>
                {item.name}
              </span>
              {mobile && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {item.description}
                </span>
              )}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-2">
        {/* Theme Toggler and Logout at the top */}
        <div className="flex items-center space-x-2 mr-4">
          <ThemeToggler />
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="flex items-center space-x-2 transition-all duration-200 ease-in-out transform hover:scale-105 hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
            <span>Logout</span>
          </Button>
        </div>
        <NavItems />
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col w-80">
            <div className="flex flex-col space-y-4 mt-4">
              {/* Theme Toggler and Logout at the top */}
              <div className="flex items-center justify-center space-x-2 py-2 border-b">
                <ThemeToggler />
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 transition-all duration-200 ease-in-out transform hover:scale-105 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
                  <span>Logout</span>
                </Button>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.team_name || 'Team'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="flex items-center space-x-1 text-xs">
                      <Coins className="w-3 h-3" />
                      <span>{user?.coins?.toLocaleString() || '0'}</span>
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {user?.country || 'Country'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="flex flex-col space-y-2">
                <NavItems mobile />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

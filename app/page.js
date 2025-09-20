'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import AuthForm from '@/components/AuthForm';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          // User is logged in, redirect to dashboard
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();
  }, [router]);

  // Show auth form if not logged in
  return <AuthForm onLogin={() => router.push('/dashboard')} />;
}

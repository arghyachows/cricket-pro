import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'supabase',
      connection: 'connected'
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'supabase',
        error: error.message
      },
      { status: 503 }
    );
  }
}

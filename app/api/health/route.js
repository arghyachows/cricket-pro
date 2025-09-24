import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/mongodb/index';

export async function GET() {
  try {
    const healthData = await healthCheck();

    // Return appropriate HTTP status based on health
    const statusCode = healthData.status === 'healthy' ? 200 : 503;

    return NextResponse.json(healthData, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      { status: 500 }
    );
  }
}

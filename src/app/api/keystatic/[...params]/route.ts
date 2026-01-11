import { NextResponse } from 'next/server';

// Cloudflare Pages requires edge runtime for dynamic routes
export const runtime = 'edge';

// Keystatic requires Node.js fs APIs which don't work in edge runtime
// In production (Cloudflare), return an error message
// In development, this route should not be used (Keystatic needs Node.js runtime)
export async function GET() {
  return NextResponse.json(
    { 
      error: 'Keystatic admin is not available in production',
      message: 'Please use Keystatic admin locally in development mode (npm run dev)'
    },
    { status: 503 }
  );
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Keystatic admin is not available in production',
      message: 'Please use Keystatic admin locally in development mode (npm run dev)'
    },
    { status: 503 }
  );
}

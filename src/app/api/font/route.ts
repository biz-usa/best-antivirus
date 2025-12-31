
import { getSiteConfig } from '@/lib/data';
import { NextResponse } from 'next/server';

// This API route is no longer used for font loading as it's handled by next/font in the layout.
// It can be kept for other purposes or removed. For now, it returns an empty response.
export async function GET() {
    return new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
}

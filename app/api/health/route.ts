// app/api/health/route.ts

import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'

export async function GET() {
  try {
    // Test database connection and count properties
    const result = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN location IS NOT NULL THEN 1 END) as with_location
      FROM properties
    `;
    
    return NextResponse.json({
      status: 'ok',
      dbConnected: true,
      properties: {
        total: result[0].total,
        withLocation: result[0].with_location
      }
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        dbConnected: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
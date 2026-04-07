import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'babylapse API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
}

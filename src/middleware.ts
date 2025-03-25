import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting map
const ipRequestMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 30 // 30 requests per minute

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Basic rate limiting
  const ip = request.ip ?? 'anonymous'
  const now = Date.now()
  const requestData = ipRequestMap.get(ip)

  if (requestData) {
    if (now - requestData.timestamp < RATE_LIMIT_WINDOW) {
      if (requestData.count >= MAX_REQUESTS) {
        return new NextResponse('Too Many Requests', { status: 429 })
      }
      requestData.count++
    } else {
      requestData.count = 1
      requestData.timestamp = now
    }
  } else {
    ipRequestMap.set(ip, { count: 1, timestamp: now })
  }

  // CORS headers
  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return response
}

export const config = {
  matcher: '/api/:path*',
}

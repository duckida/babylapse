import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth2 callback handler for Hackatime integration
 * This route handles the OAuth2 callback from Hackatime
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/?error=missing_code', request.url)
    )
  }

  // In a full implementation, you would:
  // 1. Validate the state parameter to prevent CSRF
  // 2. Exchange the code for access/refresh tokens with Hackatime
  // 3. Store the tokens securely
  // 4. Redirect the user to their dashboard

  return NextResponse.redirect(new URL('/', request.url))
}

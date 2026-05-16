import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  try {
    // Dynamically import so missing env vars don't crash at module load time
    const { updateSession } = await import('@/utils/supabase/middleware')
    return await updateSession(request)
  } catch (error) {
    console.error('[Proxy] Error during session update:', error)
    return NextResponse.next({
      request: { headers: request.headers },
    })
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

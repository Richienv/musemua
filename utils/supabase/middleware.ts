import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set(name, value, options);
          },
          remove(name: string, options: any) {
            response.cookies.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    // Refresh session if expired
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
    }

    // Protected routes handling
    const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/protected') || 
                            request.nextUrl.pathname.startsWith('/booking-detail');

    if (isProtectedRoute && !session) {
      const redirectUrl = new URL('/sign-in', request.url);
      redirectUrl.searchParams.set('redirect_to', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect from auth pages if already authenticated
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL('/protected', request.url));
    }

    return response;
  } catch (e) {
    console.error('Middleware error:', e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};

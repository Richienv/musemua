import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const headersList = headers();
    const host = headersList.get('host') || '';
    const protocol = process?.env?.NODE_ENV === 'production' ? 'https' : 'http';
    
    const requestUrl = new URL(`${protocol}://${host}${request.url.split(host)[1]}`);
    const code = requestUrl.searchParams.get("code");
    const origin = `${protocol}://${host}`;
    const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

    if (!code) {
      console.error("No code provided in auth callback");
      return NextResponse.redirect(`${origin}/auth/error`);
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth exchange error:", error);
      return NextResponse.redirect(`${origin}/auth/error`);
    }

    // Successful authentication
    const finalRedirect = redirectTo 
      ? `${origin}${redirectTo}`
      : `${origin}/protected`;

    return NextResponse.redirect(finalRedirect);
  } catch (error) {
    console.error("Auth callback error:", error);
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${origin}/auth/error`);
  }
}

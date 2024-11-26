import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const origin = requestUrl.origin;
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
    return NextResponse.redirect(`${origin}/auth/error`);
  }
}

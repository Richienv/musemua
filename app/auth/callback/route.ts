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

    // Check if user is verified and create profile if needed
    if (data.user && data.user.email_confirmed_at) {
      try {
        // Check if user profile already exists
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        // If no profile exists, create one from the user metadata
        if (!existingProfile) {
          const userMetadata = data.user.user_metadata;
          const userType = userMetadata.user_type || 'client';
          
          const profileData = {
            id: data.user.id,
            auth_user_id: data.user.id,
            email: data.user.email,
            first_name: userMetadata.first_name || '',
            last_name: userMetadata.last_name || '',
            display_name: `${userMetadata.first_name || ''} ${userMetadata.last_name || ''}`.trim(),
            user_type: userType,
            status: 'offline',
            location: userMetadata.location || null,
            clients_reached: 0,
            projects_completed: 0,
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Add type-specific fields
          if (userType === 'muse') {
            profileData.expertise = 'Professional Model';
          }

          const { error: profileError } = await supabase
            .from('users')
            .insert(profileData);

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            // Don't redirect to error, just log and continue
          }
        }
      } catch (profileCreationError) {
        console.error('Error in profile creation process:', profileCreationError);
        // Don't redirect to error, just log and continue
      }
    }

    // Determine final redirect
    let finalRedirect;
    if (redirectTo) {
      finalRedirect = `${origin}${redirectTo}`;
    } else if (data.user?.email_confirmed_at) {
      // If email is confirmed, redirect to verification success page
      finalRedirect = `${origin}/verification-success`;
    } else {
      // If email is not confirmed, redirect to verification page
      finalRedirect = `${origin}/email-verification`;
    }

    return NextResponse.redirect(finalRedirect);
  } catch (error) {
    console.error("Auth callback error:", error);
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${origin}/auth/error`);
  }
}

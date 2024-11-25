'use server';

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// ... existing code ...

export async function signUpAction(formData: FormData) {
  const supabase = createServerActionClient({ cookies });
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const userType = formData.get("user_type") as "client" | "streamer";

  // Step 1: Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        user_type: userType,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    // Step 2: Insert user data into public.users table
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        user_type: userType,
        profile_picture_url: null,
        bio: null,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Attempt to delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { error: "Failed to create user profile: " + profileError.message };
    }
  }

  revalidatePath("/");
  return { success: "Check your email to confirm your account" };
}

// ... other actions ...
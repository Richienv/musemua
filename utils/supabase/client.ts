import { createBrowserClient } from "@supabase/ssr";

// Add a singleton implementation to reuse the Supabase client
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

// Function to create or get the existing Supabase client
export const createClient = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  
  return supabaseInstance;
};

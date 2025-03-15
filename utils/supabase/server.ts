import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// We can't use a true singleton for server components since cookies are request-specific
// Instead, we'll use a cache map keyed by request timestamp to reuse connections in the same request
const clientCache = new Map();

export const createClient = () => {
  const cookieStore = cookies();
  
  // Generate a unique key for this request context
  // In server components, this ensures we reuse the same client for multiple 
  // database operations within the same request
  const requestId = Date.now().toString();
  
  // Check if we have a client for this request
  if (clientCache.has(requestId)) {
    return clientCache.get(requestId);
  }
  
  // Create a new client for this request
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
  
  // Store in cache
  clientCache.set(requestId, client);
  
  // Clean up old entries (keep only the 10 most recent)
  if (clientCache.size > 10) {
    const oldestKey = clientCache.keys().next().value;
    clientCache.delete(oldestKey);
  }
  
  return client;
};

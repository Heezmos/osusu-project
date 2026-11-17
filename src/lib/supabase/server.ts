import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "./env";

/**
 * Creates a request-scoped Supabase client for Server Components,
 * Server Actions and Route Handlers.
 *
 * Do not share this client across requests. Authorization must still be
 * checked in each protected server action or route handler.
 */
export async function createClient() {
  const config = getSupabasePublicEnv();

  if (!config) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The middleware refresh
          // handler is responsible for persisting refreshed auth cookies.
        }
      },
    },
  });
}

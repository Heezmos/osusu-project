export type SupabasePublicEnv = {
  url: string;
  publishableKey: string;
};

/**
 * Returns the public Supabase configuration when both required values exist.
 * The publishable key is safe for browser use; never place a service-role key here.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return null;

  return { url, publishableKey };
}

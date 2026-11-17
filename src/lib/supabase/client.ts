import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  const config = getSupabasePublicEnv();

  if (!config) {
    throw new Error(
      "Supabase is not configured. Add the project URL and publishable key to the deployment environment."
    );
  }

  if (!client) {
    client = createBrowserClient(config.url, config.publishableKey);
  }

  return client;
}

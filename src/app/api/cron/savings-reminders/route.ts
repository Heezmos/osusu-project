import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!cronSecret || !serviceRoleKey || !supabaseUrl) {
    return Response.json(
      { success: false, error: "Reminder worker is not configured." },
      { status: 503 },
    );
  }

  const supplied = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${cronSecret}`;
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);

  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return Response.json({ success: false }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.rpc(
    "osusu_enqueue_due_savings_reminders",
  );

  if (error) {
    console.error("Osusu savings reminder worker failed:", error.message);
    return Response.json(
      { success: false, error: "Unable to queue savings reminders." },
      { status: 500 },
    );
  }

  return Response.json({ success: true, result: data });
}

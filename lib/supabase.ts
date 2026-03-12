import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role for storage operations
export function createServerSupabaseClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Rewrite Supabase storage URLs to Cloudflare CDN
// e.g. https://xxx.supabase.co/storage/... → https://cdn.groar.app/storage/...
const CDN_HOST = process.env.NEXT_PUBLIC_CDN_HOST; // "cdn.groar.app"

export function toCdnUrl(url: string | null | undefined): string {
  if (!url || !CDN_HOST) return url ?? "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith(".supabase.co")) {
      parsed.hostname = CDN_HOST;
      parsed.protocol = "https:";
      return parsed.toString();
    }
  } catch {}
  return url;
}

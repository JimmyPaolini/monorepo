import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import {
  getRequestHeader,
  setResponseHeader,
} from "@tanstack/react-start/server";

import type { Database } from "./database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for server-side operations with cookie handling.
 * This client automatically handles auth session cookies via HTTP headers.
 *
 * Usage in server functions:
 * ```ts
 * const supabase = getSupabaseServerClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 */
export function getSupabaseServerClient(): SupabaseClient<Database> {
  const cookieHeader = getRequestHeader("cookie") ?? "";

  const supabaseUrl = process.env["SUPABASE_URL"];
  const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"];

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables",
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const parsed = parseCookieHeader(cookieHeader);
        // Ensure value is always a string (required by Supabase SSR types)
        return parsed.map(({ name, value }) => ({ name, value: value ?? "" }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const serialized = serializeCookieHeader(name, value, options);
          setResponseHeader("Set-Cookie", serialized);
        });
      },
    },
  });
}

/**
 * User type returned from auth operations
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string | undefined;
  avatarUrl?: string | undefined;
}

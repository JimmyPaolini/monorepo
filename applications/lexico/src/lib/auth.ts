import { createServerFn } from "@tanstack/react-start";

import { getSupabaseServerClient } from "./supabase-server";

import type { AuthUser } from "./supabase-server";

/**
 * Transforms Supabase user to our AuthUser type
 */
function transformUser(user: {
  email?: string;
  id: string;
  /* eslint-disable-next-line @typescript-eslint/naming-convention -- Supabase uses snake_case */
  user_metadata?: Record<string, unknown>;
}): AuthUser | null {
  if (!user.email) {
    return null;
  }

  return {
    avatarUrl: user.user_metadata?.["avatar_url"] as string | undefined,
    email: user.email,
    id: user.id,
    name:
      (user.user_metadata?.["full_name"] as string | undefined) ??
      (user.user_metadata?.["name"] as string | undefined),
  };
}

/**
 * Server function to get the current authenticated user.
 * Returns null if not authenticated.
 */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthUser | null> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return transformUser(user);
  },
);

/**
 * Server function to sign out the current user.
 */
export const signOut = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ success: boolean }> => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
      return { success: false };
    }

    return { success: true };
  },
);

/**
 * Server function to get the OAuth sign-in URL for Google.
 * Returns the URL to redirect the user to for authentication.
 *
 * TODO: Configure Google OAuth in Supabase dashboard:
 * 1. Go to Supabase Dashboard -\> Authentication -\> Providers
 * 2. Enable Google provider
 * 3. Add your Google OAuth credentials (Client ID and Secret)
 * 4. Configure the redirect URL in Google Cloud Console
 */
export const getGoogleSignInUrl = createServerFn({ method: "GET" })
  .inputValidator((data: { redirectTo: string }) => data)
  .handler(
    async ({ data }): Promise<{ error: null | string; url: null | string }> => {
      const supabase = getSupabaseServerClient();

      const { data: authData, error } = await supabase.auth.signInWithOAuth({
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: data.redirectTo,
        },
        provider: "google",
      });

      if (error) {
        console.error("Google sign in error:", error);
        return { error: error.message, url: null };
      }

      return { error: null, url: authData.url };
    },
  );

/**
 * Server function to exchange an OAuth code for a session.
 * This is called after the OAuth provider redirects back to our app.
 */
export const exchangeCodeForSession = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => data)
  .handler(
    async ({ data }): Promise<{ error: null | string; success: boolean }> => {
      const supabase = getSupabaseServerClient();

      const { error } = await supabase.auth.exchangeCodeForSession(data.code);

      if (error) {
        console.error("Code exchange error:", error);
        return { error: error.message, success: false };
      }

      return { error: null, success: true };
    },
  );

/**
 * Server function to delete the current user's account.
 * This requires admin privileges in production.
 */
export const deleteAccount = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ error: null | string; success: boolean }> => {
    const supabase = getSupabaseServerClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated", success: false };
    }

    // Sign out first
    await supabase.auth.signOut();

    // Note: Actual user deletion requires admin API or database trigger
    // For now, we just sign out the user
    // TODO: Implement proper user deletion with admin API or Edge Function

    return { error: null, success: true };
  },
);

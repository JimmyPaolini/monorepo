import { createServerFn } from "@tanstack/react-start";

import { getSupabaseServerClient } from "./supabase-server";

/**
 * Represents a user's saved text in the library.
 */
/* eslint-disable @typescript-eslint/naming-convention */
/**
 *
 */
export interface UserText {
  /** Text UUID */
  id: string;
  /** Content of the text */
  text: string;
  /** Title of the text */
  title: string;
  /** ID of the user who owns the text */
  user_id: string;
}
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Get all texts for the current user
 */
export const getUserTexts = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserText[]> => {
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("user_texts")
      .select("id, title, text, user_id")
      .eq("user_id", user.id)
      .order("title");

    if (error) {
      console.error("Error fetching user texts:", error);
      return [];
    }

    return data as UserText[];
  },
);

/**
 * Create a new text for the current user
 */
export const createUserText = createServerFn({ method: "POST" })
  .inputValidator((data: { text: string; title: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<{
      error: null | string;
      success: boolean;
      text: null | UserText;
    }> => {
      const supabase = getSupabaseServerClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Not authenticated", success: false, text: null };
      }

      const { data: newText, error } = await supabase
        .from("user_texts")
        .insert({
          id: crypto.randomUUID(),
          text: data.text,
          title: data.title,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating text:", error);
        return { error: error.message, success: false, text: null };
      }

      return { error: null, success: true, text: newText as UserText };
    },
  );

/**
 * Update an existing text
 */
export const updateUserText = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; text: string; title: string }) => data)
  .handler(
    async ({ data }): Promise<{ error: null | string; success: boolean }> => {
      const supabase = getSupabaseServerClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Not authenticated", success: false };
      }

      const { error } = await supabase
        .from("user_texts")
        .update({
          text: data.text,
          title: data.title,
        })
        .eq("id", data.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating text:", error);
        return { error: error.message, success: false };
      }

      return { error: null, success: true };
    },
  );

/**
 * Delete a text
 */
export const deleteUserText = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(
    async ({ data }): Promise<{ error: null | string; success: boolean }> => {
      const supabase = getSupabaseServerClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Not authenticated", success: false };
      }

      const { error } = await supabase
        .from("user_texts")
        .delete()
        .eq("id", data.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting text:", error);
        return { error: error.message, success: false };
      }

      return { error: null, success: true };
    },
  );

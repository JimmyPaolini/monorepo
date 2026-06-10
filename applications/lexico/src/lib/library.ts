import { createServerFn } from "@tanstack/react-start";

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
  // eslint-disable-next-line @typescript-eslint/require-await
  async (): Promise<UserText[]> => {
    return [];
  },
);

/**
 * Create a new text for the current user
 */
export const createUserText = createServerFn({ method: "POST" })
  .inputValidator((data: { text: string; title: string }) => data)
  .handler(
    async (): Promise<{
      error: null | string;
      success: boolean;
      text: null | UserText;
    }> => {
      await Promise.resolve();
      return { error: null, success: true, text: null };
    },
  );

/**
 * Update an existing text
 */
export const updateUserText = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; text: string; title: string }) => data)
  .handler(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (): Promise<{ error: null | string; success: boolean }> => {
      return { error: null, success: true };
    },
  );

/**
 * Delete a text
 */
export const deleteUserText = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (): Promise<{ error: null | string; success: boolean }> => {
      return { error: null, success: true };
    },
  );

import _ from "lodash";
import { useCallback, useEffect, useState } from "react";

import {
  createUserText,
  deleteUserText,
  getUserTexts,
  updateUserText,
} from "../../lib/library";

import type { UserText } from "../../lib/library";
import type React from "react";

/**
 * State object returned by the useLibraryPage hook.
 */
export interface LibraryPageState {
  closeEdit: () => void;
  editingText: null | UserText;
  error: null | string;
  formText: string;
  formTitle: string;
  handleCreate: () => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handleUpdate: () => Promise<void>;
  isCreateOpen: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  openEdit: (text: UserText) => void;
  selectedText: null | UserText;
  setFormText: (value: string) => void;
  setFormTitle: (value: string) => void;
  setIsCreateOpen: (open: boolean) => void;
  setSelectedText: (text: null | UserText) => void;
  texts: UserText[];
}

// 🔧 State Initialization
interface LibraryPageHookState {
  editingText: null | UserText;
  error: null | string;
  formText: string;
  formTitle: string;
  isCreateOpen: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  selectedText: null | UserText;
  setEditingText: (text: null | UserText) => void;
  setError: (error: null | string) => void;
  setFormText: (text: string) => void;
  setFormTitle: (title: string) => void;
  setIsCreateOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setSelectedText: (text: null | UserText) => void;
  setTexts: React.Dispatch<React.SetStateAction<UserText[]>>;
  texts: UserText[];
}

/**
 * Hook managing the library page state and operations.
 * Handles text CRUD operations, form state, and UI dialogs.
 */
export function useLibraryPage(): LibraryPageState {
  const state = useLibraryPageStateInitialization();

  const fetchTexts = useCallback(
    async () =>
      fetchTextsAsync(state.setTexts, state.setIsLoading, state.setError),
    [],
  );

  useEffect(() => {
    void fetchTexts();
  }, [fetchTexts]);

  const handleCreate = useCallback(
    async () =>
      createTextAsync(
        state.formTitle,
        state.formText,
        state.setTexts,
        state.setFormTitle,
        state.setFormText,
        state.setIsCreateOpen,
        state.setIsSubmitting,
      ),
    [state.formTitle, state.formText],
  );

  const handleUpdate = useCallback(
    async () =>
      updateTextAsync(
        state.editingText,
        state.formTitle,
        state.formText,
        state.setTexts,
        state.setFormTitle,
        state.setFormText,
        state.setEditingText,
        state.setIsSubmitting,
      ),
    [state.editingText, state.formTitle, state.formText],
  );

  const handleDelete = useCallback(
    async (id: string) =>
      deleteTextAsync(
        id,
        state.selectedText,
        state.setTexts,
        state.setSelectedText,
      ),
    [state.selectedText],
  );

  return buildLibraryPageState(state, handleCreate, handleUpdate, handleDelete);
}

// 🔧 State Builder
function buildLibraryPageState(
  state: LibraryPageHookState,
  handleCreate: () => Promise<void>,
  handleUpdate: () => Promise<void>,
  handleDelete: (id: string) => Promise<void>,
): LibraryPageState {
  return {
    closeEdit: () => {
      state.setFormTitle("");
      state.setFormText("");
      state.setEditingText(null);
    },
    editingText: state.editingText,
    error: state.error,
    formText: state.formText,
    formTitle: state.formTitle,
    handleCreate,
    handleDelete,
    handleUpdate,
    isCreateOpen: state.isCreateOpen,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    openEdit: (text: UserText) => {
      state.setFormTitle(text.title);
      state.setFormText(text.text);
      state.setEditingText(text);
    },
    selectedText: state.selectedText,
    setFormText: state.setFormText,
    setFormTitle: state.setFormTitle,
    setIsCreateOpen: state.setIsCreateOpen,
    setSelectedText: state.setSelectedText,
    texts: state.texts,
  };
}

// 🔧 Create Handler
async function createTextAsync(
  formTitle: string,
  formText: string,
  setTexts: (function_: (previous: UserText[]) => UserText[]) => void,
  setFormTitle: (title: string) => void,
  setFormText: (text: string) => void,
  setIsCreateOpen: (open: boolean) => void,
  setIsSubmitting: (submitting: boolean) => void,
): Promise<void> {
  if (!formTitle.trim() || !formText.trim()) return;
  setIsSubmitting(true);
  try {
    const result = await createUserText({
      data: { text: formText, title: formTitle },
    });
    if (result.success && result.text) {
      setTexts((previous) => {
        const toSort = [...previous, result.text] as UserText[];
        const sorted = _.orderBy(toSort, [(t: UserText) => t.title]);
        return sorted;
      });
      setFormTitle("");
      setFormText("");
      setIsCreateOpen(false);
    }
  } catch (error_) {
    console.error("Failed to create text:", error_);
  } finally {
    setIsSubmitting(false);
  }
}

// 🔧 Delete Handler
async function deleteTextAsync(
  id: string,
  selectedText: null | UserText,
  setTexts: (function_: (previous: UserText[]) => UserText[]) => void,
  setSelectedText: (text: null | UserText) => void,
): Promise<void> {
  try {
    const result = await deleteUserText({ data: { id } });
    if (result.success) {
      setTexts((previous) => previous.filter((t) => t.id !== id));
      if (selectedText?.id === id) {
        setSelectedText(null);
      }
    }
  } catch (error_) {
    console.error("Failed to delete text:", error_);
  }
}

// 🔧 Fetch Handler
async function fetchTextsAsync(
  setTexts: (texts: UserText[]) => void,
  setIsLoading: (loading: boolean) => void,
  setError: (error: null | string) => void,
): Promise<void> {
  setIsLoading(true);
  setError(null);
  try {
    const data = await getUserTexts();
    setTexts(data);
  } catch (error_: unknown) {
    const message =
      error_ instanceof Error ? error_.message : "Failed to load texts";
    setError(message);
  } finally {
    setIsLoading(false);
  }
}

// 🔧 Update Handler
async function updateTextAsync(
  editingText: null | UserText,
  formTitle: string,
  formText: string,
  setTexts: (function_: (previous: UserText[]) => UserText[]) => void,
  setFormTitle: (title: string) => void,
  setFormText: (text: string) => void,
  setEditingText: (text: null | UserText) => void,
  setIsSubmitting: (submitting: boolean) => void,
): Promise<void> {
  if (!editingText || !formTitle.trim() || !formText.trim()) return;
  setIsSubmitting(true);
  try {
    const result = await updateUserText({
      data: { id: editingText.id, text: formText, title: formTitle },
    });
    if (result.success) {
      setTexts((previous) => {
        const mapped = previous.map((t) =>
          t.id === editingText.id
            ? { ...t, text: formText, title: formTitle }
            : t,
        );
        const sorted = _.orderBy(mapped, [(t: UserText) => t.title]);
        return sorted;
      });
      setFormTitle("");
      setFormText("");
      setEditingText(null);
    }
  } catch (error_) {
    console.error("Failed to update text:", error_);
  } finally {
    setIsSubmitting(false);
  }
}

function useLibraryPageStateInitialization(): LibraryPageHookState {
  const [texts, setTexts] = useState<UserText[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingText, setEditingText] = useState<null | UserText>(null);
  const [selectedText, setSelectedText] = useState<null | UserText>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formText, setFormText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return {
    editingText,
    error,
    formText,
    formTitle,
    isCreateOpen,
    isLoading,
    isSubmitting,
    selectedText,
    setEditingText,
    setError,
    setFormText,
    setFormTitle,
    setIsCreateOpen,
    setIsLoading,
    setIsSubmitting,
    setSelectedText,
    setTexts,
    texts,
  };
}

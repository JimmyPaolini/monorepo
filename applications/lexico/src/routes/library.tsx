import { createFileRoute } from "@tanstack/react-router";
import _ from "lodash";
import { BookOpen, Edit, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
} from "@monorepo/lexico-components";

import {
  createUserText,
  deleteUserText,
  getUserTexts,
  updateUserText,
} from "../lib/library";

import type { UserText } from "../lib/library";
import type { ReactNode } from "react";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
});

// 📐 Component interfaces

interface LibraryCreateDialogProps {
  formText: string;
  formTitle: string;
  isCreateOpen: boolean;
  isSubmitting: boolean;
  onCreateConfirm: () => Promise<void>;
  onFormTextChange: (value: string) => void;
  onFormTitleChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
}

interface LibraryEditDialogProps {
  editingText: null | UserText;
  formText: string;
  formTitle: string;
  isSubmitting: boolean;
  onClose: () => void;
  onFormTextChange: (value: string) => void;
  onFormTitleChange: (value: string) => void;
  onUpdateConfirm: () => Promise<void>;
}

interface LibraryEmptyStateProps {
  error: null | string;
  isLoading: boolean;
  texts: UserText[];
}

interface LibraryPageState {
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

interface LibrarySelectedViewProps {
  onBack: () => void;
  selectedText: null | UserText;
}

interface LibraryTextCardProps {
  onDelete: (id: string) => Promise<void>;
  onEdit: (text: UserText) => void;
  onSelect: (text: UserText) => void;
  text: UserText;
}

interface LibraryTextGridProps {
  error: null | string;
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  onEdit: (text: UserText) => void;
  onSelect: (text: UserText) => void;
  selectedText: null | UserText;
  texts: UserText[];
}

// 🧩 Components

function LibraryCreateDialog({
  formText,
  formTitle,
  isCreateOpen,
  isSubmitting,
  onCreateConfirm,
  onFormTextChange,
  onFormTitleChange,
  onOpenChange,
}: LibraryCreateDialogProps): ReactNode {
  return (
    <Dialog
      onOpenChange={onOpenChange}
      open={isCreateOpen}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Text
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Text</DialogTitle>
          <DialogDescription>
            Add a Latin text to your library for reading practice.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              onChange={(event) => onFormTitleChange(event.currentTarget.value)}
              placeholder="e.g., Cicero's First Catilinarian"
              value={formTitle}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="text">Text</Label>
            <Textarea
              className="min-h-50"
              id="text"
              onChange={(event) => onFormTextChange(event.currentTarget.value)}
              placeholder="Paste your Latin text here..."
              value={formText}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || !formTitle.trim() || !formText.trim()}
            onClick={() => void onCreateConfirm()}
          >
            {isSubmitting ? "Adding..." : "Add Text"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LibraryEditDialog({
  editingText,
  formText,
  formTitle,
  isSubmitting,
  onClose,
  onFormTextChange,
  onFormTitleChange,
  onUpdateConfirm,
}: LibraryEditDialogProps): ReactNode {
  return (
    <Dialog
      onOpenChange={(open) => !open && onClose()}
      open={Boolean(editingText)}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Text</DialogTitle>
          <DialogDescription>
            Update the title or content of your text.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              onChange={(event) => onFormTitleChange(event.currentTarget.value)}
              value={formTitle}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-text">Text</Label>
            <Textarea
              className="min-h-50"
              id="edit-text"
              onChange={(event) => onFormTextChange(event.currentTarget.value)}
              value={formText}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || !formTitle.trim() || !formText.trim()}
            onClick={() => void onUpdateConfirm()}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LibraryEmptyState({
  error,
  isLoading,
  texts,
}: LibraryEmptyStateProps): ReactNode {
  if (isLoading || error || texts.length > 0) {
    return null;
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Your Library is Empty</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        <p>
          Add Latin texts to your library for reading practice. Click the
          &quot;Add Text&quot; button above to get started.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Library page component that displays and manages user's saved texts.
 *
 * @returns React node
 */
function LibraryPage(): ReactNode {
  const {
    closeEdit,
    editingText,
    error,
    formText,
    formTitle,
    handleCreate,
    handleDelete,
    handleUpdate,
    isCreateOpen,
    isLoading,
    isSubmitting,
    openEdit,
    selectedText,
    setFormText,
    setFormTitle,
    setIsCreateOpen,
    setSelectedText,
    texts,
  } = useLibraryPage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Library</h1>
        </div>
        <LibraryCreateDialog
          formText={formText}
          formTitle={formTitle}
          isCreateOpen={isCreateOpen}
          isSubmitting={isSubmitting}
          onCreateConfirm={handleCreate}
          onFormTextChange={setFormText}
          onFormTitleChange={setFormTitle}
          onOpenChange={setIsCreateOpen}
        />
      </div>
      <LibraryEditDialog
        editingText={editingText}
        formText={formText}
        formTitle={formTitle}
        isSubmitting={isSubmitting}
        onClose={closeEdit}
        onFormTextChange={setFormText}
        onFormTitleChange={setFormTitle}
        onUpdateConfirm={handleUpdate}
      />
      {isLoading && (
        <div className="text-center text-muted-foreground">
          <p>Loading library...</p>
        </div>
      )}
      {error && (
        <div className="text-center text-destructive">
          <p>Error: {error}</p>
        </div>
      )}
      <LibraryTextGrid
        error={error}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={openEdit}
        onSelect={setSelectedText}
        selectedText={selectedText}
        texts={texts}
      />
      <LibrarySelectedView
        onBack={() => setSelectedText(null)}
        selectedText={selectedText}
      />
      <LibraryEmptyState
        error={error}
        isLoading={isLoading}
        texts={texts}
      />
    </div>
  );
}

function LibrarySelectedView({
  onBack,
  selectedText,
}: LibrarySelectedViewProps): ReactNode {
  if (!selectedText) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={onBack}
        variant="outline"
      >
        ← Back to Library
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{selectedText.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-relaxed">
            {selectedText.text}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LibraryTextCard({
  onDelete,
  onEdit,
  onSelect,
  text,
}: LibraryTextCardProps): ReactNode {
  return (
    <Card
      className="cursor-pointer transition-transform hover:scale-[1.02]"
      onClick={() => onSelect(text)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-1 text-lg">{text.title}</CardTitle>
          <div className="flex gap-1">
            <Button
              className="h-8 w-8"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(text);
              }}
              size="icon"
              variant="ghost"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation();
                void onDelete(text.id);
              }}
              size="icon"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {text.text.slice(0, 150)}...
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function LibraryTextGrid({
  error,
  isLoading,
  onDelete,
  onEdit,
  onSelect,
  selectedText,
  texts,
}: LibraryTextGridProps): ReactNode {
  if (isLoading || error || texts.length === 0 || selectedText) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {texts.map((text) => (
        <LibraryTextCard
          key={text.id}
          onDelete={onDelete}
          onEdit={onEdit}
          onSelect={onSelect}
          text={text}
        />
      ))}
    </div>
  );
}

function useLibraryPage(): LibraryPageState {
  const [texts, setTexts] = useState<UserText[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingText, setEditingText] = useState<null | UserText>(null);
  const [selectedText, setSelectedText] = useState<null | UserText>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formText, setFormText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTexts = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void fetchTexts();
  }, [fetchTexts]);

  const handleCreate = useCallback(async () => {
    if (!formTitle.trim() || !formText.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await createUserText({
        data: { text: formText, title: formTitle },
      });
      if (result.success && result.text) {
        const newText = result.text;
        setTexts((previous) =>
          _.orderBy([...previous, newText], [(t) => t.title]),
        );
        setFormTitle("");
        setFormText("");
        setIsCreateOpen(false);
      }
    } catch (error_) {
      console.error("Failed to create text:", error_);
    } finally {
      setIsSubmitting(false);
    }
  }, [formTitle, formText]);

  const handleUpdate = useCallback(async () => {
    if (!editingText || !formTitle.trim() || !formText.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await updateUserText({
        data: { id: editingText.id, text: formText, title: formTitle },
      });
      if (result.success) {
        setTexts((previous) =>
          _.orderBy(
            previous.map((t) =>
              t.id === editingText.id
                ? { ...t, text: formText, title: formTitle }
                : t,
            ),
            [(t) => t.title],
          ),
        );
        setFormTitle("");
        setFormText("");
        setEditingText(null);
      }
    } catch (error_) {
      console.error("Failed to update text:", error_);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingText, formTitle, formText]);

  const handleDelete = useCallback(
    async (id: string) => {
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
    },
    [selectedText],
  );

  return {
    closeEdit: () => {
      setFormTitle("");
      setFormText("");
      setEditingText(null);
    },
    editingText,
    error,
    formText,
    formTitle,
    handleCreate,
    handleDelete,
    handleUpdate,
    isCreateOpen,
    isLoading,
    isSubmitting,
    openEdit: (text: UserText) => {
      setFormTitle(text.title);
      setFormText(text.text);
      setEditingText(text);
    },
    selectedText,
    setFormText,
    setFormTitle,
    setIsCreateOpen,
    setSelectedText,
    texts,
  };
}

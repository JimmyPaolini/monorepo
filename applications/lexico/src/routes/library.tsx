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
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Edit, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

/**
 * Library page component that displays and manages user's saved texts.
 *
 * @returns React node
 */
function LibraryPage(): ReactNode {
  const [texts, setTexts] = useState<UserText[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingText, setEditingText] = useState<UserText | null>(null);
  const [selectedText, setSelectedText] = useState<UserText | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formText, setFormText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTexts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserTexts();
      setTexts(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load texts";
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
        data: { title: formTitle, text: formText },
      });
      if (result.success && result.text) {
        const newText = result.text;
        setTexts((prev) =>
          [...prev, newText].sort((a, b) => a.title.localeCompare(b.title)),
        );
        setFormTitle("");
        setFormText("");
        setIsCreateOpen(false);
      }
    } catch (err) {
      console.error("Failed to create text:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [formTitle, formText]);

  const handleUpdate = useCallback(async () => {
    if (!editingText || !formTitle.trim() || !formText.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await updateUserText({
        data: { id: editingText.id, title: formTitle, text: formText },
      });
      if (result.success) {
        setTexts((prev) =>
          prev
            .map((t) =>
              t.id === editingText.id
                ? { ...t, title: formTitle, text: formText }
                : t,
            )
            .sort((a, b) => a.title.localeCompare(b.title)),
        );
        setFormTitle("");
        setFormText("");
        setEditingText(null);
      }
    } catch (err) {
      console.error("Failed to update text:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingText, formTitle, formText]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const result = await deleteUserText({ data: { id } });
        if (result.success) {
          setTexts((prev) => prev.filter((t) => t.id !== id));
          if (selectedText?.id === id) {
            setSelectedText(null);
          }
        }
      } catch (err) {
        console.error("Failed to delete text:", err);
      }
    },
    [selectedText],
  );

  const openEdit = (text: UserText): void => {
    setFormTitle(text.title);
    setFormText(text.text);
    setEditingText(text);
  };

  const closeEdit = (): void => {
    setFormTitle("");
    setFormText("");
    setEditingText(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Library</h1>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
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
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.currentTarget.value)}
                  placeholder="e.g., Cicero's First Catilinarian"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text">Text</Label>
                <Textarea
                  id="text"
                  value={formText}
                  onChange={(e) => setFormText(e.currentTarget.value)}
                  placeholder="Paste your Latin text here..."
                  className="min-h-[200px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleCreate()}
                disabled={isSubmitting || !formTitle.trim() || !formText.trim()}
              >
                {isSubmitting ? "Adding..." : "Add Text"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={Boolean(editingText)}
        onOpenChange={(open) => !open && closeEdit()}
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
                value={formTitle}
                onChange={(e) => setFormTitle(e.currentTarget.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-text">Text</Label>
              <Textarea
                id="edit-text"
                value={formText}
                onChange={(e) => setFormText(e.currentTarget.value)}
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeEdit}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleUpdate()}
              disabled={isSubmitting || !formTitle.trim() || !formText.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {!isLoading && !error && texts.length > 0 && !selectedText && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {texts.map((text) => (
            <Card
              key={text.id}
              className="cursor-pointer transition-transform hover:scale-[1.02]"
              onClick={() => setSelectedText(text)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-1 text-lg">
                    {text.title}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(text);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(text.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {text.text.substring(0, 150)}...
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Selected text view */}
      {selectedText && (
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setSelectedText(null)}
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
      )}

      {!isLoading && !error && texts.length === 0 && (
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
      )}
    </div>
  );
}

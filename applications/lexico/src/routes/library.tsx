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

/**
 * Library page component that displays and manages user's saved texts.
 *
 * @returns React node
 */
function LibraryPage(): ReactNode {
  const [texts, setTexts] = useState<UserText[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingText, setEditingText] = useState<null | UserText>(null);
  const [selectedText, setSelectedText] = useState<null | UserText>(null);

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
          onOpenChange={setIsCreateOpen}
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
                  onChange={(event) => setFormTitle(event.currentTarget.value)}
                  placeholder="e.g., Cicero's First Catilinarian"
                  value={formTitle}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text">Text</Label>
                <Textarea
                  className="min-h-[200px]"
                  id="text"
                  onChange={(event) => setFormText(event.currentTarget.value)}
                  placeholder="Paste your Latin text here..."
                  value={formText}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setIsCreateOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmitting || !formTitle.trim() || !formText.trim()}
                onClick={() => void handleCreate()}
              >
                {isSubmitting ? "Adding..." : "Add Text"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        onOpenChange={(open) => !open && closeEdit()}
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
                onChange={(event) => setFormTitle(event.currentTarget.value)}
                value={formTitle}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-text">Text</Label>
              <Textarea
                className="min-h-[200px]"
                id="edit-text"
                onChange={(event) => setFormText(event.currentTarget.value)}
                value={formText}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={closeEdit}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || !formTitle.trim() || !formText.trim()}
              onClick={() => void handleUpdate()}
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
                      className="h-8 w-8"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEdit(text);
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
                        void handleDelete(text.id);
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
          ))}
        </div>
      )}

      {/* Selected text view */}
      {selectedText && (
        <div className="space-y-4">
          <Button
            onClick={() => setSelectedText(null)}
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

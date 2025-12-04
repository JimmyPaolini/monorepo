import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@monorepo/lexico-components";
import { createFileRoute } from "@tanstack/react-router";

import type { ReactNode } from "react";

export const Route = createFileRoute("/bookmarks")({
  component: BookmarksPage,
});

function BookmarksPage(): ReactNode {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Bookmarks</h1>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Saved Words</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            Your bookmarked Latin words will appear here. Save words while
            searching to build your vocabulary list.
          </p>
          <p className="mt-4 text-sm italic">Bookmarks feature coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@monorepo/lexico-components";
import { createFileRoute } from "@tanstack/react-router";

import type { ReactNode } from "react";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
});

function LibraryPage(): ReactNode {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Library</h1>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Your Texts</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>
            Your saved Latin texts will appear here. You can add texts to
            practice reading and vocabulary.
          </p>
          <p className="mt-4 text-sm italic">Library feature coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}

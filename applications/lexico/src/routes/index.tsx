import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@monorepo/lexico-components";
import { createFileRoute } from "@tanstack/react-router";

import type { ReactNode } from "react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage(): ReactNode {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Welcome to Lexico
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Built with TanStack Start and Supabase
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button>Get Started</Button>
          <Button variant="outline">Documentation</Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Configure your application to get up and running
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-2 text-muted-foreground">
            <li>
              Configure your Supabase credentials in{" "}
              <code className="rounded bg-muted px-2 py-1 text-sm">.env</code>
            </li>
            <li>Add your routes in the src/routes directory</li>
            <li>Use the Supabase client for authentication and data</li>
          </ul>
        </CardContent>
      </Card>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          title="TanStack Start"
          description="Full-stack React framework with SSR, streaming, and server functions"
        />
        <FeatureCard
          title="Supabase"
          description="Open source Firebase alternative with auth, database, and storage"
        />
        <FeatureCard
          title="Shadcn/ui"
          description="Beautifully designed components built with Radix UI and Tailwind CSS"
        />
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}): ReactNode {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

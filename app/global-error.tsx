"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center font-sans text-text">
        <h1 className="text-2xl font-semibold">Application Error</h1>
        <p className="max-w-md text-sm text-muted">
          A critical error occurred. Please reload the page or contact support if the issue
          continues .
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          Reload
        </button>
      </body>
    </html>
  );
}

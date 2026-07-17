"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="text-center py-24">
      <h1 className="text-3xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-slate-600">
        An unexpected error occurred. Please try again.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}

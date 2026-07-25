"use client";

interface Props { message: string | null; }

export function ToolError({ message }: Props) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
      {message}
    </div>
  );
}

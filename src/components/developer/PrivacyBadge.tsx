"use client";

export function PrivacyBadge() {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
      <span aria-hidden>🔒</span>
      Your data is processed locally in your browser and is never uploaded.
    </p>
  );
}

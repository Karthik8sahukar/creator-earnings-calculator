"use client";

interface Props {
  onAction: () => void;
  actionLabel: string;
  actionDisabled?: boolean;
}

/**
 * Primary action button for decision tools.
 */
export function ActionButtons({ onAction, actionLabel, actionDisabled }: Props) {
  return (
    <div className="flex justify-center sm:justify-start">
      <button
        type="button"
        onClick={onAction}
        disabled={actionDisabled}
        className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-lg shadow-md hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
      >
        {actionLabel}
      </button>
    </div>
  );
}

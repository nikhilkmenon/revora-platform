import React from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Consistent empty state component used across all list/grid views.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon = "inbox", title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-[#ccc3d7]/20 px-8">
    <span className="material-symbols-outlined text-5xl text-[#5300b7]/25 mb-4">{icon}</span>
    <p className="font-display font-medium text-xl text-[#1d1a24] mb-2">{title}</p>
    {description && <p className="text-sm text-[#4a4455] max-w-sm leading-relaxed">{description}</p>}
    {action && (
      <button
        onClick={action.onClick}
        className="mt-6 px-6 py-2.5 bg-[#5300b7] text-white rounded-full text-sm font-semibold hover:scale-105 transition-all"
      >
        {action.label}
      </button>
    )}
  </div>
);

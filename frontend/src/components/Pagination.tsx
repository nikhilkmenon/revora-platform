import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Reusable pagination control used in admin tables and product grids.
 */
export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 rounded-full border border-[#ccc3d7] flex items-center justify-center text-[#4a4455] hover:bg-[#e8e0ee] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${
            page === currentPage
              ? "bg-[#5300b7] text-white"
              : "border border-[#ccc3d7] text-[#4a4455] hover:bg-[#e8e0ee]"
          }`}
        >
          {page}
        </button>
      ))}

      {totalPages > 7 && <span className="text-[#4a4455]">…{totalPages}</span>}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 rounded-full border border-[#ccc3d7] flex items-center justify-center text-[#4a4455] hover:bg-[#e8e0ee] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </div>
  );
};

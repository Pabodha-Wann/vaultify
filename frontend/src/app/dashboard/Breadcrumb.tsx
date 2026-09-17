"use client";

export interface BreadcrumbSegment {
  id: number | null;
  name: string;
}

interface BreadcrumbProps {
  path: BreadcrumbSegment[];
  onNavigate: (id: number | null) => void;
}

export default function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  return (
    <nav aria-label="Folder path" className="flex items-center gap-1 flex-wrap">
      {path.map((seg, i) => {
        const isLast = i === path.length - 1;
        return (
          <span key={seg.id ?? "root"} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-slate/50 select-none" aria-hidden>
                /
              </span>
            )}
            {isLast ? (
              <span className="text-sm font-semibold text-paper">{seg.name}</span>
            ) : (
              <button
                onClick={() => onNavigate(seg.id)}
                className="text-sm text-slate hover:text-paper hover:underline transition-colors
                  focus-visible:outline-brass rounded-sm cursor-pointer"
              >
                {seg.name}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}

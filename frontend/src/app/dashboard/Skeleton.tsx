export default function Skeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  if (viewMode === "grid") {
    return (
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        role="status"
        aria-label="Loading contents"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#1A1E24] border border-slate/15 rounded-sm p-3.5 space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-sm bg-slate/20" />
              <div className="w-4 h-4 rounded-xs bg-slate/15" />
            </div>
            <div className="space-y-1.5 pt-2">
              <div
                className="h-3 rounded-xs bg-slate/20"
                style={{ width: `${50 + (i % 3) * 20}%` }}
              />
              <div className="h-2.5 w-12 rounded-xs bg-slate/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-slate/15 rounded-sm overflow-hidden" role="status" aria-label="Loading contents">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 border-b border-slate/15 bg-[#181C22] animate-pulse"
        >
          {/* Badge placeholder */}
          <div className="w-7 h-5 rounded-xs bg-slate/20 shrink-0" />
          {/* Name placeholder */}
          <div
            className="h-3.5 rounded-xs bg-slate/20"
            style={{ width: `${30 + (i % 3) * 20}%` }}
          />
          {/* Size placeholder */}
          <div className="ml-auto h-3 w-14 rounded-xs bg-slate/15" />
          {/* Date placeholder */}
          <div className="h-3 w-20 rounded-xs bg-slate/10 hidden md:block" />
        </div>
      ))}
    </div>
  );
}

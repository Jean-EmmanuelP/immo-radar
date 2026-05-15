'use client';

const SORT_OPTIONS = [
  { value: 'score', label: 'Score' },
  { value: 'discount', label: 'Decote' },
  { value: 'yield', label: 'Yield' },
  { value: 'price', label: 'Prix' },
] as const;

export default function SortBar({
  sort,
  onSort,
}: {
  sort: string;
  onSort: (s: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted mr-1">Trier:</span>
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSort(opt.value)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            sort === opt.value
              ? 'bg-accent-blue/20 text-accent-blue'
              : 'text-muted hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

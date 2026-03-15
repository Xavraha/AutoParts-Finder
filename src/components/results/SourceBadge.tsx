interface SourceBadgeProps {
  sourceKey: string;
  sourceName: string;
}

const SOURCE_COLORS: Record<string, string> = {
  ebay: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  carpart: 'bg-blue-100 text-blue-800 border-blue-200',
  craigslist: 'bg-purple-100 text-purple-800 border-purple-200',
  facebook: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  lkq: 'bg-green-100 text-green-800 border-green-200',
  mock: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function SourceBadge({ sourceKey, sourceName }: SourceBadgeProps) {
  const colors = SOURCE_COLORS[sourceKey] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colors}`}>
      {sourceName}
    </span>
  );
}

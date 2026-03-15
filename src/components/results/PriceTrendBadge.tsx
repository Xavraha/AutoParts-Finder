import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceTrendBadgeProps {
  direction: 'up' | 'down' | 'stable' | 'new';
  changePercent?: number | null;
}

export function PriceTrendBadge({ direction, changePercent }: PriceTrendBadgeProps) {
  if (direction === 'new') return null;

  const configs = {
    up: {
      icon: TrendingUp,
      color: 'text-red-600 bg-red-50',
      label: changePercent != null ? `+${changePercent.toFixed(0)}%` : 'Price up',
    },
    down: {
      icon: TrendingDown,
      color: 'text-green-600 bg-green-50',
      label: changePercent != null ? `${changePercent.toFixed(0)}%` : 'Price down',
    },
    stable: {
      icon: Minus,
      color: 'text-gray-500 bg-gray-50',
      label: 'Stable',
    },
  };

  const { icon: Icon, color, label } = configs[direction];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

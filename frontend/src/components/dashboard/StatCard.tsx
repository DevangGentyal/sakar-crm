import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/src/components/ui';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: number;
  color?: 'blue' | 'purple' | 'green' | 'amber' | 'red';
  onClick?: () => void;
}

const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-900', icon: 'text-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-900', icon: 'text-purple-600' },
  green: { bg: 'bg-green-100', text: 'text-green-900', icon: 'text-green-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-900', icon: 'text-amber-600' },
  red: { bg: 'bg-red-100', text: 'text-red-900', icon: 'text-red-600' },
};

export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, change, color = 'blue', onClick }) => {
  const colorClass = colorMap[color];
  const isPositive = (change ?? 0) >= 0;

  return (
    <Card padding="md" hoverable className={`h-full ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClass.bg}`}>
          <Icon className={`w-6 h-6 ${colorClass.icon}`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-sm text-slate-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </Card>
  );
};

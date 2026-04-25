import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Consumption } from '../types';
import { startOfDay, subDays, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeeklyChartProps {
  data: Consumption[];
}

interface WeeklyTooltipEntry {
  name: 'caffeine' | 'alcohol';
  value: number;
  color?: string;
}

interface WeeklyTooltipProps {
  active?: boolean;
  payload?: WeeklyTooltipEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: WeeklyTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border p-4 shadow-xl min-w-[150px]">
        <p className="font-display font-bold text-textMain mb-2 text-sm uppercase tracking-wide">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2" 
                style={{ backgroundColor: entry.color }} 
              />
              <span className="text-xs text-textMuted font-medium uppercase tracking-wider">
                {entry.name === 'caffeine' ? 'Cafeína' : 'Álcool'}
              </span>
            </div>
            <span className="font-mono font-bold text-textMain text-sm">
              {entry.value}
              <span className="text-[10px] ml-0.5 text-textMuted">{entry.name === 'caffeine' ? 'mg' : 'g'}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const WeeklyChart: React.FC<WeeklyChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i);
      return {
        date,
        label: format(date, 'EEE', { locale: ptBR }).toUpperCase().replace('.', ''), 
        fullDate: format(date, "dd 'de' MMMM", { locale: ptBR }),
        caffeine: 0,
        alcohol: 0
      };
    });

    data.forEach(item => {
      const dayStat = last7Days.find(d => isSameDay(d.date, item.timestamp));
      if (dayStat) {
        if (item.type === 'caffeine') {
          dayStat.caffeine += item.amount;
        } else if (item.type === 'alcohol') {
          dayStat.alcohol += item.amount; 
        }
      }
    });

    return last7Days;
  }, [data]);

  return (
    <div className="h-72 w-full font-mono text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={0}>
          <CartesianGrid vertical={false} stroke="#dfd9c8" strokeDasharray="4 4" opacity={0.5} />
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#5c5c5e', fontSize: 10, fontWeight: 700 }} 
            dy={15}
          />
          <YAxis 
            hide 
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: '#f1ebd9', opacity: 0.5 }} 
          />
          <Bar 
            dataKey="caffeine" 
            name="caffeine" 
            stackId="a" 
            fill="#121214" 
            radius={[2, 2, 0, 0]} 
            barSize={32} 
          />
          <Bar 
            dataKey="alcohol" 
            name="alcohol" 
            stackId="b" 
            fill="#de491b" 
            radius={[2, 2, 0, 0]} 
            barSize={32} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyChart;

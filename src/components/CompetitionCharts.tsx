import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { startOfDay, isToday } from 'date-fns';
import { getConsumptions } from '../services/consumption';
import type { UserProfile } from '../services/user';
import { Trophy } from 'lucide-react';

interface CompetitionChartsProps {
  users: UserProfile[];
}

interface UserRanking {
  userId: string;
  displayName: string;
  photoURL: string | null;
  caffeineToday: number;
  alcoholToday: number;
}

interface RankingTooltipPayload {
  value: number;
  dataKey: string;
  payload: UserRanking;
}

interface RankingTooltipProps {
  active?: boolean;
  payload?: RankingTooltipPayload[];
}

const CompetitionCharts: React.FC<CompetitionChartsProps> = ({ users }) => {
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (users.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const today = startOfDay(new Date());
      
      try {
        const promises = users.map(async (user) => {
          // Fetch consumptions from today
          const consumptions = await getConsumptions(user.uid, undefined, today);
          
          let caffeineToday = 0;
          let alcoholToday = 0;

          consumptions.forEach(c => {
            if (isToday(c.timestamp)) {
              if (c.type === 'caffeine') caffeineToday += c.amount;
              if (c.type === 'alcohol') alcoholToday += c.amount;
            }
          });

          return {
            userId: user.uid,
            displayName: user.displayName || 'Anônimo',
            photoURL: user.photoURL,
            caffeineToday,
            alcoholToday
          };
        });

        const results = await Promise.all(promises);
        setRankings(results);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [users]);

  const caffeineData = useMemo(() => {
    return [...rankings]
      .sort((a, b) => b.caffeineToday - a.caffeineToday)
      .slice(0, 5)
      .filter(u => u.caffeineToday > 0);
  }, [rankings]);

  const alcoholData = useMemo(() => {
    return [...rankings]
      .sort((a, b) => b.alcoholToday - a.alcoholToday)
      .slice(0, 5)
      .filter(u => u.alcoholToday > 0);
  }, [rankings]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="h-64 bg-surface border border-border rounded-lg animate-pulse"></div>
        <div className="h-64 bg-surface border border-border rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (caffeineData.length === 0 && alcoholData.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload }: RankingTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-textMain mb-1">{payload[0].payload.displayName}</p>
          <p className="font-mono text-textMuted">
            {payload[0].value} {payload[0].dataKey === 'caffeineToday' ? 'mg' : 'g'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Caffeine Ranking */}
      <div className="bg-surface border border-border rounded-lg p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-surfaceHighlight rounded border border-border text-primary">
            <Trophy size={18} />
          </div>
          <div>
            <h3 className="font-bold font-display uppercase tracking-wider text-sm text-textMain">Top Cafeína (Hoje)</h3>
          </div>
        </div>
        
        {caffeineData.length > 0 ? (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={caffeineData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="displayName" 
                  type="category" 
                  width={100} 
                  tick={{ fill: '#5c5c5e', fontSize: 10, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1ebd9', opacity: 0.3 }} />
                <Bar dataKey="caffeineToday" radius={[0, 4, 4, 0]} barSize={20}>
                  {caffeineData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#eab308' : '#71717a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-textMuted text-xs font-mono">
            Sem dados hoje
          </div>
        )}
      </div>

      {/* Alcohol Ranking */}
      <div className="bg-surface border border-border rounded-lg p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-surfaceHighlight rounded border border-border text-secondary">
            <Trophy size={18} />
          </div>
          <div>
            <h3 className="font-bold font-display uppercase tracking-wider text-sm text-textMain">Top Álcool (Hoje)</h3>
          </div>
        </div>

        {alcoholData.length > 0 ? (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={alcoholData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="displayName" 
                  type="category" 
                  width={100} 
                  tick={{ fill: '#5c5c5e', fontSize: 10, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1ebd9', opacity: 0.3 }} />
                <Bar dataKey="alcoholToday" radius={[0, 4, 4, 0]} barSize={20}>
                  {alcoholData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#71717a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-textMuted text-xs font-mono">
            Sem dados hoje
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionCharts;

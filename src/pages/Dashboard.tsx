import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/auth';
import { getConsumptions, addConsumption, updateConsumption, deleteConsumption } from '../services/consumption';
import { calculateActiveLoad } from '../utils/metabolism';
import type { Consumption } from '../types';
import ConsumptionForm from '../components/ConsumptionForm';
import WeeklyChart from '../components/WeeklyChart';
import ActiveLoadDisplay from '../components/ActiveLoadDisplay';
import TimerSection from '../components/TimerSection';
import { Plus, Coffee, Wine, Clock, BarChart3, ArrowUpRight, Edit2, Trash2, Repeat, X } from 'lucide-react';
import { formatDistanceToNow, isToday, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

type ConsumptionInput = Omit<Consumption, 'id' | 'userId' | 'timestamp'>;

type StatCardIcon = React.ComponentType<{ size?: number; className?: string }>;

interface StatCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: StatCardIcon;
  color: string;
  lastTime?: Consumption | null;
  subtitle?: string;
  average?: string;
  extraLabel?: string;
  extraValueComponent?: React.ReactNode;
}

const StatCard = ({ title, value, unit, icon: Icon, color, lastTime, subtitle, average, extraLabel, extraValueComponent }: StatCardProps) => (
  <div className="bg-surface border border-border rounded-lg p-6 flex flex-col justify-between h-auto min-h-[180px] hover:border-textMuted/30 transition-all duration-300 shadow-sm relative overflow-hidden group">
    <div>
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={clsx("p-2 rounded-md border bg-white", color.replace('text-', 'border-'))}>
            <Icon size={18} className={color} />
          </div>
          <span className="text-textMuted text-xs font-bold uppercase tracking-widest font-display">{title}</span>
        </div>
        {lastTime && (
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-textMuted bg-surfaceHighlight px-2 py-1 rounded border border-border">
            <Clock size={10} />
            <span>{formatDistanceToNow(lastTime.timestamp, { addSuffix: true, locale: ptBR })}</span>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-2 relative z-10">
        <span className="text-5xl font-mono font-bold text-textMain tracking-tighter">{value || 0}</span>
        <span className="text-sm text-textMuted font-bold uppercase tracking-wider">{unit}</span>
      </div>
    </div>

    <div className="space-y-3 mt-6 relative z-10">
      {extraValueComponent && (
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <span className="text-xs font-medium text-textMuted uppercase tracking-wider">{extraLabel}</span>
          {extraValueComponent}
        </div>
      )}
      {(subtitle || average) && (
        <div className={clsx("flex flex-col gap-2", !extraValueComponent && "pt-4 border-t border-border")}>
          {subtitle && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-textMuted uppercase tracking-wider">Total Histórico</span>
              <span className={clsx("text-sm font-mono font-bold", color)}>
                {subtitle}
              </span>
            </div>
          )}
          {average && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-textMuted uppercase tracking-wider">Média Diária</span>
              <span className={clsx("text-sm font-mono font-bold", color)}>
                {average}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConsumption, setEditingConsumption] = useState<Consumption | undefined>(undefined);
  const [itemToRepeat, setItemToRepeat] = useState<Consumption | null>(null);
  const [lastCaffeine, setLastCaffeine] = useState<Consumption | null>(null);
  const [lastAlcohol, setLastAlcohol] = useState<Consumption | null>(null);
  
  // Force re-render every minute to update active load
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async (userId: string) => {
    try {
      const data = await getConsumptions(userId);
      setConsumptions(data);
      
      const caffeine = data.find(c => c.type === 'caffeine');
      const alcohol = data.find(c => c.type === 'alcohol');
      setLastCaffeine(caffeine || null);
      setLastAlcohol(alcohol || null);
      
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      void fetchData(user.uid);
    }, 0);
    return () => clearTimeout(t);
  }, [user, fetchData]);

  const handleAddOrUpdate = async (data: ConsumptionInput) => {
    if (!user) return;
    if (editingConsumption) {
      await updateConsumption(user.uid, editingConsumption.id, data);
    } else {
      await addConsumption(user.uid, data);
    }
    setEditingConsumption(undefined);
    await fetchData(user.uid);
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Tem certeza que deseja apagar este registro?')) return;
    try {
      await deleteConsumption(user.uid, id);
      setConsumptions(prev => prev.filter(c => c.id !== id));
      await fetchData(user.uid);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (consumption: Consumption) => {
    setEditingConsumption(consumption);
    setShowForm(true);
  };

  const handleRepeat = async () => {
    if (!user || !itemToRepeat) return;
    try {
      const dataToRepeat = {
        type: itemToRepeat.type,
        amount: itemToRepeat.amount,
        unit: itemToRepeat.unit,
        description: itemToRepeat.description,
        notes: itemToRepeat.notes
      };
      await addConsumption(user.uid, dataToRepeat);
      setItemToRepeat(null);
      await fetchData(user.uid);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingConsumption(undefined);
  };

  const todaysTotals = useMemo(() => {
    return consumptions
      .filter(c => isToday(c.timestamp))
      .reduce((acc, curr) => {
        if (!acc[curr.type]) acc[curr.type] = 0;
        acc[curr.type] += curr.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [consumptions]);

  const lifetimeTotals = useMemo(() => {
    return consumptions.reduce((acc, curr) => {
        if (!acc[curr.type]) acc[curr.type] = 0;
        acc[curr.type] += curr.amount;
        return acc;
    }, {} as Record<string, number>);
  }, [consumptions]);

  const activeCaffeine = tick >= 0 ? calculateActiveLoad(consumptions, 'caffeine') : 0;

  const calculateDailyAverage = (type: 'caffeine' | 'alcohol') => {
    const typeConsumptions = consumptions.filter(c => c.type === type);
    if (typeConsumptions.length === 0) return 0;

    const dates = typeConsumptions.map(c => c.timestamp.getTime());
    const firstDate = new Date(Math.min(...dates));
    const now = new Date();

    const days = Math.max(1, differenceInCalendarDays(now, firstDate) + 1);
    const total = typeConsumptions.reduce((acc, curr) => acc + curr.amount, 0);

    return total / days;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-textMain">Painel de Controle</h1>
          <p className="text-textMuted text-sm mt-1">Visão geral do seu desempenho hoje.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-accent text-white hover:bg-accent/90 px-6 py-3 rounded-lg font-display font-bold flex items-center gap-2 transition-all shadow-md shadow-accent/10 uppercase tracking-wide text-sm"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Registrar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Cafeína (Hoje)"
          value={(todaysTotals['caffeine'] || 0).toFixed(0)}
          unit="mg"
          icon={Coffee}
          color="text-textMain"
          lastTime={lastCaffeine}
          subtitle={`${(lifetimeTotals['caffeine'] || 0).toFixed(0)}mg`}
          average={`${calculateDailyAverage('caffeine').toFixed(0)}mg/dia`}
          extraLabel="Carga Ativa"
          extraValueComponent={<ActiveLoadDisplay value={activeCaffeine} unit="mg" color="text-accent" />}
        />
        <StatCard
          title="Álcool (Hoje)"
          value={todaysTotals['alcohol']?.toFixed(1) || '0.0'}
          unit="g"
          icon={Wine}
          color="text-textMain"
          lastTime={lastAlcohol}
          subtitle={`${lifetimeTotals['alcohol'] || 0}g`}
          average={`${calculateDailyAverage('alcohol').toFixed(1)}g/dia`}
        />
      </div>

      <TimerSection />

      {consumptions.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-8 border-b border-border pb-4">
            <div className="p-2 bg-surfaceHighlight rounded-md text-textMain">
              <BarChart3 size={20} />
            </div>
            <h2 className="text-sm font-bold text-textMain uppercase tracking-widest font-display">Visão Semanal</h2>
          </div>
          <WeeklyChart data={consumptions} />
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-textMain">Atividade Recente</h2>
        </div>
        
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {consumptions.length === 0 ? (
            <div className="p-12 text-center text-textMuted font-mono text-sm">Nenhuma atividade registrada ainda.</div>
          ) : (
            <div className="divide-y divide-border">
              {consumptions.slice(0, 5).map((item) => (
                <div key={item.id} className="p-5 flex items-center justify-between hover:bg-surfaceHighlight/50 transition-colors group">
                  <div className="flex items-center gap-5">
                    <div className={clsx(
                      "w-12 h-12 rounded-lg flex items-center justify-center border",
                      item.type === 'caffeine' ? "bg-white border-border text-textMain" : 
                      item.type === 'alcohol' ? "bg-white border-border text-textMain" : "bg-white border-border text-textMain"
                    )}>
                      {item.type === 'caffeine' ? <Coffee size={20} /> : item.type === 'alcohol' ? <Wine size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <div className="font-bold text-textMain font-display text-lg">{item.description}</div>
                      <div className="text-xs text-textMuted flex items-center gap-2 mt-1 font-mono">
                        <span className="uppercase">{formatDistanceToNow(item.timestamp, { addSuffix: true, locale: ptBR })}</span>
                        {item.notes && <span>• {item.notes}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="font-mono font-bold text-xl text-right text-textMain">
                      {item.type === 'caffeine' ? item.amount.toFixed(0) : item.amount}
                      <span className="text-xs text-textMuted ml-1 uppercase">{item.unit}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => setItemToRepeat(item)}
                        className="text-textMuted hover:text-textMain p-2 hover:bg-white rounded-md border border-transparent hover:border-border transition-all"
                        title="Repetir"
                      >
                        <Repeat size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(item)}
                        className="text-textMuted hover:text-textMain p-2 hover:bg-white rounded-md border border-transparent hover:border-border transition-all"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-textMuted hover:text-red-600 p-2 hover:bg-white rounded-md border border-transparent hover:border-border transition-all"
                        title="Apagar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <ConsumptionForm
          onClose={handleCloseForm}
          onSubmit={handleAddOrUpdate}
          initialData={editingConsumption}
        />
      )}

      {itemToRepeat && (
        <div className="fixed inset-0 bg-textMain/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-lg p-8 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-bold">Repetir Atividade</h3>
              <button onClick={() => setItemToRepeat(null)} className="text-textMuted hover:text-textMain">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-textMuted mb-8 leading-relaxed">
              Deseja adicionar um novo registro de <strong className="text-textMain font-bold">{itemToRepeat.description}</strong> com <strong className="text-textMain font-mono">{itemToRepeat.amount}{itemToRepeat.unit}</strong> agora?
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setItemToRepeat(null)}
                className="flex-1 px-4 py-3 rounded-lg font-bold text-textMuted hover:bg-surfaceHighlight transition-colors border border-transparent hover:border-border"
              >
                Cancelar
              </button>
              <button
                onClick={handleRepeat}
                className="flex-1 bg-accent text-white px-4 py-3 rounded-lg font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
              >
                <Repeat size={18} />
                <span>Repetir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

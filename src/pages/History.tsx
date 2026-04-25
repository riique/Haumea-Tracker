import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth';
import { getConsumptions, deleteConsumption, updateConsumption } from '../services/consumption';
import type { Consumption } from '../types';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Coffee, Wine, Trash2, ArrowUpRight, Edit2 } from 'lucide-react';
import ConsumptionForm from '../components/ConsumptionForm';
import clsx from 'clsx';

const History = () => {
  const { user } = useAuth();
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConsumption, setEditingConsumption] = useState<Consumption | undefined>(undefined);

  type ConsumptionInput = Omit<Consumption, 'id' | 'userId' | 'timestamp'>;

  const fetchData = useCallback(async (userId: string) => {
    try {
      const data = await getConsumptions(userId);
      setConsumptions(data);
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

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Tem certeza que deseja apagar este registro?')) return;
    try {
      await deleteConsumption(user.uid, id);
      setConsumptions(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate = async (data: ConsumptionInput) => {
    if (!user || !editingConsumption) return;
    await updateConsumption(user.uid, editingConsumption.id, data);
    setEditingConsumption(undefined);
    setShowForm(false);
    await fetchData(user.uid);
  };

  const handleEdit = (consumption: Consumption) => {
    setEditingConsumption(consumption);
    setShowForm(true);
  };

  const groupedConsumptions = consumptions.reduce((acc, curr) => {
    const dateKey = format(curr.timestamp, 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(curr);
    return acc;
  }, {} as Record<string, Consumption[]>);

  const sortedKeys = Object.keys(groupedConsumptions).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-textMain">Histórico</h1>
          <p className="text-textMuted text-sm mt-1">Registro completo de atividades.</p>
        </div>
      </div>

      {consumptions.length === 0 ? (
        <div className="text-center text-textMuted py-20 font-mono text-sm border border-dashed border-border rounded-lg">
          Nenhum registro encontrado.
        </div>
      ) : (
        <div className="space-y-12">
          {sortedKeys.map(dateKey => {
            const items = groupedConsumptions[dateKey];
            const firstDate = items[0].timestamp;
            const title = isToday(firstDate) ? 'Hoje' : isYesterday(firstDate) ? 'Ontem' : format(firstDate, "d 'de' MMMM, yyyy", { locale: ptBR });

            return (
              <div key={dateKey} className="space-y-4">
                <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest font-display sticky top-0 bg-background/95 backdrop-blur-sm py-3 z-10 border-b border-transparent">
                  {title}
                </h3>
                <div className="bg-surface border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
                  {items.map((item) => (
                    <div key={item.id} className="p-5 flex items-center justify-between group hover:bg-surfaceHighlight/50 transition-colors">
                      <div className="flex items-center gap-5">
                        <div className={clsx(
                          "w-12 h-12 rounded-lg flex items-center justify-center border transition-colors",
                          item.type === 'caffeine' ? "bg-white border-border text-textMain" : 
                          item.type === 'alcohol' ? "bg-white border-border text-textMain" : "bg-white border-border text-textMain"
                        )}>
                          {item.type === 'caffeine' ? <Coffee size={20} /> : item.type === 'alcohol' ? <Wine size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <div className="font-bold text-textMain font-display text-lg">{item.description}</div>
                          <div className="text-xs text-textMuted flex items-center gap-2 mt-1 font-mono">
                            <span className="bg-surfaceHighlight px-1.5 py-0.5 rounded border border-border">{format(item.timestamp, 'HH:mm')}</span>
                            {item.notes && <span>• {item.notes}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="font-mono font-bold text-xl text-right text-textMain">
                          {item.amount}<span className="text-xs text-textMuted ml-1 uppercase">{item.unit}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
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
              </div>
            );
          })}
        </div>
      )}

      {showForm && editingConsumption && (
        <ConsumptionForm
            onClose={() => {
                setShowForm(false);
                setEditingConsumption(undefined);
            }}
            onSubmit={handleUpdate}
            initialData={editingConsumption}
        />
      )}
    </div>
  );
};

export default History;

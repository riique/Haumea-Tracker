import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth';
import { subscribeToTimers, addTimer, deleteTimer, updateTimer, toggleTimer } from '../services/timer';
import type { Timer } from '../types';
import { Plus, X, Timer as TimerIcon } from 'lucide-react';
import TimerCard from './TimerCard';

const TimerSection = () => {
  const { user } = useAuth();
  const [timers, setTimers] = useState<Timer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTimer, setEditingTimer] = useState<Timer | null>(null);
  const [timerName, setTimerName] = useState('');
  const [timerDesc, setTimerDesc] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = subscribeToTimers(user.uid, (updatedTimers) => {
      setTimers(updatedTimers);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenForm = (timer?: Timer) => {
    if (timer) {
      setEditingTimer(timer);
      setTimerName(timer.name);
      setTimerDesc(timer.description);
    } else {
      setEditingTimer(null);
      setTimerName('');
      setTimerDesc('');
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTimer(null);
    setTimerName('');
    setTimerDesc('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !timerName) return;

    setLoading(true);
    try {
      if (editingTimer) {
        await updateTimer(user.uid, editingTimer.id, {
          name: timerName,
          description: timerDesc
        });
      } else {
        await addTimer(user.uid, {
          name: timerName,
          description: timerDesc
        });
      }
      handleCloseForm();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar cronômetro');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Tem certeza que deseja remover este cronômetro?')) return;
    try {
      await deleteTimer(user.uid, id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggle = async (timer: Timer) => {
    if (!user) return;
    try {
      await toggleTimer(user.uid, timer);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <TimerIcon className="text-primary" size={24} />
            <h2 className="text-xl font-bold">Meus Cronômetros</h2>
        </div>
        
        <button
          onClick={() => handleOpenForm()}
          className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
        >
          <Plus size={18} />
          <span>Novo Cronômetro</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingTimer ? 'Editar Cronômetro' : 'Novo Cronômetro'}</h3>
              <button onClick={handleCloseForm} className="text-textMuted hover:text-textMain">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-1.5">Nome</label>
                <input
                  type="text"
                  value={timerName}
                  onChange={e => setTimerName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-textMain focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ex: Jejum, Estudo, etc."
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-1.5">Descrição (Opcional)</label>
                <input
                  type="text"
                  value={timerDesc}
                  onChange={e => setTimerDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-textMain focus:outline-none focus:border-primary transition-colors"
                  placeholder="Breve descrição..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-textMuted hover:bg-surfaceHighlight transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-background px-4 py-2 rounded-lg font-bold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : (editingTimer ? 'Atualizar' : 'Criar Cronômetro')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {timers.map(timer => (
          <TimerCard 
            key={timer.id} 
            timer={timer} 
            onDelete={handleDelete}
            onToggle={handleToggle}
            onEdit={handleOpenForm}
          />
        ))}
        
        {timers.length === 0 && !loading && (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-border rounded-2xl text-textMuted">
                <TimerIcon className="mx-auto mb-2 opacity-20" size={48} />
                <p>Nenhum cronômetro ativo</p>
                <button onClick={() => handleOpenForm()} className="text-primary text-sm font-bold mt-2 hover:underline">
                    Criar o primeiro
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default TimerSection;

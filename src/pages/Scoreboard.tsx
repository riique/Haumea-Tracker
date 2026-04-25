import { useEffect, useState } from 'react';
import { getAllUsers, type UserProfile } from '../services/user';
import { getConsumptions } from '../services/consumption';
import type { Consumption } from '../types';
import { calculateActiveLoad } from '../utils/metabolism';
import ActiveLoadDisplay from '../components/ActiveLoadDisplay';
import CompetitionCharts from '../components/CompetitionCharts';
import { 
  Users, 
  Activity, 
  Coffee, 
  Wine, 
  X,
  History as HistoryIcon,
  TrendingUp
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

interface UserStats {
  todayCaffeine: number;
  todayAlcohol: number;
  activeCaffeine: number;
  activeAlcohol: number;
  totalCaffeine: number;
  totalAlcohol: number;
}

export default function Scoreboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userConsumptions, setUserConsumptions] = useState<Consumption[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (user: UserProfile) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    try {
      const consumptions = await getConsumptions(user.uid);
      setUserConsumptions(consumptions);
      calculateStats(consumptions);
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const calculateStats = (consumptions: Consumption[]) => {
    const stats: UserStats = {
      todayCaffeine: 0,
      todayAlcohol: 0,
      activeCaffeine: calculateActiveLoad(consumptions, 'caffeine'),
      activeAlcohol: calculateActiveLoad(consumptions, 'alcohol'), 
      totalCaffeine: 0,
      totalAlcohol: 0
    };

    consumptions.forEach(c => {
      // Total
      if (c.type === 'caffeine') stats.totalCaffeine += c.amount;
      if (c.type === 'alcohol') stats.totalAlcohol += c.amount;

      // Today
      if (isToday(c.timestamp)) {
        if (c.type === 'caffeine') stats.todayCaffeine += c.amount;
        if (c.type === 'alcohol') stats.todayAlcohol += c.amount;
      }
    });

    setUserStats(stats);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setUserConsumptions([]);
    setUserStats(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">
      <header>
        <h1 className="text-3xl font-display font-bold text-textMain mb-2">
          Scoreboard
        </h1>
        <p className="text-textMuted text-sm">
          Monitoramento global de usuários cadastrados.
        </p>
      </header>

      {/* Competition Charts */}
      <CompetitionCharts users={users} />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div 
              key={user.uid}
              onClick={() => handleUserClick(user)}
              className="bg-surface p-6 rounded-lg shadow-sm border border-border hover:border-accent/50 transition-all cursor-pointer group hover:shadow-md"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-lg bg-surfaceHighlight flex items-center justify-center text-textMuted group-hover:bg-white group-hover:text-accent transition-colors border border-transparent group-hover:border-accent/20">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    <Users size={24} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-textMain group-hover:text-accent transition-colors font-display text-lg">
                    {user.displayName || 'Usuário Anônimo'}
                  </h3>
                  <p className="text-xs text-textMuted font-mono mt-1">
                    Última atividade: {format(user.lastActive, "d MMM, HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-textMuted group-hover:text-textMain transition-colors">
                <span>Ver status completo</span>
                <Activity size={16} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-textMain/20 backdrop-blur-sm p-0 sm:p-4" onClick={closeModal}>
          <div 
            className="bg-surface border-t sm:border border-border w-full max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-surfaceHighlight/30 sticky top-0 z-10 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white border border-border flex items-center justify-center text-textMuted overflow-hidden">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt={selectedUser.displayName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <Users size={24} />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-textMain font-display">
                    {selectedUser.displayName || 'Usuário Anônimo'}
                  </h2>
                  <p className="text-sm text-textMuted font-mono">{selectedUser.email}</p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-white text-textMuted hover:text-textMain rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {loadingDetails ? (
                 <div className="flex items-center justify-center h-40">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                 </div>
              ) : userStats ? (
                <>
                  {/* Status Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Caffeine Card */}
                    <div className="bg-white p-6 rounded-lg border border-border hover:border-textMain transition-colors">
                      <div className="flex items-center gap-3 mb-6 text-textMain">
                        <div className="p-2 bg-surfaceHighlight rounded border border-border">
                          <Coffee size={20} />
                        </div>
                        <h3 className="font-bold font-display uppercase tracking-wider text-sm">Cafeína</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-textMuted font-medium uppercase tracking-wide">Hoje</span>
                          <span className="font-mono font-bold text-2xl text-textMain">{userStats.todayCaffeine}<span className="text-sm text-textMuted ml-1">mg</span></span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-textMuted font-medium uppercase tracking-wide">Carga Ativa</span>
                          <ActiveLoadDisplay value={userStats.activeCaffeine} unit="mg" color="text-accent" />
                        </div>
                        <div className="pt-4 border-t border-border flex justify-between items-center">
                          <span className="text-xs font-bold uppercase text-textMuted tracking-wider">Total Histórico</span>
                          <span className="font-mono font-bold text-textMain">{userStats.totalCaffeine}mg</span>
                        </div>
                      </div>
                    </div>

                    {/* Alcohol Card */}
                    <div className="bg-white p-6 rounded-lg border border-border hover:border-textMain transition-colors">
                      <div className="flex items-center gap-3 mb-6 text-textMain">
                        <div className="p-2 bg-surfaceHighlight rounded border border-border">
                          <Wine size={20} />
                        </div>
                        <h3 className="font-bold font-display uppercase tracking-wider text-sm">Álcool</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-textMuted font-medium uppercase tracking-wide">Hoje</span>
                          <span className="font-mono font-bold text-2xl text-textMain">{userStats.todayAlcohol}<span className="text-sm text-textMuted ml-1">g</span></span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-textMuted font-medium uppercase tracking-wide">Carga Ativa</span>
                          <ActiveLoadDisplay value={userStats.activeAlcohol} unit="g" color="text-textMain" />
                        </div>
                        <div className="pt-4 border-t border-border flex justify-between items-center">
                          <span className="text-xs font-bold uppercase text-textMuted tracking-wider">Total Histórico</span>
                          <span className="font-mono font-bold text-textMain">{userStats.totalAlcohol}g</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                      <TrendingUp size={20} className="text-textMuted" />
                      <h3 className="font-bold font-display text-lg">Atividade Recente</h3>
                    </div>
                    <div className="bg-surface rounded-lg border border-border overflow-hidden divide-y divide-border">
                      {userConsumptions.slice(0, 5).map((consumption) => (
                        <div key={consumption.id} className="p-4 flex justify-between items-center hover:bg-surfaceHighlight/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={clsx(
                              "w-10 h-10 rounded-lg flex items-center justify-center border",
                              "bg-white border-border text-textMain"
                            )}>
                              {consumption.type === 'caffeine' ? <Coffee size={16} /> : <Wine size={16} />}
                            </div>
                            <div>
                              <p className="font-bold text-textMain font-display text-sm">{consumption.description || (consumption.type === 'caffeine' ? 'Cafeína' : 'Álcool')}</p>
                              <p className="text-xs text-textMuted font-mono mt-0.5">{format(consumption.timestamp, "d MMM, HH:mm", { locale: ptBR })}</p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-sm text-textMain bg-surfaceHighlight px-2 py-1 rounded border border-border">
                            {consumption.amount}{consumption.unit}
                          </span>
                        </div>
                      ))}
                      {userConsumptions.length === 0 && (
                        <div className="p-8 text-center text-textMuted font-mono text-sm">
                          Nenhuma atividade recente encontrada.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Complete History */}
                  <div>
                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                      <HistoryIcon size={20} className="text-textMuted" />
                      <h3 className="font-bold font-display text-lg">Histórico Completo</h3>
                    </div>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-surfaceHighlight text-textMuted font-bold uppercase tracking-wider text-xs border-b border-border sticky top-0 font-display">
                            <tr>
                              <th className="p-3 pl-4">Data</th>
                              <th className="p-3">Tipo</th>
                              <th className="p-3">Descrição</th>
                              <th className="p-3 text-right pr-4">Qtd.</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-white">
                            {userConsumptions.map((consumption) => (
                              <tr key={consumption.id} className="hover:bg-surfaceHighlight/50 transition-colors">
                                <td className="p-3 pl-4 font-mono text-xs text-textMuted">
                                  {format(consumption.timestamp, "dd/MM/yyyy HH:mm")}
                                </td>
                                <td className="p-3">
                                  <span className={clsx(
                                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border",
                                    consumption.type === 'caffeine' 
                                      ? "bg-surfaceHighlight text-textMain border-border" 
                                      : "bg-surfaceHighlight text-textMuted border-border"
                                  )}>
                                    {consumption.type === 'caffeine' ? 'Cafeína' : 'Álcool'}
                                  </span>
                                </td>
                                <td className="p-3 text-textMain font-medium">
                                  {consumption.description || '-'}
                                </td>
                                <td className="p-3 text-right pr-4 font-mono font-bold text-textMain">
                                  {consumption.amount}{consumption.unit}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

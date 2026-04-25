import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { updateUserProfile } from '../services/user';

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!displayName.trim()) {
      setError('O nome não pode estar vazio');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await updateUserProfile(user, displayName.trim());
      onClose();
    } catch (err) {
      console.error(err);
      setError('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-textMain/20 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-surface border-t sm:border border-border rounded-t-2xl sm:rounded-lg shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surfaceHighlight/30 rounded-t-2xl sm:rounded-t-lg sticky top-0 z-10">
          <h2 className="text-xl font-display font-bold text-textMain">Editar Perfil</h2>
          <button onClick={onClose} className="text-textMuted hover:text-textMain transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 pb-safe">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider font-display">Nome de Exibição</label>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-10 bg-white font-medium focus:bg-surfaceHighlight transition-colors"
                placeholder="Seu nome"
                autoFocus
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
            </div>
            <p className="text-[10px] text-textMuted">Este nome aparecerá no Scoreboard para todos os usuários.</p>
          </div>

          <div className="pt-2 sticky bottom-0 bg-surface p-4 sm:p-0 sm:static border-t sm:border-0 border-border">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white hover:bg-accent/90 font-display font-bold text-sm uppercase tracking-widest py-4 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-accent/20"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;

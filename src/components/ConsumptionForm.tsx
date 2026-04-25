import React, { useState, useEffect } from 'react';
import { X, Coffee, Wine, HelpCircle } from 'lucide-react';
import type { Consumption, SubstanceType } from '../types';
import clsx from 'clsx';

interface ConsumptionFormProps {
  onClose: () => void;
  onSubmit: (data: Omit<Consumption, 'id' | 'userId' | 'timestamp'>) => Promise<void>;
  initialData?: Consumption;
}

const ConsumptionForm: React.FC<ConsumptionFormProps> = ({ onClose, onSubmit, initialData }) => {
  const [type, setType] = useState<SubstanceType>(initialData?.type || 'caffeine');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [unit, setUnit] = useState(initialData?.unit || 'mg');
  const [description, setDescription] = useState(initialData?.description || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [loading, setLoading] = useState(false);

  // Update unit when type changes if not editing or if type changes
  useEffect(() => {
    if (!initialData || type !== initialData.type) {
      if (type === 'caffeine') setUnit('mg');
      else if (type === 'alcohol') setUnit('g');
      else setUnit('');
    }
  }, [type, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const parsedAmount = Number.parseFloat(amount.replace(',', '.'));
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

      await onSubmit({
        type,
        amount: parsedAmount,
        unit,
        description,
        notes
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: 'caffeine', label: 'Cafeína', icon: Coffee, defaultUnit: 'mg' },
    { value: 'alcohol', label: 'Álcool', icon: Wine, defaultUnit: 'g' },
    { value: 'other', label: 'Outro', icon: HelpCircle, defaultUnit: '' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-textMain/20 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-surface border-t sm:border border-border rounded-t-2xl sm:rounded-lg shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surfaceHighlight/30 sticky top-0 z-10 backdrop-blur-sm">
          <h2 className="text-xl font-display font-bold text-textMain">{initialData ? 'Editar Registro' : 'Registrar Consumo'}</h2>
          <button onClick={onClose} className="text-textMuted hover:text-textMain transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 pb-safe">
          <div className="grid grid-cols-3 gap-4">
            {typeOptions.map((option) => {
              const isSelected = type === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value as SubstanceType)}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all duration-200",
                    isSelected 
                      ? "bg-textMain text-white border-textMain shadow-md" 
                      : "bg-white text-textMuted border-border hover:border-textMuted hover:text-textMain"
                  )}
                >
                  <option.icon size={24} />
                  <span className="text-xs font-bold font-display tracking-wide uppercase">{option.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider font-display">Quantidade</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-lg font-mono font-bold bg-white focus:bg-surfaceHighlight transition-colors"
                placeholder="0"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider font-display">Unidade</label>
              {type === 'other' ? (
                 <input
                 type="text"
                 value={unit}
                 onChange={(e) => setUnit(e.target.value)}
                 className="w-full text-lg font-mono font-bold bg-white"
                 placeholder="unidade"
                 required
               />
              ) : (
                <div className="w-full h-[46px] bg-surfaceHighlight/50 border border-border rounded-lg px-4 flex items-center text-lg font-mono font-bold text-textMuted cursor-not-allowed">
                  {unit}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider font-display">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white font-medium"
              placeholder={type === 'caffeine' ? "Ex: Espresso Duplo" : type === 'alcohol' ? "Ex: Cerveja IPA" : "Descrição do item"}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider font-display">Notas (Opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none h-24 bg-white font-medium"
              placeholder="Como você se sente? Detalhes adicionais..."
            />
          </div>

          <div className="pt-2 sticky bottom-0 bg-surface p-4 sm:p-0 sm:static border-t sm:border-0 border-border">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white hover:bg-accent/90 font-display font-bold text-sm uppercase tracking-widest py-4 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-accent/20"
            >
              {loading ? 'Salvando...' : initialData ? 'Atualizar Registro' : 'Confirmar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsumptionForm;

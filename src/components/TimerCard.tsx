import { useState, useEffect } from 'react';
import { intervalToDuration, format, type Duration } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Timer } from '../types';
import { Trash2, Clock, Pause, Play, Edit2 } from 'lucide-react';
import clsx from 'clsx';

interface TimerCardProps {
  timer: Timer;
  onDelete: (id: string) => void;
  onToggle: (timer: Timer) => void;
  onEdit: (timer: Timer) => void;
}

type DateValue = Date | string | number | { toDate: () => Date } | null | undefined;

const toDate = (value: DateValue): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return value.toDate();
  }
  return new Date(value ?? Date.now());
};

const TimerCard = ({ timer, onDelete, onToggle, onEdit }: TimerCardProps) => {
  const [duration, setDuration] = useState<Duration>({});

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let totalMs = timer.accumulatedTime || 0;

      if (timer.isRunning && timer.startTime) {
        const start = toDate(timer.startTime as DateValue);
        
        if (!isNaN(start.getTime())) {
          totalMs += now.getTime() - start.getTime();
        }
      }

      setDuration(intervalToDuration({
        start: 0,
        end: totalMs
      }));
    };

    updateTime();
    
    if (timer.isRunning) {
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [timer.startTime, timer.accumulatedTime, timer.isRunning]);

  const formatUnit = (value: number | undefined, label: string, alwaysShow = false) => {
    if (!alwaysShow && (value === undefined || value === 0)) return null;
    return (
      <div className={clsx(
        "flex flex-col items-center justify-center p-3 min-w-[64px] transition-colors border-r last:border-r-0 border-border",
        timer.isRunning ? "bg-white" : "bg-transparent"
      )}>
        <span className={clsx(
          "text-2xl font-mono font-bold transition-colors",
          timer.isRunning ? "text-accent" : "text-textMain"
        )}>{String(value || 0).padStart(2, '0')}</span>
        <span className="text-[10px] uppercase text-textMuted tracking-wider font-bold mt-1">{label}</span>
      </div>
    );
  };

  const formattedCreatedAt = timer.createdAt ? format(
    toDate(timer.createdAt as DateValue),
    "dd MMM, HH:mm",
    { locale: ptBR }
  ) : '';

  return (
    <div className={clsx(
      "bg-surface border border-border rounded-lg relative group transition-all",
      timer.isRunning ? "shadow-md ring-1 ring-accent/20" : "hover:border-textMuted/30"
    )}>
      <div className="p-5 flex justify-between items-start border-b border-border bg-surfaceHighlight/30">
        <div className="flex items-start gap-4">
          <div className={clsx(
            "p-2.5 rounded-md transition-colors border",
            timer.isRunning 
              ? "bg-accent text-white border-accent" 
              : "bg-white text-textMuted border-border"
          )}>
            {timer.isRunning ? <Clock size={20} className="animate-pulse" /> : <Pause size={20} />}
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-textMain leading-tight">{timer.name}</h3>
            {formattedCreatedAt && (
              <span className="text-[10px] text-textMuted uppercase tracking-wider block mt-1 font-mono">
                Iniciado: {formattedCreatedAt}
              </span>
            )}
            {timer.description && (
              <p className="text-sm text-textMuted mt-2 leading-relaxed">{timer.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(timer)}
            className="text-textMuted hover:text-textMain p-2 hover:bg-white rounded-md transition-colors border border-transparent hover:border-border"
            title="Editar"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(timer.id)}
            className="text-textMuted hover:text-red-600 p-2 hover:bg-white rounded-md transition-colors border border-transparent hover:border-border"
            title="Excluir"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex border-b border-border overflow-x-auto bg-surfaceHighlight/10 no-scrollbar">
        <div className="flex min-w-full">
          {formatUnit(duration.years, 'Anos')}
          {formatUnit(duration.months, 'Meses')}
          {formatUnit(duration.days, 'Dias')}
          {formatUnit(duration.hours || 0, 'Hr', true)}
          {formatUnit(duration.minutes || 0, 'Min', true)}
          {formatUnit(duration.seconds || 0, 'Seg', true)}
        </div>
      </div>

      <button
        onClick={() => onToggle(timer)}
        className={clsx(
          "w-full py-4 font-display font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-b-lg",
          timer.isRunning 
            ? "bg-white text-textMuted hover:text-textMain hover:bg-surfaceHighlight" 
            : "bg-accent text-white hover:bg-accent/90"
        )}
      >
        {timer.isRunning ? (
          <>
            <Pause size={16} />
            <span>Pausar Timer</span>
          </>
        ) : (
          <>
            <Play size={16} />
            <span>Continuar Timer</span>
          </>
        )}
      </button>
    </div>
  );
};

export default TimerCard;

import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import clsx from 'clsx';

interface ActiveLoadDisplayProps {
  value: number;
  unit?: string;
  color?: string;
}

const ActiveLoadDisplay: React.FC<ActiveLoadDisplayProps> = ({ value, unit = 'mg', color = 'text-primary' }) => {
  // Se maior ou igual a 1, mostra com 2 casas decimais
  if (value >= 1) {
    return (
      <span className={clsx("text-sm font-mono font-bold", color)}>
        {value.toFixed(2)}{unit}
      </span>
    );
  }

  // Se for 0, mostra 0
  if (value === 0) {
    return (
        <span className={clsx("text-sm font-mono font-bold", color)}>
          0{unit}
        </span>
      );
  }

  // Se menor que 1, formata para notação científica
  const exponent = Math.floor(Math.log10(value));
  const mantissa = (value / Math.pow(10, exponent)).toFixed(2);
  
  // LaTeX string: 2.5 \cdot 10^{-8}
  const latex = `${mantissa} \\cdot 10^{${exponent}}`;

  return (
    <div className={clsx("inline-flex items-center gap-1", color)}>
        <span className="text-xs font-medium">
            <InlineMath math={latex} />
        </span>
        <span className="text-xs font-mono font-bold ml-1">{unit}</span>
    </div>
  );
};

export default ActiveLoadDisplay;

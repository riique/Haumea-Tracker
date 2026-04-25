import { differenceInMinutes } from 'date-fns';
import type { Consumption } from '../types';

const CAFFEINE_HALF_LIFE_MINUTES = 300; // 5 hours

const ALCOHOL_ELIMINATION_G_PER_HOUR = 7;
const MIN_RELEVANT_AMOUNT = 0.01;

/**
 * Calculates the current active amount of a substance in the system based on its half-life.
 * 
 * Formula: Remaining = Initial * (0.5) ^ (ElapsedMinutes / HalfLifeMinutes)
 */
export const calculateActiveLoad = (
  consumptions: Consumption[], 
  type: 'caffeine' | 'alcohol' = 'caffeine'
): number => {
  const now = new Date();

  return consumptions
    .filter(c => c.type === type)
    .reduce((total, item) => {
      const elapsedMinutes = differenceInMinutes(now, new Date(item.timestamp));
      
      if (!Number.isFinite(elapsedMinutes) || elapsedMinutes < 0) return total;
      
      if (type === 'caffeine') {
        const remaining = item.amount * Math.pow(0.5, elapsedMinutes / CAFFEINE_HALF_LIFE_MINUTES);
        if (remaining < MIN_RELEVANT_AMOUNT) return total;
        return total + remaining;
      }

      const hours = elapsedMinutes / 60;
      const remaining = item.amount - ALCOHOL_ELIMINATION_G_PER_HOUR * hours;
      if (remaining < MIN_RELEVANT_AMOUNT) return total;
      return total + remaining;
    }, 0);
};

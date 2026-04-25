export type SubstanceType = 'caffeine' | 'alcohol' | 'other';

export interface Consumption {
  id: string;
  userId: string;
  type: SubstanceType;
  amount: number;
  unit: string;
  description: string;
  notes?: string;
  timestamp: Date; 
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface Timer {
  id: string;
  userId: string;
  name: string;
  description: string;
  startTime: Date | null;
  accumulatedTime: number; // in milliseconds
  isRunning: boolean;
  createdAt: Date;
}

export interface ConsumptionStats {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

import { 
  collection, 
  addDoc, 
  query, 
  deleteDoc, 
  doc, 
  onSnapshot,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Timer } from '../types';

const COLLECTION_NAME = 'timers';

const toDate = (value: unknown): Date | null => {
  if (value === null) return null;
  if (value instanceof Date) return value;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'number' || typeof value === 'string') return new Date(value);
  return new Date();
};

export const addTimer = async (
  userId: string, 
  data: Omit<Timer, 'id' | 'userId' | 'createdAt' | 'startTime' | 'accumulatedTime' | 'isRunning'>
) => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, `users/${userId}/${COLLECTION_NAME}`), {
      userId,
      ...data,
      startTime: now,
      accumulatedTime: 0,
      isRunning: true,
      createdAt: now
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding timer: ", error);
    throw error;
  }
};

export const updateTimer = async (
  userId: string,
  timerId: string,
  data: Partial<Timer>
) => {
  try {
    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}`, timerId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating timer: ", error);
    throw error;
  }
};

export const toggleTimer = async (userId: string, timer: Timer) => {
  try {
    const now = new Date();
    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}`, timer.id);
    
    if (timer.isRunning) {
      // Stopping
      if (!timer.startTime) return;
      const elapsed = now.getTime() - timer.startTime.getTime();
      await updateDoc(docRef, {
        isRunning: false,
        startTime: null,
        accumulatedTime: (timer.accumulatedTime || 0) + elapsed
      });
    } else {
      // Starting
      await updateDoc(docRef, {
        isRunning: true,
        startTime: Timestamp.fromDate(now)
      });
    }
  } catch (error) {
    console.error("Error toggling timer: ", error);
    throw error;
  }
};

export const subscribeToTimers = (userId: string, callback: (timers: Timer[]) => void) => {
  const q = query(
    collection(db, `users/${userId}/${COLLECTION_NAME}`)
  );

  return onSnapshot(q, (snapshot) => {
    const timers = snapshot.docs
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          startTime: toDate(data.startTime),
          accumulatedTime: data.accumulatedTime || 0,
          isRunning: data.isRunning ?? true, // Default to true for migration
          createdAt: data.createdAt ? toDate(data.createdAt) : new Date(0) // Default to epoch if missing
        } as Timer;
      })
      .sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
      
    callback(timers);
  }, (error) => {
    console.error("Error subscribing to timers: ", error);
  });
};

export const deleteTimer = async (userId: string, timerId: string) => {
  try {
    await deleteDoc(doc(db, `users/${userId}/${COLLECTION_NAME}`, timerId));
  } catch (error) {
    console.error("Error deleting timer: ", error);
    throw error;
  }
};

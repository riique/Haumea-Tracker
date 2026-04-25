import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  doc, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Consumption, SubstanceType } from '../types';

const COLLECTION_NAME = 'consumptions';

const toDate = (value: unknown): Date => {
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  if (typeof value === 'number' || typeof value === 'string') return new Date(value);
  return new Date();
};

export const addConsumption = async (
  userId: string, 
  data: Omit<Consumption, 'id' | 'userId' | 'timestamp'>
) => {
  try {
    const docRef = await addDoc(collection(db, `users/${userId}/${COLLECTION_NAME}`), {
      userId,
      ...data,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const updateConsumption = async (
  userId: string,
  consumptionId: string,
  data: Partial<Omit<Consumption, 'id' | 'userId' | 'timestamp'>>
) => {
  try {
    const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}`, consumptionId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

export const getConsumptions = async (userId: string, filterType?: SubstanceType, startDate?: Date) => {
  try {
    let q = query(
      collection(db, `users/${userId}/${COLLECTION_NAME}`),
      orderBy('timestamp', 'desc')
    );

    if (filterType) {
      q = query(q, where('type', '==', filterType));
    }

    if (startDate) {
      q = query(q, where('timestamp', '>=', Timestamp.fromDate(startDate)));
    }

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(d => {
      const data = d.data() as Record<string, unknown>;
      const docUserId = typeof data.userId === 'string' ? data.userId : userId;
      return {
        id: d.id,
        ...data,
        userId: docUserId,
        timestamp: toDate(data.timestamp)
      } as Consumption;
    });
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
};

export const deleteConsumption = async (userId: string, consumptionId: string) => {
  try {
    await deleteDoc(doc(db, `users/${userId}/${COLLECTION_NAME}`, consumptionId));
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
};

export const getLastConsumption = async (userId: string, type: SubstanceType) => {
  try {
    const q = query(
      collection(db, `users/${userId}/${COLLECTION_NAME}`),
      where('type', '==', type),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    const doc = querySnapshot.docs[0];
    const data = doc.data() as Record<string, unknown>;
    const docUserId = typeof data.userId === 'string' ? data.userId : userId;
    const timestamp = toDate(data.timestamp);
    return {
      id: doc.id,
      ...data,
      userId: docUserId,
      timestamp
    } as Consumption;
  } catch (error) {
    console.error("Error getting last consumption: ", error);
    return null;
  }
};

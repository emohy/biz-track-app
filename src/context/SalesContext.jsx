import { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy,
    limit
} from 'firebase/firestore';
import { db, getMetadata } from '../firebase';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

const SalesContext = createContext();

export const useSales = () => useContext(SalesContext);

export const SalesProvider = ({ children }) => {
    const { user } = useAuth();
    const { testMode } = useSettings();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingDeletes, setPendingDeletes] = useState({});

    const collectionName = testMode ? 'test_sales' : 'sales';

    useEffect(() => {
        if (!user) {
            setSales([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'users', user.uid, collectionName),
            orderBy('createdAt', 'desc'),
            limit(1000) // Mitigation for Denial-of-Wallet (Read-bombing)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const salesList = snapshot.docs.map(doc => {
                const data = doc.data({ serverTimestamps: 'estimate' });
                const toISO = (val) => {
                    if (!val) return new Date().toISOString();
                    if (typeof val.toDate === 'function') return val.toDate().toISOString();
                    const d = new Date(val);
                    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
                };
                return {
                    id: doc.id,
                    ...data,
                    createdAt: toISO(data.createdAt),
                    updatedAt: toISO(data.updatedAt),
                };
            });
            // Filter out items that are marked as deleted in the cloud
            setSales(salesList.filter(s => !s.isDeleted));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, collectionName]);

    const addSale = async (saleData) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, collectionName), {
            ...saleData,
            ...getMetadata(user.uid)
        });
    };

    const updateSale = async (id, updates) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, collectionName, id);
        await updateDoc(ref, {
            ...updates,
            ...getMetadata(user.uid, true)
        });
    };

    const deleteSale = async (id) => {
        if (!user) return;
        const itemToDelete = sales.find(s => s.id === id);
        if (!itemToDelete) return;

        // 1. Mark as deleted in Firestore immediately (Soft Delete)
        // This ensures the "deleting" state persists even on refresh
        const ref = doc(db, 'users', user.uid, collectionName, id);
        await updateDoc(ref, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            ...getMetadata(user.uid, true)
        });

        // 2. Set the local timer for "Hard Delete" (if desired) or just to clear the "Undo" UI
        const timeoutId = setTimeout(async () => {
            // Optional: You could physically delete document here after 5s
            // await deleteDoc(ref); 

            setPendingDeletes(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }, 5000);

        setPendingDeletes(prev => ({
            ...prev,
            [id]: { item: itemToDelete, timeoutId }
        }));
        return id;
    };

    const undoDelete = async (id) => {
        const pending = pendingDeletes[id];
        if (pending) {
            clearTimeout(pending.timeoutId);

            // Revert the soft delete in Firestore
            const ref = doc(db, 'users', user.uid, collectionName, id);
            await updateDoc(ref, {
                isDeleted: false,
                deletedAt: null,
                ...getMetadata(user.uid, true)
            });

            setPendingDeletes(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    };

    return (
        <SalesContext.Provider value={{
            sales: sales.filter(s => !pendingDeletes[s.id]),
            addSale,
            updateSale,
            deleteSale,
            undoDelete,
            isPendingDelete: (id) => !!pendingDeletes[id],
            loading
        }}>
            {children}
        </SalesContext.Provider>
    );
};

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
    orderBy
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
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const salesList = snapshot.docs.map(doc => {
                const data = doc.data({ serverTimestamps: 'estimate' });
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
                };
            });
            setSales(salesList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, collectionName]);

    const addSale = async (saleData) => {
        if (!user) return;
        addDoc(collection(db, 'users', user.uid, collectionName), {
            ...saleData,
            ...getMetadata(user.uid)
        });
    };

    const updateSale = async (id, updates) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, collectionName, id);
        updateDoc(ref, {
            ...updates,
            ...getMetadata(user.uid, true)
        });
    };

    const deleteSale = async (id) => {
        if (!user) return;
        const itemToDelete = sales.find(s => s.id === id);
        if (!itemToDelete) return;

        const timeoutId = setTimeout(() => {
            const ref = doc(db, 'users', user.uid, collectionName, id);
            deleteDoc(ref);
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

    const undoDelete = (id) => {
        const pending = pendingDeletes[id];
        if (pending) {
            clearTimeout(pending.timeoutId);
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

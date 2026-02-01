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
import { db } from '../firebase';
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
            const salesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()?.toISOString(),
                updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
            }));
            setSales(salesList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, collectionName]);

    const addSale = async (saleData) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, collectionName), {
            ...saleData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    };

    const updateSale = async (id, updates) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, collectionName, id);
        await updateDoc(ref, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    };

    const deleteSale = async (id) => {
        if (!user) return;
        const itemToDelete = sales.find(s => s.id === id);
        if (!itemToDelete) return;

        const timeoutId = setTimeout(async () => {
            const ref = doc(db, 'users', user.uid, collectionName, id);
            await deleteDoc(ref);
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

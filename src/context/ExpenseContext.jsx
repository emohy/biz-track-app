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

const ExpenseContext = createContext();

export const useExpense = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }) => {
    const { user } = useAuth();
    const { testMode } = useSettings();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingDeletes, setPendingDeletes] = useState({});

    const collectionName = testMode ? 'test_expenses' : 'expenses';

    useEffect(() => {
        if (!user) {
            setExpenses([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'users', user.uid, collectionName),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const expenseList = snapshot.docs.map(doc => {
                const data = doc.data({ serverTimestamps: 'estimate' });
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
                };
            });
            setExpenses(expenseList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, collectionName]);

    const addExpense = async (data) => {
        if (!user) return;
        addDoc(collection(db, 'users', user.uid, collectionName), {
            ...data,
            ...getMetadata(user.uid)
        });
    };

    const updateExpense = async (id, updatedData) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, collectionName, id);
        updateDoc(ref, {
            ...updatedData,
            ...getMetadata(user.uid, true)
        });
    };

    const deleteExpense = async (id) => {
        if (!user) return;
        const itemToDelete = expenses.find(e => e.id === id);
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
        <ExpenseContext.Provider value={{
            expenses: expenses.filter(e => !pendingDeletes[e.id]),
            addExpense,
            updateExpense,
            deleteExpense,
            undoDelete,
            isPendingDelete: (id) => !!pendingDeletes[id],
            loading
        }}>
            {children}
        </ExpenseContext.Provider>
    );
};

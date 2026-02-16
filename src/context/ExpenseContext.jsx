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
            orderBy('createdAt', 'desc'),
            limit(500)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const expenseList = snapshot.docs.map(doc => {
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
            setExpenses(expenseList.filter(e => !e.isDeleted));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, collectionName]);

    const addExpense = async (data) => {
        if (!user) return;
        try {
            return await addDoc(collection(db, 'users', user.uid, collectionName), {
                ...data,
                ...getMetadata(user.uid)
            });
        } catch (error) {
            console.error("Error adding expense:", error);
            throw error;
        }
    };

    const updateExpense = async (id, updatedData) => {
        if (!user) return;
        try {
            const ref = doc(db, 'users', user.uid, collectionName, id);
            return await updateDoc(ref, {
                ...updatedData,
                ...getMetadata(user.uid, true)
            });
        } catch (error) {
            console.error("Error updating expense:", error);
            throw error;
        }
    };

    const deleteExpense = async (id) => {
        if (!user) return;
        const itemToDelete = expenses.find(e => e.id === id);
        if (!itemToDelete) return;

        // 1. Mark as deleted in Firestore
        const ref = doc(db, 'users', user.uid, collectionName, id);
        await updateDoc(ref, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            ...getMetadata(user.uid, true)
        });

        // 2. Clear UI undo toast
        const timeoutId = setTimeout(() => {
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

            // Revert soft delete
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

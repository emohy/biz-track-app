import { createContext, useContext, useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';

const ExpenseContext = createContext();

export const useExpense = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }) => {
    const { testMode } = useSettings();
    const storageKey = testMode ? 'test_expenses' : 'expenses';

    const [expenses, setExpenses] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : [];
    });

    const [pendingDeletes, setPendingDeletes] = useState({});

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(expenses));
    }, [expenses, storageKey]);

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        setExpenses(saved ? JSON.parse(saved) : []);
    }, [testMode, storageKey]);

    const addExpense = (data) => {
        const now = new Date().toISOString();
        const newExpense = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        };
        setExpenses(prev => [newExpense, ...prev]);
    };

    const updateExpense = (id, updatedData) => {
        setExpenses(prev => prev.map(exp =>
            exp.id === id ? { ...exp, ...updatedData, updatedAt: new Date().toISOString() } : exp
        ));
    };

    const deleteExpense = (id) => {
        const itemToDelete = expenses.find(e => e.id === id);
        if (!itemToDelete) return;

        setExpenses(prev => prev.filter(e => e.id !== id));

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

    const undoDelete = (id) => {
        const pending = pendingDeletes[id];
        if (pending) {
            clearTimeout(pending.timeoutId);
            setExpenses(prev => [pending.item, ...prev]);
            setPendingDeletes(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    };

    return (
        <ExpenseContext.Provider value={{
            expenses, addExpense, updateExpense, deleteExpense, undoDelete,
            isPendingDelete: (id) => !!pendingDeletes[id]
        }}>
            {children}
        </ExpenseContext.Provider>
    );
};

import { createContext, useContext, useState, useEffect } from 'react';

const ExpenseContext = createContext();

export const useExpense = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }) => {
    const [expenses, setExpenses] = useState(() => {
        const saved = localStorage.getItem('expenses');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }, [expenses]);

    const addExpense = (data) => {
        const newExpense = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        setExpenses(prev => [newExpense, ...prev]);
    };

    const updateExpense = (id, updatedData) => {
        setExpenses(prev => prev.map(exp =>
            exp.id === id ? { ...exp, ...updatedData } : exp
        ));
    };

    const deleteExpense = (id) => {
        setExpenses(prev => prev.filter(exp => exp.id !== id));
    };

    return (
        <ExpenseContext.Provider value={{ expenses, addExpense, updateExpense, deleteExpense }}>
            {children}
        </ExpenseContext.Provider>
    );
};

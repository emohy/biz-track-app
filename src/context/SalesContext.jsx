import { createContext, useContext, useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';

const SalesContext = createContext();

export const useSales = () => useContext(SalesContext);

export const SalesProvider = ({ children }) => {
    const { testMode } = useSettings();
    const storageKey = testMode ? 'test_sales' : 'sales';

    const [sales, setSales] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : [];
    });

    const [pendingDeletes, setPendingDeletes] = useState({});

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(sales));
    }, [sales, storageKey]);

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        setSales(saved ? JSON.parse(saved) : []);
    }, [testMode, storageKey]);

    const addSale = (saleData) => {
        const now = new Date().toISOString();
        const newSale = {
            ...saleData,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        };
        setSales(prev => [newSale, ...prev]);
    };

    const updateSale = (id, updates) => {
        setSales(prev => prev.map(sale =>
            sale.id === id ? { ...sale, ...updates, updatedAt: new Date().toISOString() } : sale
        ));
    };

    const deleteSale = (id) => {
        const itemToDelete = sales.find(s => s.id === id);
        if (!itemToDelete) return;

        setSales(prev => prev.filter(s => s.id !== id));

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
            setSales(prev => [pending.item, ...prev]);
            setPendingDeletes(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    };

    return (
        <SalesContext.Provider value={{
            sales, addSale, updateSale, deleteSale, undoDelete,
            isPendingDelete: (id) => !!pendingDeletes[id]
        }}>
            {children}
        </SalesContext.Provider>
    );
};

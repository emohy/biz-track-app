import { createContext, useContext, useState, useEffect } from 'react';

const SalesContext = createContext();

export const useSales = () => useContext(SalesContext);

export const SalesProvider = ({ children }) => {
    const [sales, setSales] = useState(() => {
        const saved = localStorage.getItem('sales');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('sales', JSON.stringify(sales));
    }, [sales]);

    const addSale = (saleData) => {
        const newSale = {
            ...saleData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        setSales(prev => [newSale, ...prev]);
    };

    const deleteSale = (id) => {
        setSales(prev => prev.filter(sale => sale.id !== id));
    };

    const updateSale = (id, updates) => {
        setSales(prev => prev.map(sale =>
            sale.id === id ? { ...sale, ...updates } : sale
        ));
    };

    return (
        <SalesContext.Provider value={{ sales, addSale, deleteSale, updateSale }}>
            {children}
        </SalesContext.Provider>
    );
};

import { createContext, useContext, useState, useEffect } from 'react';

const CustomerContext = createContext();

export const useCustomer = () => useContext(CustomerContext);

export const CustomerProvider = ({ children }) => {
    const [customers, setCustomers] = useState(() => {
        const saved = localStorage.getItem('customers');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('customers', JSON.stringify(customers));
    }, [customers]);

    const addCustomer = (customerData) => {
        const newCustomer = {
            ...customerData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        setCustomers(prev => [newCustomer, ...prev]);
        return newCustomer;
    };

    const updateCustomer = (id, updatedData) => {
        setCustomers(prev => prev.map(c =>
            c.id === id ? { ...c, ...updatedData } : c
        ));
    };

    return (
        <CustomerContext.Provider value={{ customers, addCustomer, updateCustomer }}>
            {children}
        </CustomerContext.Provider>
    );
};

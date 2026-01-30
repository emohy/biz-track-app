import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSettings } from './SettingsContext';

const ProductContext = createContext();

export const useProduct = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
    const { testMode } = useSettings();
    const storageKey = testMode ? 'test_products' : 'products';

    const [products, setProducts] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : [];
    });

    const [pendingDeletes, setPendingDeletes] = useState({});

    // Effect for Storage Persistence
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(products));
    }, [products, storageKey]);

    // Handle testMode switch: reload data
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        setProducts(saved ? JSON.parse(saved) : []);
    }, [testMode, storageKey]);

    const addProduct = (productData) => {
        const now = new Date().toISOString();
        const newProduct = {
            ...productData,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        };
        setProducts(prev => [newProduct, ...prev]);
    };

    const updateProduct = (id, updatedData) => {
        setProducts(prev => prev.map(prod =>
            prod.id === id ? { ...prod, ...updatedData, updatedAt: new Date().toISOString() } : prod
        ));
    };

    const deleteProduct = (id) => {
        // Soft delete logic: stage for deletion
        const itemToDelete = products.find(p => p.id === id);
        if (!itemToDelete) return;

        // Immediately remove from visible list
        setProducts(prev => prev.filter(p => p.id !== id));

        // Create a timeout to finalize deletion
        const timeoutId = setTimeout(() => {
            setPendingDeletes(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            // Permanent deletion is already handled by setProducts above, 
            // but we could have a hidden 'trash' state if needed.
            // For this requirement, we just clear the undo option.
        }, 5000);

        setPendingDeletes(prev => ({
            ...prev,
            [id]: { item: itemToDelete, timeoutId }
        }));

        // Return the id so the UI can show the Undo toast
        return id;
    };

    const undoDelete = (id) => {
        const pending = pendingDeletes[id];
        if (pending) {
            clearTimeout(pending.timeoutId);
            setProducts(prev => [pending.item, ...prev]);
            setPendingDeletes(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    };

    return (
        <ProductContext.Provider value={{
            products,
            addProduct,
            updateProduct,
            deleteProduct,
            undoDelete,
            isPendingDelete: (id) => !!pendingDeletes[id]
        }}>
            {children}
        </ProductContext.Provider>
    );
};

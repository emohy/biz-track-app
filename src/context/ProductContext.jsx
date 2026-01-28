import { createContext, useContext, useState, useEffect } from 'react';

const ProductContext = createContext();

export const useProduct = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState(() => {
        const saved = localStorage.getItem('products');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('products', JSON.stringify(products));
    }, [products]);

    const addProduct = (productData) => {
        const newProduct = {
            ...productData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        setProducts(prev => [newProduct, ...prev]);
    };

    const updateProduct = (id, updatedData) => {
        setProducts(prev => prev.map(prod =>
            prod.id === id ? { ...prod, ...updatedData } : prod
        ));
    };

    const deleteProduct = (id) => {
        setProducts(prev => prev.filter(prod => prod.id !== id));
    };

    return (
        <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
            {children}
        </ProductContext.Provider>
    );
};

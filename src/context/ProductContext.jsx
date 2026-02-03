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

const ProductContext = createContext();

export const useProduct = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
    const { user } = useAuth();
    const { testMode } = useSettings();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingDeletes, setPendingDeletes] = useState({});

    // Collection reference: users/{uid}/products OR users/{uid}/test_products
    const collectionName = testMode ? 'test_products' : 'products';

    useEffect(() => {
        if (!user) {
            setProducts([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'users', user.uid, collectionName),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productList = snapshot.docs.map(doc => {
                const data = doc.data({ serverTimestamps: 'estimate' });
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore timestamps to ISO strings for existing UI compatibility
                    createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
                };
            });
            setProducts(productList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, collectionName]);

    const addProduct = async (productData) => {
        if (!user) return;

        addDoc(collection(db, 'users', user.uid, collectionName), {
            ...productData,
            ...getMetadata(user.uid)
        });
    };

    const updateProduct = async (id, updatedData) => {
        if (!user) return;

        const productRef = doc(db, 'users', user.uid, collectionName, id);
        updateDoc(productRef, {
            ...updatedData,
            ...getMetadata(user.uid, true)
        });
    };

    const deleteProduct = async (id) => {
        if (!user) return;

        // Soft delete logic: stage for deletion (local UI only)
        const itemToDelete = products.find(p => p.id === id);
        if (!itemToDelete) return;

        // Note: For real-time Firestore, we'd usually want to 
        // handle the 'undo' by not actually deleting from Firestore immediately.
        // But for simplicity, we'll follow the original pattern:
        // Immediately remove from local list (Firestore snapshot will usually 
        // add it back unless we filter it out locally).

        const timeoutId = setTimeout(() => {
            const productRef = doc(db, 'users', user.uid, collectionName, id);
            deleteDoc(productRef);
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
        <ProductContext.Provider value={{
            products: products.filter(p => !pendingDeletes[p.id]),
            addProduct,
            updateProduct,
            deleteProduct,
            undoDelete,
            isPendingDelete: (id) => !!pendingDeletes[id],
            loading
        }}>
            {children}
        </ProductContext.Provider>
    );
};

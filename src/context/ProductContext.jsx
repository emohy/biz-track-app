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
            orderBy('createdAt', 'desc'),
            limit(500)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productList = snapshot.docs.map(doc => {
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
            setProducts(productList.filter(p => !p.isDeleted));
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

        const itemToDelete = products.find(p => p.id === id);
        if (!itemToDelete) return;

        // 1. Mark as deleted in Firestore immediately
        const productRef = doc(db, 'users', user.uid, collectionName, id);
        await updateDoc(productRef, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            ...getMetadata(user.uid, true)
        });

        // 2. Clear UI undo toast after timeout
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

            // Revert the soft delete in Firestore
            const productRef = doc(db, 'users', user.uid, collectionName, id);
            await updateDoc(productRef, {
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

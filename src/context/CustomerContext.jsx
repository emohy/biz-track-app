import { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    query,
    orderBy
} from 'firebase/firestore';
import { db, getMetadata } from '../firebase';
import { useAuth } from './AuthContext';

const CustomerContext = createContext();

export const useCustomer = () => useContext(CustomerContext);

export const CustomerProvider = ({ children }) => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setCustomers([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'users', user.uid, 'customers'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const customerList = snapshot.docs.map(doc => {
                const data = doc.data({ serverTimestamps: 'estimate' });
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
                };
            });
            setCustomers(customerList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addCustomer = (customerData) => {
        if (!user) return;
        const tempId = Date.now().toString(); // Temporary ID for UI
        addDoc(collection(db, 'users', user.uid, 'customers'), {
            ...customerData,
            ...getMetadata(user.uid)
        });
        return { id: tempId, ...customerData };
    };

    const updateCustomer = async (id, updatedData) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, 'customers', id);
        updateDoc(ref, {
            ...updatedData,
            ...getMetadata(user.uid, true)
        });
    };

    return (
        <CustomerContext.Provider value={{ customers, addCustomer, updateCustomer, loading }}>
            {children}
        </CustomerContext.Provider>
    );
};

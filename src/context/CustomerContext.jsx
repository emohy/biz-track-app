import { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    query,
    orderBy,
    limit
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
            orderBy('createdAt', 'desc'),
            limit(500)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const customerList = snapshot.docs.map(doc => {
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
            setCustomers(customerList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addCustomer = async (customerData) => {
        if (!user) return;
        try {
            const docRef = await addDoc(collection(db, 'users', user.uid, 'customers'), {
                ...customerData,
                ...getMetadata(user.uid)
            });
            return { id: docRef.id, ...customerData };
        } catch (error) {
            console.error("Error adding customer:", error);
            throw error;
        }
    };

    const updateCustomer = async (id, updatedData) => {
        if (!user) return;
        try {
            const ref = doc(db, 'users', user.uid, 'customers', id);
            return await updateDoc(ref, {
                ...updatedData,
                ...getMetadata(user.uid, true)
            });
        } catch (error) {
            console.error("Error updating customer:", error);
            throw error;
        }
    };

    return (
        <CustomerContext.Provider value={{ customers, addCustomer, updateCustomer, loading }}>
            {children}
        </CustomerContext.Provider>
    );
};

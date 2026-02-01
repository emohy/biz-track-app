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
import { db } from '../firebase';
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
            const customerList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()?.toISOString(),
                updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
            }));
            setCustomers(customerList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addCustomer = async (customerData) => {
        if (!user) return;
        const docRef = await addDoc(collection(db, 'users', user.uid, 'customers'), {
            ...customerData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { id: docRef.id, ...customerData };
    };

    const updateCustomer = async (id, updatedData) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, 'customers', id);
        await updateDoc(ref, {
            ...updatedData,
            updatedAt: serverTimestamp()
        });
    };

    return (
        <CustomerContext.Provider value={{ customers, addCustomer, updateCustomer, loading }}>
            {children}
        </CustomerContext.Provider>
    );
};

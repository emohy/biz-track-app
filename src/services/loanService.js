import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export const loanService = {
    // Get all loans for a user
    getLoans: async (userId) => {
        try {
            const loansRef = collection(db, 'loans');
            const q = query(loansRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching loans:", error);
            throw error;
        }
    },

    // Add a new loan
    addLoan: async (userId, loanData) => {
        try {
            const loansRef = collection(db, 'loans');
            const docRef = await addDoc(loansRef, {
                ...loanData,
                userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            return { id: docRef.id, ...loanData };
        } catch (error) {
            console.error("Error adding loan:", error);
            throw error;
        }
    },

    // Update an existing loan
    updateLoan: async (loanId, updates) => {
        try {
            const loanRef = doc(db, 'loans', loanId);
            await updateDoc(loanRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
            return { id: loanId, ...updates };
        } catch (error) {
            console.error("Error updating loan:", error);
            throw error;
        }
    },

    // Delete a loan
    deleteLoan: async (loanId) => {
        try {
            const loanRef = doc(db, 'loans', loanId);
            await deleteDoc(loanRef);
            return loanId;
        } catch (error) {
            console.error("Error deleting loan:", error);
            throw error;
        }
    },

    // Add a repayment record to the sub-collection
    addRepayment: async (loanId, repaymentData) => {
        try {
            const repaymentsRef = collection(db, 'loans', loanId, 'repayments');
            const docRef = await addDoc(repaymentsRef, {
                ...repaymentData,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...repaymentData };
        } catch (error) {
            console.error("Error adding repayment:", error);
            throw error;
        }
    },

    // Get all repayment records for a loan
    getRepayments: async (loanId) => {
        try {
            const repaymentsRef = collection(db, 'loans', loanId, 'repayments');
            const q = query(repaymentsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching repayments:", error);
            throw error;
        }
    }
};

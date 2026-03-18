import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { loanService } from '../services/loanService';

const LoanContext = createContext();

export const useLoan = () => useContext(LoanContext);

// ── Utility: Normalize any date value to a plain JS Date ──
const normalizeDate = (dateVal) => {
    if (!dateVal) return null;
    try {
        if (typeof dateVal === 'object' && dateVal.toDate && typeof dateVal.toDate === 'function') {
            return dateVal.toDate();
        }
        if (dateVal instanceof Date) return new Date(dateVal);
        if (typeof dateVal === 'string') {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
                const [y, m, d] = dateVal.split('-').map(Number);
                return new Date(y, m - 1, d);
            }
            const parsed = new Date(dateVal);
            return isNaN(parsed.getTime()) ? null : parsed;
        }
    } catch { return null; }
    return null;
};

// ── Utility: Get the frequency step in days (approximate) ──
const frequencyToDays = (freq) => {
    switch (freq) {
        case 'daily': return 1;
        case 'weekly': return 7;
        case 'monthly': return 30;
        case 'quarterly': return 90;
        default: return 30;
    }
};

// ── Utility: Advance a date by one frequency step ──
const advanceDateByFrequency = (date, freq) => {
    const d = new Date(date);
    switch (freq) {
        case 'daily': d.setDate(d.getDate() + 1); break;
        case 'weekly': d.setDate(d.getDate() + 7); break;
        case 'monthly': d.setMonth(d.getMonth() + 1); break;
        case 'quarterly': d.setMonth(d.getMonth() + 3); break;
        default: d.setMonth(d.getMonth() + 1);
    }
    return d;
};

// ── Utility: Count periods between two dates for a given frequency ──
const countPeriods = (firstDueDate, endDate, frequency) => {
    const first = normalizeDate(firstDueDate);
    const end = normalizeDate(endDate);
    if (!first || !end || end <= first) return 1;

    let count = 0;
    let cursor = new Date(first);
    while (cursor <= end) {
        count++;
        cursor = advanceDateByFrequency(cursor, frequency);
    }
    return Math.max(count, 1);
};

// ── Utility: find the next due date after today ──
const getNextDueDate = (firstDueDate, endDate, frequency) => {
    const first = normalizeDate(firstDueDate);
    const end = normalizeDate(endDate);
    if (!first) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let cursor = new Date(first);
    cursor.setHours(0, 0, 0, 0);

    // Walk forward through the schedule
    while (cursor < today) {
        const next = advanceDateByFrequency(cursor, frequency);
        if (end && next > end) return null; // past end of loan
        cursor = next;
    }

    if (end && cursor > end) return null;
    return cursor;
};

export const LoanProvider = ({ children }) => {
    const { user } = useAuth();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeLoan, setActiveLoan] = useState(null);

    // ── Calculate derived fields for a single loan ──
    const calculateLoanData = (baseLoan) => {
        try {
            if (!baseLoan) return null;

            const mode = baseLoan.agreementMode || 'legacy_simple';
            const remainingBalance = Math.max(
                (Number(baseLoan.totalRepayment) || 0) - (Number(baseLoan.amountPaid) || 0),
                0
            );

            // ─── LEGACY_SIMPLE: preserve old behavior exactly ───
            if (mode === 'legacy_simple') {
                let daysRemaining = null;
                let suggestedDailyReserve = 0;

                const due = normalizeDate(baseLoan.dueDate);
                if (due) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    due.setHours(0, 0, 0, 0);
                    daysRemaining = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                }

                if (baseLoan.status === 'active' && daysRemaining !== null) {
                    if (daysRemaining > 0) {
                        suggestedDailyReserve = remainingBalance / daysRemaining;
                    } else if (daysRemaining === 0) {
                        suggestedDailyReserve = remainingBalance;
                    }
                }

                return {
                    ...baseLoan,
                    agreementMode: 'legacy_simple',
                    remainingBalance,
                    daysRemaining: isNaN(daysRemaining) ? null : daysRemaining,
                    suggestedDailyReserve: isNaN(suggestedDailyReserve) ? 0 : suggestedDailyReserve
                };
            }

            // ─── STRUCTURED: installment-based calculations ───
            const periodCount = countPeriods(baseLoan.firstDueDate, baseLoan.endDate, baseLoan.repaymentFrequency);
            const totalRepayment = Number(baseLoan.totalRepayment) || 0;
            const expectedPaymentPerPeriod = periodCount > 0 ? Math.ceil(totalRepayment / periodCount) : totalRepayment;
            const nextDueDate = getNextDueDate(baseLoan.firstDueDate, baseLoan.endDate, baseLoan.repaymentFrequency);

            let daysUntilNextDue = null;
            if (nextDueDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                daysUntilNextDue = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            }

            // Reserve suggestion: how much to set aside daily to hit the next installment
            let suggestedDailyReserve = 0;
            if (baseLoan.status === 'active' && daysUntilNextDue !== null && daysUntilNextDue > 0) {
                const amountNeeded = Math.min(expectedPaymentPerPeriod, remainingBalance);
                suggestedDailyReserve = amountNeeded / daysUntilNextDue;
            } else if (baseLoan.status === 'active' && daysUntilNextDue === 0) {
                suggestedDailyReserve = Math.min(expectedPaymentPerPeriod, remainingBalance);
            }

            return {
                ...baseLoan,
                agreementMode: 'structured',
                remainingBalance,
                periodCount,
                expectedPaymentPerPeriod,
                nextDueDate: nextDueDate ? nextDueDate.toISOString().split('T')[0] : null,
                daysUntilNextDue,
                suggestedDailyReserve: isNaN(suggestedDailyReserve) ? 0 : suggestedDailyReserve,
                // Keep daysRemaining for overdue detection on endDate
                daysRemaining: daysUntilNextDue
            };

        } catch (error) {
            console.error("Critical error calculating loan data:", error, baseLoan);
            return { ...baseLoan, error: true, status: baseLoan.status || 'active' };
        }
    };

    const fetchLoans = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const fetchedLoans = await loanService.getLoans(user.uid);
            const computedLoans = fetchedLoans.map(calculateLoanData).filter(l => l !== null);
            setLoans(computedLoans);

            // Dashboard focus: nearest due active/overdue loan
            const currentActiveLoans = computedLoans.filter(l => l.status === 'active' || l.status === 'overdue');
            if (currentActiveLoans.length > 0) {
                currentActiveLoans.sort((a, b) => {
                    if (a.daysRemaining === null) return 1;
                    if (b.daysRemaining === null) return -1;
                    const diff = (a.daysRemaining || 0) - (b.daysRemaining || 0);
                    if (diff !== 0) return diff;
                    return (a.id || "").localeCompare(b.id || "");
                });
                setActiveLoan(currentActiveLoans[0]);
            } else {
                setActiveLoan(null);
            }
            console.log("Loans updated:", computedLoans.length, "active:", currentActiveLoans.length);
        } catch (error) {
            console.error('Failed to fetch loans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchLoans();
        } else {
            setLoans([]);
            setActiveLoan(null);
        }
    }, [user]);

    const addLoan = async (loanData) => {
        if (!user) throw new Error('You must be logged in to add a loan');
        try {
            setLoading(true);
            const cleanedData = {
                ...loanData,
                principal: Number(loanData.principal) || 0,
                totalRepayment: Number(loanData.totalRepayment) || 0,
                amountPaid: Number(loanData.amountPaid) || 0,
                status: loanData.status || 'active'
            };
            const newLoan = await loanService.addLoan(user.uid, cleanedData);
            const calculated = calculateLoanData(newLoan);
            if (calculated) {
                setLoans(prev => [...prev, calculated]);
            }
            await fetchLoans();
            return newLoan;
        } catch (error) {
            console.error('Error adding loan:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateLoan = async (id, updates) => {
        try {
            await loanService.updateLoan(id, updates);
            await fetchLoans();
        } catch (error) {
            console.error('Error updating loan:', error);
            throw error;
        }
    };

    const recordRepayment = async (loan, amount, note = '') => {
        const repaymentAmount = Number(amount);
        if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
            throw new Error("Invalid repayment amount");
        }

        const newAmountPaid = (Number(loan.amountPaid) || 0) + repaymentAmount;
        const totalRepayment = Number(loan.totalRepayment) || 0;

        if (newAmountPaid > totalRepayment) {
            throw new Error(`Repayment exceeds remaining balance. Max allowed: ${totalRepayment - (Number(loan.amountPaid) || 0)}`);
        }

        // 1. Create sub-collection record
        await loanService.addRepayment(loan.id, {
            amount: repaymentAmount,
            datePaid: new Date().toISOString(),
            note: note || ''
        });

        // 2. Update parent loan
        const updates = {
            amountPaid: newAmountPaid,
            updatedAt: new Date().toISOString()
        };
        if (newAmountPaid === totalRepayment) {
            updates.status = 'completed';
        }

        return updateLoan(loan.id, updates);
    };

    const getLoanRepayments = async (loanId) => {
        return await loanService.getRepayments(loanId);
    };

    const value = {
        loans,
        activeLoan,
        loading,
        addLoan,
        updateLoan,
        recordRepayment,
        fetchLoans,
        getLoanRepayments
    };

    return (
        <LoanContext.Provider value={value}>
            {children}
        </LoanContext.Provider>
    );
};

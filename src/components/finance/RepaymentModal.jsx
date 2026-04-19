import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatCurrency, parseCurrency } from '../../utils';
import { useLoan } from '../../context/LoanContext';
import { useSettings } from '../../context/SettingsContext';
import './RepaymentModal.css';

const RepaymentModal = ({ isOpen, onClose, loan, onSaveSuccess }) => {
    const { recordRepayment } = useLoan();
    const { notify } = useSettings();
    
    const [repaymentAmount, setRepaymentAmount] = useState('');
    const [displayRepayment, setDisplayRepayment] = useState('');
    const [repaymentNote, setRepaymentNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setRepaymentAmount('');
            setDisplayRepayment('');
            setRepaymentNote('');
            setError('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen || !loan) return null;

    const handleChange = (e) => {
        const val = e.target.value;
        setDisplayRepayment(val);
        setRepaymentAmount(parseCurrency(val));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const amount = Number(repaymentAmount);
        if (amount <= 0) {
            setError('Enter a valid amount > 0');
            return;
        }

        if (amount > loan.remainingBalance) {
            setError(`Cannot exceed balance of ${formatCurrency(loan.remainingBalance)}`);
            return;
        }

        setIsSubmitting(true);
        try {
            await recordRepayment(loan, amount, repaymentNote);
            notify(`Recorded repayment of ${formatCurrency(amount)}`);
            if (onSaveSuccess) onSaveSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to record repayment');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="repayment-overlay" onClick={onClose}>
            <div className="repayment-content" onClick={e => e.stopPropagation()}>
                {/* Fixed Header */}
                <div className="repayment-header">
                    <h2>Record Repayment</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close modal">
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="repayment-body">
                    <p className="repayment-subtitle">
                        Paying back <strong>{loan.lenderName}</strong>. <br/>
                        Current balance: <strong>{formatCurrency(loan.remainingBalance)}</strong>
                    </p>

                    <form id="repaymentForm" className="repayment-form" onSubmit={handleSubmit}>
                        <div className="repayment-form-group">
                            <label>Amount Paid Now*</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={displayRepayment}
                                onChange={handleChange}
                                onBlur={() => setDisplayRepayment(formatCurrency(repaymentAmount))}
                                placeholder="UGX 0"
                                required
                            />
                        </div>

                        <div className="repayment-form-group">
                            <label>Note (optional)</label>
                            <input
                                type="text"
                                value={repaymentNote}
                                onChange={(e) => setRepaymentNote(e.target.value)}
                                placeholder="e.g. Week 3 payment"
                            />
                        </div>
                    </form>
                </div>

                {/* Fixed Footer */}
                <div className="repayment-footer">
                    {error && <small className="repayment-error">{error}</small>}
                    <div className="repayment-actions">
                        <button 
                            type="button" 
                            className="btn-cancel" 
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            form="repaymentForm"
                            className="btn-submit"
                            disabled={isSubmitting || !repaymentAmount}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Repayment'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RepaymentModal;

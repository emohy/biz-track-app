import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatCurrency, parseCurrency } from '../../utils';
import { useLoan } from '../../context/LoanContext';
import { useSettings } from '../../context/SettingsContext';

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
        <div className="modal-overlay repayment-overlay" onClick={onClose} style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-color)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '24px', animation: 'slideUp 0.3s ease' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Record Repayment</h2>
                    <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <p className="subtitle" style={{ marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    Paying back <strong style={{color: 'var(--text-color)'}}>{loan.lenderName}</strong>. <br/>
                    Current balance: {formatCurrency(loan.remainingBalance)}
                </p>

                <form className="repayment-form" onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Amount Paid Now*</label>
                        <input
                            type="text"
                            value={displayRepayment}
                            onChange={handleChange}
                            onBlur={() => setDisplayRepayment(formatCurrency(repaymentAmount))}
                            placeholder="UGX 0"
                            autoFocus
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '1rem', background: 'var(--surface-color)', color: 'var(--text-color)' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Note (optional)</label>
                        <input
                            type="text"
                            value={repaymentNote}
                            onChange={(e) => setRepaymentNote(e.target.value)}
                            placeholder="e.g. Week 3 payment"
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '1rem', background: 'var(--surface-color)', color: 'var(--text-color)' }}
                        />
                    </div>

                    {error && <small className="error-text" style={{ color: 'var(--danger-color)', display: 'block', marginBottom: '16px' }}>{error}</small>}

                    <div className="form-actions" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button 
                            type="button" 
                            className="btn-cancel" 
                            onClick={onClose}
                            style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', fontWeight: '500', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn-submit"
                            disabled={isSubmitting || !repaymentAmount}
                            style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer', opacity: (isSubmitting || !repaymentAmount) ? 0.7 : 1 }}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Repayment'}
                        </button>
                    </div>
                </form>
            </div>
            <style>
                {`
                    @keyframes slideUp {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                `}
            </style>
        </div>
    );
};

export default RepaymentModal;

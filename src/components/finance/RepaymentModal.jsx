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
        <div className="modal-overlay repayment-overlay" onClick={onClose} style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ 
                width: '100%', 
                maxWidth: '500px', 
                backgroundColor: 'var(--surface-color)', 
                borderTopLeftRadius: '20px', 
                borderTopRightRadius: '20px', 
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                maxHeight: '95dvh',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' 
            }}>
                {/* Fixed Header */}
                <div className="modal-header" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid var(--border-color)', margin: 0 }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Record Repayment</h2>
                    <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}><X size={24} /></button>
                </div>

                {/* Scrollable Body */}
                <div className="modal-body" style={{ padding: '24px', flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <p className="subtitle" style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        Paying back <strong style={{color: 'var(--text-primary)'}}>{loan.lenderName}</strong>. <br/>
                        Current balance: <strong style={{color: 'var(--text-primary)'}}>{formatCurrency(loan.remainingBalance)}</strong>
                    </p>

                    <form id="repaymentForm" className="repayment-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Amount Paid Now*</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={displayRepayment}
                                onChange={handleChange}
                                onBlur={() => setDisplayRepayment(formatCurrency(repaymentAmount))}
                                placeholder="UGX 0"
                                autoFocus
                                required
                                style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '1.05rem', background: 'var(--bg-color)', color: 'var(--text-primary)', transition: 'border-color 0.2s' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Note (optional)</label>
                            <input
                                type="text"
                                value={repaymentNote}
                                onChange={(e) => setRepaymentNote(e.target.value)}
                                placeholder="e.g. Week 3 payment"
                                style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '1rem', background: 'var(--bg-color)', color: 'var(--text-primary)', transition: 'border-color 0.2s' }}
                            />
                        </div>
                    </form>
                </div>

                {/* Fixed Footer */}
                <div className="modal-footer" style={{ padding: '16px 24px 24px', borderTop: '1px solid var(--border-color)', flexShrink: 0, backgroundColor: 'var(--surface-color)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
                    {error && <small className="error-text" style={{ color: 'var(--danger-color)', display: 'block', marginBottom: '12px', textAlign: 'center', fontWeight: '500' }}>{error}</small>}
                    <div className="form-actions" style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            type="button" 
                            className="btn-cancel" 
                            onClick={onClose}
                            style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer', fontSize: '1rem' }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            form="repaymentForm"
                            className="btn-submit"
                            disabled={isSubmitting || !repaymentAmount}
                            style={{ flex: 2, padding: '14px', borderRadius: '8px', border: 'none', background: 'var(--navy-800, #1e3a8a)', color: '#ffffff', fontWeight: '600', cursor: 'pointer', opacity: (isSubmitting || !repaymentAmount) ? 0.7 : 1, fontSize: '1rem' }}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Repayment'}
                        </button>
                    </div>
                </div>
            </div>
            <style>
                {`
                    .repayment-overlay {
                        /* Provide reliable 100dvh support */
                        height: 100vh; 
                        height: 100dvh;
                    }
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

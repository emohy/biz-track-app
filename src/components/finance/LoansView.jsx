import { useState, useEffect } from 'react';
import { 
    Trash2, Wallet, TrendingUp, Repeat
} from 'lucide-react';
import { useLoan } from '../../context/LoanContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency, parseCurrency } from '../../utils';
import LoanForm from '../LoanForm';
import UndoToast from '../UndoToast';
import './LoansView.css';

const LoansView = ({ highlightLoanId }) => {
    const { loans, recordRepayment, deleteSale, undoDelete, loading } = useLoan();
    const { notify } = useSettings();
    
    // Extracted loan state
    const [loanFilter, setLoanFilter] = useState('active'); // active | completed
    const [selectedLoanForRepayment, setSelectedLoanForRepayment] = useState(null);
    const [repaymentAmount, setRepaymentAmount] = useState('');
    const [displayRepayment, setDisplayRepayment] = useState('');
    const [repaymentNote, setRepaymentNote] = useState('');
    const [isSubmittingRepayment, setIsSubmittingRepayment] = useState(false);
    const [repaymentError, setRepaymentError] = useState('');
    const [isAddLoanOpen, setIsAddLoanOpen] = useState(false); // Just for empty state inline adding, global FAB still does this

    // Undo management (since Loans.jsx didn't have undoDelete implementation fully visible, assuming similar to sales)
    // Wait, the original Loans.jsx didn't have a handleDelete for Loans itself! It only had repayment.
    // The previous view_file of Loans.jsx didn't show a delete button for loans. 
    // Wait, there was NO delete button on the loan card in Loans.jsx! Let me ensure I just use what was there.

    const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
    const completedLoans = loans.filter(l => l.status === 'completed');

    const displayLoans = loanFilter === 'active' ? activeLoans : completedLoans;

    const safeDate = (dateVal) => {
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return 'N/A';
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (e) {
            return 'N/A';
        }
    };

    const frequencyLabel = (freq) => {
        switch (freq) {
            case 'daily': return 'Daily';
            case 'weekly': return 'Weekly';
            case 'monthly': return 'Monthly';
            case 'quarterly': return 'Quarterly';
            default: return freq || '';
        }
    };

    const handleOpenRepayment = (loan) => {
        setSelectedLoanForRepayment(loan);
        setRepaymentAmount('');
        setDisplayRepayment('');
        setRepaymentNote('');
        setRepaymentError('');
    };

    const handleRepaymentChange = (e) => {
        const val = e.target.value;
        setDisplayRepayment(val);
        setRepaymentAmount(parseCurrency(val));
        setRepaymentError('');
    };

    const handleRepaymentSubmit = async (e) => {
        e.preventDefault();
        if (isSubmittingRepayment || !selectedLoanForRepayment) return;

        const amount = Number(repaymentAmount);
        if (amount <= 0) {
            setRepaymentError('Enter a valid amount');
            return;
        }

        if (amount > selectedLoanForRepayment.remainingBalance) {
            setRepaymentError(`Cannot exceed balance of ${formatCurrency(selectedLoanForRepayment.remainingBalance)}`);
            return;
        }

        setIsSubmittingRepayment(true);
        try {
            await recordRepayment(selectedLoanForRepayment, amount, repaymentNote);
            notify(`Recorded repayment of ${formatCurrency(amount)} to ${selectedLoanForRepayment.lenderName}`);
            setSelectedLoanForRepayment(null);
        } catch (err) {
            setRepaymentError(err.message || 'Failed to record repayment');
        } finally {
            setIsSubmittingRepayment(false);
        }
    };

    const LegacyLoanCard = ({ loan }) => {
        const isOverdue = loan.status === 'overdue';
        const isCompleted = loan.status === 'completed';
        const isHighlighted = highlightLoanId === loan.id;

        return (
            <div 
                className={`loan-card ${isOverdue ? 'overdue' : ''} ${isHighlighted ? 'highlight' : ''} fade-in`}
                id={`loan-${loan.id}`}
            >
                <div className="loan-card-header">
                    <div className="lender-info">
                        <h3>{loan.lenderName}</h3>
                        <span className={`status-badge ${loan.status}`}>
                            {loan.status}
                        </span>
                    </div>
                </div>

                <div className="loan-metrics">
                    <div className="metric">
                        <span className="label">Remaining Balance</span>
                        <span className="value">{formatCurrency(loan.remainingBalance)}</span>
                    </div>
                    <div className="metric">
                        <span className="label">Due Date</span>
                        <span className="value">{safeDate(loan.dueDate)}</span>
                    </div>
                </div>

                {!isCompleted && loan.suggestedDailyReserve > 0 && (
                    <div className="loan-reserve-v2">
                        <TrendingUp size={14} />
                        <span>Daily Reserve: <strong>{formatCurrency(loan.suggestedDailyReserve)}</strong></span>
                    </div>
                )}

                {!isCompleted && (
                    <div className="loan-actions">
                        <button 
                            className="btn-repay"
                            onClick={() => handleOpenRepayment(loan)}
                        >
                            Record Repayment
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const StructuredLoanCard = ({ loan }) => {
        const isOverdue = loan.status === 'overdue' || (loan.daysUntilNextDue !== null && loan.daysUntilNextDue < 0);
        const isCompleted = loan.status === 'completed';
        const isHighlighted = highlightLoanId === loan.id;

        return (
            <div 
                className={`loan-card ${isOverdue ? 'overdue' : ''} ${isHighlighted ? 'highlight' : ''} fade-in`}
                id={`loan-${loan.id}`}
            >
                <div className="loan-card-header">
                    <div className="lender-info">
                        <h3>{loan.lenderName}</h3>
                        <div className="loan-badges">
                            <span className={`status-badge ${loan.status}`}>
                                {isOverdue ? 'overdue' : loan.status}
                            </span>
                            <span className="frequency-badge">
                                <Repeat size={12} />
                                {frequencyLabel(loan.repaymentFrequency)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="loan-metrics">
                    <div className="metric">
                        <span className="label">Remaining Balance</span>
                        <span className="value">{formatCurrency(loan.remainingBalance)}</span>
                    </div>
                    <div className="metric">
                        <span className="label">Per {frequencyLabel(loan.repaymentFrequency).replace(/ly$/i, '')} Payment</span>
                        <span className="value">{formatCurrency(loan.expectedPaymentPerPeriod)}</span>
                    </div>
                </div>

                <div className="loan-metrics secondary">
                    <div className="metric">
                        <span className="label">Next Due</span>
                        <span className="value">
                            {loan.nextDueDate ? safeDate(loan.nextDueDate) : 'Completed'}
                        </span>
                    </div>
                    <div className="metric">
                        <span className="label">End Date</span>
                        <span className="value">{safeDate(loan.endDate)}</span>
                    </div>
                </div>

                {!isCompleted && loan.suggestedDailyReserve > 0 && (
                    <div className="loan-reserve-v2">
                        <TrendingUp size={14} />
                        <span>Set aside about <strong>{formatCurrency(loan.suggestedDailyReserve)}</strong>/day to stay on track</span>
                    </div>
                )}

                {!isCompleted && (
                    <div className="loan-actions">
                        <button 
                            className="btn-repay"
                            onClick={() => handleOpenRepayment(loan)}
                        >
                            Record Repayment
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const LoanCard = ({ loan }) => {
        const mode = loan.agreementMode || 'legacy_simple';
        return mode === 'structured' 
            ? <StructuredLoanCard loan={loan} /> 
            : <LegacyLoanCard loan={loan} />;
    };

    if (loading) {
        return <div className="loading-state">Loading your loans...</div>;
    }

    if (loans.length === 0) {
        return (
            <div className="empty-loans fade-in" style={{ paddingTop: '2rem' }}>
                <Wallet size={48} />
                <h3>No Loans Yet</h3>
                <p>Taking a loan to grow your business? Track it here to stay on top of repayments.</p>
                <button className="btn-primary" style={{ margin: '24px auto' }} onClick={() => setIsAddLoanOpen(true)}>
                    Add First Loan
                </button>
                <LoanForm isOpen={isAddLoanOpen} onClose={() => setIsAddLoanOpen(false)} />
            </div>
        );
    }

    return (
        <div className="loans-view">
            {/* Embedded Active/Completed Filter */}
            <div className="loan-status-filter">
                <button 
                    className={`filter-btn ${loanFilter === 'active' ? 'active' : ''}`}
                    onClick={() => setLoanFilter('active')}
                >
                    Active ({activeLoans.length})
                </button>
                <button 
                    className={`filter-btn ${loanFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setLoanFilter('completed')}
                >
                    Completed ({completedLoans.length})
                </button>
            </div>

            <div className="loans-list fade-in" style={{ marginTop: '16px' }}>
                {displayLoans.length === 0 ? (
                    <div className="empty-state">
                        <p>No {loanFilter} loans found.</p>
                    </div>
                ) : (
                    displayLoans.map(loan => (
                        <LoanCard key={loan.id} loan={loan} />
                    ))
                )}
            </div>

            {/* Repayment Modal */}
            {selectedLoanForRepayment && (
                <div className="repayment-modal-overlay" onClick={() => setSelectedLoanForRepayment(null)}>
                    <div className="repayment-modal" onClick={e => e.stopPropagation()}>
                        <h2>Record Repayment</h2>
                        <p className="subtitle">
                            Paying back <strong>{selectedLoanForRepayment.lenderName}</strong>. 
                            Current balance: {formatCurrency(selectedLoanForRepayment.remainingBalance)}
                        </p>

                        <form className="repayment-form" onSubmit={handleRepaymentSubmit}>
                            <div className="input-group">
                                <label>Amount Paid Now*</label>
                                <input
                                    type="text"
                                    value={displayRepayment}
                                    onChange={handleRepaymentChange}
                                    onBlur={() => setDisplayRepayment(formatCurrency(repaymentAmount))}
                                    placeholder="UGX 0"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Note (optional)</label>
                                <input
                                    type="text"
                                    value={repaymentNote}
                                    onChange={(e) => setRepaymentNote(e.target.value)}
                                    placeholder="e.g. Week 3 payment"
                                />
                            </div>

                            {repaymentError && <small className="error-text" style={{ color: 'var(--danger-color)', display: 'block', marginTop: '4px' }}>{repaymentError}</small>}

                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    className="btn-cancel" 
                                    onClick={() => setSelectedLoanForRepayment(null)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-submit"
                                    disabled={isSubmittingRepayment || !repaymentAmount}
                                >
                                    {isSubmittingRepayment ? 'Saving...' : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoansView;

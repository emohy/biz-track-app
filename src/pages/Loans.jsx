import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    ArrowLeft, 
    Plus, 
    Wallet, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    ArrowRight,
    TrendingUp,
    Repeat
} from 'lucide-react';
import { useLoan } from '../context/LoanContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency, parseCurrency } from '../utils';
import LoanForm from '../components/LoanForm';
import './Loans.css';

const Loans = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { loans, recordRepayment, loading } = useLoan();
    const { notify } = useSettings();
    
    const highlightLoanId = location.state?.highlightLoanId;
    
    const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
    const [selectedLoanForRepayment, setSelectedLoanForRepayment] = useState(null);
    const [repaymentAmount, setRepaymentAmount] = useState('');
    const [displayRepayment, setDisplayRepayment] = useState('');
    const [repaymentNote, setRepaymentNote] = useState('');
    const [isSubmittingRepayment, setIsSubmittingRepayment] = useState(false);
    const [repaymentError, setRepaymentError] = useState('');

    const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
    const completedLoans = loans.filter(l => l.status === 'completed');

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

    // ── Legacy Card ──
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

    // ── Structured Card ──
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

    return (
        <div className="page container loans-page">
            <header className="loans-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1>Loans</h1>
                <button className="add-loan-btn" onClick={() => setIsAddLoanOpen(true)}>
                    <Plus size={20} />
                    <span>Add</span>
                </button>
            </header>

            {loading ? (
                <div className="loading-state">Loading your loans...</div>
            ) : (
                <>
                    {loans.length === 0 ? (
                        <div className="empty-loans fade-in">
                            <Wallet size={48} />
                            <h3>No Loans Yet</h3>
                            <p>Taking a loan to grow your business? Track it here to stay on top of repayments.</p>
                            <button className="add-loan-btn" style={{ margin: '24px auto' }} onClick={() => setIsAddLoanOpen(true)}>
                                <Plus size={20} />
                                <span>Add First Loan</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            {activeLoans.length > 0 && (
                                <section className="loans-section">
                                    <h2>Active Loans</h2>
                                    {activeLoans.map(loan => (
                                        <LoanCard key={loan.id} loan={loan} />
                                    ))}
                                </section>
                            )}

                            {completedLoans.length > 0 && (
                                <section className="loans-section">
                                    <h2>Completed History</h2>
                                    {completedLoans.map(loan => (
                                        <LoanCard key={loan.id} loan={loan} />
                                    ))}
                                </section>
                            )}
                        </>
                    )}
                </>
            )}

            <LoanForm 
                isOpen={isAddLoanOpen}
                onClose={() => setIsAddLoanOpen(false)}
            />

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

export default Loans;

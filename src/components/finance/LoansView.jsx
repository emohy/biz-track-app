import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useLoan } from '../../context/LoanContext';
import { formatCurrency } from '../../utils';
import LoanForm from '../LoanForm';
import './LoansView.css';

const LoansView = ({ highlightLoanId }) => {
    const navigate = useNavigate();
    const { loans, loading } = useLoan();
    
    const [loanFilter, setLoanFilter] = useState('active'); // active | completed
    const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);

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

    const LoanCard = ({ loan }) => {
        const isOverdue = loan.status === 'overdue' || (loan.daysUntilNextDue !== null && loan.daysUntilNextDue < 0);
        const isCompleted = loan.status === 'completed';
        const isHighlighted = highlightLoanId === loan.id;

        // Legacy vs Structured logic for due dates
        const dueDateDisplay = loan.nextDueDate ? loan.nextDueDate : loan.dueDate;

        return (
            <div 
                className={`loan-card ${isOverdue ? 'overdue' : ''} ${isHighlighted ? 'highlight' : ''} fade-in clickable-card`}
                onClick={() => navigate(`/finance/loans/${loan.id}`)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s', padding: '16px' }}
            >
                <div className="loan-card-header" style={{ marginBottom: '12px' }}>
                    <div className="lender-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{loan.lenderName}</h3>
                        <div className="loan-badges">
                            <span className={`status-badge ${loan.status}`}>
                                {isOverdue && !isCompleted ? 'overdue' : loan.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="loan-metrics" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="metric">
                        <span className="label" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Remaining Balance</span>
                        <span className="value" style={{ fontWeight: '600' }}>{formatCurrency(loan.remainingBalance)}</span>
                    </div>
                    <div className="metric" style={{ textAlign: 'right' }}>
                        <span className="label" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{isCompleted ? 'Completed On' : 'Next Due'}</span>
                        <span className="value" style={{ fontWeight: '500' }}>{safeDate(dueDateDisplay)}</span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="loading-state">Loading your loans...</div>;
    }

    if (loans.length === 0) {
        return (
            <div className="empty-loans fade-in" style={{ paddingTop: '2rem', textAlign: 'center' }}>
                <Wallet size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                <h3>No Loans Yet</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Taking a loan to grow your business? Track it here to stay on top of repayments.</p>
                <button className="btn-primary" style={{ margin: '24px auto' }} onClick={() => setIsAddLoanOpen(true)}>
                    Add First Loan
                </button>
                <LoanForm isOpen={isAddLoanOpen} onClose={() => setIsAddLoanOpen(false)} />
            </div>
        );
    }

    return (
        <div className="loans-view">
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

            <div className="loans-list fade-in" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {displayLoans.length === 0 ? (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <p>No {loanFilter} loans found.</p>
                    </div>
                ) : (
                    displayLoans.map(loan => (
                        <LoanCard key={loan.id} loan={loan} />
                    ))
                )}
            </div>
        </div>
    );
};

export default LoansView;

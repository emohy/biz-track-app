import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, TrendingUp, Calendar, AlertCircle, Clock } from 'lucide-react';
import { useLoan } from '../context/LoanContext';
import { formatCurrency } from '../utils';
import LoanForm from '../components/LoanForm';
import RepaymentModal from '../components/finance/RepaymentModal';
import './LoanDetail.css';

const LoanDetail = () => {
    const { loanId } = useParams();
    const navigate = useNavigate();
    const { loans, getLoanRepayments, loading } = useLoan();
    
    const [loan, setLoan] = useState(null);
    const [repayments, setRepayments] = useState([]);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isRepayOpen, setIsRepayOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        const found = loans.find(l => l.id === loanId);
        setLoan(found || null);
    }, [loans, loanId]);

    const fetchRepayments = async () => {
        if (!loanId) return;
        try {
            const data = await getLoanRepayments(loanId);
            setRepayments(data);
        } catch (e) {
            console.error(e);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchRepayments();
    }, [loanId]);

    if (loading || (!loan && historyLoading)) {
        return <div className="page container"><div className="loading-state">Loading loan details...</div></div>;
    }

    if (!loan) {
        return (
            <div className="page container">
                <header className="loans-header detail-header">
                    <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
                    <h1>Loan Not Found</h1>
                </header>
                <div className="empty-state">This loan may have been deleted.</div>
            </div>
        );
    }

    const isLegacy = loan.agreementMode === 'legacy_simple';
    const isStructured = loan.agreementMode === 'structured';
    const isManual = loan.installmentMode === 'manual';

    const isOverdue = loan.status === 'overdue' || (loan.daysUntilNextDue !== null && loan.daysUntilNextDue < 0);
    const isCompleted = loan.status === 'completed';
    
    let paymentLabel = 'Expected Payment';
    let paymentValue = isStructured ? loan.expectedPaymentPerPeriod : 0;
    let paymentHelper = 'Calculated from loan schedule';

    if (isManual && loan.agreedPaymentPerPeriod) {
        paymentLabel = 'Agreed Payment';
        paymentValue = loan.agreedPaymentPerPeriod;
        paymentHelper = 'Agreed with lender';
    } else if (isStructured && !isManual) {
        paymentLabel = 'Estimated Payment';
        paymentHelper = 'Calculated from loan schedule';
    }

    const dueDateDisplay = loan.nextDueDate || loan.dueDate || '';
    const safeDate = (dateVal) => {
        if (!dateVal) return 'N/A';
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const completionPercent = loan.totalRepayment > 0 
        ? Math.min(Math.round(((loan.amountPaid || 0) / loan.totalRepayment) * 100), 100) 
        : 0;

    return (
        <div className="page container loan-detail-page fade-in">
            {/* Top App Bar */}
            <header className="loans-header detail-header">
                <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
                <h1>Loan Details</h1>
                {!isCompleted && (
                    <button className="action-icon-btn" onClick={() => setIsEditOpen(true)}>
                        <Edit2 size={20} />
                    </button>
                )}
            </header>

            {/* Primary Summary Card */}
            <section className="summary-card">
                <div className="lender-header">
                    <h2>{loan.lenderName}</h2>
                    <div className="badges">
                        <span className={`status-badge ${loan.status}`}>
                            {isOverdue && !isCompleted ? 'overdue' : loan.status}
                        </span>
                        {isStructured && (
                            <span className="frequency-badge">{loan.repaymentFrequency}</span>
                        )}
                    </div>
                </div>

                <div className="summary-balance">
                    <span className="label">Remaining Balance</span>
                    <span className="value giant text-primary">{formatCurrency(loan.remainingBalance)}</span>
                </div>
                
                <div className="summary-grid mt-4">
                    <div className="grid-item">
                        <span className="label">{isCompleted ? 'Completed On' : 'Next Due'}</span>
                        <span className="value">
                            {dueDateDisplay ? safeDate(dueDateDisplay) : 'N/A'}
                        </span>
                    </div>

                    {isStructured && !isCompleted && (
                        <div className="grid-item manual-badge-container">
                            <span className="label">{paymentLabel}</span>
                            <span className="value">{formatCurrency(paymentValue)}</span>
                        </div>
                    )}
                    
                    <div className="grid-item">
                        <span className="label">Total Paid</span>
                        <span className="value secondary highlight-green">{formatCurrency(loan.amountPaid || 0)}</span>
                    </div>
                </div>
            </section>

            {/* Action Section */}
            {!isCompleted && (
                <section className="action-section">
                    <div className={`guidance-message ${isOverdue ? 'overdue' : 'normal'}`}>
                        {isOverdue ? (
                            <><AlertCircle size={18} /><span>Loan is overdue — prioritize repayment.</span></>
                        ) : loan.suggestedDailyReserve > 0 ? (
                            <><TrendingUp size={18} /><span>Set aside about {formatCurrency(loan.suggestedDailyReserve)}/day</span></>
                        ) : loan.daysUntilNextDue === 0 ? (
                            <><Clock size={18} /><span>Payment is due today!</span></>
                        ) : (
                            <><Calendar size={18} /><span>Looking good. Keep up the scheduled payments.</span></>
                        )}
                    </div>
                    <button className="btn-navy full-width" onClick={() => setIsRepayOpen(true)}>
                        Record Repayment
                    </button>
                </section>
            )}

            {/* Repayment Progress */}
            <section className="detail-section progress-section">
                <h3>Repayment Progress</h3>
                <div className="progress-container">
                    <div className="progress-labels">
                        <span>{completionPercent}% repaid</span>
                        <span>{formatCurrency(loan.amountPaid || 0)} of {formatCurrency(loan.totalRepayment || (loan.principal || 0))}</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${completionPercent}%` }}></div>
                    </div>
                </div>
            </section>

            {/* Loan Agreement Section */}
            <section className="detail-section agreement-section">
                <h3>Loan Agreement</h3>
                
                <div className="agreement-group">
                    <h4 className="group-title">Loan Terms</h4>
                    <div className="agreement-list">
                        <div className="agreement-row">
                            <span>Principal</span>
                            <strong>{formatCurrency(loan.principal || 0)}</strong>
                        </div>
                        {isStructured && (
                            <>
                                <div className="agreement-row">
                                    <span>Interest ({loan.interestType === 'fixed_rate' ? '%' : 'Amount'})</span>
                                    <strong>{loan.interestType === 'fixed_rate' ? `${loan.interestValue}%` : formatCurrency(loan.interestValue || 0)}</strong>
                                </div>
                                <div className="agreement-row">
                                    <span>Total Repayment</span>
                                    <strong>{formatCurrency(loan.totalRepayment || 0)}</strong>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {isStructured && (
                    <>
                    <div className="agreement-group pt-4">
                        <h4 className="group-title">Schedule</h4>
                        <div className="agreement-list">
                            <div className="agreement-row">
                                <span>Start Date</span>
                                <strong>{safeDate(loan.startDate)}</strong>
                            </div>
                            <div className="agreement-row">
                                <span>End Date</span>
                                <strong>{safeDate(loan.endDate)}</strong>
                            </div>
                        </div>
                    </div>
                    
                    <div className="agreement-group pt-4">
                        <h4 className="group-title">Payment Setup</h4>
                        <div className="agreement-list">
                            <div className="agreement-row">
                                <span>Frequency</span>
                                <strong style={{ textTransform: 'capitalize' }}>{loan.repaymentFrequency || 'N/A'}</strong>
                            </div>
                            <div className="agreement-row">
                                <span>Mode</span>
                                <strong style={{ textTransform: 'capitalize' }}>{loan.installmentMode || 'derived'}</strong>
                            </div>
                        </div>
                    </div>
                    </>
                )}
            </section>

            {/* Repayment History Section */}
            <section className="detail-section history-section">
                <h3>Repayment History</h3>
                {historyLoading ? (
                    <div className="loading-state">Loading history...</div>
                ) : repayments.length === 0 ? (
                    <div className="empty-state">No repayments recorded yet</div>
                ) : (
                    <div className="history-list">
                        {repayments.map(rep => (
                            <div key={rep.id} className="history-row">
                                <div className="history-info">
                                    <span className="history-amount">{formatCurrency(rep.amount)}</span>
                                    <span className="history-date">
                                        {new Date(rep.createdAt || rep.datePaid).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="history-meta">
                                    {rep.note && <span className="history-note">"{rep.note}"</span>}
                                    {rep.remainingBalance !== undefined && <span className="history-remaining">Remaining after payment: {formatCurrency(rep.remainingBalance)}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <LoanForm 
                isOpen={isEditOpen} 
                onClose={() => setIsEditOpen(false)} 
                initialData={loan} 
            />
            
            <RepaymentModal 
                isOpen={isRepayOpen} 
                onClose={() => setIsRepayOpen(false)} 
                loan={loan} 
                onSaveSuccess={fetchRepayments} 
            />
        </div>
    );
};

export default LoanDetail;

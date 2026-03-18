import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ExpensesView from '../components/finance/ExpensesView';
import LoansView from '../components/finance/LoansView';
import './FinancePage.css';

const FinancePage = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('expenses');

    useEffect(() => {
        if (location.pathname.includes('/loans')) {
            setActiveTab('loans');
        } else if (location.pathname.includes('/expenses')) {
            setActiveTab('expenses');
        }
    }, [location.pathname]);

    return (
        <div className="page container finance-page">
            <header className="finance-header">
                <h1>Finance</h1>
            </header>

            <div className="finance-tabs">
                <button 
                    className={`finance-tab ${activeTab === 'expenses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('expenses')}
                >
                    Expenses
                </button>
                <button 
                    className={`finance-tab ${activeTab === 'loans' ? 'active' : ''}`}
                    onClick={() => setActiveTab('loans')}
                >
                    Loans
                </button>
            </div>

            <div className="finance-content">
                {activeTab === 'expenses' ? (
                    <ExpensesView />
                ) : (
                    <LoansView highlightLoanId={location.state?.highlightLoanId} />
                )}
            </div>
        </div>
    );
};

export default FinancePage;

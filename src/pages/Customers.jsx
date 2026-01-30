import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, DollarSign, CheckCircle } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useSales } from '../context/SalesContext';
import { formatCurrency } from '../utils';
import QuickPaymentModal from '../components/QuickPaymentModal';
import './Customers.css';

const Customers = () => {
    const { customers } = useCustomer();
    const { sales, updateSale } = useSales();
    const navigate = useNavigate();
    const location = useLocation();
    const searchRef = useRef(null);

    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'owing'); // 'owing', 'all', 'clear'
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (location.state?.focusSearch && searchRef.current) {
            searchRef.current.focus();
        }
    }, [location.state]);

    const customerStats = useMemo(() => {
        return customers.map(customer => {
            const customerSales = sales.filter(s => s.customerId === customer.id);
            const balance = customerSales.reduce((acc, sale) => acc + (sale.amountDue || 0), 0);

            let status = 'CLEAR';
            if (balance > 0) {
                const outstandingSales = customerSales.filter(s => s.amountDue > 0);
                const hasPartialPayments = outstandingSales.some(s => (s.amountPaid || 0) > 0);
                status = hasPartialPayments ? 'PARTIAL' : 'OWING';
            }

            const lastPurchase = customerSales.reduce((latest, sale) => {
                const saleDate = new Date(sale.createdAt).getTime();
                return saleDate > latest ? saleDate : latest;
            }, 0);

            return { ...customer, balance, status, lastPurchase };
        });
    }, [customers, sales]);

    const filteredCustomers = useMemo(() => {
        let filtered = customerStats;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(q) ||
                (c.phone && c.phone.includes(q))
            );
        }

        if (activeTab === 'owing') {
            filtered = filtered.filter(c => c.balance > 0);
        } else if (activeTab === 'clear') {
            filtered = filtered.filter(c => c.balance === 0);
        }

        return filtered.sort((a, b) => {
            if (activeTab === 'owing') {
                if (b.balance !== a.balance) return b.balance - a.balance;
            }
            return b.lastPurchase - a.lastPurchase;
        });
    }, [customerStats, activeTab, searchQuery]);

    const openPaymentModal = (e, customer) => {
        e.stopPropagation();
        setSelectedCustomer(customer);
        setPaymentModalOpen(true);
    };

    const handlePaymentSubmit = (saleId, amount) => {
        const sale = sales.find(s => s.id === saleId);
        if (!sale) return;

        const newAmountPaid = (sale.amountPaid || 0) + amount;
        const newAmountDue = sale.totalAmount - newAmountPaid;
        const newStatus = newAmountDue <= 0 ? 'Paid' : 'Partial';

        updateSale(saleId, {
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            paymentStatus: newStatus
        });

        // Check if debt cleared for success message
        if (selectedCustomer.balance - amount <= 0) {
            setSuccessMessage(`Debt cleared for ${selectedCustomer.name}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    return (
        <div className="page container">
            <h1>Customers {activeTab === 'owing' && searchQuery === '' && <span className="count-badge">{filteredCustomers.length}</span>}</h1>

            {successMessage && (
                <div className="success-banner">
                    <CheckCircle size={18} />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Search Bar */}
            <div className="search-bar">
                <Search size={20} className="search-icon" />
                <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'owing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('owing')}
                >
                    Owing
                </button>
                <button
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All
                </button>
                <button
                    className={`tab ${activeTab === 'clear' ? 'active' : ''}`}
                    onClick={() => setActiveTab('clear')}
                >
                    Clear
                </button>
            </div>

            {filteredCustomers.length === 0 ? (
                <div className="empty-state">
                    <p>
                        {searchQuery ? 'No customers found.' :
                            activeTab === 'owing' ? 'No one owes you money!' : 'Ready to build your database?'}
                    </p>
                    <small>
                        {!searchQuery && (activeTab === 'owing'
                            ? 'Record credit sales to track balances and follow up with customers.'
                            : 'Customer records appear here automatically as you record sales.')}
                    </small>
                </div>
            ) : (
                <div className="customer-list">
                    {filteredCustomers.map(customer => (
                        <div
                            key={customer.id}
                            className={`customer-card ${customer.status.toLowerCase()} ${customer.balance > 0 ? 'has-debt' : ''}`}
                            onClick={() => navigate(`/customers/${customer.id}`)}
                        >
                            <div className="customer-main-info">
                                <div className="customer-name-row">
                                    <span className="customer-name">{customer.name}</span>
                                    {customer.phone && <span className="customer-phone">{customer.phone}</span>}
                                </div>
                                <div className="customer-balance-area">
                                    {customer.balance > 0 ? (
                                        <div className={`balance-display ${customer.status.toLowerCase()}`}>
                                            <span className="amount">{formatCurrency(customer.balance)}</span>
                                            <span className="label">{customer.status}</span>
                                        </div>
                                    ) : (
                                        <div className="balance-display clear">
                                            <span className="amount">CLEAR</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="customer-actions-cell">
                                {customer.balance > 0 && activeTab === 'owing' && (
                                    <button
                                        className="record-payment-btn"
                                        onClick={(e) => openPaymentModal(e, customer)}
                                    >
                                        <DollarSign size={14} />
                                        <span>Record Payment</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedCustomer && (
                <QuickPaymentModal
                    isOpen={paymentModalOpen}
                    onClose={() => {
                        setPaymentModalOpen(false);
                        setSelectedCustomer(null);
                    }}
                    onSubmit={handlePaymentSubmit}
                    customerSales={sales.filter(s => s.customerId === selectedCustomer.id)}
                    customerName={selectedCustomer.name}
                />
            )}
        </div>
    );
};

export default Customers;

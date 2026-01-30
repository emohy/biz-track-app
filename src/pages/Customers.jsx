import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, DollarSign, CheckCircle } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useSales } from '../context/SalesContext';
import { formatCurrency } from '../utils';
import QuickPaymentModal from '../components/QuickPaymentModal';
import SkeletonLoader from '../components/SkeletonLoader';
import './Customers.css';

const Customers = () => {
    const { customers } = useCustomer();
    const { sales, updateSale } = useSales();
    const navigate = useNavigate();
    const location = useLocation();
    const searchRef = useRef(null);

    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'owing'); // 'owing', 'all', 'clear', 'partial'
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (location.state?.focusSearch && searchRef.current) {
            searchRef.current.focus();
        }
    }, [location.state]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const customerStats = useMemo(() => {
        return customers.map(customer => {
            const customerSales = sales.filter(s => s.customerId === customer.id);
            const balance = customerSales.reduce((acc, sale) => acc + (sale.amountDue || 0), 0);

            let status = 'clear';
            if (balance > 0) {
                const outstandingSales = customerSales.filter(s => s.amountDue > 0);
                const hasPartialPayments = outstandingSales.some(s => (s.amountPaid || 0) > 0);
                status = hasPartialPayments ? 'partial' : 'owing';
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
            filtered = filtered.filter(c => c.status === 'owing' || c.status === 'partial');
        } else if (activeTab === 'partial') {
            filtered = filtered.filter(c => c.status === 'partial');
        } else if (activeTab === 'clear') {
            filtered = filtered.filter(c => c.status === 'clear');
        }

        return filtered.sort((a, b) => {
            if (activeTab === 'owing' || activeTab === 'partial') {
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
            <h1>
                Customers
                <span className="count-badge">{customers.length}</span>
            </h1>

            <div className="search-container">
                <div className="premium-search-bar">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <X
                            size={18}
                            style={{ cursor: 'pointer', opacity: 0.6 }}
                            onClick={() => setSearchQuery('')}
                        />
                    )}
                </div>
            </div>

            <div className="tabs-scroll">
                <button
                    className={`tab-pill ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => handleTabChange('all')}
                >
                    All
                </button>
                <button
                    className={`tab-pill ${activeTab === 'owing' ? 'active' : ''}`}
                    onClick={() => handleTabChange('owing')}
                >
                    Owing Debt
                </button>
                <button
                    className={`tab-pill ${activeTab === 'partial' ? 'active' : ''}`}
                    onClick={() => handleTabChange('partial')}
                >
                    Partial
                </button>
                <button
                    className={`tab-pill ${activeTab === 'clear' ? 'active' : ''}`}
                    onClick={() => handleTabChange('clear')}
                >
                    Cleared
                </button>
            </div>

            {isLoading ? (
                <SkeletonLoader type="card" count={3} />
            ) : filteredCustomers.length === 0 ? (
                <div className="empty-state">
                    <p>{searchQuery ? 'No customers match your search' : 'No customers found'}</p>
                    <small>Your client list will appear here once you record sales with customer details.</small>
                </div>
            ) : (
                <div className="customer-list fade-in">
                    {filteredCustomers.map(customer => {
                        const initials = customer.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .substring(0, 2);

                        return (
                            <div
                                key={customer.id}
                                className={`customer-card ${customer.status}`}
                                onClick={() => navigate(`/customers/${customer.id}`)}
                            >
                                <div className="customer-avatar">
                                    {initials}
                                </div>

                                <div className="customer-info-main">
                                    <h3 className="customer-name">{customer.name}</h3>
                                    <span className="customer-phone">{customer.phone || 'No phone number'}</span>
                                </div>

                                <div className="customer-balance-block">
                                    <span className="balance-amount">
                                        {formatCurrency(customer.balance)}
                                    </span>
                                    <span className="balance-label">
                                        {customer.status === 'clear' ? 'Account Clear' : 'Balance Due'}
                                    </span>
                                    {customer.balance > 0 && (
                                        <button
                                            className="btn-record-payment"
                                            onClick={(e) => openPaymentModal(e, customer)}
                                        >
                                            <DollarSign size={14} />
                                            <span>Record Payment</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
            {successMessage && (
                <div className="success-message-overlay">
                    <CheckCircle size={24} />
                    <span>{successMessage}</span>
                </div>
            )}
        </div>
    );
};

export default Customers;

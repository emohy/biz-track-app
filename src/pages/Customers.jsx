import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useSales } from '../context/SalesContext';
import { formatCurrency } from '../utils';
import './Customers.css';

const Customers = () => {
    const { customers } = useCustomer();
    const { sales } = useSales();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('owing'); // 'owing', 'all', 'clear'
    const [searchQuery, setSearchQuery] = useState('');

    const customerStats = useMemo(() => {
        return customers.map(customer => {
            const customerSales = sales.filter(s => s.customerId === customer.id);
            const balance = customerSales.reduce((acc, sale) => acc + (sale.amountDue || 0), 0);

            // Status Logic:
            // CLEAR: Balance 0
            // PARTIAL: Balance > 0 AND (Some payments made on outstanding sales OR some outstanding sales are partial)
            // OWING: Balance > 0 AND (No payments made on outstanding sales)

            let status = 'CLEAR';
            if (balance > 0) {
                const outstandingSales = customerSales.filter(s => s.amountDue > 0);
                const hasPartialPayments = outstandingSales.some(s => (s.amountPaid || 0) > 0);
                status = hasPartialPayments ? 'PARTIAL' : 'OWING';
            }

            // Find most recent purchase date
            const lastPurchase = customerSales.reduce((latest, sale) => {
                const saleDate = new Date(sale.createdAt).getTime();
                return saleDate > latest ? saleDate : latest;
            }, 0);

            return { ...customer, balance, status, lastPurchase };
        });
    }, [customers, sales]);

    const filteredCustomers = useMemo(() => {
        let filtered = customerStats;

        // 1. Filter by Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(q) ||
                (c.phone && c.phone.includes(q))
            );
        }

        // 2. Filter by Tab
        if (activeTab === 'owing') {
            // Owing tab shows anyone with debt (Partial or Owing)
            filtered = filtered.filter(c => c.balance > 0);
        } else if (activeTab === 'clear') {
            filtered = filtered.filter(c => c.balance === 0);
        }
        // 'all' includes everyone

        // 3. Sort
        return filtered.sort((a, b) => {
            if (activeTab === 'owing') {
                // Highest debt first, then most recent
                if (b.balance !== a.balance) return b.balance - a.balance;
            }
            // Default secondary: Most recent purchase first
            return b.lastPurchase - a.lastPurchase;
        });
    }, [customerStats, activeTab, searchQuery]);

    return (
        <div className="page container">
            <h1>Customers</h1>

            {/* Search Bar */}
            <div className="search-bar">
                <Search size={20} className="search-icon" />
                <input
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
                            activeTab === 'owing' ? 'No one owes you money!' : 'No customers yet.'}
                    </p>
                </div>
            ) : (
                <div className="customer-list">
                    {filteredCustomers.map(customer => (
                        <div
                            key={customer.id}
                            className="customer-card"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                        >
                            <div className="customer-info">
                                <span className="customer-name">{customer.name}</span>
                                {customer.phone && <span className="customer-phone">{customer.phone}</span>}
                            </div>
                            <div className="customer-status">
                                {customer.balance > 0 ? (
                                    <div className={`balance-badge ${customer.status.toLowerCase()}`}>
                                        <span className="label">{customer.status}</span>
                                        <span className="amount">{formatCurrency(customer.balance)}</span>
                                    </div>
                                ) : (
                                    <div className="balance-badge clear">CLEAR</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Customers;
